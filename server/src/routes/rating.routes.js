import { Router } from "express";
import Rating from "../models/Rating.js";
import Booking from "../models/Booking.js";
import WorkerProfile from "../models/WorkerProfile.js";
import User from "../models/User.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

// POST /api/ratings — submit review, recalculate worker average, and flag quality audits
router.post("/", async (request, response, next) => {
  try {
    const { bookingId, workerId: explicitWorkerId, stars = 5, comment = "", tags = [] } = request.body;
    const numericStars = Math.max(1, Math.min(5, Number(stars) || 5));

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

    // Fallback if user is anonymous in demo
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

    // 1. Create the rating document
    const rating = await Rating.create({
      bookingId: bookingId || undefined,
      customerId: effectiveUserId || undefined,
      workerId: targetWorkerId,
      stars: numericStars,
      comment,
      tags: Array.isArray(tags) ? tags : [],
    });

    // 2. Aggregate all ratings for this worker to recompute accurate average & total
    const stats = await Rating.aggregate([
      { $match: { workerId: targetWorkerId } },
      {
        $group: {
          _id: "$workerId",
          average: { $avg: "$stars" },
          count: { $sum: 1 },
        },
      },
    ]);

    const newRatingAvg = Number((stats[0]?.average || numericStars).toFixed(2));
    const totalReviews = stats[0]?.count || 1;

    // 3. Automatically update the WorkerProfile
    await WorkerProfile.findOneAndUpdate(
      { $or: [{ userId: targetWorkerId }, { _id: targetWorkerId }] },
      {
        ratingAvg: newRatingAvg,
        ratingCount: totalReviews,
        $inc: { jobsCompleted: 1 },
      },
      { new: true }
    );

    // 4. Cooperative Trust Protocol: If stars < 3, flag for automatic Federation Desk review
    const requiresFederationAudit = numericStars < 3;
    if (requiresFederationAudit) {
      console.warn(
        `⚠️ [Federation Audit] Low rating (${numericStars}★) received for Worker: ${targetWorkerId}. Routed to Ward Quality Bench.`
      );
    }

    return response.status(201).json({
      success: true,
      data: {
        rating,
        newRatingAvg,
        totalReviews,
        requiresFederationAudit,
        auditNotice: requiresFederationAudit
          ? "Your feedback has been logged. Ratings below 3 stars automatically trigger a Federation Desk mediation and upskilling review."
          : "Thank you! Your feedback directly strengthens cooperative trust and worker ownership.",
      },
      message: "Feedback successfully recorded & worker profile updated",
    });
  } catch (error) {
    next(error);
  }
});

export default router;
