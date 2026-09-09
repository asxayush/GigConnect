import { Router } from "express";
import WorkerProfile from "../models/WorkerProfile.js";
import Worker from "../models/Worker.js";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

// Overview is accessible to any authenticated user (JWT required).
// Sensitive admin actions (worker review, pending KYC) retain requireRole guards.
router.get("/overview", requireAuth, async (request, response, next) => {
    try {
        const [pendingWorkers, activeWorkers, bookingVolume, demand, areaGroupRaw, peakHoursRaw] = await Promise.all([
            WorkerProfile.find({ verificationStatus: "pending" }).populate("userId", "name phone location").sort({ createdAt: -1 }),
            WorkerProfile.countDocuments({ verificationStatus: "verified" }),
            Booking.aggregate([
                { $match: { createdAt: { $gte: new Date(Date.now() - 14 * 86400000) } } },
                { $group: { _id: { $dateToString: { date: "$createdAt", format: "%Y-%m-%d" } }, count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]),
            Booking.aggregate([
                { $group: { _id: "$serviceCategory", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]),
            Booking.aggregate([
                {
                    $project: {
                        serviceCategory: 1,
                        area: {
                            $cond: {
                                if: { $regexMatch: { input: "$address", regex: /Gurugram|Cyber City/i } },
                                then: "Gurugram Cyber City",
                                else: {
                                    $cond: {
                                        if: { $regexMatch: { input: "$address", regex: /Dwarka/i } },
                                        then: "Dwarka Hub",
                                        else: {
                                            $cond: {
                                                if: { $regexMatch: { input: "$address", regex: /Noida/i } },
                                                then: "Noida Sector 62/93",
                                                else: {
                                                    $cond: {
                                                        if: { $regexMatch: { input: "$address", regex: /Hauz Khas|Saket|GK|South Delhi/i } },
                                                        then: "South Delhi Cluster",
                                                        else: "Central Delhi (CP)"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: { area: "$area", serviceCategory: "$serviceCategory" },
                        requests: { $sum: 1 }
                    }
                },
                { $sort: { requests: -1 } }
            ]),
            Booking.aggregate([
                {
                    $group: {
                        _id: { $hour: "$scheduledAt" },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ])
        ]);

        const totalBookings = demand.reduce((sum, item) => sum + item.count, 0) || 1;
        const demandForecast = areaGroupRaw.slice(0, 8).map((item) => {
            const share = Number(((item.requests / totalBookings) * 100).toFixed(1));
            const isSurge = share >= 12 || item.requests >= 3;
            return {
                area: item._id.area,
                serviceCategory: item._id.serviceCategory,
                requests: item.requests,
                sharePercentage: share,
                urgency: isSurge ? "High Demand" : "Balanced",
                recommendation: isSurge
                    ? `Pre-dispatch +2 verified ${item._id.serviceCategory.toLowerCase()}s to ${item._id.area}`
                    : `Normal allocation adequate`,
            };
        });

        response.json({
            success: true,
            data: {
                pendingWorkers,
                activeWorkers,
                bookingVolume,
                demand,
                demandForecast,
                peakHours: peakHoursRaw,
                totalBookings,
            },
            message: "Admin overview & explainable demand insights fetched",
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/admin/workers/pending
 * List all workers with status 'pending' awaiting manual admin review
 */
router.get("/workers/pending", requireAuth, requireRole("admin", "coordinator"), async (request, response, next) => {
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
router.patch("/workers/:id/review", requireAuth, requireRole("admin", "coordinator"), async (request, response, next) => {
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

/**
 * GET /api/admin/tickets
 * List all support & grievance tickets
 */
router.get("/tickets", async (request, response, next) => {
    try {
        const Ticket = (await import("../../models/Ticket.js")).default;
        const tickets = await Ticket.find().sort({ createdAt: -1 }).limit(50).lean();

        response.json({
            success: true,
            count: tickets.length,
            data: tickets,
            message: "Support & grievance tickets fetched successfully",
        });
    } catch (error) {
        next(error);
    }
});

export default router;
