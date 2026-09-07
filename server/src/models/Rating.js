import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
    {
        bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, unique: true },
        customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        workerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        stars: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, trim: true, maxlength: 1000 },
    },
    { timestamps: true }
);

export default mongoose.model("Rating", ratingSchema);
