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
      required: [true, "customerId is required"],
      index: true,
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    serviceCategory: {
      type: String,
      required: [true, "serviceCategory is required"],
      trim: true,
    },
    bookingType: {
      type: String,
      enum: ["immediate", "scheduled"],
      default: "immediate",
      index: true,
    },
    scheduledDate: {
      type: Date,
      validate: {
        validator: function (value) {
          // If bookingType is scheduled, scheduledDate is required
          if (this.bookingType === "scheduled" && !value && !this.scheduledAt) {
            return false;
          }
          return true;
        },
        message: "scheduledDate is required when bookingType is 'scheduled'",
      },
    },
    scheduledAt: {
      type: Date,
    },
    requestStatus: {
      type: String,
      enum: ["pending", "accepted", "rejected", "declined", "completed"],
      default: "pending",
      index: true,
    },
    // Backward-compatible status alias
    status: {
      type: String,
      enum: [
        "pending",
        "requested",
        "accepted",
        "assigned",
        "in-progress",
        "In Progress",
        "completed",
        "Completed",
        "rejected",
        "declined",
        "cancelled",
        "Cancelled",
        "escrow-settled",
      ],
      default: "pending",
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
    paymentStatus: {
      type: String,
      enum: [
        "unpaid",
        "held_in_escrow",
        "released",
        "pending",
        "paid",
        "released_to_worker",
        "refunded",
        "order_created",
        "escrow_settled",
        "failed",
      ],
      default: "unpaid",
      index: true,
    },
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
    razorpayOrderId: {
      type: String,
      trim: true,
    },
    razorpayPaymentId: {
      type: String,
      trim: true,
    },
    razorpaySignature: {
      type: String,
      trim: true,
    },
    paymentOrderId: {
      type: String,
      trim: true,
    },
    paymentId: {
      type: String,
      trim: true,
    },
    paymentSignature: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      default: "Customer Location, Delhi-NCR",
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
    isEmergency: {
      type: Boolean,
      default: false,
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
    // Cooperative Fair Split (95% Worker, 5% Welfare Fund, 0% Platform Commission)
    distribution: {
      workerPayout: {
        type: Number,
        default: 0,
      },
      mutualWelfare: {
        type: Number,
        default: 0,
      },
      platformFee: {
        type: Number,
        default: 0,
      },
    },
    specialRequest: {
      type: String,
      default: "",
    },
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

// Pre-save hook: Sync status aliases, amounts, scheduled dates, and Razorpay aliases
bookingSchema.pre("save", function (next) {
  // Sync requestStatus with legacy status
  if (this.requestStatus && !this.status) {
    this.status = this.requestStatus;
  } else if (this.status && !this.requestStatus) {
    if (this.status === "assigned" || this.status === "in-progress" || this.status === "In Progress") {
      this.requestStatus = "accepted";
    } else if (this.status === "completed" || this.status === "Completed") {
      this.requestStatus = "completed";
    } else if (this.status === "cancelled" || this.status === "Cancelled") {
      this.requestStatus = "rejected";
    } else {
      this.requestStatus = "pending";
    }
  }

  // Sync scheduledDate and scheduledAt
  if (this.scheduledDate && !this.scheduledAt) {
    this.scheduledAt = this.scheduledDate;
  } else if (this.scheduledAt && !this.scheduledDate) {
    this.scheduledDate = this.scheduledAt;
  }

  // Ensure baseFare and price are synchronized
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

  // Auto-sync Razorpay aliases
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

  if (this.razorpaySignature && !this.paymentSignature) {
    this.paymentSignature = this.razorpaySignature;
  } else if (this.paymentSignature && !this.razorpaySignature) {
    this.razorpaySignature = this.paymentSignature;
  }

  // Auto-compute fair distribution
  const total = Number(this.totalAmount || this.baseFare || 0);
  this.distribution = {
    workerPayout: Math.round(total * 0.95),
    mutualWelfare: Math.round(total * 0.05),
    platformFee: 0,
  };

  if (typeof next === "function") {
    next();
  }
});

bookingSchema.index({ customerId: 1, requestStatus: 1 });
bookingSchema.index({ workerId: 1, requestStatus: 1 });
bookingSchema.index({ serviceCategory: 1, scheduledDate: 1 });
bookingSchema.index({ "location.coordinates": "2dsphere" });

export default mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
