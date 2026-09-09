import { Router } from "express";
import { body } from "express-validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  loginWithFirebase,
  sendPhoneOtp,
  verifyPhoneOtp,
  updateProfile,
} from "../controllers/auth.controller.js";
import { authLimiter, otpLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validate.js";
import { protect } from "../middleware/auth.js";
import User from "../src/models/User.js";

const router = Router();

const signToken = (user) =>
  jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET || "gigconnect-development-secret",
    { expiresIn: "7d" }
  );

// ──────────────────────────────────────────────
// POST /api/auth/register — email/password account creation
// ──────────────────────────────────────────────
router.post(
  "/register",
  authLimiter,
  validate([
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ]),
  async (req, res, next) => {
    try {
      const { name, email, phone, password, role = "customer", location } = req.body;

      if (!email && !phone) {
        return res.status(400).json({ success: false, message: "Email or mobile number is required" });
      }
      if (!["customer", "worker"].includes(role)) {
        return res.status(400).json({ success: false, message: "Invalid registration role" });
      }

      const identityChecks = [];
      if (email) identityChecks.push({ email: email.toLowerCase().trim() });
      if (phone) {
        const rawDigits = phone.replace(/[\s()-]/g, "").replace(/^\+91/, "");
        identityChecks.push({ phone: rawDigits }, { phone: `+91${rawDigits}` });
      }
      const existing = await User.findOne({ $or: identityChecks });
      if (existing) {
        return res.status(409).json({ success: false, message: "An account with these details already exists" });
      }

      const user = await User.create({
        name,
        email: email ? email.toLowerCase().trim() : undefined,
        phone: phone ? phone.replace(/[\s()-]/g, "").replace(/^\+91/, "") : undefined,
        passwordHash: await bcrypt.hash(password, 10),
        role,
        location,
      });

      return res.status(201).json({
        success: true,
        data: {
          user: { id: user._id, _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role },
          token: signToken(user),
        },
        message: "Account created successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

// ──────────────────────────────────────────────
// POST /api/auth/login — phone/email + password sign-in
// ──────────────────────────────────────────────
router.post(
  "/login",
  authLimiter,
  validate([
    body("password").notEmpty().withMessage("Password is required"),
  ]),
  async (req, res, next) => {
    try {
      const { email, phone, password } = req.body;

      let query = {};
      if (email) {
        query = { email: email.toLowerCase().trim() };
      } else if (phone) {
        const cleaned = phone.replace(/[\s()-]/g, "");
        const rawDigits = cleaned.replace(/^\+91/, "");
        query = {
          $or: [
            { phone: cleaned },
            { phone: rawDigits },
            { phone: `+91${rawDigits}` },
          ],
        };
      } else {
        return res.status(400).json({ success: false, message: "Email or mobile number is required" });
      }

      const user = await User.findOne(query).select("+passwordHash");
      if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({
          success: false,
          message: "Invalid mobile number/email or password (Default Demo Password: Demo@123)",
        });
      }

      return res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            gender: user.gender,
            avatar: user.avatar,
          },
          token: signToken(user),
        },
        message: `Logged in successfully as ${user.name} (${user.role})`,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ──────────────────────────────────────────────
// Firebase Google Auth
// ──────────────────────────────────────────────
router.post("/firebase", authLimiter, loginWithFirebase);

// ──────────────────────────────────────────────
// Mobile OTP Routes (Twilio / SMS)
// ──────────────────────────────────────────────
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

// ──────────────────────────────────────────────
// Protected Profile Update
// ──────────────────────────────────────────────
router.patch("/profile", protect, updateProfile);

export default router;
