import mongoose from "mongoose";

const additionalChargeSchema = new mongoose.Schema({
  reason: {
    type: String,
    required: true,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ["requested", "paid", "rejected"],
    default: "requested",
  },
  razorpayOrderId: {
    type: String,
  },
  razorpayPaymentId: {
    type: String,
  },
  razorpaySignature: {
    type: String,
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  resolvedAt: {
    type: Date,
  },
});

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
        "pending",
        "accepted",
        "assigned",
        "in-progress",
        "completed",
        "escrow-settled",
        "declined",
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
    arrivalTime: {
      type: String,
      default: "15 mins",
    },
    isDemo: {
      type: Boolean,
      default: false,
      index: true,
    },
    isEmergency: {
      type: Boolean,
      default: false,
    },
    // Pricing & Escrow Architecture
    baseFare: {
      type: Number,
      min: 0,
      default: 0,
    },
    price: {
      type: Number,
      min: 0,
      default: 0,
    },
    additionalCharges: [additionalChargeSchema],
    totalAmount: {
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
      enum: [
        "pending",
        "held_in_escrow",
        "released_to_worker",
        "refunded",
        "unpaid",
        "order_created",
        "paid",
        "escrow_settled",
        "failed",
      ],
      default: "pending",
      index: true,
    },
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
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
    // Cooperative Zero-Platform-Fee Split (95% Worker, 5% Welfare, 0% Platform)
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
    // Dual-Handshake Completion tracking
    workerMarkedDone: {
      type: Boolean,
      default: false,
    },
    workerCompletedAt: {
      type: Date,
    },
    customerCompletedAt: {
      type: Date,
    },
    autoReleaseAt: {
      type: Date,
    },
    assignedAt: Date,
    startedAt: Date,
    completedAt: Date,
    settledAt: Date,
  },
  { timestamps: true }
);

// Pre-save hook to ensure baseFare and totalAmount are always synchronized with price
bookingSchema.pre("save", function (next) {
  if (this.baseFare === 0 && this.price > 0) {
    this.baseFare = this.price;
  } else if (this.price === 0 && this.baseFare > 0) {
    this.price = this.baseFare;
  }

  // Calculate totalAmount = baseFare + sum of paid additional charges
  const paidAddons = (this.additionalCharges || [])
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + Number(c.amount || 0), 0);

  this.totalAmount = (Number(this.baseFare) || Number(this.price) || 0) + paidAddons;

  // Auto-sync aliases
  if (this.razorpayOrderId && !this.paymentOrderId) {
    this.paymentOrderId = this.razorpayOrderId;
  } else if (this.paymentOrderId && !this.razorpayOrderId) {
    this.razorpayOrderId = this.paymentOrderId;
  }

  if (this.razorpayPaymentId && !this.paymentId) {
    this.paymentId = this.razorpayPaymentId;
  } else if (this.paymentId && !this.razorpayPaymentId) {
    this.razorpayPaymentId = this.paymentId;
  }

  next();
});

bookingSchema.index({ serviceCategory: 1, scheduledAt: 1 });
bookingSchema.index({ "location.coordinates": "2dsphere" });
bookingSchema.index({ customerId: 1, status: 1 });
bookingSchema.index({ workerId: 1, status: 1 });
bookingSchema.index({ paymentStatus: 1, autoReleaseAt: 1 });

export default mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
