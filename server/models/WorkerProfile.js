import mongoose from "mongoose";

const workerProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    skills: { type: [String], default: [] },
    certifications: { type: [String], default: [] },
    photoUrl: { type: String, default: "" },
    verificationStatus: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
    availability: { type: Boolean, default: true },
    ratingAvg: { type: Number, default: 0 },
    jobsCompleted: { type: Number, default: 0 },
    location: {
      type: { type: String, enum: ["Point"] },
      coordinates: { type: [Number] },
    },
  },
  { timestamps: true }
);

workerProfileSchema.index({ verificationStatus: 1, skills: 1 });
workerProfileSchema.index({ location: "2dsphere" });

export default mongoose.models.WorkerProfile || mongoose.model("WorkerProfile", workerProfileSchema);
