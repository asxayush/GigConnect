import { Server } from "socket.io";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import EmergencyAlert from "../models/EmergencyAlert.js";
import { registerChatHandlers } from "./chatSocket.js";
import { registerSupportHandlers } from "./supportSocket.js";
import { registerPaymentHandlers } from "./paymentSocket.js";

let ioInstance = null;

/**
 * Helper to get active Socket.io instance
 */
export const getIO = () => ioInstance;

/**
 * Socket notification when payment is verified in Escrow (REST -> Worker)
 */
export const notifyPaymentSecured = (booking) => {
  if (!ioInstance || !booking) return;

  const payload = {
    bookingId: String(booking._id),
    customerId: String(booking.customerId),
    workerId: String(booking.workerId),
    serviceCategory: booking.serviceCategory,
    paymentStatus: "held_in_escrow",
    requestStatus: booking.requestStatus || "accepted",
    totalAmount: booking.totalAmount,
    message: "Pre-paid Escrow funds secured! Please travel to customer site.",
    timestamp: new Date().toISOString(),
  };

  const targetWorker = String(booking.workerId);
  const targetCustomer = String(booking.customerId);

  // Emit to Worker room (supports raw ID and prefixed ID)
  ioInstance.to(targetWorker).emit("payment_secured_proceed", payload);
  ioInstance.to(`worker_${targetWorker}`).emit("payment_secured_proceed", payload);

  // Also broadcast to Customer & Booking room
  ioInstance.to(targetCustomer).emit("payment_secured_confirmed", payload);
  ioInstance.to(`user_${targetCustomer}`).emit("payment_secured_confirmed", payload);
  ioInstance.to(`booking_${booking._id}`).emit("payment_secured_proceed", payload);

  console.log(`[Socket] Emitted payment_secured_proceed for Booking ${booking._id} to Worker ${targetWorker}`);
};

/**
 * Initialize Socket.io server and real-time handshake handlers
 */
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

    // Register Chat, Support & Overtime Handlers
    registerChatHandlers(ioInstance, socket);
    registerSupportHandlers(ioInstance, socket);
    registerPaymentHandlers(ioInstance, socket);

    // ==========================================
    // ROOM SUBSCRIPTIONS
    // ==========================================

    // 1. Worker joins personal room
    const handleJoinWorker = ({ workerId, userId }) => {
      const id = workerId || userId;
      if (id) {
        socket.join(String(id));
        socket.join(`worker_${id}`);
        console.log(`[Socket.io] Worker joined rooms: '${id}' & 'worker_${id}'`);
      }
    };
    socket.on("joinWorker", handleJoinWorker);
    socket.on("join_worker", handleJoinWorker);

    // 2. Customer joins personal room
    const handleJoinUser = ({ userId, customerId }) => {
      const id = userId || customerId;
      if (id) {
        socket.join(String(id));
        socket.join(`user_${id}`);
        console.log(`[Socket.io] User joined rooms: '${id}' & 'user_${id}'`);
      }
    };
    socket.on("joinUser", handleJoinUser);
    socket.on("join_user", handleJoinUser);

    // 3. Join specific booking room
    const handleJoinBooking = ({ bookingId }) => {
      if (bookingId) {
        socket.join(String(bookingId));
        socket.join(`booking_${bookingId}`);
        console.log(`[Socket.io] Joined booking room: 'booking_${bookingId}'`);
      }
    };
    socket.on("joinBooking", handleJoinBooking);
    socket.on("join_booking", handleJoinBooking);

    // 4. Admin room for dispatch & SOS monitoring
    socket.on("join_admin", () => socket.join("admin_room"));
    socket.on("join_admin_room", () => socket.join("admin_room"));

    // ==========================================
    // PART 4: REAL-TIME BOOKING HANDSHAKE
    // ==========================================

    /**
     * Event: request_booking
     * Customer initiates booking. DB creates record (pending, unpaid).
     * Backend emits new_booking_request to the assigned/target Worker.
     */
    socket.on("request_booking", async (payload, callback) => {
      try {
        const {
          customerId,
          workerId,
          serviceCategory,
          bookingType = "immediate",
          scheduledDate,
          scheduledAt,
          baseFare = 250,
          price = 250,
          address = "Customer Location",
          location,
          isEmergency = false,
          specialRequest = "",
        } = payload || {};

        if (!customerId || !serviceCategory) {
          if (typeof callback === "function") {
            return callback({ success: false, error: "customerId and serviceCategory are required." });
          }
          return socket.emit("error", { message: "customerId and serviceCategory are required." });
        }

        const effectiveSchedule = scheduledDate || scheduledAt || (bookingType === "scheduled" ? new Date(Date.now() + 86400000) : new Date());

        const newBooking = await Booking.create({
          customerId,
          workerId: workerId || undefined,
          serviceCategory,
          bookingType,
          scheduledDate: effectiveSchedule,
          scheduledAt: effectiveSchedule,
          requestStatus: "pending",
          status: "pending",
          paymentStatus: "unpaid",
          baseFare: Number(baseFare || price || 250),
          price: Number(baseFare || price || 250),
          totalAmount: Number(baseFare || price || 250),
          address,
          location: location || { type: "Point", coordinates: [77.2090, 28.6139] },
          isEmergency: Boolean(isEmergency),
          specialRequest,
        });

        const bookingData = await Booking.findById(newBooking._id)
          .populate("customerId", "name phone avatar gender")
          .populate("workerId", "name phone avatar trade");

        const broadcastPayload = {
          bookingId: String(newBooking._id),
          booking: bookingData || newBooking,
          customerId: String(customerId),
          workerId: workerId ? String(workerId) : null,
          serviceCategory,
          bookingType,
          scheduledDate: effectiveSchedule,
          baseFare: newBooking.baseFare,
          totalAmount: newBooking.totalAmount,
          requestStatus: "pending",
          paymentStatus: "unpaid",
          address,
          timestamp: new Date().toISOString(),
        };

        // Notify specific worker room
        if (workerId) {
          ioInstance.to(String(workerId)).emit("new_booking_request", broadcastPayload);
          ioInstance.to(`worker_${workerId}`).emit("new_booking_request", broadcastPayload);
        }

        // Notify customer that booking is created and pending worker acceptance
        socket.emit("booking_created", {
          success: true,
          message: "Booking request placed. Waiting for worker acceptance.",
          data: broadcastPayload,
        });

        if (typeof callback === "function") {
          callback({ success: true, data: broadcastPayload });
        }

        console.log(`[Handshake] New booking requested: ${newBooking._id} -> Worker ${workerId}`);
      } catch (err) {
        console.error("[Handshake] Error in request_booking:", err);
        if (typeof callback === "function") callback({ success: false, error: err.message });
        socket.emit("booking_error", { message: err.message });
      }
    });

    /**
     * Event: accept_booking
     * Worker accepts the pending request.
     * Backend updates DB (requestStatus: 'accepted') and emits booking_accepted_pay_now to Customer.
     */
    socket.on("accept_booking", async (payload, callback) => {
      try {
        const { bookingId, workerId } = payload || {};

        if (!bookingId) {
          if (typeof callback === "function") return callback({ success: false, error: "bookingId is required." });
          return socket.emit("error", { message: "bookingId is required." });
        }

        const booking = await Booking.findById(bookingId);
        if (!booking) {
          if (typeof callback === "function") return callback({ success: false, error: "Booking not found." });
          return socket.emit("error", { message: "Booking not found." });
        }

        booking.requestStatus = "accepted";
        booking.status = "accepted";
        if (workerId && !booking.workerId) {
          booking.workerId = workerId;
        }
        booking.assignedAt = new Date();
        await booking.save();

        const populatedBooking = await Booking.findById(booking._id)
          .populate("customerId", "name phone avatar")
          .populate("workerId", "name phone avatar trade");

        const responsePayload = {
          bookingId: String(booking._id),
          booking: populatedBooking || booking,
          customerId: String(booking.customerId),
          workerId: String(booking.workerId),
          requestStatus: "accepted",
          paymentStatus: booking.paymentStatus, // 'unpaid'
          baseFare: booking.baseFare,
          totalAmount: booking.totalAmount,
          message: "Worker accepted! Please complete pre-paid escrow payment to lock booking.",
          timestamp: new Date().toISOString(),
        };

        const targetCust = String(booking.customerId);

        // Emit booking_accepted_pay_now to Customer room
        ioInstance.to(targetCust).emit("booking_accepted_pay_now", responsePayload);
        ioInstance.to(`user_${targetCust}`).emit("booking_accepted_pay_now", responsePayload);
        ioInstance.to(`booking_${booking._id}`).emit("booking_accepted_pay_now", responsePayload);

        // Acknowledge worker
        socket.emit("booking_accepted_confirmed", {
          success: true,
          message: "You have accepted the booking. Customer has been asked to fund escrow.",
          data: responsePayload,
        });

        if (typeof callback === "function") {
          callback({ success: true, data: responsePayload });
        }

        console.log(`[Handshake] Worker ${booking.workerId} accepted Booking ${booking._id}`);
      } catch (err) {
        console.error("[Handshake] Error in accept_booking:", err);
        if (typeof callback === "function") callback({ success: false, error: err.message });
      }
    });

    /**
     * Event: reject_booking
     */
    socket.on("reject_booking", async (payload, callback) => {
      try {
        const { bookingId, reason } = payload || {};
        const booking = await Booking.findById(bookingId);
        if (booking) {
          booking.requestStatus = "rejected";
          booking.status = "rejected";
          await booking.save();

          const rejectPayload = {
            bookingId: String(booking._id),
            requestStatus: "rejected",
            reason: reason || "Worker is currently unavailable.",
          };

          const targetCust = String(booking.customerId);
          ioInstance.to(targetCust).emit("booking_rejected", rejectPayload);
          ioInstance.to(`user_${targetCust}`).emit("booking_rejected", rejectPayload);
        }

        if (typeof callback === "function") callback({ success: true });
      } catch (err) {
        if (typeof callback === "function") callback({ success: false, error: err.message });
      }
    });

    /**
     * Event: payment_verified_trigger (Internal / client socket fallback trigger)
     */
    socket.on("payment_verified_trigger", async (payload) => {
      const { bookingId } = payload || {};
      if (bookingId) {
        const booking = await Booking.findById(bookingId);
        if (booking) notifyPaymentSecured(booking);
      }
    });

    // ==========================================
    // GPS LOCATION & EMERGENCY SOS HANDLERS
    // ==========================================

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

        ioInstance.to(String(bookingId)).emit("location_update", payload);
        ioInstance.to(`booking_${bookingId}`).emit("location_update", payload);
        ioInstance.to("admin_room").emit("worker_location_update", payload);
      }
    });

    socket.on("trigger_sos", async (data) => {
      try {
        const { bookingId, userId, workerId, location, reason, metadata } = data || {};
        let geoPoint = { type: "Point", coordinates: [77.2090, 28.6139] };
        if (location && Array.isArray(location.coordinates)) {
          geoPoint = { type: "Point", coordinates: location.coordinates };
        } else if (location && location.lat && location.lng) {
          geoPoint = { type: "Point", coordinates: [location.lng, location.lat] };
        }

        const alert = await EmergencyAlert.create({
          bookingId: bookingId || undefined,
          triggeredBy: userId || workerId,
          userRole: workerId ? "worker" : "customer",
          location: geoPoint,
          reason: reason || "RED ALERT: Emergency SOS Triggered",
          status: "active",
          metadata: metadata || {},
        });

        const sosPayload = {
          alertId: alert._id,
          bookingId,
          triggeredBy: userId || workerId,
          location: geoPoint,
          reason: alert.reason,
          timestamp: new Date().toISOString(),
        };

        ioInstance.to("admin_room").emit("emergency_sos_alert", sosPayload);
        if (bookingId) {
          ioInstance.to(`booking_${bookingId}`).emit("emergency_sos_alert", sosPayload);
        }
      } catch (e) {
        console.error("[Socket] SOS Trigger Error:", e.message);
      }
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return ioInstance;
};
