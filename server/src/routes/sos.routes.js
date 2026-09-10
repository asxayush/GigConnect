import { Router } from "express";
import mongoose from "mongoose";
import EmergencyAlert from "../models/EmergencyAlert.js";
import SOSEvent from "../models/SOSEvent.js";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import { getIO } from "../../sockets/bookingSocket.js";
import { sendEmergencySosEmail } from "../services/emailService.js";

const router = Router();

function asObjectId(id) {
  if (!id) return undefined;
  const value = String(id);
  if (!mongoose.Types.ObjectId.isValid(value)) return undefined;
  return value;
}

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

    const bookingObjectId = asObjectId(bookingId);
    const userObjectId = asObjectId(userId);
    const workerObjectId = asObjectId(workerId);

    let geoPoint = { type: "Point", coordinates: [77.209, 28.6139] };
    if (location && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
      geoPoint = { type: "Point", coordinates: location.coordinates.map(Number) };
    } else if (location && location.lat != null && location.lng != null) {
      geoPoint = {
        type: "Point",
        coordinates: [Number(location.lng), Number(location.lat)],
      };
    }

    const sosCode = `SOS-${Date.now().toString().slice(-6)}`;

    let customerUser = null;
    let workerUser = null;

    if (userObjectId) {
      customerUser = await User.findById(userObjectId);
    } else if (req.user) {
      customerUser = req.user;
    }

    if (workerObjectId) {
      workerUser = await User.findById(workerObjectId);
    }

    if (bookingObjectId && (!customerUser || !workerUser)) {
      const booking = await Booking.findById(bookingObjectId).populate("customerId workerId");
      if (booking) {
        if (!customerUser && booking.customerId) customerUser = booking.customerId;
        if (!workerUser && booking.workerId) workerUser = booking.workerId;
      }
    }

    const emailResult = await sendEmergencySosEmail({
      sosCode,
      bookingId: bookingObjectId || bookingId || "Direct SOS",
      userName: customerUser?.name || "Cooperative Member",
      userPhone: customerUser?.phone || "Not specified",
      workerName: workerUser?.name || "Assigned Karigar",
      workerPhone: workerUser?.phone || "Not specified",
      address,
      coordinates: geoPoint.coordinates,
      recipientEmail: emergencyContactEmail || customerUser?.email || "safety-desk@gigconnect.coop",
    });

    const sosEvent = await SOSEvent.create({
      sosCode,
      bookingId: bookingObjectId,
      userId: customerUser?._id || userObjectId,
      workerId: workerUser?._id || workerObjectId,
      triggeredBy: req.user?.role === "worker" ? "worker" : "customer",
      location: geoPoint,
      address,
      emailNotificationSent: Boolean(emailResult.success),
      emailNotificationId: emailResult.messageId || "",
      emailPreviewUrl: emailResult.previewUrl || "",
      status: "active",
    });

    const alert = await EmergencyAlert.create({
      bookingId: bookingObjectId,
      userId: customerUser?._id || userObjectId,
      workerId: workerUser?._id || workerObjectId,
      location: geoPoint,
      status: "active",
      reason: reason || `🚨 Emergency SOS Triggered (#${sosCode})`,
      notes: JSON.stringify({
        sosCode,
        address,
        emailMessageId: emailResult.messageId,
        emailPreviewUrl: emailResult.previewUrl,
        emailSent: Boolean(emailResult.success),
        emailError: emailResult.error || null,
      }),
    });

    try {
      const io = getIO();
      const payload = {
        alertId: alert._id,
        sosCode,
        bookingId: bookingObjectId || bookingId,
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
        emailNotificationSent: Boolean(emailResult.success),
        triggeredAt: new Date(),
      };

      io.to("admin_room").emit("sos_alert_admin", payload);
      io.to("admin_room").emit("emergency_sos_alert", payload);
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
        message: emailResult.success
          ? "🚨 Rapid Response Team alerted. Emergency email dispatched."
          : "🚨 Rapid Response Team alerted. Email dispatch failed — alert is still logged.",
      },
      message: "Emergency SOS broadcasted successfully",
      warning: emailResult.success ? undefined : `Email dispatch failed: ${emailResult.error || "unknown"}`,
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
