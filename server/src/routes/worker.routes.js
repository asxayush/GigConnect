import { Router } from "express";
import User from "../models/User.js";
import WorkerProfile from "../models/WorkerProfile.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

router.get("/", async (request, response, next) => {
    try {
        const filter = { verificationStatus: "verified", availability: true };
        if (request.query.skill) filter.skills = request.query.skill;
        const profiles = await WorkerProfile.find(filter).populate("userId", "name phone location").sort({ ratingAvg: -1 });
        response.json({ success: true, data: profiles, message: "Workers fetched" });
    } catch (error) { next(error); }
});

router.post("/", requireAuth, requireRole("admin", "coordinator", "worker"), async (request, response, next) => {
    try {
        const { name, phone, email, skills = [], certifications = [], availability = true, location } = request.body;
        if (!name || !phone || skills.length === 0) return response.status(400).json({ success: false, message: "name, phone and at least one skill are required" });
        const user = await User.create({ name, phone, email, role: "worker", location });
        const profile = await WorkerProfile.create({ userId: user._id, skills, certifications, availability });
        response.status(201).json({ success: true, data: await profile.populate("userId", "name phone location"), message: "Worker submitted for verification" });
    } catch (error) { next(error); }
});

router.patch("/:id", requireAuth, async (request, response, next) => {
    try {
        const profile = await WorkerProfile.findOneAndUpdate({ userId: request.params.id }, request.body, { new: true, runValidators: true }).populate("userId", "name phone location");
        if (!profile) return response.status(404).json({ success: false, message: "Worker profile not found" });
        response.json({ success: true, data: profile, message: "Worker updated" });
    } catch (error) { next(error); }
});

router.patch("/:id/verification", requireAuth, requireRole("admin"), async (request, response, next) => {
    try {
        const { status } = request.body;
        if (!["verified", "rejected", "pending"].includes(status)) return response.status(400).json({ success: false, message: "Invalid verification status" });
        const profile = await WorkerProfile.findOneAndUpdate({ userId: request.params.id }, { verificationStatus: status }, { new: true }).populate("userId", "name phone location");
        if (!profile) return response.status(404).json({ success: false, message: "Worker profile not found" });
        response.json({ success: true, data: profile, message: `Worker ${status}` });
    } catch (error) { next(error); }
});

export default router;
