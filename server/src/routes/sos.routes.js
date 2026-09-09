import { Router } from "express";
import EmergencyAlert from "../models/EmergencyAlert.js";
import { getIO } from "../../sockets/bookingSocket.js";

const router = Router();

// POST /api/sos — trigger SOS alert over REST
router.post("/", async (req, res, next) => {
  try {
    const { bookingId, userId, workerId, location, reason, metadata } = req.body || {};

    let geoPoint = { type: "Point", coordinates: [77.2090, 28.6139] };
    if (location && Array.isArray(location.coordinates)) {
      geoPoint = { type: "Point", coordinates: location.coordinates };
    } else if (location && location.lat && location.lng) {
      geoPoint = { type: "Point", coordinates: [Number(location.lng), Number(location.lat)] };
    }

    const alert = await EmergencyAlert.create({
      bookingId: bookingId || undefined,
      userId: userId || req.user?._id,
      workerId: workerId || undefined,
      location: geoPoint,
      status: "active",
      reason: reason || "🚨 In-app Emergency SOS Triggered by Customer",
      notes: metadata ? JSON.stringify(metadata) : "",
    });

    // Broadcast via socket if available
    try {
      const io = getIO();
      const payload = {
        alertId: alert._id,
        bookingId,
        userId: userId || req.user?._id,
        workerId,
        location: geoPoint,
        status: "active",
        reason: alert.reason,
        triggeredAt: alert.createdAt,
      };
      io.to("admin_room").emit("sos_alert_admin", payload);
      if (bookingId) {
        io.to(`booking_${bookingId}`).emit("sos_status_update", {
          ...payload,
          alertMessage: "Federation Admins have been alerted and are tracking this job.",
        });
      }
    } catch (socketErr) {
      console.warn("Socket broadcast fallback for SOS:", socketErr.message);
    }

    res.status(201).json({
      success: true,
      data: alert,
      message: "Federation Admins have been alerted and are tracking this job.",
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/sos/active — list all active alerts for Federation Desk
router.get("/active", async (req, res, next) => {
  try {
    const alerts = await EmergencyAlert.find({ status: "active" })
      .populate("userId", "name phone")
      .populate("workerId", "name phone")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: alerts });
  } catch (err) {
    next(err);
  }
});

export default router;
