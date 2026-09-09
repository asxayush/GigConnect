import Booking from "../models/Booking.js";
import { releasePayout } from "../controllers/paymentController.js";

/**
 * PART 3: The "Mutual Consent Overtime" Socket Logic
 * Conflict Resolution & Anti-Fraud Engine
 */
export const registerPaymentHandlers = (io, socket) => {
  /**
   * 1. Worker requests overtime / extra materials payment
   * Event: request_addon_payment
   * Payload: { bookingId, amount, reason }
   */
  socket.on("request_addon_payment", async (data) => {
    try {
      const { bookingId, amount, reason, workerId } = data || {};

      if (!bookingId || !amount || !reason) {
        return socket.emit("payment_error", {
          message: "bookingId, amount, and reason are required for add-on request.",
        });
      }

      const booking = await Booking.findById(bookingId).populate("customerId workerId", "name phone");
      if (!booking) {
        return socket.emit("payment_error", { message: "Booking not found." });
      }

      // Append new requested charge to additionalCharges array
      const chargeEntry = {
        reason: String(reason).trim(),
        amount: Number(amount),
        status: "requested",
        requestedAt: new Date(),
      };

      booking.additionalCharges.push(chargeEntry);
      await booking.save();

      const createdCharge = booking.additionalCharges[booking.additionalCharges.length - 1];

      const broadcastPayload = {
        bookingId: booking._id,
        chargeId: createdCharge._id,
        amount: createdCharge.amount,
        reason: createdCharge.reason,
        workerName: booking.workerId?.name || "Worker",
        requestedAt: createdCharge.requestedAt,
        baseFare: booking.baseFare || booking.price,
        currentTotal: booking.totalAmount,
      };

      console.log(`[Socket] Addon payment requested: Booking ${bookingId} for ₹${amount} (${reason})`);

      // Broadcast to Customer in booking room and personal room
      io.to(`booking_${bookingId}`).emit("addon_payment_requested", broadcastPayload);
      if (booking.customerId?._id) {
        io.to(`user_${booking.customerId._id}`).emit("addon_payment_requested", broadcastPayload);
      }

      // Acknowledge back to worker
      socket.emit("addon_request_sent", {
        success: true,
        chargeId: createdCharge._id,
        message: "Overtime request sent to customer. Awaiting their pre-payment approval.",
      });
    } catch (err) {
      console.error("[Socket] Error in request_addon_payment:", err.message);
      socket.emit("payment_error", { message: err.message });
    }
  });

  /**
   * 2. Customer approves & funds add-on payment
   * Event: approve_addon_payment
   * Payload: { bookingId, chargeId, razorpayOrderId, razorpayPaymentId, razorpaySignature }
   */
  socket.on("approve_addon_payment", async (data) => {
    try {
      const {
        bookingId,
        chargeId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      } = data || {};

      if (!bookingId || !chargeId) {
        return socket.emit("payment_error", {
          message: "bookingId and chargeId are required to approve add-on.",
        });
      }

      const booking = await Booking.findById(bookingId).populate("customerId workerId", "name phone");
      if (!booking) {
        return socket.emit("payment_error", { message: "Booking not found." });
      }

      const targetCharge = booking.additionalCharges.id(chargeId);
      if (!targetCharge) {
        return socket.emit("payment_error", { message: "Charge item not found in booking." });
      }

      targetCharge.status = "paid";
      targetCharge.razorpayOrderId = razorpayOrderId || targetCharge.razorpayOrderId;
      targetCharge.razorpayPaymentId = razorpayPaymentId || "mock_addon_pay_id";
      targetCharge.razorpaySignature = razorpaySignature || "mock_addon_sig";
      targetCharge.resolvedAt = new Date();

      // Recalculate totalAmount
      const paidAddons = booking.additionalCharges
        .filter((c) => c.status === "paid")
        .reduce((sum, c) => sum + Number(c.amount || 0), 0);

      booking.totalAmount = (Number(booking.baseFare) || Number(booking.price) || 0) + paidAddons;
      booking.price = booking.totalAmount;
      booking.distribution = {
        workerPayout: Math.round(booking.totalAmount * 0.95),
        mutualWelfare: Math.round(booking.totalAmount * 0.05),
        platformFee: 0,
      };

      await booking.save();

      const approvedPayload = {
        bookingId: booking._id,
        chargeId: targetCharge._id,
        reason: targetCharge.reason,
        amount: targetCharge.amount,
        status: "paid",
        newTotalAmount: booking.totalAmount,
        distribution: booking.distribution,
      };

      console.log(`[Socket] Addon payment approved: Booking ${bookingId} +₹${targetCharge.amount}`);

      // Broadcast to Worker so they can continue working
      io.to(`booking_${bookingId}`).emit("addon_approved", approvedPayload);
      if (booking.workerId?._id) {
        io.to(`worker_${booking.workerId._id}`).emit("addon_approved", approvedPayload);
      }

      socket.emit("addon_approval_confirmed", {
        success: true,
        data: approvedPayload,
      });
    } catch (err) {
      console.error("[Socket] Error in approve_addon_payment:", err.message);
      socket.emit("payment_error", { message: err.message });
    }
  });

  /**
   * 3. Customer rejects overtime / add-on payment
   * Event: reject_addon_payment
   * Payload: { bookingId, chargeId, reason }
   */
  socket.on("reject_addon_payment", async (data) => {
    try {
      const { bookingId, chargeId, reason } = data || {};

      if (!bookingId || !chargeId) {
        return socket.emit("payment_error", {
          message: "bookingId and chargeId are required to reject add-on.",
        });
      }

      const booking = await Booking.findById(bookingId).populate("customerId workerId", "name phone");
      if (!booking) {
        return socket.emit("payment_error", { message: "Booking not found." });
      }

      const targetCharge = booking.additionalCharges.id(chargeId);
      if (targetCharge) {
        targetCharge.status = "rejected";
        targetCharge.resolvedAt = new Date();
        await booking.save();
      }

      const rejectedPayload = {
        bookingId: booking._id,
        chargeId,
        reason: reason || "Customer declined additional overtime / charges.",
        status: "rejected",
        message: "Customer declined extra hours. Please wrap up work at agreed base time.",
      };

      console.log(`[Socket] Addon payment rejected: Booking ${bookingId}`);

      // Broadcast to Worker instructing them to stop at base time
      io.to(`booking_${bookingId}`).emit("addon_rejected", rejectedPayload);
      if (booking.workerId?._id) {
        io.to(`worker_${booking.workerId._id}`).emit("addon_rejected", rejectedPayload);
      }

      socket.emit("addon_rejection_confirmed", {
        success: true,
        data: rejectedPayload,
      });
    } catch (err) {
      console.error("[Socket] Error in reject_addon_payment:", err.message);
      socket.emit("payment_error", { message: err.message });
    }
  });

  /**
   * 4. Worker marks job as done (Dual-Handshake Step 1)
   * Event: worker_marked_done
   * Payload: { bookingId }
   */
  socket.on("worker_marked_done", async (data) => {
    try {
      const { bookingId } = data || {};

      if (!bookingId) {
        return socket.emit("payment_error", { message: "bookingId is required." });
      }

      const booking = await Booking.findById(bookingId).populate("customerId workerId", "name phone");
      if (!booking) {
        return socket.emit("payment_error", { message: "Booking not found." });
      }

      const autoReleaseDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24-hr auto-release
      booking.workerMarkedDone = true;
      booking.workerCompletedAt = new Date();
      booking.autoReleaseAt = autoReleaseDate;
      await booking.save();

      const handshakePayload = {
        bookingId: booking._id,
        workerName: booking.workerId?.name || "Worker",
        workerCompletedAt: booking.workerCompletedAt,
        autoReleaseAt: booking.autoReleaseAt,
        totalAmount: booking.totalAmount,
        distribution: booking.distribution,
        message: "Worker has completed the service. Please review work and confirm release of Escrow payment.",
      };

      console.log(`[Socket] Worker marked job done: Booking ${bookingId}. 24h auto-release clock started.`);

      // Notify customer to review and release funds
      io.to(`booking_${bookingId}`).emit("worker_completed_prompt", handshakePayload);
      if (booking.customerId?._id) {
        io.to(`user_${booking.customerId._id}`).emit("worker_completed_prompt", handshakePayload);
      }

      socket.emit("worker_done_acknowledged", {
        success: true,
        message: "Customer notified for dual-handshake confirmation. Escrow auto-release set for 24 hours if customer is unresponsive.",
        autoReleaseAt: autoReleaseDate,
      });
    } catch (err) {
      console.error("[Socket] Error in worker_marked_done:", err.message);
      socket.emit("payment_error", { message: err.message });
    }
  });
};
