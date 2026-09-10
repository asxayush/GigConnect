import { Router } from "express";
import { body } from "express-validator";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import {
  createBooking,
  acceptBooking,
  declineBooking,
  getBookings,
  getBookingById,
  getPendingBookingsForWorker,
  getDemoInfo,
  updateBookingStatus,
  verifyOtpAndStart,
} from "../controllers/booking.controller.js";
import { completeBookingHandler } from "../controllers/paymentController.js";
import { protect, authorize } from "../middleware/auth.js";
import { bookingLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validate.js";

const router = Router();

// Tolerant auth middleware for demo reliability (never 401s during live demo)
const optionalProtect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || "gigconnect-development-secret"
        );
        const user = await User.findById(decoded.userId).select("-passwordHash");
        if (user) req.user = user;
      } catch {
        // Fallback for demo token
        const demoUser = await User.findOne({ isDemo: true, role: "customer" });
        if (demoUser) req.user = demoUser;
      }
    }
  } catch {
    // Non-fatal
  }
  next();
};

// 1. Live Hackathon Demo Endpoints
router.get("/demo-info", getDemoInfo);
router.get("/pending/:workerId", optionalProtect, getPendingBookingsForWorker);
router.get("/:id", optionalProtect, getBookingById);
router.patch("/:id/accept", optionalProtect, acceptBooking);
router.patch("/:id/decline", optionalProtect, declineBooking);

// 2. Booking creation (Works with both demo customer and standard auth)
router.post(
  "/",
  optionalProtect,
  createBooking
);

// 3. Authenticated standard routes
router.get("/", protect, getBookings);

router.patch(
  "/:id/verify-otp",
  validate([
    body("otp").trim().notEmpty().withMessage("4-digit OTP is required"),
  ]),
  verifyOtpAndStart
);

// Dual-Handshake Completion (Customer marks complete & releases escrow)
router.post("/:id/complete", completeBookingHandler);
router.patch("/:id/complete", completeBookingHandler);

router.patch(
  "/:id/status",
  validate([
    body("status").trim().notEmpty().withMessage("Status is required"),
  ]),
  updateBookingStatus
);

export default router;
