import mongoose from "mongoose";

const toolItemSchema = new mongoose.Schema(
  {
    toolId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    brand: { type: String, required: true },
    specs: { type: String, default: "" },
    replacementValue: { type: Number, required: true },
    coopDailyFee: { type: Number, default: 0 },
    securityDeposit: { type: String, default: "₹0 (Cooperative Mutual Trust)" },
    totalStock: { type: Number, default: 3 },
    availableStock: { type: Number, default: 3 },
    condition: { type: String, default: "Certified Master Grade" },
    hubName: { type: String, required: true },
    hubAddress: { type: String, required: true },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [77.209, 28.6139] },
    },
    imageUrl: { type: String, default: "" },
    requiredBadge: { type: String, default: "Cooperative Verified Tradesperson" },
  },
  { timestamps: true }
);

toolItemSchema.index({ location: "2dsphere" });
toolItemSchema.index({ toolId: 1, category: 1 });

export default mongoose.models.ToolItem || mongoose.model("ToolItem", toolItemSchema);
