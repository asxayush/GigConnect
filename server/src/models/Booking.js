import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    serviceCategory: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
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
      address: String,
      lat: Number,
      lng: Number,
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "requested",
        "assigned",
        "in-progress",
        "completed",
        "escrow-settled",
        "cancelled",
        "Requested",
        "Assigned",
        "In Progress",
        "Completed",
        "Cancelled",
      ],
      default: "requested",
      index: true,
    },
    isEmergency: {
      type: Boolean,
      default: false,
    },
    price: {
      type: Number,
      min: 0,
      default: 0,
    },
    otp: {
      type: String,
      default: function () {
        return Math.floor(1000 + Math.random() * 9000).toString();
      },
    },
    otpAttempts: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "order_created", "paid", "escrow_settled", "failed", "refunded"],
      default: "unpaid",
      index: true,
    },
    paymentOrderId: {
      type: String,
    },
    paymentId: {
      type: String,
    },
    paymentSignature: {
      type: String,
    },
    distribution: {
      workerPayout: {
        type: Number,
        default: 0, // 95%
      },
      mutualWelfare: {
        type: Number,
        default: 0, // 5%
      },
      platformFee: {
        type: Number,
        default: 0, // 0%
      },
    },
    specialRequest: {
      type: String,
    },
    assignedAt: Date,
    startedAt: Date,
    completedAt: Date,
    settledAt: Date,
  },
  { timestamps: true }
);

bookingSchema.index({ serviceCategory: 1, scheduledAt: 1 });
bookingSchema.index({ "location.coordinates": "2dsphere" });
bookingSchema.index({ customerId: 1, status: 1 });
bookingSchema.index({ workerId: 1, status: 1 });

export default mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
