import { Router } from "express";
import Booking from "../models/Booking.js";
import WorkerProfile from "../models/WorkerProfile.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();
const transitions = { Requested: ["Assigned", "Cancelled"], Assigned: ["In Progress", "Cancelled"], "In Progress": ["Completed"], Completed: [] };

router.get("/", requireAuth, async (request, response, next) => {
    try {
        const filter = request.user.role === "customer" ? { customerId: request.user._id } : request.user.role === "worker" ? { workerId: request.user._id } : {};
        const bookings = await Booking.find(filter).populate("customerId workerId", "name phone").sort({ scheduledAt: -1 });
        response.json({ success: true, data: bookings, message: "Bookings fetched" });
    } catch (error) { next(error); }
});

router.post("/", requireAuth, async (request, response, next) => {
    try {
        const { serviceCategory, address, location, scheduledAt, workerId, isEmergency = false, price } = request.body;
        if (!serviceCategory || !address || !scheduledAt) return response.status(400).json({ success: false, message: "serviceCategory, address and scheduledAt are required" });
        if (workerId) {
            const worker = await WorkerProfile.findOne({ userId: workerId, verificationStatus: "verified", availability: true });
            if (!worker) return response.status(400).json({ success: false, message: "Worker is not available" });
        }
        const booking = await Booking.create({ customerId: request.user._id, workerId, serviceCategory, address, location, scheduledAt, isEmergency, price, status: workerId ? "Assigned" : "Requested" });
        response.status(201).json({ success: true, data: await booking.populate("workerId", "name phone"), message: "Booking created" });
    } catch (error) { next(error); }
});

router.patch("/:id/status", requireAuth, async (request, response, next) => {
    try {
        const booking = await Booking.findById(request.params.id);
        if (!booking) return response.status(404).json({ success: false, message: "Booking not found" });
        const { status } = request.body;
        if (!transitions[booking.status]?.includes(status)) return response.status(400).json({ success: false, message: `Cannot move booking from ${booking.status} to ${status}` });
        booking.status = status;
        if (status === "Completed" && booking.workerId) await WorkerProfile.findOneAndUpdate({ userId: booking.workerId }, { $inc: { jobsCompleted: 1 } });
        await booking.save();
        response.json({ success: true, data: booking, message: "Booking status updated" });
    } catch (error) { next(error); }
});

export default router;
