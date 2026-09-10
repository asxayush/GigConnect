import { Router } from "express";
import Rating from "../models/Rating.js";
import Booking from "../models/Booking.js";
import WorkerProfile from "../models/WorkerProfile.js";
import User from "../models/User.js";
import Worker from "../models/Worker.js";

const router = Router();

// Helper function to recalculate worker ratings and dynamic isSakhiVerified badge
export async function recalculateWorkerSakhiStatus(workerUserId) {
  try {
    // 1. Compute overall rating statistics
    const stats = await Rating.aggregate([
      { $match: { workerId: workerUserId } },
      {
        $group: {
          _id: "$workerId",
          avgRating: { $avg: "$stars" },
          count: { $sum: 1 },
        },
      },
    ]);

    const womenSafetyStats = await Rating.aggregate([
      { $match: { workerId: workerUserId, isWomenSafetyAudit: true } },
      {
        $group: {
          _id: "$workerId",
          avgSafetyRating: { $avg: "$safetyRating" },
          womenSafetyCount: { $sum: 1 },
          safetyPositiveCount: {
            $sum: {
              $cond: [{ $gte: ["$safetyRating", 4] }, 1, 0],
            },
          },
        },
      },
    ]);

    const stat = stats[0] || { avgRating: 0, count: 0 };
    const womenStat = womenSafetyStats[0] || {
      avgSafetyRating: 0,
      womenSafetyCount: 0,
      safetyPositiveCount: 0,
    };

    const ratingAvg = Number((stat.avgRating || 0).toFixed(2));
    const ratingCount = stat.count;

    const workerUser = await User.findById(workerUserId);
    const isFemale =
      workerUser?.gender?.toLowerCase() === "female" ||
      workerUser?.gender?.toLowerCase() === "f";

    // Sakhi Trust: female worker + at least 3 women-authored safety ratings averaging >= 4.0
    const earnedSakhiBadge =
      isFemale &&
      womenStat.safetyPositiveCount >= 3 &&
      womenStat.avgSafetyRating >= 4.0;

    const existingProfile = await WorkerProfile.findOne({
      $or: [{ userId: workerUserId }, { _id: workerUserId }],
    });

    const sakhiFields = {};
    if (earnedSakhiBadge) {
      sakhiFields.isSakhiVerified = true;
      sakhiFields.sakhiVerified = true;
    } else if (womenStat.womenSafetyCount >= 3) {
      sakhiFields.isSakhiVerified = false;
      sakhiFields.sakhiVerified = false;
    }

    const updatedProfile = await WorkerProfile.findOneAndUpdate(
      { $or: [{ userId: workerUserId }, { _id: workerUserId }] },
      {
        ratingAvg,
        ratingCount,
        ...sakhiFields,
      },
      { new: true }
    );

    await Worker.updateMany(
      { phone: workerUser?.phone },
      {
        rating: ratingAvg,
        ...(sakhiFields.sakhiVerified !== undefined
          ? { sakhiVerified: sakhiFields.sakhiVerified }
          : {}),
      }
    );

    return {
      ratingAvg,
      ratingCount,
      safetyPositiveCount: womenStat.safetyPositiveCount,
      womenSafetyCount: womenStat.womenSafetyCount,
      avgSafetyRating: Number((womenStat.avgSafetyRating || 0).toFixed(2)),
      isSakhiVerified: earnedSakhiBadge || Boolean(existingProfile?.sakhiVerified || existingProfile?.isSakhiVerified),
      updatedProfile,
    };
  } catch (err) {
    console.error("Error recalculating Sakhi status:", err);
    return null;
  }
}

// POST /api/ratings — submit review with safetyRating and trigger Sakhi verification evaluation
router.post("/", async (request, response, next) => {
  try {
    const {
      bookingId,
      workerId: explicitWorkerId,
      stars = 5,
      safetyRating = 5,
      comment = "",
      tags = [],
    } = request.body;

    const numericStars = Math.max(1, Math.min(5, Number(stars) || 5));
    const numericSafety = Math.max(1, Math.min(5, Number(safetyRating) || 5));

    let effectiveUserId = request.user?._id;
    let targetWorkerId = explicitWorkerId;

    if (bookingId) {
      const booking = await Booking.findById(bookingId);
      if (booking) {
        if (!effectiveUserId && booking.customerId) {
          effectiveUserId = booking.customerId;
        }
        if (!targetWorkerId && booking.workerId) {
          targetWorkerId = booking.workerId;
        }
      }
    }

    if (!effectiveUserId) {
      const demoUser = await User.findOne({ role: "customer" });
      effectiveUserId = demoUser?._id;
    }

    if (!targetWorkerId) {
      return response.status(400).json({
        success: false,
        message: "Worker ID or valid Booking ID is required to submit a rating",
      });
    }

    // Determine if reviewer is a female customer for Women Safety Audit weighting
    const reviewer = await User.findById(effectiveUserId);
    const isFemaleReviewer = reviewer?.gender?.toLowerCase() === "female";

    // 1. Create the rating document with safety rating
    const rating = await Rating.create({
      bookingId: bookingId || undefined,
      customerId: effectiveUserId || undefined,
      workerId: targetWorkerId,
      stars: numericStars,
      safetyRating: numericSafety,
      comment,
      tags: Array.isArray(tags) ? tags : [],
      isWomenSafetyAudit: isFemaleReviewer,
    });

    // 2. Automatically recalculate worker stats and dynamic Sakhi Trust verification badge
    const sakhiEvaluation = await recalculateWorkerSakhiStatus(targetWorkerId);

    // 3. Low-rating alert
    const requiresFederationAudit = numericStars < 3;
    if (requiresFederationAudit) {
      console.warn(
        `⚠️ [Federation Audit] Low rating (${numericStars}★) logged for Worker: ${targetWorkerId}. Routed to Ward Quality Bench.`
      );
    }

    return response.status(201).json({
      success: true,
      data: {
        rating,
        ...sakhiEvaluation,
        requiresFederationAudit,
        auditNotice: requiresFederationAudit
          ? "Your feedback has been logged. Ratings below 3 stars automatically trigger a Federation Desk mediation review."
          : "Thank you! Your feedback directly strengthens cooperative trust and worker ownership.",
      },
      message: "Feedback successfully recorded & Sakhi Trust verification updated",
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/ratings/worker/:id — fetch reviews for a worker
router.get("/worker/:id", async (request, response, next) => {
  try {
    const reviews = await Rating.find({ workerId: request.params.id })
      .populate("customerId", "name avatar")
      .sort({ createdAt: -1 })
      .limit(20);

    response.json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
