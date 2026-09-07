import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        phone: { type: String, trim: true, unique: true, sparse: true },
        email: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
        firebaseUid: { type: String, unique: true, sparse: true },
        passwordHash: { type: String, select: false },
        role: { type: String, enum: ["customer", "worker", "admin", "coordinator"], default: "customer" },
        location: { lat: Number, lng: Number, area: String },
    },
    { timestamps: true }
);

export default mongoose.model("User", userSchema);
