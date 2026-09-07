import { Router } from "express";
import Rating from "../models/Rating.js";
import Booking from "../models/Booking.js";
import WorkerProfile from "../models/WorkerProfile.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.post("/", requireAuth, async (request, response, next) => {
    try {
        const { bookingId, stars, comment } = request.body;
        const booking = await Booking.findOne({ _id: bookingId, customerId: request.user._id, status: "Completed" });
        if (!booking || !booking.workerId) return response.status(400).json({ success: false, message: "Only completed assigned bookings can be rated" });
        const rating = await Rating.create({ bookingId, customerId: request.user._id, workerId: booking.workerId, stars, comment });
        const stats = await Rating.aggregate([{ $match: { workerId: booking.workerId } }, { $group: { _id: "$workerId", average: { $avg: "$stars" } } }]);
        await WorkerProfile.findOneAndUpdate({ userId: booking.workerId }, { ratingAvg: Number((stats[0]?.average || 0).toFixed(2)) });
        response.status(201).json({ success: true, data: rating, message: "Feedback submitted" });
    } catch (error) { next(error); }
});

export default router;
