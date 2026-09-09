import { Router } from "express";
import { body } from "express-validator";
import {
  createBooking,
  acceptBooking,
  getBookings,
  updateBookingStatus,
  verifyOtpAndStart,
  completeAndSettle,
} from "../controllers/booking.controller.js";
import { protect, authorize } from "../middleware/auth.js";
import { bookingLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validate.js";

const router = Router();

// All booking routes require authentication
router.use(protect);

router
  .route("/")
  .get(getBookings)
  .post(
    authorize("user", "customer"),
    bookingLimiter,
    validate([
      body("serviceCategory").trim().notEmpty().withMessage("Service category is required"),
      body("address").trim().notEmpty().withMessage("Address is required"),
      body("scheduledAt").isISO8601().withMessage("Valid ISO scheduledAt date is required"),
    ]),
    createBooking
  );

router.patch(
  "/:id/accept",
  authorize("worker"),
  acceptBooking
);

router.patch(
  "/:id/verify-otp",
  validate([
    body("otp").trim().notEmpty().withMessage("4-digit OTP is required"),
  ]),
  verifyOtpAndStart
);

router.patch(
  "/:id/complete",
  completeAndSettle
);

router.patch(
  "/:id/status",
  validate([
    body("status").trim().notEmpty().withMessage("Status is required"),
  ]),
  updateBookingStatus
);

export default router;
