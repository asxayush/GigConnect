import { Router } from "express";
import Razorpay from "razorpay";
import Booking from "../models/Booking.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.post("/orders", requireAuth, async (request, response, next) => {
    try {
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return response.status(503).json({ success: false, message: "Payments are not configured" });
        const booking = await Booking.findOne({ _id: request.body.bookingId, customerId: request.user._id });
        if (!booking) return response.status(404).json({ success: false, message: "Booking not found" });
        const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
        const order = await razorpay.orders.create({ amount: Math.round(Number(booking.price || 0) * 100), currency: "INR", receipt: String(booking._id) });
        booking.paymentStatus = "order_created";
        booking.paymentOrderId = order.id;
        await booking.save();
        response.status(201).json({ success: true, data: { orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID }, message: "Payment order created" });
    } catch (error) { next(error); }
});

export default router;
