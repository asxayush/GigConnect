import Booking from "../models/Booking.js";
import WorkerProfile from "../models/WorkerProfile.js";
import Notification from "../models/Notification.js";
import { getIO } from "../sockets/bookingSocket.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * @desc Create booking & emit newBookingRequest to verified workers
 * @route POST /api/bookings
 * @access Private (User / Customer)
 */
export const createBooking = asyncHandler(async (req, res) => {
  const {
    serviceCategory,
    address,
    location,
    scheduledAt,
    workerId,
    isEmergency,
    price,
    specialRequest,
  } = req.body;

  if (!serviceCategory || !address || !scheduledAt) {
    throw new ApiError(400, "serviceCategory, address, and scheduledAt are required fields.");
  }

  // If a direct worker was picked, check availability & verification
  if (workerId) {
    const worker = await WorkerProfile.findOne({
      userId: workerId,
      verificationStatus: "verified",
      availability: true,
    });
    if (!worker) {
      throw new ApiError(400, "The selected worker is unavailable or unverified.");
    }
  }

  const booking = await Booking.create({
    customerId: req.user._id,
    workerId: workerId || undefined,
    serviceCategory,
    address,
    location,
    scheduledAt,
    isEmergency: Boolean(isEmergency),
    price: price || 0,
    specialRequest: specialRequest || undefined,
    status: workerId ? "Assigned" : "pending",
  });

  const populatedBooking = await booking.populate("customerId", "name phone");

  let io;
  try {
    io = getIO();
  } catch (ioErr) {
    console.warn("[Booking Controller] Socket.io not initialized:", ioErr.message);
  }

  if (workerId) {
    // 1. Direct assignment
    if (io) {
      io.to(`worker_${workerId}`).emit("newBookingRequest", populatedBooking);
    }
    await Notification.create({
      recipient: workerId,
      sender: req.user._id,
      type: "BOOKING_REQUEST",
      title: `Direct Request: ${serviceCategory}`,
      message: `You have received a direct booking request at ${address}.`,
      data: { bookingId: booking._id, price: booking.price, scheduledAt },
    });
  } else {
    // 2. Broadcast booking: Find all verified workers matching this service category
    const matchingWorkers = await WorkerProfile.find({
      skills: serviceCategory,
      verificationStatus: "verified",
      availability: true,
    }).select("userId");

    const workerUserIds = matchingWorkers.map((w) => w.userId.toString());

    // Emit live socket event to active matching worker rooms
    if (io && workerUserIds.length > 0) {
      workerUserIds.forEach((id) => {
        io.to(`worker_${id}`).emit("newBookingRequest", populatedBooking);
      });
    }

    // Persist notification for offline workers
    if (workerUserIds.length > 0) {
      const notifications = workerUserIds.map((id) => ({
        recipient: id,
        sender: req.user._id,
        type: "BOOKING_REQUEST",
        title: `New Gig Opportunity: ${serviceCategory}`,
        message: `New booking available at ${address} for ₹${booking.price || "Standard Rate"}.`,
        data: {
          bookingId: booking._id,
          serviceCategory,
          price: booking.price,
          scheduledAt,
        },
      }));
      await Notification.insertMany(notifications);
    }
  }

  res.status(201).json({
    success: true,
    message: "Booking created and dispatched successfully.",
    data: populatedBooking,
  });
});

/**
 * @desc Race-condition safe booking acceptance
 * @route PATCH /api/bookings/:id/accept
 * @access Private (Worker)
 */
export const acceptBooking = asyncHandler(async (req, res) => {
  const bookingId = req.params.id;
  const workerUserId = req.user._id;

  // Atomic race-safe condition: ONLY updates if status is still strictly 'pending'
  const booking = await Booking.findOneAndUpdate(
    { _id: bookingId, status: "pending" },
    {
      $set: {
        status: "Assigned",
        workerId: workerUserId,
      },
    },
    { new: true, runValidators: true }
  ).populate("customerId workerId", "name phone");

  if (!booking) {
    throw new ApiError(
      409,
      "Job no longer available. Another worker has already accepted this booking or it was cancelled."
    );
  }

  let io;
  try {
    io = getIO();
  } catch (ioErr) {
    console.warn("[Booking Controller] Socket.io not initialized:", ioErr.message);
  }

  if (io) {
    // Notify the customer in real-time
    io.to(`user_${booking.customerId._id}`).emit("bookingConfirmed", {
      bookingId: booking._id,
      status: "Assigned",
      worker: {
        id: req.user._id,
        name: req.user.name,
        phone: req.user.phone,
      },
    });

    // Notify other workers to remove this job from their available queue
    io.emit("bookingTaken", { bookingId: booking._id });
  }

  // Save notification for customer
  await Notification.create({
    recipient: booking.customerId._id,
    sender: workerUserId,
    type: "BOOKING_CONFIRMED",
    title: "Worker Assigned!",
    message: `${req.user.name} has accepted your ${booking.serviceCategory} booking.`,
    data: { bookingId: booking._id, workerPhone: req.user.phone },
  });

  res.status(200).json({
    success: true,
    message: "Booking successfully accepted.",
    data: booking,
  });
});

/**
 * @desc List bookings for current user
 * @route GET /api/bookings
 * @access Private
 */
export const getBookings = asyncHandler(async (req, res) => {
  const filter =
    req.user.role === "worker"
      ? { workerId: req.user._id }
      : req.user.role === "admin"
      ? {}
      : { customerId: req.user._id };

  const bookings = await Booking.find(filter)
    .populate("customerId workerId", "name phone")
    .sort({ scheduledAt: -1 });

  res.status(200).json({
    success: true,
    data: bookings,
    message: "Bookings fetched successfully.",
  });
});

/**
 * @desc Advance booking lifecycle (In Progress -> Completed / Cancelled)
 * @route PATCH /api/bookings/:id/status
 * @access Private
 */
export const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw new ApiError(404, "Booking not found.");
  }

  const isCustomer = String(booking.customerId) === String(req.user._id);
  const isWorker = String(booking.workerId) === String(req.user._id);
  const isAdmin = req.user.role === "admin";

  if (!isCustomer && !isWorker && !isAdmin) {
    throw new ApiError(403, "You do not have permission to alter this booking.");
  }

  const validTransitions = {
    pending: ["Assigned", "Cancelled"],
    Requested: ["Assigned", "Cancelled"],
    Assigned: ["In Progress", "Cancelled"],
    "In Progress": ["Completed"],
    Completed: [],
    Cancelled: [],
  };

  if (!validTransitions[booking.status]?.includes(status)) {
    throw new ApiError(400, `Cannot transition booking from ${booking.status} to ${status}.`);
  }

  booking.status = status;
  if (status === "Completed" && booking.workerId) {
    await WorkerProfile.findOneAndUpdate(
      { userId: booking.workerId },
      { $inc: { jobsCompleted: 1 } }
    );
  }
  await booking.save();

  const populated = await booking.populate("customerId workerId", "name phone");

  let io;
  try {
    io = getIO();
    io.to(`user_${booking.customerId}`).emit("bookingStatusChanged", { bookingId: booking._id, status });
    if (booking.workerId) {
      io.to(`worker_${booking.workerId}`).emit("bookingStatusChanged", { bookingId: booking._id, status });
    }
  } catch (ioErr) {
    // Non-fatal socket emission failure
  }

  res.status(200).json({
    success: true,
    message: `Booking status updated to ${status}.`,
    data: populated,
  });
});
