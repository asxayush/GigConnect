import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    serviceCategory: { type: String, required: true, trim: true, index: true },
    address: { type: String, required: true, trim: true },
    location: { lat: Number, lng: Number },
    scheduledAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "Requested", "Assigned", "In Progress", "Completed", "Cancelled"],
      default: "pending",
      index: true,
    },
    isEmergency: { type: Boolean, default: false },
    price: { type: Number, min: 0, default: 0 },
    specialRequest: { type: String, trim: true },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "order_created", "paid", "failed"],
      default: "unpaid",
    },
    paymentOrderId: String,
  },
  { timestamps: true }
);

bookingSchema.index({ serviceCategory: 1, scheduledAt: 1 });
bookingSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
