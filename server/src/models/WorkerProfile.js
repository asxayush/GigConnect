import mongoose from "mongoose";

const workerProfileSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
        skills: { type: [String], default: [] },
        certifications: { type: [String], default: [] },
        verificationStatus: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
        availability: { type: Boolean, default: true },
        ratingAvg: { type: Number, default: 0 },
        jobsCompleted: { type: Number, default: 0 },
    },
    { timestamps: true }
);

workerProfileSchema.index({ verificationStatus: 1, skills: 1 });
export default mongoose.model("WorkerProfile", workerProfileSchema);
