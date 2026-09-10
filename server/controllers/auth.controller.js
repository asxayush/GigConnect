import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { verifyFirebaseToken } from "../src/firebase.js";
import { checkPhoneVerification, sendPhoneVerification } from "../src/utils/twilio.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const signToken = (user) =>
  jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET || "gigconnect-development-secret",
    { expiresIn: "7d" }
  );

/**
 * STRICT AUTH FLOW: Mobile OTP (Twilio / SMS) & Google (Firebase Auth)
 * Email & Password login has been completely removed.
 */

// 1. Send 6-Digit OTP to Indian Mobile (+91...)
export const sendPhoneOtp = asyncHandler(async (req, res) => {
  const phone = req.body.phone?.replace(/[\s()-]/g, "");
  if (!/^\+[1-9]\d{7,14}$/.test(phone || "")) {
    throw new ApiError(400, "Enter a valid 10-digit phone number with country code, for example +919876543210.");
  }

  const verification = await sendPhoneVerification(phone);
  res.status(200).json({
    success: true,
    data: {
      phone,
      status: verification.status,
    },
    message: "OTP sent securely to your mobile number.",
  });
});

// 2. Verify 6-Digit OTP & Issue JWT Session
export const verifyPhoneOtp = asyncHandler(async (req, res) => {
  const phone = req.body.phone?.replace(/[\s()-]/g, "");
  const code = req.body.code?.trim();
  const selectedRole = req.body.role === "worker" ? "worker" : "customer";

  if (!/^\+[1-9]\d{7,14}$/.test(phone || "") || !/^\d{6}$/.test(code || "")) {
    throw new ApiError(400, "Enter a valid phone number and the 6-digit OTP code.");
  }

  const verification = await checkPhoneVerification(phone, code);
  if (verification.status !== "approved") {
    throw new ApiError(401, "Incorrect or expired OTP. Please enter the valid code received on your phone.");
  }

  let user = await User.findOne({ phone });
  const isNew = !user;
  if (!user) {
    user = await User.create({
      phone,
      name: `Member ${phone.slice(-4)}`,
      role: selectedRole,
    });
  }

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar || "",
        gender: user.gender || "",
        location: user.location,
        isNew,
      },
      token: signToken(user),
    },
    message: "Phone verified successfully. Welcome to GigConnect.",
  });
});

// 3. Google Sign-In with Firebase ID Token Verification
export const loginWithFirebase = asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  const selectedRole = req.body.role === "worker" ? "worker" : "customer";

  if (!token) {
    throw new ApiError(401, "Firebase ID token is required in Authorization header.");
  }

  const identity = await verifyFirebaseToken(token);
  let user = await User.findOne({ firebaseUid: identity.uid });

  if (!user) {
    user = await User.create({
      firebaseUid: identity.uid,
      name: identity.name || identity.phone_number || identity.email || "GigConnect member",
      email: identity.email,
      phone: identity.phone_number,
      role: selectedRole,
      avatar: identity.picture || "",
    });
  } else if (identity.picture && !user.avatar) {
    user.avatar = identity.picture;
    await user.save();
  }

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar || identity.picture || "",
        gender: user.gender || "",
        location: user.location,
      },
      token: signToken(user),
    },
    message: "Google account authenticated successfully.",
  });
});

// 4. Update Profile
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, location, avatar, gender } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  if (name !== undefined) user.name = name.trim();
  if (avatar !== undefined) user.avatar = avatar;
  if (gender !== undefined) user.gender = gender;
  if (location !== undefined) {
    user.location = typeof location === "string" ? { area: location } : location;
  }

  await user.save();

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar || "",
        gender: user.gender || "",
        location: user.location,
      },
    },
    message: "Profile updated successfully.",
  });
});
