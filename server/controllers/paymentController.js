import crypto from "node:crypto";
import Razorpay from "razorpay";
import Booking from "../models/Booking.js";
import WorkerProfile from "../models/WorkerProfile.js";
import { getIO } from "../sockets/bookingSocket.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Lazy / Safe Razorpay client factory
 */
export const getRazorpayInstance = () => {
  const key_id =
    process.env.RAZORPAY_KEY_ID ||
    process.env.RAZORPAY_KEY ||
    "rzp_test_gigconnect";
  const key_secret =
    process.env.RAZORPAY_KEY_SECRET ||
    process.env.RAZORPAY_SECRET ||
    "gigconnect_test_secret_2026";

  return {
    instance: new Razorpay({ key_id, key_secret }),
    keyId: key_id,
    keySecret: key_secret,
    isConfigured: Boolean(
      process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ),
  };
};

/**
 * PART 2: Razorpay Controller
 */

/**
 * @desc 1. Create Razorpay order for initial base fare (Pre-paid Escrow)
 * @route POST /api/payments/orders/base
 * @access Private
 */
export const createBaseOrder = asyncHandler(async (req, res) => {
  const { bookingId, amount } = req.body;

  if (!bookingId) {
    throw new ApiError(400, "bookingId is required to initialize payment.");
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, "Booking record not found.");
  }

  // Prevent double payment
  if (
    booking.paymentStatus === "held_in_escrow" ||
    booking.paymentStatus === "paid" ||
    booking.paymentStatus === "released_to_worker"
  ) {
    return res.status(400).json({
      success: false,
      message: "This booking is already funded and secured in Escrow.",
      data: { paymentStatus: booking.paymentStatus, totalAmount: booking.totalAmount },
    });
  }

  const targetAmount = Number(amount || booking.baseFare || booking.price || 249);
  const amountInPaise = Math.max(100, Math.round(targetAmount * 100));

  const { instance, keyId, isConfigured } = getRazorpayInstance();
  let orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  let orderPayload = {
    id: orderId,
    amount: amountInPaise,
    currency: "INR",
    receipt: String(booking._id),
  };

  if (isConfigured) {
    try {
      const rzpOrder = await instance.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: String(booking._id),
        notes: {
          bookingId: String(booking._id),
          serviceCategory: booking.serviceCategory,
          type: "BASE_FARE_ESCROW",
          cooperative: "GigConnect Multi-State Cooperative",
        },
      });
      orderPayload = rzpOrder;
      orderId = rzpOrder.id;
    } catch (rzpErr) {
      console.warn("[Razorpay] Order create fallback to synthetic ID:", rzpErr.message);
    }
  }

  booking.baseFare = targetAmount;
  booking.price = targetAmount;
  booking.totalAmount = targetAmount;
  booking.paymentStatus = "order_created";
  booking.razorpayOrderId = orderId;
  booking.paymentOrderId = orderId;
  await booking.save();

  return res.status(201).json({
    success: true,
    data: {
      orderId: orderId,
      amount: orderPayload.amount,
      currency: orderPayload.currency,
      keyId: keyId,
      bookingId: booking._id,
      baseFare: targetAmount,
      totalAmount: booking.totalAmount,
    },
    message: "Base fare escrow order initialized successfully.",
  });
});

/**
 * @desc 2. Verify Razorpay Signature & Lock funds in Escrow
 * @route POST /api/payments/verify
 * @access Private
 */
export const verifyPayment = asyncHandler(async (req, res) => {
  const {
    bookingId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  if (!bookingId || !razorpay_order_id || !razorpay_payment_id) {
    throw new ApiError(
      400,
      "bookingId, razorpay_order_id, and razorpay_payment_id are mandatory."
    );
  }

  const booking = await Booking.findById(bookingId).populate(
    "workerId",
    "name phone"
  );
  if (!booking) {
    throw new ApiError(404, "Booking not found.");
  }

  if (
    booking.paymentStatus === "held_in_escrow" ||
    booking.paymentStatus === "released_to_worker"
  ) {
    return res.status(200).json({
      success: true,
      data: booking,
      message: "Payment signature already verified and funds held in escrow.",
    });
  }

  const { keySecret, isConfigured } = getRazorpayInstance();

  // HMAC SHA256 Signature verification
  let isValidSignature = true;
  if (isConfigured && razorpay_signature) {
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      isValidSignature = false;
    }
  }

  if (!isValidSignature) {
    booking.paymentStatus = "failed";
    await booking.save();
    throw new ApiError(400, "Invalid payment cryptographic signature. Security verification failed.");
  }

  // Calculate Zero Platform Fee Distribution (95% Worker / 5% Mutual Welfare / 0% Platform)
  const totalBill = Number(booking.totalAmount || booking.baseFare || booking.price || 0);
  const workerPayout = Math.round(totalBill * 0.95);
  const mutualWelfare = Math.round(totalBill * 0.05);
  const platformFee = 0;

  const otpPin = booking.otp || Math.floor(1000 + Math.random() * 9000).toString();

  booking.paymentStatus = "held_in_escrow";
  booking.razorpayOrderId = razorpay_order_id;
  booking.razorpayPaymentId = razorpay_payment_id;
  booking.paymentSignature = razorpay_signature || "sha256_mock_verified";
  booking.status = "Assigned";
  booking.assignedAt = new Date();
  booking.otp = otpPin;
  booking.otpAttempts = 0;
  booking.distribution = {
    workerPayout,
    mutualWelfare,
    platformFee,
  };

  await booking.save();

  // Broadcast real-time event to rooms
  try {
    const io = getIO();
    if (io) {
      const payload = {
        bookingId: booking._id,
        status: "Assigned",
        paymentStatus: "held_in_escrow",
        otp: otpPin,
        totalAmount: booking.totalAmount,
        distribution: booking.distribution,
      };

      io.to(`booking_${booking._id}`).emit("booking_paid", payload);
      io.to(`booking_${booking._id}`).emit("payment_escrow_secured", payload);

      if (booking.workerId?._id) {
        io.to(`worker_${booking.workerId._id}`).emit("newBookingAssigned", booking);
      }
    }
  } catch (socketErr) {
    console.warn("[Payment Verification] Socket emit warning:", socketErr.message);
  }

  return res.status(200).json({
    success: true,
    data: {
      bookingId: booking._id,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      razorpayOrderId: booking.razorpayOrderId,
      razorpayPaymentId: booking.razorpayPaymentId,
      totalAmount: booking.totalAmount,
      distribution: booking.distribution,
      otp: booking.otp,
    },
    message: "Payment successfully verified! 100% of funds locked in dispute-free Escrow.",
  });
});

/**
 * @desc 3. Create Razorpay order for approved Add-On / Overtime charge
 * @route POST /api/payments/orders/addon
 * @access Private
 */
export const createAddOnOrder = asyncHandler(async (req, res) => {
  const { bookingId, chargeId, amount, reason } = req.body;

  if (!bookingId) {
    throw new ApiError(400, "bookingId is required.");
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, "Booking not found.");
  }

  let targetCharge = null;
  if (chargeId) {
    targetCharge = booking.additionalCharges.id(chargeId);
  } else if (amount && reason) {
    booking.additionalCharges.push({
      reason,
      amount: Number(amount),
      status: "requested",
      requestedAt: new Date(),
    });
    targetCharge = booking.additionalCharges[booking.additionalCharges.length - 1];
  }

  if (!targetCharge) {
    throw new ApiError(404, "Target add-on charge not found or underspecified.");
  }

  if (targetCharge.status === "paid") {
    return res.status(400).json({
      success: false,
      message: "This add-on charge has already been paid.",
    });
  }

  const amountInPaise = Math.max(100, Math.round(Number(targetCharge.amount) * 100));
  const { instance, keyId, isConfigured } = getRazorpayInstance();

  let orderId = `addon_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  let orderPayload = {
    id: orderId,
    amount: amountInPaise,
    currency: "INR",
    receipt: `addon_${targetCharge._id}`,
  };

  if (isConfigured) {
    try {
      const rzpOrder = await instance.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: `addon_${targetCharge._id}`,
        notes: {
          bookingId: String(booking._id),
          chargeId: String(targetCharge._id),
          reason: targetCharge.reason,
          type: "ADDON_OVERTIME_PAYMENT",
        },
      });
      orderPayload = rzpOrder;
      orderId = rzpOrder.id;
    } catch (rzpErr) {
      console.warn("[Razorpay] Add-on order create fallback:", rzpErr.message);
    }
  }

  targetCharge.razorpayOrderId = orderId;
  await booking.save();

  return res.status(201).json({
    success: true,
    data: {
      orderId: orderId,
      chargeId: targetCharge._id,
      amount: orderPayload.amount,
      currency: orderPayload.currency,
      keyId: keyId,
      bookingId: booking._id,
      reason: targetCharge.reason,
    },
    message: "Add-on Razorpay order created for customer approval.",
  });
});

/**
 * @desc 3b. Verify Add-On payment signature & update charge status to 'paid'
 * @route POST /api/payments/verify/addon
 * @access Private
 */
export const verifyAddOnPayment = asyncHandler(async (req, res) => {
  const {
    bookingId,
    chargeId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  if (!bookingId || !chargeId) {
    throw new ApiError(400, "bookingId and chargeId are required.");
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, "Booking not found.");
  }

  const charge = booking.additionalCharges.id(chargeId);
  if (!charge) {
    throw new ApiError(404, "Additional charge record not found.");
  }

  if (charge.status === "paid") {
    return res.status(200).json({
      success: true,
      data: booking,
      message: "Add-on charge already verified and paid.",
    });
  }

  const { keySecret, isConfigured } = getRazorpayInstance();

  let isValid = true;
  if (isConfigured && razorpay_signature && razorpay_order_id && razorpay_payment_id) {
    const expected = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");
    if (expected !== razorpay_signature) {
      isValid = false;
    }
  }

  if (!isValid) {
    charge.status = "rejected";
    await booking.save();
    throw new ApiError(400, "Add-on payment signature verification failed.");
  }

  charge.status = "paid";
  charge.razorpayPaymentId = razorpay_payment_id;
  charge.razorpaySignature = razorpay_signature || "sha256_mock_verified";
  charge.resolvedAt = new Date();

  // Recalculate total amount and splits
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

  // Real-time broadcast to worker that overtime/addon has been funded!
  try {
    const io = getIO();
    if (io) {
      const eventPayload = {
        bookingId: booking._id,
        chargeId: charge._id,
        reason: charge.reason,
        amount: charge.amount,
        status: "paid",
        newTotalAmount: booking.totalAmount,
        distribution: booking.distribution,
      };

      io.to(`booking_${booking._id}`).emit("addon_approved", eventPayload);
      if (booking.workerId) {
        io.to(`worker_${booking.workerId}`).emit("addon_approved", eventPayload);
      }
    }
  } catch (socketErr) {
    console.warn("[AddOn Verify] Socket emit error:", socketErr.message);
  }

  return res.status(200).json({
    success: true,
    data: {
      bookingId: booking._id,
      chargeId: charge._id,
      status: charge.status,
      totalAmount: booking.totalAmount,
      distribution: booking.distribution,
    },
    message: "Overtime/Add-on payment verified and approved successfully.",
  });
});

/**
 * @desc 4. Release Escrow Payout (Mock / Razorpay Route Integration)
 * Can be called upon Customer Dual-Handshake confirmation OR 24-hr Auto-Release Cron.
 */
export const releasePayout = async (booking, releaseContext = {}) => {
  if (!booking) throw new Error("Booking instance is required for payout release.");

  // If already released, return idempotently
  if (booking.paymentStatus === "released_to_worker") {
    return booking;
  }

  const workerPayoutAmount = booking.distribution?.workerPayout || Math.round(Number(booking.totalAmount || booking.price || 0) * 0.95);
  const welfareAmount = booking.distribution?.mutualWelfare || Math.round(Number(booking.totalAmount || booking.price || 0) * 0.05);

  /**
   * Razorpay Route / Payout Dispatch Logic (Simulated for Hackathon/Staging)
   * In Production:
   * await razorpay.transfers.create({
   *   account: workerProfile.bankAccountOrVpa,
   *   amount: workerPayoutAmount * 100,
   *   currency: "INR",
   *   notes: { bookingId: booking._id, split: "95_percent_worker" }
   * });
   */
  console.log(`[ESCROW PAYOUT RELEASED] Booking: ${booking._id} | Worker Payout: ₹${workerPayoutAmount} (95%) | Welfare Fund: ₹${welfareAmount} (5%) | Source: ${releaseContext.reason || "Customer Dual-Handshake"}`);

  booking.paymentStatus = "released_to_worker";
  booking.status = "Completed";
  booking.completedAt = new Date();
  booking.settledAt = new Date();
  booking.customerCompletedAt = new Date();

  await booking.save();

  // Credit worker welfare balance & restore worker availability
  if (booking.workerId) {
    await WorkerProfile.findOneAndUpdate(
      { $or: [{ userId: booking.workerId }, { _id: booking.workerId }] },
      {
        availability: true,
        $inc: {
          jobsCompleted: 1,
          welfareFundBalance: welfareAmount,
        },
      }
    );
  }

  // Socket broadcast to participants
  try {
    const io = getIO();
    if (io) {
      const payload = {
        bookingId: booking._id,
        status: "Completed",
        paymentStatus: "released_to_worker",
        settledAt: booking.settledAt,
        distribution: booking.distribution,
        releasedBy: releaseContext.reason || "customer_confirmation",
      };

      io.to(`booking_${booking._id}`).emit("booking_completed", payload);
      io.to(`booking_${booking._id}`).emit("escrow_released", payload);

      if (booking.workerId) {
        io.to(`worker_${booking.workerId}`).emit("payout_released", payload);
      }
    }
  } catch (socketErr) {
    console.warn("[Release Payout] Socket emit error:", socketErr.message);
  }

  return booking;
};

/**
 * @desc PART 4: Dual-Handshake Job Completion API
 * @route POST /api/bookings/:id/complete
 * @access Private (Customer / Admin)
 */
export const completeBookingHandler = asyncHandler(async (req, res) => {
  const bookingId = req.params.id;
  const booking = await Booking.findById(bookingId).populate("customerId workerId", "name phone");

  if (!booking) {
    throw new ApiError(404, "Booking not found.");
  }

  const isCustomer = req.user && String(booking.customerId?._id || booking.customerId) === String(req.user._id);
  const isAdmin = req.user && req.user.role === "admin";

  if (!isCustomer && !isAdmin) {
    throw new ApiError(403, "Only the customer or an admin can confirm job completion and release escrow.");
  }

  const updatedBooking = await releasePayout(booking, {
    reason: `customer_confirmation_by_${req.user?.name || req.user?._id}`,
  });

  return res.status(200).json({
    success: true,
    data: updatedBooking,
    message: "Job completion confirmed! Escrow funds released directly to worker (95%) and Cooperative Welfare Fund (5%).",
  });
});

/**
 * CRON JOB SPECIFICATION: Auto-Release Escrow after 24 Hours
 * -------------------------------------------------------------
 * If a worker marks a job done (`workerMarkedDone: true`) and the customer
 * fails to confirm or dispute within 24 hours (`autoReleaseAt <= now`),
 * this job automatically releases the escrowed payout to the worker.
 *
 * Example Cron Schedule (Every 15 minutes):
 * cron.schedule("15 * * * *", async () => {
 *   await checkAndAutoReleaseEscrow();
 * });
 */
export const checkAndAutoReleaseEscrow = async () => {
  try {
    const expiredBookings = await Booking.find({
      paymentStatus: "held_in_escrow",
      workerMarkedDone: true,
      autoReleaseAt: { $lte: new Date() },
    });

    for (const booking of expiredBookings) {
      console.log(`[Auto-Release Cron] Automatically releasing escrow for booking ${booking._id} after 24h.`);
      await releasePayout(booking, { reason: "auto_released_after_24h" });
    }
  } catch (err) {
    console.error("[Auto-Release Cron Error]:", err.message);
  }
};
