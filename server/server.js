import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { initBookingSocket } from "./sockets/bookingSocket.js";
import { errorHandler } from "./middleware/errorHandler.js";

// Routes
import authRoutes from "./routes/auth.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import workerRoutes from "./src/routes/worker.routes.js";
import workerVerificationRoutes from "./src/routes/workerVerification.routes.js";
import adminRoutes from "./src/routes/admin.routes.js";
import paymentRoutes from "./src/routes/payment.routes.js";
import ratingRoutes from "./src/routes/rating.routes.js";
import sosRoutes from "./src/routes/sos.routes.js";
import chatRoutes from "./routes/chatRoutes.js";
import toolBankRoutes from "./routes/toolBankRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

dotenv.config();

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = http.createServer(app);

// 1. Initialize Real-Time WebSockets
initBookingSocket(httpServer);

// 2. Security Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length
      ? (origin, callback) => {
          if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
          callback(new Error(`CORS policy rejection: Origin '${origin}' is not permitted.`));
        }
      : true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 3. Body Parsing & Static Files
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(path.join(currentDirectory, "uploads")));

// 4. Mount API Routes
app.get("/health", (_req, res) => res.json({ status: "ok", timestamp: new Date() }));
app.get("/", (_req, res) => res.json({ success: true, message: "GigConnect API & Socket.io server is running" }));

app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/worker", workerVerificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/sos", sosRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/toolbank", toolBankRoutes);
app.use("/api/ai", aiRoutes);

// 5. 404 Unmatched Route Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// 6. Centralized Error Handler (Must be last)
app.use(errorHandler);

// 7. Database Connection & Server Boot
const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`✓ GigConnect API & Socket.io server live on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("FATAL: MongoDB connection failed:", err.message);
    process.exit(1);
  });

export { app, httpServer };
export default app;
