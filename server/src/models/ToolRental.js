import mongoose from "mongoose";

const toolRentalSchema = new mongoose.Schema(
  {
    rentalCode: { type: String, required: true, unique: true },
    toolId: { type: String, required: true },
    toolItem: { type: mongoose.Schema.Types.ObjectId, ref: "ToolItem" },
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    workerName: { type: String, default: "" },
    workerPhone: { type: String, default: "" },
    pickupHub: { type: String, required: true },
    pickupAddress: { type: String, default: "" },
    replacementValue: { type: Number, default: 0 },
    depositAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["active", "returned", "overdue"],
      default: "active",
    },
    rentedAt: { type: Date, default: Date.now },
    expectedReturnAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
    returnedAt: { type: Date, default: null },
    aadhaarVerifiedSnapshot: { type: Boolean, default: true },
  },
  { timestamps: true }
);

toolRentalSchema.index({ workerId: 1, status: 1 });
toolRentalSchema.index(
  { workerId: 1 },
  { unique: true, partialFilterExpression: { status: "active" }, name: "one_active_rental_per_worker" }
);
toolRentalSchema.index({ toolId: 1, status: 1 });

export default mongoose.models.ToolRental || mongoose.model("ToolRental", toolRentalSchema);
