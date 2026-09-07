import express from "express";
import cors from "cors";
import authRoutes from "./src/routes/auth.routes.js";
import workerRoutes from "./src/routes/worker.routes.js";
import bookingRoutes from "./src/routes/booking.routes.js";
import ratingRoutes from "./src/routes/rating.routes.js";
import adminRoutes from "./src/routes/admin.routes.js";
import paymentRoutes from "./src/routes/payment.routes.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();



const PORT = process.env.PORT || 5000;
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

app.use(cors({ origin: process.env.CLIENT_URL || true }));
app.use(express.json());
app.use("/uploads", express.static(path.join(currentDirectory, "uploads")));

app.get("/", (req, res) => {
  res.send("GigConnect API is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);

app.use((error, request, response, next) => {
  console.error(error);
  if (error.code === 11000) return response.status(409).json({ success: false, message: "A record with that value already exists" });
  if (error.name === "ValidationError") return response.status(400).json({ success: false, message: error.message });
  return response.status(500).json({ success: false, message: "Internal server error" });
});

export default app;