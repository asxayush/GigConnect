import mongoose from "mongoose";

/**
 * Worker Schema for Aadhaar & Biometric Face Verification
 * 
 * SECURITY NOTE:
 * Full 12-digit Aadhaar numbers are NEVER stored in the database.
 * Only the masked version with the last 4 digits (e.g. "•••• •••• 1234") is retained.
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
        // Store ONLY last 4 digits masked, never full 12 digits (e.g. •••• •••• 1234)
        aadhaarNumberMasked: {
            type: String,
            required: [true, "Masked Aadhaar number is required"],
            trim: true,
        },
        // Cloudinary / Storage URL for the uploaded Aadhaar card document
        aadhaarCardImageUrl: {
            type: String,
            required: [true, "Aadhaar card image URL is required"],
        },
        // Cloudinary / Storage URL for the live selfie captured via webcam
        selfieImageUrl: {
            type: String,
            default: "",
        },
        // Confidence score between 0 and 100 calculated from Euclidean distance
        faceMatchScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },
        // Verification status transitions:
        // - 'pending': Face match score between 60-85, requires admin manual review
        // - 'auto_verified': Face match score > 85, verified automatically by AI
        // - 'manually_verified': Approved manually by an admin reviewer
        // - 'rejected': Face match score < 60 or rejected by admin
        verificationStatus: {
            type: String,
            enum: ["pending", "auto_verified", "manually_verified", "rejected"],
            default: "pending",
            index: true,
        },
        // Timestamp of auto or manual verification
        verifiedAt: {
            type: Date,
        },
        // Extracted and sanitized OCR details from the Aadhaar card
        extractedOcrData: {
            name: { type: String, trim: true, default: "" },
            dob: { type: String, trim: true, default: "" },
            address: { type: String, trim: true, default: "" },
        },
        // Reviewer notes if reviewed manually by an admin
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

// Helpful compound indexes
workerSchema.index({ verificationStatus: 1, createdAt: -1 });

export default mongoose.model("Worker", workerSchema);
