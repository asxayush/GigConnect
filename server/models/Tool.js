import mongoose from "mongoose";

const toolSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    toolName: {
      type: String,
      required: [true, "Tool name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      trim: true,
      default: "General",
    },
    hourlyRate: {
      type: Number,
      required: [true, "Hourly rental rate is required"],
      min: 0,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        default: [77.209, 28.6139],
      },
      address: {
        type: String,
        default: "Delhi NCR",
      },
    },
    status: {
      type: String,
      enum: ["available", "rented"],
      default: "available",
      index: true,
    },
    rentedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    rentedAt: {
      type: Date,
      default: null,
    },
    imageUrl: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

toolSchema.index({ location: "2dsphere" });
toolSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.Tool || mongoose.model("Tool", toolSchema);
