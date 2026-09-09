import { Router } from "express";
import { body } from "express-validator";
import {
  loginWithFirebase,
  sendPhoneOtp,
  verifyPhoneOtp,
  updateProfile,
} from "../controllers/auth.controller.js";
import { authLimiter, otpLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validate.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// Firebase Google Auth
router.post("/firebase", authLimiter, loginWithFirebase);

// Mobile OTP Routes (Twilio / SMS)
router.post(
  "/phone/send",
  otpLimiter,
  validate([
    body("phone").trim().notEmpty().withMessage("Phone number is required"),
  ]),
  sendPhoneOtp
);

router.post(
  "/phone/verify",
  otpLimiter,
  validate([
    body("phone").trim().notEmpty().withMessage("Phone number is required"),
    body("code").isLength({ min: 6, max: 6 }).withMessage("6-digit OTP is required"),
  ]),
  verifyPhoneOtp
);

// Protected Profile Update
router.patch("/profile", protect, updateProfile);

export default router;
