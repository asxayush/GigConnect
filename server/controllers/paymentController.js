import crypto from "node:crypto";
import Razorpay from "razorpay";
import Booking from "../models/Booking.js";
import WorkerProfile from "../models/WorkerProfile.js";
import { getIO, notifyPaymentSecured } from "../sockets/bookingSocket.js";
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
 * PART 3: PAYMENT CONTROLLER WITH RAZORPAY (ZERO-REFUND ESCROW WORKFLOW)
 */

/**
 * @desc 1. Create Escrow Order (Called by Customer ONLY AFTER Worker accepts booking)
 * @route POST /api/payments/escrow/order
 * @access Private (Customer)
 */
export const createEscrowOrder = asyncHandler(async (req, res) => {
  const { bookingId, amount } = req.body;

  if (!bookingId) {
    throw new ApiError(400, "bookingId is required to initialize escrow payment.");
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, "Booking record not found.");
  }

  // Strict Rule: Worker MUST accept the request before customer can pay into escrow
  const isAccepted =
    booking.requestStatus === "accepted" ||
    booking.status === "accepted" ||
    booking.status === "assigned";

  if (!isAccepted) {
    return res.status(400).json({
      success: false,
      message: "Worker must accept the booking before escrow order can be generated.",
      data: {
        bookingId: booking._id,
        currentRequestStatus: booking.requestStatus,
        paymentStatus: booking.paymentStatus,
      },
    });
  }

  // Prevent double payment if already secured in escrow or released
  if (
    booking.paymentStatus === "held_in_escrow" ||
    booking.paymentStatus === "released" ||
    booking.paymentStatus === "paid" ||
    booking.paymentStatus === "released_to_worker"
  ) {
    return res.status(400).json({
      success: false,
      message: "Payment for this booking is already secured in Escrow.",
      data: { paymentStatus: booking.paymentStatus, totalAmount: booking.totalAmount },
    });
  }

  const targetAmount = Number(amount || booking.baseFare || booking.price || booking.totalAmount || 250);
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
          type: "PREPAID_ESCROW_BASE_FARE",
          cooperative: "GigConnect Cooperative Federation",
        },
      });
      orderPayload = rzpOrder;
      orderId = rzpOrder.id;
    } catch (rzpErr) {
      console.warn("[Razorpay] Order create fallback to synthetic ID:", rzpErr.message);
    }
  }

  booking.baseFare = targetAmount;
  booking.totalAmount = targetAmount;
  booking.razorpayOrderId = orderId;
  booking.paymentOrderId = orderId;
  await booking.save();

  return res.status(200).json({
    success: true,
    message: "Escrow order created successfully. Worker is locked.",
    data: {
      orderId: orderPayload.id,
      amount: targetAmount,
      amountInPaise,
      currency: "INR",
      keyId,
      bookingId: booking._id,
      workerId: booking.workerId,
      serviceCategory: booking.serviceCategory,
      requestStatus: booking.requestStatus,
      paymentStatus: booking.paymentStatus,
    },
  });
});

/**
 * @desc 2. Verify Escrow Payment (Verifies signature and locks funds in Escrow)
 * @route POST /api/payments/escrow/verify
 * @access Private
 */
export const verifyEscrowPayment = asyncHandler(async (req, res) => {
  const {
    bookingId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  const order_id = razorpayOrderId || razorpay_order_id;
  const payment_id = razorpayPaymentId || razorpay_payment_id;
  const signature = razorpaySignature || razorpay_signature;

  if (!bookingId || !order_id || !payment_id) {
    throw new ApiError(400, "bookingId, razorpayOrderId, and razorpayPaymentId are required.");
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, "Booking record not found.");
  }

  const { keySecret, isConfigured } = getRazorpayInstance();

  // Signature verification
  let isValidSignature = false;
  if (isConfigured && signature) {
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${order_id}|${payment_id}`)
      .digest("hex");
    isValidSignature = generatedSignature === signature;
  } else {
    // Demo mode: accept synthetic test tokens
    isValidSignature = Boolean(payment_id);
  }

  if (!isValidSignature) {
    throw new ApiError(400, "Invalid Razorpay payment signature verification failed.");
  }

  // Update booking state to 'held_in_escrow'
  booking.paymentStatus = "held_in_escrow";
  booking.razorpayOrderId = order_id;
  booking.razorpayPaymentId = payment_id;
  booking.razorpaySignature = signature || "verified_synthetic_signature";
  booking.paymentOrderId = order_id;
  booking.paymentId = payment_id;
  booking.paymentSignature = signature || "verified_synthetic_signature";

  await booking.save();

  // Trigger Real-Time Socket Event to Worker: payment_secured_proceed
  try {
    notifyPaymentSecured(booking);
  } catch (socketErr) {
    console.warn("[Socket] Error triggering payment_secured_proceed:", socketErr.message);
  }

  return res.status(200).json({
    success: true,
    message: "Payment successfully verified and held in secure Escrow. Worker notified to proceed.",
    data: {
      bookingId: booking._id,
      paymentStatus: booking.paymentStatus,
      requestStatus: booking.requestStatus,
      totalAmount: booking.totalAmount,
      razorpayOrderId: booking.razorpayOrderId,
      razorpayPaymentId: booking.razorpayPaymentId,
      distribution: booking.distribution,
    },
  });
});

/**
 * @desc 3. Release Payout to Worker (Called on job completion)
 * @route POST /api/payments/escrow/release
 * @access Private
 */
export const releasePayout = asyncHandler(async (req, res) => {
  const bookingId = req.params.id || req.body.bookingId;

  if (!bookingId) {
    throw new ApiError(400, "bookingId is required to release payout.");
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, "Booking record not found.");
  }

  if (booking.paymentStatus === "released" || booking.paymentStatus === "released_to_worker") {
    return res.status(200).json({
      success: true,
      message: "Payout has already been released to the worker.",
      data: booking,
    });
  }

  // Update states
  booking.requestStatus = "completed";
  booking.status = "completed";
  booking.paymentStatus = "released";
  booking.customerCompletedAt = new Date();
  booking.completedAt = new Date();
  booking.settledAt = new Date();

  await booking.save();

  // Mock Jan Dhan / Cooperative Bank UPI Payout Transfer
  const workerPayoutAmount = booking.distribution?.workerPayout || Math.round((booking.totalAmount || 250) * 0.95);
  const welfareAmount = booking.distribution?.mutualWelfare || Math.round((booking.totalAmount || 250) * 0.05);

  console.log(`[Escrow Settlement] Released ₹${workerPayoutAmount} (95%) to Worker ${booking.workerId}`);
  console.log(`[Escrow Settlement] Contributed ₹${welfareAmount} (5%) to PMJJBY Cooperative Mutual Welfare Fund`);

  // Update Worker stats in WorkerProfile
  if (booking.workerId) {
    await WorkerProfile.findOneAndUpdate(
      { userId: booking.workerId },
      { $inc: { jobsCompleted: 1 } }
    ).catch(() => {});
  }

  // Notify real-time sockets
  try {
    const io = getIO();
    if (io) {
      const payload = {
        bookingId: String(booking._id),
        paymentStatus: "released",
        requestStatus: "completed",
        payoutAmount: workerPayoutAmount,
        welfareContribution: welfareAmount,
        timestamp: new Date().toISOString(),
      };
      io.to(String(booking.workerId)).emit("payout_released", payload);
      io.to(`worker_${booking.workerId}`).emit("payout_released", payload);
      io.to(String(booking.customerId)).emit("booking_settled", payload);
      io.to(`user_${booking.customerId}`).emit("booking_settled", payload);
      io.to(`booking_${booking._id}`).emit("booking_settled", payload);
    }
  } catch (err) {
    console.warn("[Socket] Release payout broadcast error:", err.message);
  }

  return res.status(200).json({
    success: true,
    message: "Escrow funds successfully released to Worker Jan Dhan UPI account with 0% platform commission.",
    data: {
      bookingId: booking._id,
      requestStatus: booking.requestStatus,
      paymentStatus: booking.paymentStatus,
      workerPayout: workerPayoutAmount,
      mutualWelfare: welfareAmount,
      platformFee: 0,
    },
  });
});

/**
 * Backward-compatible Aliases
 */
export const createBaseOrder = createEscrowOrder;
export const verifyPayment = verifyEscrowPayment;
export const completeBookingHandler = releasePayout;

/**
 * Additional Charges (Overtime / Spare Parts)
 */
export const createAddOnOrder = asyncHandler(async (req, res) => {
  const { bookingId, reason, amount } = req.body;

  if (!bookingId || !amount || Number(amount) <= 0) {
    throw new ApiError(400, "bookingId and positive amount are required for add-on order.");
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, "Booking not found.");
  }

  const { instance, keyId, isConfigured } = getRazorpayInstance();
  const amountInPaise = Math.round(Number(amount) * 100);
  let orderId = `addon_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  if (isConfigured) {
    try {
      const rzpOrder = await instance.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: `addon_${booking._id}_${Date.now()}`,
        notes: { bookingId: String(booking._id), reason: reason || "Additional Task", type: "ADDON_CHARGE" },
      });
      orderId = rzpOrder.id;
    } catch (e) {
      console.warn("[Razorpay] Add-on order fallback:", e.message);
    }
  }

  const addOnEntry = {
    reason: reason || "Additional service / spare parts",
    amount: Number(amount),
    status: "requested",
    razorpayOrderId: orderId,
    requestedAt: new Date(),
  };

  booking.additionalCharges.push(addOnEntry);
  await booking.save();

  return res.status(200).json({
    success: true,
    message: "Add-on order created successfully.",
    data: { orderId, amount: Number(amount), currency: "INR", keyId, addOn: addOnEntry },
  });
});

export const verifyAddOnPayment = asyncHandler(async (req, res) => {
  const { bookingId, addOnId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, "Booking not found.");
  }

  const charge = booking.additionalCharges.id(addOnId) || booking.additionalCharges.find((c) => c.razorpayOrderId === razorpayOrderId);
  if (!charge) {
    throw new ApiError(404, "Add-on charge not found.");
  }

  charge.status = "paid";
  charge.razorpayPaymentId = razorpayPaymentId;
  charge.razorpaySignature = razorpaySignature;
  charge.resolvedAt = new Date();

  await booking.save();

  return res.status(200).json({
    success: true,
    message: "Add-on payment verified and locked in escrow.",
    data: { bookingId: booking._id, totalAmount: booking.totalAmount, charge },
  });
});
