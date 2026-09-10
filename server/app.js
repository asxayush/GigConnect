import express from "express";
import cors from "cors";
import authRoutes from "./src/routes/auth.routes.js";
import workerRoutes from "./src/routes/worker.routes.js";
import bookingRoutes from "./src/routes/booking.routes.js";
import ratingRoutes from "./src/routes/rating.routes.js";
import adminRoutes from "./src/routes/admin.routes.js";
import paymentRoutes from "./src/routes/payment.routes.js";
import workerVerificationRoutes from "./src/routes/workerVerification.routes.js";
import sosRoutes from "./src/routes/sos.routes.js";
import toolRoutes from "./routes/tool.routes.js";
import chatRoutes from "./routes/chatRoutes.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

// ──────────────────────────────────────────────
// Security headers (helmet-equivalent, no extra dependency)
// ──────────────────────────────────────────────
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }
  next();
});

// ──────────────────────────────────────────────
// CORS — supports multiple comma-separated origins in CLIENT_URL
// e.g. CLIENT_URL=https://gigconnect.vercel.app,http://localhost:5173
// ──────────────────────────────────────────────
const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length
      ? (origin, callback) => {
          // Allow requests with no origin (server-to-server, Postman, curl)
          if (!origin || allowedOrigins.includes(origin))
            return callback(null, true);
          callback(new Error(`CORS: origin '${origin}' is not allowed`));
        }
      : true, // fallback: allow all when CLIENT_URL is not set (dev convenience)
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(path.join(currentDirectory, "uploads")));

app.get("/", (_req, res) => {
  res.json({ success: true, message: "GigConnect API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/worker", workerVerificationRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/sos", sosRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/tools", toolRoutes);
app.use("/api/chat", chatRoutes);

// 404 handler for unmatched routes
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ──────────────────────────────────────────────
// Global error handler — 4-argument signature required by Express
// ──────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((error, _req, response, _next) => {
  console.error("[GigConnect Error]", error.name, error.message);

  // MongoDB duplicate key
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0] || "value";
    return response
      .status(409)
      .json({
        success: false,
        message: `A record with that ${field} already exists`,
      });
  }

  // Mongoose validation error (schema-level)
  if (error.name === "ValidationError") {
    return response
      .status(400)
      .json({ success: false, message: error.message });
  }

  // Mongoose CastError — bad ObjectId in URL params (e.g. /api/bookings/not-an-id)
  if (error.name === "CastError") {
    return response.status(400).json({
      success: false,
      message: `Invalid ID format for field '${error.path}'`,
    });
  }

  // JWT errors
  if (
    error.name === "JsonWebTokenError" ||
    error.name === "TokenExpiredError"
  ) {
    return response
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }

  // CORS errors
  if (error.message?.startsWith("CORS:")) {
    return response
      .status(403)
      .json({ success: false, message: error.message });
  }

  // Multer file size limit
  if (error.code === "LIMIT_FILE_SIZE") {
    return response.status(413).json({
      success: false,
      message: "File too large. Maximum allowed size is 5MB.",
    });
  }

  return response
    .status(500)
    .json({ success: false, message: "Internal server error" });
});

export default app;
