import mongoose from "mongoose";

/**
 * Worker Schema for Aadhaar, Biometric Face Verification, Social Security & Legal Compliance
 * Full 12-digit Aadhaar numbers are NEVER stored in the database. Only masked string.
 */
const workerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Worker name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
      index: true,
    },
    aadhaarNumberMasked: {
      type: String,
      required: [true, "Masked Aadhaar number is required"],
      trim: true,
    },
    aadhaarCardImageUrl: {
      type: String,
      required: [true, "Aadhaar card image URL is required"],
    },
    selfieImageUrl: {
      type: String,
      default: "",
    },
    faceMatchScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    gender: {
      type: String,
      default: "Male",
    },
    trade: {
      type: String,
      default: "",
    },
    hourlyRate: {
      type: Number,
      default: 250,
    },
    walletBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    rating: {
      type: Number,
      default: 4.8,
    },
    sakhiVerified: {
      type: Boolean,
      default: false,
    },
    locationCoords: {
      lat: Number,
      lng: Number,
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "auto_verified", "manually_verified", "verified", "rejected"],
      default: "pending",
      index: true,
    },
    verifiedAt: {
      type: Date,
    },
    extractedOcrData: {
      name: { type: String, trim: true, default: "" },
      dob: { type: String, trim: true, default: "" },
      address: { type: String, trim: true, default: "" },
    },
    // Social Security & Worker Welfare Layer (§ Part 1)
    socialSecurity: {
      hasLifeInsurance: { type: Boolean, default: false },
      providerName: { type: String, default: "PMJJBY / Cooperative Group Life" },
      policyNumber: { type: String, default: "" },
      enrolledViaCooperative: { type: Boolean, default: false },
    },
    // Legal Compliance & DPDP Act 2023 Consent Layer (§ Part 1)
    legalConsent: {
      termsAccepted: { type: Boolean, default: false },
      privacyAccepted: { type: Boolean, default: false },
      consentTimestamp: { type: Date, default: Date.now },
      dpdpCompliant: { type: Boolean, default: true },
    },
    adminNotes: {
      type: String,
      trim: true,
      default: "",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

workerSchema.index({ verificationStatus: 1, createdAt: -1 });

export default mongoose.models.Worker || mongoose.model("Worker", workerSchema);
