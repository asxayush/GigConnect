import { Router } from "express";
import EmergencyAlert from "../models/EmergencyAlert.js";
import SOSEvent from "../models/SOSEvent.js";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import { getIO } from "../../sockets/bookingSocket.js";
import { sendEmergencySosEmail } from "../services/emailService.js";

const router = Router();

// POST /api/sos — trigger real SOS event, send email notification, broadcast socket, and log to MongoDB
router.post("/", async (req, res, next) => {
  try {
    const {
      bookingId,
      userId,
      workerId,
      location,
      reason,
      address = "Delhi NCR Service Site",
      emergencyContactEmail,
    } = req.body || {};

    let geoPoint = { type: "Point", coordinates: [77.209, 28.6139] };
    if (location && Array.isArray(location.coordinates)) {
      geoPoint = { type: "Point", coordinates: location.coordinates };
    } else if (location && location.lat && location.lng) {
      geoPoint = {
        type: "Point",
        coordinates: [Number(location.lng), Number(location.lat)],
      };
    }

    const sosCode = `SOS-${Date.now().toString().slice(-6)}`;

    // Resolve caller and worker details for email & dashboard
    let customerUser = null;
    let workerUser = null;

    if (userId) {
      customerUser = await User.findById(userId);
    } else if (req.user) {
      customerUser = req.user;
    }

    if (workerId) {
      workerUser = await User.findById(workerId);
    }

    if (bookingId && (!customerUser || !workerUser)) {
      const booking = await Booking.findById(bookingId).populate("customerId workerId");
      if (booking) {
        if (!customerUser && booking.customerId) customerUser = booking.customerId;
        if (!workerUser && booking.workerId) workerUser = booking.workerId;
      }
    }

    // 1. Send real emergency email notification
    const emailResult = await sendEmergencySosEmail({
      sosCode,
      bookingId,
      userName: customerUser?.name || "Cooperative Member",
      userPhone: customerUser?.phone || "Not specified",
      workerName: workerUser?.name || "Assigned Karigar",
      workerPhone: workerUser?.phone || "Not specified",
      address,
      coordinates: geoPoint.coordinates,
      recipientEmail: emergencyContactEmail || customerUser?.email || "safety-desk@gigconnect.coop",
    });

    // 2. Persist to SOSEvent collection
    const sosEvent = await SOSEvent.create({
      sosCode,
      bookingId: bookingId || undefined,
      userId: customerUser?._id || undefined,
      workerId: workerUser?._id || undefined,
      triggeredBy: req.user?.role === "worker" ? "worker" : "customer",
      location: geoPoint,
      address,
      emailNotificationSent: Boolean(emailResult.success),
      emailNotificationId: emailResult.messageId || "",
      emailPreviewUrl: emailResult.previewUrl || "",
      status: "active",
    });

    // 3. Keep EmergencyAlert in sync for backward compatibility
    const alert = await EmergencyAlert.create({
      bookingId: bookingId || undefined,
      userId: customerUser?._id || undefined,
      workerId: workerUser?._id || undefined,
      location: geoPoint,
      status: "active",
      reason: reason || `🚨 Emergency SOS Triggered (#${sosCode})`,
      notes: JSON.stringify({
        sosCode,
        address,
        emailMessageId: emailResult.messageId,
        emailPreviewUrl: emailResult.previewUrl,
      }),
    });

    // 4. Real-time WebSocket Broadcast
    try {
      const io = getIO();
      const payload = {
        alertId: alert._id,
        sosCode,
        bookingId,
        userId: customerUser?._id,
        userName: customerUser?.name || "Member",
        userPhone: customerUser?.phone,
        workerId: workerUser?._id,
        workerName: workerUser?.name,
        location: geoPoint,
        address,
        status: "active",
        reason: alert.reason,
        emailPreviewUrl: emailResult.previewUrl,
        triggeredAt: new Date(),
      };

      io.to("admin_room").emit("sos_alert_admin", payload);
      if (bookingId) {
        io.to(`booking_${bookingId}`).emit("sos_status_update", {
          ...payload,
          alertMessage: "🚨 Emergency Rapid Response Team and Coordinator Dispatched.",
        });
      }
    } catch (socketErr) {
      console.warn("Socket broadcast note:", socketErr.message);
    }

    res.status(201).json({
      success: true,
      data: {
        alertId: alert._id,
        sosCode: sosEvent.sosCode,
        status: sosEvent.status,
        emailNotificationSent: sosEvent.emailNotificationSent,
        emailPreviewUrl: sosEvent.emailPreviewUrl,
        location: geoPoint,
        message: "🚨 Rapid Response Team alerted. Emergency email dispatched.",
      },
      message: "Emergency SOS broadcasted successfully",
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/sos/active — live SOS feed for Federation Desk & Admin Dashboard
router.get(["/active", "/events"], async (req, res, next) => {
  try {
    const events = await SOSEvent.find()
      .populate("userId", "name phone email")
      .populate("workerId", "name phone")
      .populate("bookingId")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/sos/:id/resolve — resolve emergency SOS event
router.patch("/:id/resolve", async (req, res, next) => {
  try {
    const { resolutionNotes } = req.body || {};
    const event = await SOSEvent.findByIdAndUpdate(
      req.params.id,
      {
        status: "resolved",
        resolutionNotes: resolutionNotes || "Resolved by Federation Desk rapid response coordinator",
        resolvedAt: new Date(),
      },
      { new: true }
    );

    if (event) {
      await EmergencyAlert.findOneAndUpdate(
        { $or: [{ bookingId: event.bookingId }, { _id: req.params.id }] },
        { status: "resolved" }
      );
    }

    res.json({
      success: true,
      data: event,
      message: "SOS event marked as resolved",
    });
  } catch (err) {
    next(err);
  }
});

export default router;
