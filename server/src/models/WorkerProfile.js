import mongoose from "mongoose";

const workerProfileSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
        skills: { type: [String], default: [] },
        certifications: { type: [String], default: [] },
        photoUrl: { type: String, default: "" },
        verificationStatus: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
        sakhiVerified: { type: Boolean, default: false },
        isSakhiVerified: { type: Boolean, default: false },
        availability: { type: Boolean, default: true },
        ratingAvg: { type: Number, default: 0 },
        ratingCount: { type: Number, default: 0 },
        jobsCompleted: { type: Number, default: 0 },
        socialSecurity: {
            hasLifeInsurance: { type: Boolean, default: false },
            providerName: { type: String, default: "PMJJBY / Cooperative Group Life" },
            policyNumber: { type: String, default: "" },
            enrolledViaCooperative: { type: Boolean, default: false },
        },
        legalConsent: {
            termsAccepted: { type: Boolean, default: false },
            privacyAccepted: { type: Boolean, default: false },
            consentTimestamp: { type: Date, default: Date.now },
            dpdpCompliant: { type: Boolean, default: true },
        },
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
