import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import WorkerProfile from "../models/WorkerProfile.js";

const router = Router();
const signToken = (user) => jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || "gigconnect-development-secret", { expiresIn: "7d" });

router.post("/register", async (request, response, next) => {
    try {
        const { name, email, phone, password, role = "customer", location } = request.body;
        if (!name || !password || (!email && !phone)) return response.status(400).json({ success: false, message: "name, password and email or phone are required" });
        const existing = await User.findOne({ $or: [{ email: email || null }, { phone: phone || null }] });
        if (existing) return response.status(409).json({ success: false, message: "An account already exists" });
        const user = await User.create({ name, email, phone, passwordHash: await bcrypt.hash(password, 10), role, location });
        if (role === "worker") await WorkerProfile.create({ userId: user._id });
        return response.status(201).json({ success: true, data: { user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role }, token: signToken(user) }, message: "Account created" });
    } catch (error) { next(error); }
});

router.post("/login", async (request, response, next) => {
    try {
        const { email, phone, password } = request.body;
        const user = await User.findOne(email ? { email } : { phone }).select("+passwordHash");
        if (!user || !user.passwordHash || !(await bcrypt.compare(password || "", user.passwordHash))) return response.status(401).json({ success: false, message: "Invalid credentials" });
        return response.json({ success: true, data: { user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role }, token: signToken(user) }, message: "Logged in" });
    } catch (error) { next(error); }
});

export default router;
