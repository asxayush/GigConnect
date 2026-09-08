import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, unique: true, sparse: true, index: true },
    email: { type: String, trim: true, lowercase: true, unique: true, sparse: true, index: true },
    firebaseUid: { type: String, unique: true, sparse: true, index: true },
    passwordHash: { type: String, select: false },
    role: {
      type: String,
      enum: ["customer", "worker", "admin", "coordinator"],
      default: "customer",
    },
    avatar: { type: String, default: "" },
    gender: { type: String, default: "" },
    location: { lat: Number, lng: Number, area: String },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", userSchema);
