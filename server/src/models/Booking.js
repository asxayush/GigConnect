import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
    {
        customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        workerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        serviceCategory: { type: String, required: true, trim: true },
        address: { type: String, required: true, trim: true },
        location: { lat: Number, lng: Number },
        scheduledAt: { type: Date, required: true },
        status: { type: String, enum: ["Requested", "Assigned", "In Progress", "Completed", "Cancelled"], default: "Requested" },
        isEmergency: { type: Boolean, default: false },
        price: { type: Number, min: 0 },
        paymentStatus: { type: String, enum: ["unpaid", "order_created", "paid", "failed"], default: "unpaid" },
        paymentOrderId: String,
    },
    { timestamps: true }
);

bookingSchema.index({ serviceCategory: 1, scheduledAt: 1 });
export default mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
