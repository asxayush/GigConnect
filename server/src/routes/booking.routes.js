import { Router } from "express";
import Booking from "../models/Booking.js";
import WorkerProfile from "../models/WorkerProfile.js";
import { requireAuth } from "../middlewares/auth.js";
import { sendSms } from "../utils/notifications.js";

const router = Router();

const transitions = {
  Requested: ["Assigned", "Cancelled"],
  Assigned: ["In Progress", "Cancelled"],
  "In Progress": ["Completed"],
  Completed: [],
  Cancelled: [],
};

// GET /api/bookings — list bookings filtered by the caller's role
router.get("/", requireAuth, async (request, response, next) => {
  try {
    const filter =
      request.user.role === "customer"
        ? { customerId: request.user._id }
        : request.user.role === "worker"
        ? { workerId: request.user._id }
        : {};
    const bookings = await Booking.find(filter)
      .populate("customerId workerId", "name phone")
      .sort({ scheduledAt: -1 });
    response.json({ success: true, data: bookings, message: "Bookings fetched" });
  } catch (error) {
    next(error);
  }
});

// POST /api/bookings — create a new booking
router.post("/", requireAuth, async (request, response, next) => {
  try {
    const {
      serviceCategory,
      address,
      location,
      scheduledAt,
      workerId,
      isEmergency = false,
      price,
    } = request.body;

    if (!serviceCategory || !address || !scheduledAt) {
      return response.status(400).json({
        success: false,
        message: "serviceCategory, address and scheduledAt are required",
      });
    }

    if (workerId) {
      const worker = await WorkerProfile.findOne({
        userId: workerId,
        verificationStatus: "verified",
        availability: true,
      });
      if (!worker) {
        return response
          .status(400)
          .json({ success: false, message: "Worker is not available" });
      }
    }

    const booking = await Booking.create({
      customerId: request.user._id,
      workerId,
      serviceCategory,
      address,
      location,
      scheduledAt,
      isEmergency,
      price,
      status: workerId ? "Assigned" : "Requested",
    });

    const populatedBooking = await booking.populate("workerId", "name phone");

    // Fire-and-forget SMS — never let this fail the booking response
    try {
      await sendSms(
        populatedBooking.workerId?.phone,
        `GigConnect booking assigned: ${serviceCategory} on ${new Date(scheduledAt).toLocaleString()}.`
      );
    } catch {
      // SMS failure is non-fatal
    }

    response
      .status(201)
      .json({ success: true, data: populatedBooking, message: "Booking created" });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/bookings/:id/status — advance booking through its lifecycle
router.patch("/:id/status", requireAuth, async (request, response, next) => {
  try {
    const booking = await Booking.findById(request.params.id);
    if (!booking) {
      return response
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    const { status } = request.body;
    const isCustomer = String(booking.customerId) === String(request.user._id);
    const isWorker = String(booking.workerId) === String(request.user._id);
    const customerAllowed = isCustomer && ["Cancelled"].includes(status);
    const workerAllowed = isWorker && ["In Progress", "Completed"].includes(status);
    const adminAllowed = request.user.role === "admin";

    if (!customerAllowed && !workerAllowed && !adminAllowed) {
      return response.status(403).json({
        success: false,
        message: "You cannot change this booking status",
      });
    }

    if (!transitions[booking.status]?.includes(status)) {
      return response.status(400).json({
        success: false,
        message: `Cannot move booking from ${booking.status} to ${status}`,
      });
    }

    booking.status = status;
    if (status === "Completed" && booking.workerId) {
      await WorkerProfile.findOneAndUpdate(
        { userId: booking.workerId },
        { $inc: { jobsCompleted: 1 } }
      );
    }
    await booking.save();

    const populatedBooking = await booking.populate(
      "customerId workerId",
      "name phone"
    );

    // Fire-and-forget SMS notifications — never let these fail the response
    try {
      await Promise.allSettled([
        sendSms(
          populatedBooking.customerId?.phone,
          `GigConnect booking ${booking._id} is now ${status}.`
        ),
        sendSms(
          populatedBooking.workerId?.phone,
          `GigConnect booking ${booking._id} is now ${status}.`
        ),
      ]);
    } catch {
      // SMS failure is non-fatal
    }

    response.json({
      success: true,
      data: populatedBooking,
      message: "Booking status updated",
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/bookings/:id/verify-otp — authenticate 4-digit PIN to start job
router.patch("/:id/verify-otp", async (request, response, next) => {
  try {
    const { otp } = request.body;
    const booking = await Booking.findById(request.params.id);
    if (!booking) {
      return response.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.status === "In Progress" || booking.status === "Completed") {
      return response.json({ success: true, message: `Booking is already ${booking.status}`, data: booking });
    }

    if ((booking.otpAttempts || 0) >= 5) {
      return response.status(429).json({ success: false, message: "Too many failed OTP attempts. Security lock engaged." });
    }

    if (!otp || String(booking.otp).trim() !== String(otp).trim()) {
      booking.otpAttempts = (booking.otpAttempts || 0) + 1;
      await booking.save();
      const remaining = 5 - booking.otpAttempts;
      return response.status(400).json({ success: false, message: `Invalid 4-digit OTP. ${remaining} attempt(s) remaining.` });
    }

    booking.status = "In Progress";
    booking.startedAt = new Date();
    booking.otpAttempts = 0;
    await booking.save();

    if (booking.workerId) {
      await WorkerProfile.findOneAndUpdate(
        { $or: [{ userId: booking.workerId }, { _id: booking.workerId }] },
        { availability: false }
      );
    }

    const populated = await booking.populate("customerId workerId", "name phone");
    response.json({ success: true, message: "Doorstep OTP verified! Service is now In Progress.", data: populated });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/bookings/:id/complete — mark job completed & settle 95/5/0 escrow
router.patch("/:id/complete", async (request, response, next) => {
  try {
    const booking = await Booking.findById(request.params.id);
    if (!booking) {
      return response.status(404).json({ success: false, message: "Booking not found" });
    }

    booking.status = "Completed";
    booking.paymentStatus = "escrow_settled";
    booking.completedAt = new Date();
    booking.settledAt = new Date();
    await booking.save();

    if (booking.workerId) {
      await WorkerProfile.findOneAndUpdate(
        { $or: [{ userId: booking.workerId }, { _id: booking.workerId }] },
        {
          availability: true,
          $inc: {
            jobsCompleted: 1,
            welfareFundBalance: booking.distribution?.mutualWelfare || Math.round(Number(booking.price || 0) * 0.05),
          },
        }
      );
    }

    const populated = await booking.populate("customerId workerId", "name phone");
    response.json({
      success: true,
      message: "Service completed and 95% worker payout settled with 5% welfare fund allocation.",
      data: populated,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
