import { Router } from "express";
import { body } from "express-validator";
import {
  register,
  login,
  loginWithFirebase,
  sendPhoneOtp,
  verifyPhoneOtp,
  updateProfile,
} from "../controllers/auth.controller.js";
import { authLimiter, otpLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validate.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.post(
  "/register",
  authLimiter,
  validate([
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ]),
  register
);

router.post(
  "/login",
  authLimiter,
  validate([
    body("password").notEmpty().withMessage("Password is required"),
  ]),
  login
);

router.post("/firebase", authLimiter, loginWithFirebase);

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

router.patch("/profile", protect, updateProfile);

export default router;
