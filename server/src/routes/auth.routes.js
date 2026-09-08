import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import WorkerProfile from "../models/WorkerProfile.js";
import { verifyFirebaseToken } from "../firebase.js";
import { checkPhoneVerification, sendPhoneVerification } from "../utils/twilio.js";

const router = Router();
const signToken = (user) => jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || "gigconnect-development-secret", { expiresIn: "7d" });

router.post("/register", async (request, response, next) => {
    try {
        const { name, email, phone, password, role = "customer", location } = request.body;
        if (!name || !password || (!email && !phone)) return response.status(400).json({ success: false, message: "name, password and email or phone are required" });
        if (!["customer", "worker"].includes(role)) return response.status(400).json({ success: false, message: "Invalid registration role" });
        const identityChecks = [];
        if (email) identityChecks.push({ email });
        if (phone) identityChecks.push({ phone });
        const existing = await User.findOne({ $or: identityChecks });
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

router.post("/firebase", async (request, response, next) => {
    try {
        const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
        if (!token) return response.status(401).json({ success: false, message: "Firebase token required" });
        const identity = await verifyFirebaseToken(token);
        let user = await User.findOne({ firebaseUid: identity.uid });
        if (!user) user = await User.create({ firebaseUid: identity.uid, name: identity.name || identity.phone_number || identity.email || "GigConnect member", email: identity.email, phone: identity.phone_number, role: "customer" });
        return response.json({ success: true, data: { user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role }, token: signToken(user) }, message: "Firebase account connected" });
    } catch (error) { next(error); }
});

router.post("/phone/send", async (request, response, next) => {
    try {
        const phone = request.body.phone?.replace(/[\s()-]/g, "");
        if (!/^\+[1-9]\d{7,14}$/.test(phone || "")) return response.status(400).json({ success: false, message: "Enter a valid phone number with country code, for example +919876543210" });
        const verification = await sendPhoneVerification(phone);
        response.json({ success: true, data: { phone, status: verification.status }, message: "OTP sent" });
    } catch (error) { next(error); }
});

router.post("/phone/verify", async (request, response, next) => {
    try {
        const phone = request.body.phone?.replace(/[\s()-]/g, "");
        const code = request.body.code?.trim();
        if (!/^\+[1-9]\d{7,14}$/.test(phone || "") || !/^\d{4,8}$/.test(code || "")) return response.status(400).json({ success: false, message: "Enter a valid phone number and OTP" });
        const verification = await checkPhoneVerification(phone, code);
        if (verification.status !== "approved") return response.status(401).json({ success: false, message: "Incorrect or expired OTP" });
        let user = await User.findOne({ phone });
        if (!user) user = await User.create({ phone, name: phone, role: "customer" });
        response.json({ success: true, data: { user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role }, token: signToken(user) }, message: "Phone verified" });
    } catch (error) { next(error); }
});

export default router;
