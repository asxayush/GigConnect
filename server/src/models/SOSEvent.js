import mongoose from "mongoose";

const sosEventSchema = new mongoose.Schema(
  {
    sosCode: { type: String, required: true, unique: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    triggeredBy: { type: String, enum: ["customer", "worker", "coordinator"], default: "customer" },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [77.209, 28.6139] },
    },
    address: { type: String, default: "Delhi NCR Service Site" },
    emergencyContact: {
      name: { type: String, default: "Delhi Police Women Safety Helpline" },
      phone: { type: String, default: "1091 / 112" },
      email: { type: String, default: "safety-desk@gigconnect.coop" },
    },
    emailNotificationSent: { type: Boolean, default: false },
    emailNotificationId: { type: String, default: "" },
    emailPreviewUrl: { type: String, default: "" },
    status: {
      type: String,
      enum: ["active", "dispatched", "resolved"],
      default: "active",
    },
    resolutionNotes: { type: String, default: "" },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

sosEventSchema.index({ location: "2dsphere" });
sosEventSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.SOSEvent || mongoose.model("SOSEvent", sosEventSchema);
