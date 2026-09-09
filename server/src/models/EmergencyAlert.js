import mongoose from "mongoose";

const emergencyAlertSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        default: [77.2090, 28.6139],
      },
    },
    status: {
      type: String,
      enum: ["active", "resolved"],
      default: "active",
      index: true,
    },
    reason: {
      type: String,
      default: "In-app SOS Triggered",
    },
    severity: {
      type: String,
      enum: ["critical", "high", "medium"],
      default: "critical",
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

emergencyAlertSchema.index({ location: "2dsphere" });
emergencyAlertSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.EmergencyAlert ||
  mongoose.model("EmergencyAlert", emergencyAlertSchema);
