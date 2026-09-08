import bcrypt from "bcrypt";
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

export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role = "customer", location } = req.body;

  if (!name || !password || (!email && !phone)) {
    throw new ApiError(400, "name, password, and at least one of email or phone are required.");
  }

  if (!["customer", "worker"].includes(role)) {
    throw new ApiError(400, "Invalid registration role. Must be 'customer' or 'worker'.");
  }

  const identityChecks = [];
  if (email) identityChecks.push({ email });
  if (phone) identityChecks.push({ phone });
  const existing = await User.findOne({ $or: identityChecks });

  if (existing) {
    throw new ApiError(409, "An account with these details already exists.");
  }

  const user = await User.create({
    name,
    email,
    phone,
    passwordHash: await bcrypt.hash(password, 10),
    role,
    location,
  });

  res.status(201).json({
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
    message: "Account created successfully.",
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, phone, password } = req.body;

  if (!password || (!email && !phone)) {
    throw new ApiError(400, "Provide password and email or phone number.");
  }

  const user = await User.findOne(email ? { email } : { phone }).select("+passwordHash");

  if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new ApiError(401, "Invalid credentials.");
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
      },
      token: signToken(user),
    },
    message: "Logged in successfully.",
  });
});

export const loginWithFirebase = asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
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
      role: "customer",
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
    message: "Firebase account authenticated successfully.",
  });
});

export const sendPhoneOtp = asyncHandler(async (req, res) => {
  const phone = req.body.phone?.replace(/[\s()-]/g, "");
  if (!/^\+[1-9]\d{7,14}$/.test(phone || "")) {
    throw new ApiError(400, "Enter a valid phone number with country code, for example +919876543210.");
  }

  const verification = await sendPhoneVerification(phone);
  res.status(200).json({
    success: true,
    data: {
      phone,
      status: verification.status,
      demoOtp: verification.demoCode,
    },
    message: verification.demoCode
      ? `OTP sent. (Demo code: ${verification.demoCode})`
      : "OTP sent to your mobile.",
  });
});

export const verifyPhoneOtp = asyncHandler(async (req, res) => {
  const phone = req.body.phone?.replace(/[\s()-]/g, "");
  const code = req.body.code?.trim();

  if (!/^\+[1-9]\d{7,14}$/.test(phone || "") || !/^\d{6}$/.test(code || "")) {
    throw new ApiError(400, "Enter a valid phone number and the 6-digit OTP.");
  }

  const verification = await checkPhoneVerification(phone, code);
  if (verification.status !== "approved") {
    throw new ApiError(401, "Incorrect or expired OTP. Use the code received or try 123456.");
  }

  let user = await User.findOne({ phone });
  const isNew = !user;
  if (!user) {
    user = await User.create({
      phone,
      name: `Member ${phone.slice(-4)}`,
      role: "customer",
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
    message: "Phone verified successfully.",
  });
});

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
