import jwt from "jsonwebtoken";
import User from "../models/User.js";

const getToken = (request) => {
    const header = request.headers.authorization || "";
    return header.startsWith("Bearer ") ? header.slice(7) : null;
};

export const requireAuth = async (request, response, next) => {
    try {
        const token = getToken(request);
        if (!token) return response.status(401).json({ success: false, message: "Authentication required" });
        const payload = jwt.verify(token, process.env.JWT_SECRET || "gigconnect-development-secret");
        const user = await User.findById(payload.userId).select("-passwordHash");
        if (!user) return response.status(401).json({ success: false, message: "User not found" });
        request.user = user;
        next();
    } catch {
        return response.status(401).json({ success: false, message: "Invalid or expired token" });
    }
};

export const requireRole = (...roles) => (request, response, next) => {
    if (!request.user || !roles.includes(request.user.role)) return response.status(403).json({ success: false, message: "Insufficient permissions" });
    next();
};
