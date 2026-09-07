import { Router } from "express";
import WorkerProfile from "../models/WorkerProfile.js";
import Booking from "../models/Booking.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();
router.use(requireAuth, requireRole("admin"));

router.get("/overview", async (request, response, next) => {
    try {
        const [pendingWorkers, activeWorkers, bookingVolume, demand] = await Promise.all([
            WorkerProfile.find({ verificationStatus: "pending" }).populate("userId", "name phone location").sort({ createdAt: -1 }),
            WorkerProfile.countDocuments({ verificationStatus: "verified" }),
            Booking.aggregate([{ $match: { createdAt: { $gte: new Date(Date.now() - 7 * 86400000) } } }, { $group: { _id: { $dateToString: { date: "$createdAt", format: "%Y-%m-%d" } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
            Booking.aggregate([{ $group: { _id: "$serviceCategory", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]),
        ]);
        response.json({ success: true, data: { pendingWorkers, activeWorkers, bookingVolume, demand }, message: "Admin overview fetched" });
    } catch (error) { next(error); }
});

export default router;
