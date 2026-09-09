import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { verifyFirebaseToken } from "../firebase.js";
import { checkPhoneVerification, sendPhoneVerification } from "../utils/twilio.js";

const router = Router();

const signToken = (user) =>
  jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET || "gigconnect-development-secret",
    { expiresIn: "7d" }
  );

// POST /api/auth/register — email/password account creation
router.post("/register", async (request, response, next) => {
  try {
    const { name, email, phone, password, role = "customer", location } =
      request.body;

    if (!name || !password || (!email && !phone)) {
      return response.status(400).json({
        success: false,
        message:
          "name, password and at least one of email or phone are required",
      });
    }
    if (!["customer", "worker"].includes(role)) {
      return response
        .status(400)
        .json({ success: false, message: "Invalid registration role" });
    }

    const identityChecks = [];
    if (email) identityChecks.push({ email });
    if (phone) identityChecks.push({ phone });
    const existing = await User.findOne({ $or: identityChecks });
    if (existing) {
      return response.status(409).json({
        success: false,
        message: "An account with these details already exists",
      });
    }

    const user = await User.create({
      name,
      email,
      phone,
      passwordHash: await bcrypt.hash(password, 10),
      role,
      location,
    });

    return response.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
        token: signToken(user),
      },
      message: "Account created",
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login — email/phone and password sign in
router.post("/login", async (request, response, next) => {
  try {
    const { email, phone, password } = request.body;
    
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
      return response.status(400).json({ success: false, message: "Email or mobile number is required" });
    }

    const user = await User.findOne(query).select("+passwordHash");
    if (
      !user ||
      !user.passwordHash ||
      !(await bcrypt.compare(password || "", user.passwordHash))
    ) {
      return response
        .status(401)
        .json({ success: false, message: "Invalid mobile number/email or password (Default Demo Password: Demo@123)" });
    }

    return response.json({
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
});

// POST /api/auth/firebase — exchange Firebase Google ID token for GigConnect JWT
router.post("/firebase", async (request, response, next) => {
  try {
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token) {
      return response
        .status(401)
        .json({ success: false, message: "Firebase token required" });
    }
    const identity = await verifyFirebaseToken(token);
    let user = await User.findOne({ firebaseUid: identity.uid });
    if (!user) {
      user = await User.create({
        firebaseUid: identity.uid,
        name:
          identity.name ||
          identity.phone_number ||
          identity.email ||
          "GigConnect member",
        email: identity.email,
        phone: identity.phone_number,
        role: "customer",
      });
    }
    return response.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
        token: signToken(user),
      },
      message: "Firebase account connected",
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/phone/send — send OTP via Twilio Verify (or in-memory fallback)
router.post("/phone/send", async (request, response, next) => {
  try {
    const phone = request.body.phone?.replace(/[\s()-]/g, "");
    if (!/^\+[1-9]\d{7,14}$/.test(phone || "")) {
      return response.status(400).json({
        success: false,
        message:
          "Enter a valid phone number with country code, for example +919876543210",
      });
    }
    const verification = await sendPhoneVerification(phone);
    response.json({
      success: true,
      data: {
        phone,
        status: verification.status,
        demoOtp: verification.demoCode,
      },
      message: verification.demoCode
        ? `OTP sent. (Demo code: ${verification.demoCode})`
        : "OTP sent to your mobile",
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/phone/verify — verify OTP and issue JWT
router.post("/phone/verify", async (request, response, next) => {
  try {
    const phone = request.body.phone?.replace(/[\s()-]/g, "");
    const code = request.body.code?.trim();
    if (
      !/^\+[1-9]\d{7,14}$/.test(phone || "") ||
      !/^\d{6}$/.test(code || "")
    ) {
      return response.status(400).json({
        success: false,
        message: "Enter the valid phone number and the 6-digit OTP",
      });
    }
    const verification = await checkPhoneVerification(phone, code);
    if (verification.status !== "approved") {
      return response.status(401).json({
        success: false,
        message:
          "Incorrect or expired OTP. Use the code received or try 123456.",
      });
    }
    const rawDigits = phone.replace(/^\+91/, "");
    let user = await User.findOne({
      $or: [
        { phone },
        { phone: rawDigits },
        { phone: `+91${rawDigits}` },
      ],
    });
    if (!user) user = await User.create({ phone: rawDigits, name: `Member (${rawDigits.slice(0, 5)}...)`, role: "customer" });
    response.json({
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
      message: "Phone verified successfully",
    });
  } catch (error) {
    next(error);
  }
});

export default router;
