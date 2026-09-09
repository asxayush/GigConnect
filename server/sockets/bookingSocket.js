import { Server } from "socket.io";
import { registerChatHandlers } from "./chatSocket.js";
import { registerSupportHandlers } from "./supportSocket.js";
import { registerPaymentHandlers } from "./paymentSocket.js";
import EmergencyAlert from "../models/EmergencyAlert.js";

let ioInstance = null;

export const initBookingSocket = (httpServer) => {
  const allowedOrigins = (process.env.CLIENT_URL || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  ioInstance = new Server(httpServer, {
    cors: {
      origin: allowedOrigins.length ? allowedOrigins : "*",
      methods: ["GET", "POST", "PATCH"],
      credentials: true,
    },
  });

  ioInstance.on("connection", (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Register Chat Handlers
    registerChatHandlers(ioInstance, socket);

    // Register Support & Escalation Handlers
    registerSupportHandlers(ioInstance, socket);

    // Register Payment & Mutual Consent Overtime Handlers
    registerPaymentHandlers(ioInstance, socket);

    // 1. Worker joins private room
    socket.on("joinWorker", ({ workerId }) => {
      if (workerId) {
        socket.join(`worker_${workerId}`);
        console.log(`[Socket.io] Worker ${workerId} joined room: worker_${workerId}`);
      }
    });

    // 2. Customer joins private room
    socket.on("joinUser", ({ userId }) => {
      if (userId) {
        socket.join(`user_${userId}`);
        console.log(`[Socket.io] User ${userId} joined room: user_${userId}`);
      }
    });

    // 3. Join specific booking room for real-time tracking & updates
    const handleJoinBooking = ({ bookingId }) => {
      if (bookingId) {
        socket.join(`booking_${bookingId}`);
        console.log(`[Socket.io] Socket ${socket.id} joined room: booking_${bookingId}`);
      }
    };
    socket.on("joinBooking", handleJoinBooking);
    socket.on("join_booking", handleJoinBooking);

    // 4. Join Federation Admin Room for high-priority dispatch and SOS
    const handleJoinAdmin = () => {
      socket.join("admin_room");
      console.log(`[Socket.io] Admin socket ${socket.id} joined admin_room`);
    };
    socket.on("join_admin", handleJoinAdmin);
    socket.on("join_admin_room", handleJoinAdmin);

    // 5. LIVE TRACKING: Worker broadcasts GPS position to booking room
    socket.on("update_location", (data) => {
      const { bookingId, workerId, lat, lng, coordinates, heading, speed } = data || {};
      const actualCoords = coordinates || (lat && lng ? [lng, lat] : null);

      if (bookingId) {
        const payload = {
          bookingId,
          workerId,
          lat: lat || (actualCoords ? actualCoords[1] : undefined),
          lng: lng || (actualCoords ? actualCoords[0] : undefined),
          coordinates: actualCoords,
          heading: heading || 0,
          speed: speed || 0,
          timestamp: new Date().toISOString(),
        };

        // Broadcast to customer & participants in booking room
        ioInstance.to(`booking_${bookingId}`).emit("location_update", payload);
        // Also broadcast to admin room for monitoring
        ioInstance.to("admin_room").emit("worker_location_update", payload);
      }
    });

    // 6. EMERGENCY SOS: Trigger instant emergency broadcast & persist to DB
    socket.on("trigger_sos", async (data) => {
      try {
        const { bookingId, userId, workerId, location, reason, metadata } = data || {};
        
        let geoPoint = { type: "Point", coordinates: [77.2090, 28.6139] };
        if (location && Array.isArray(location.coordinates)) {
          geoPoint = { type: "Point", coordinates: location.coordinates };
        } else if (location && location.lat && location.lng) {
          geoPoint = { type: "Point", coordinates: [Number(location.lng), Number(location.lat)] };
        }

        // Create and persist active EmergencyAlert document in MongoDB
        let alertDoc = null;
        try {
          alertDoc = await EmergencyAlert.create({
            bookingId: bookingId || undefined,
            userId: userId || undefined,
            workerId: workerId || undefined,
            location: geoPoint,
            status: "active",
            reason: reason || "🚨 In-app Emergency SOS Triggered by Customer",
            notes: metadata ? JSON.stringify(metadata) : "",
          });
        } catch (dbErr) {
          console.warn("[Socket.io] EmergencyAlert DB creation fallback:", dbErr.message);
        }

        const sosPayload = {
          alertId: alertDoc?._id || `sos-${Date.now()}`,
          bookingId,
          userId,
          workerId,
          location: geoPoint,
          status: "active",
          reason: reason || "🚨 In-app Emergency SOS Triggered by Customer",
          triggeredAt: new Date().toISOString(),
          severity: "critical",
          socketId: socket.id,
        };

        console.error(`🚨 [CRITICAL SOS] Emergency alert triggered for Booking: ${bookingId}, User: ${userId}`);

        // Broadcast to Federation Admin Desk
        ioInstance.to("admin_room").emit("sos_alert_admin", sosPayload);

        // Broadcast back to current booking room so UI confirms alert status
        if (bookingId) {
          ioInstance.to(`booking_${bookingId}`).emit("sos_status_update", {
            ...sosPayload,
            alertMessage: "Federation Admins have been alerted and are tracking this job.",
          });
        }

        // Acknowledge back to sender socket
        socket.emit("sos_acknowledged", {
          success: true,
          alertId: sosPayload.alertId,
          message: "Federation Admins have been alerted and are tracking this job.",
        });
      } catch (err) {
        console.error("[Socket.io] Error in trigger_sos handler:", err.message);
        socket.emit("sos_error", { success: false, message: err.message });
      }
    });

    // 7. Resolve SOS Alert by Admin
    socket.on("resolve_sos", async ({ alertId, bookingId, notes, resolvedBy }) => {
      try {
        if (alertId) {
          await EmergencyAlert.findByIdAndUpdate(alertId, {
            status: "resolved",
            resolvedAt: new Date(),
            resolvedBy,
            notes,
          });
        }

        ioInstance.to("admin_room").emit("sos_resolved", { alertId, bookingId });
        if (bookingId) {
          ioInstance.to(`booking_${bookingId}`).emit("sos_status_update", {
            bookingId,
            status: "resolved",
            resolvedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error("[Socket.io] Error resolving SOS:", err.message);
      }
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return ioInstance;
};

export const getIO = () => {
  if (!ioInstance) {
    throw new Error("Socket.io has not been initialized. Call initBookingSocket first.");
  }
  return ioInstance;
};
