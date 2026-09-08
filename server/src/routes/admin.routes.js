import { Router } from "express";
import WorkerProfile from "../models/WorkerProfile.js";
import Worker from "../models/Worker.js";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

// Basic admin auth middleware (JWT-based, checks role === 'admin')
router.use(requireAuth, requireRole("admin"));

/**
 * GET /api/admin/overview
 */
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

/**
 * GET /api/admin/workers/pending
 * List all workers with status 'pending' awaiting manual admin review
 */
router.get("/workers/pending", async (request, response, next) => {
    try {
        const pendingWorkers = await Worker.find({ verificationStatus: "pending" })
            .sort({ createdAt: -1 })
            .lean();

        response.json({
            success: true,
            count: pendingWorkers.length,
            data: pendingWorkers,
            message: "Pending worker verifications fetched successfully",
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/admin/workers/:id/review
 * Admin manually approves or rejects, updating verificationStatus to 'manually_verified' or 'rejected'
 */
router.patch("/workers/:id/review", async (request, response, next) => {
    try {
        const { status, notes } = request.body;

        if (!["manually_verified", "rejected"].includes(status)) {
            return response.status(400).json({
                success: false,
                message: "Invalid status. Allowed review statuses are: 'manually_verified' or 'rejected'",
            });
        }

        const worker = await Worker.findByIdAndUpdate(
            request.params.id,
            {
                verificationStatus: status,
                adminNotes: notes || "",
                reviewedBy: request.user._id,
                verifiedAt: new Date(),
            },
            { new: true, runValidators: true }
        );

        if (!worker) {
            return response.status(404).json({
                success: false,
                message: "Worker verification record not found",
            });
        }

        // If a corresponding User and WorkerProfile exists for this phone number, synchronize status
        const linkedUser = await User.findOne({ phone: worker.phone });
        if (linkedUser) {
            await WorkerProfile.findOneAndUpdate(
                { userId: linkedUser._id },
                { verificationStatus: status === "manually_verified" ? "verified" : "rejected" }
            );
        }

        response.json({
            success: true,
            data: worker,
            message: `Worker verification status updated to ${status}`,
        });
    } catch (error) {
        next(error);
    }
});

export default router;
