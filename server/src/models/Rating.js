import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    stars: { type: Number, required: true, min: 1, max: 5 },
    safetyRating: { type: Number, min: 1, max: 5, default: 5 },
    comment: { type: String, trim: true, maxlength: 1000, default: "" },
    tags: { type: [String], default: [] },
    isWomenSafetyAudit: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ratingSchema.index({ workerId: 1, stars: 1 });
ratingSchema.index({ workerId: 1, safetyRating: 1 });

export default mongoose.models.Rating || mongoose.model("Rating", ratingSchema);
