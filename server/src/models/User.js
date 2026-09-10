import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        phone: { type: String, trim: true, unique: true, sparse: true },
        email: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
        firebaseUid: { type: String, unique: true, sparse: true },
        passwordHash: { type: String, select: false },
        role: { type: String, enum: ["customer", "worker", "admin", "coordinator"], default: "customer" },
        avatar: { type: String, default: "" },
        gender: { type: String, default: "" },
        location: { lat: Number, lng: Number, area: String },
        isDemo: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", userSchema);
