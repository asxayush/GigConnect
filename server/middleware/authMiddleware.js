import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Worker from "../models/Worker.js";
import WorkerProfile from "../models/WorkerProfile.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Standard authentication middleware: parses and validates Bearer token
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. Bearer token missing.",
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "gigconnect-development-secret"
    );
  } catch (jwtErr) {
    if (token && token.startsWith("demo-")) {
      // Mock worker / customer token fallback for seamless demo
      const isWorkerToken = token.includes("worker");
      const phone = isWorkerToken ? "9811012345" : "9876543210";
      let demoUser = await User.findOne({ phone });
      if (!demoUser) {
        demoUser = await User.create({
          name: isWorkerToken ? "Ramesh Kumar (Electrician)" : "Demo Customer",
          phone,
          email: isWorkerToken ? "ramesh@gigconnect.in" : "demo@gigconnect.in",
          role: isWorkerToken ? "worker" : "customer",
          verificationStatus: isWorkerToken ? "verified" : "unverified",
        });
      }
      req.user = demoUser;
      return next();
    }
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authorization token.",
    });
  }

  const user = await User.findById(decoded.userId).select("-passwordHash");
  if (!user) {
    return res.status(401).json({
      success: false,
      message: "User belonging to this token no longer exists.",
    });
  }

  req.user = user;
  next();
});

/**
 * PART 1: Security & Access Control Middleware for Cooperative Tool Bank
 * Enforces that only fully verified workers can reserve high-value equipment.
 */
export const requireVerifiedWorker = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  // 1. Role must be 'worker'
  const isWorkerRole = req.user.role === "worker";

  // 2. Check verification status on User or linked Worker/WorkerProfile
  let isVerified = req.user.verificationStatus === "verified";

  if (!isVerified && req.user.phone) {
    const workerRecord = await Worker.findOne({ phone: req.user.phone });
    if (workerRecord && (workerRecord.verificationStatus === "verified" || workerRecord.verificationStatus === "manually_verified")) {
      isVerified = true;
    } else {
      const profile = await WorkerProfile.findOne({ userId: req.user._id });
      if (profile && profile.verificationStatus === "verified") {
        isVerified = true;
      }
    }
  }

  // If not role worker OR not verified, block with 403
  if (!isWorkerRole || !isVerified) {
    return res.status(403).json({
      success: false,
      message: "Tool Bank access requires Federation verification.",
      code: "VERIFICATION_REQUIRED",
      currentStatus: req.user.verificationStatus || "pending",
    });
  }

  next();
});

export const requireAuth = protect;
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user.role}) is not authorized.`,
      });
    }
    next();
  };
};

export default {
  protect,
  requireAuth,
  requireVerifiedWorker,
  authorize,
};
