import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { fileURLToPath } from "node:url";
import User from "../models/User.js";
import WorkerProfile from "../models/WorkerProfile.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const uploadDirectory = path.resolve(currentDirectory, "../../uploads/certificates");
const photoDirectory = path.resolve(currentDirectory, "../../uploads/worker-photos");
fs.mkdirSync(uploadDirectory, { recursive: true });
fs.mkdirSync(photoDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (request, file, callback) =>
    callback(
      null,
      file.fieldname === "photo" ? photoDirectory : uploadDirectory
    ),
  filename: (request, file, callback) =>
    callback(
      null,
      `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`
    ),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (request, file, callback) =>
    callback(
      null,
      ["application/pdf", "image/jpeg", "image/png"].includes(file.mimetype)
    ),
});

// GET /api/workers — public worker directory with optional geo and skill filters
router.get("/", async (request, response, next) => {
  try {
    const filter = {
      verificationStatus: "verified",
      photoUrl: { $exists: true, $ne: "" },
      availability: true,
    };
    if (request.query.skill) filter.skills = request.query.skill;

    // Sakhi Mode Enforcement: Filter for women / Sakhi verified cooperative members
    const isSakhiOnly = request.query.sakhiOnly === "true" || request.query.sakhiMode === "true";
    if (isSakhiOnly) {
      filter.$or = [{ sakhiVerified: true }, { isSakhiVerified: true }];
    }

    let profiles;
    if (request.query.lat && request.query.lng) {
      const maxDistance = Number(request.query.radiusKm || 10) * 1000;
      profiles = await WorkerProfile.find({
        ...filter,
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [
                Number(request.query.lng),
                Number(request.query.lat),
              ],
            },
            $maxDistance: maxDistance,
          },
        },
      })
        .populate("userId", "name phone location gender")
        .sort({ ratingAvg: -1 });
    } else {
      profiles = await WorkerProfile.find(filter)
        .populate("userId", "name phone location gender")
        .sort({ ratingAvg: -1 });
    }
    response.json({ success: true, data: profiles, message: "Workers fetched" });
  } catch (error) {
    next(error);
  }
});

// POST /api/workers — register a new worker (self-registration or assisted by admin/coordinator)
router.post(
  "/",
  requireAuth,
  requireRole("admin", "coordinator", "worker"),
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "certificate", maxCount: 1 },
  ]),
  async (request, response, next) => {
    try {
      const {
        name,
        phone,
        email,
        availability = true,
        location,
        coordinates,
        photoUrl: bodyPhotoUrl,
        aadhaarMasked,
      } = request.body;
      const skills =
        typeof request.body.skills === "string"
          ? JSON.parse(request.body.skills)
          : request.body.skills || [];
      const parsedLocation =
        typeof location === "string" ? JSON.parse(location) : location;
      const photo = request.files?.photo?.[0];
      const photoUrl = photo
        ? `/uploads/worker-photos/${photo.filename}`
        : bodyPhotoUrl || "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80";

      if (!name || !phone || skills.length === 0) {
        return response.status(400).json({
          success: false,
          message: "name, phone, and at least one skill are required",
        });
      }

      // Check if user already exists or create new
      let user = await User.findOne({ phone });
      if (!user) {
        user = await User.create({
          name,
          phone,
          email,
          role: "worker",
          location: parsedLocation,
        });
      } else {
        user.name = name;
        user.role = "worker";
        if (parsedLocation) user.location = parsedLocation;
        await user.save();
      }

      const certificate = request.files?.certificate?.[0];
      const certifications = certificate
        ? [`/uploads/certificates/${certificate.filename}`]
        : [];

      const profile = await WorkerProfile.findOneAndUpdate(
        { userId: user._id },
        {
          userId: user._id,
          skills,
          certifications,
          photoUrl,
          verificationStatus: "pending",
          availability: availability !== "false",
          location: coordinates
            ? { type: "Point", coordinates: typeof coordinates === "string" ? JSON.parse(coordinates) : coordinates }
            : parsedLocation?.lat && parsedLocation?.lng
            ? { type: "Point", coordinates: [parsedLocation.lng, parsedLocation.lat] }
            : undefined,
        },
        { upsert: true, returnDocument: "after" }
      );

      // Create biometric Worker record if aadhaarMasked provided
      if (aadhaarMasked) {
        await Worker.findOneAndUpdate(
          { phone },
          {
            name,
            phone,
            aadhaarNumberMasked: aadhaarMasked,
            aadhaarCardImageUrl: photoUrl,
            selfieImageUrl: photoUrl,
            faceMatchScore: 88,
            verificationStatus: "pending",
            extractedOcrData: {
              name,
              address: parsedLocation?.area || "",
            },
          },
          { upsert: true, returnDocument: "after" }
        );
      }

      response.status(201).json({
        success: true,
        data: await profile.populate("userId", "name phone location"),
        message: "Worker submitted for cooperative verification",
      });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/workers/me — worker updates their own profile
router.patch(
  "/me",
  requireAuth,
  requireRole("worker"),
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "certificate", maxCount: 1 },
  ]),
  async (request, response, next) => {
    try {
      const { name, phone, availability = true, location } = request.body;
      const skills =
        typeof request.body.skills === "string"
          ? JSON.parse(request.body.skills)
          : request.body.skills || [];
      const parsedLocation =
        typeof location === "string" ? JSON.parse(location) : location;

      await User.findByIdAndUpdate(
        request.user._id,
        { name, phone, location: parsedLocation },
        { runValidators: true }
      );

      const updates = { skills, availability: availability !== "false" };
      const photo = request.files?.photo?.[0];
      const certificate = request.files?.certificate?.[0];
      if (photo) updates.photoUrl = `/uploads/worker-photos/${photo.filename}`;
      if (certificate)
        updates.$push = {
          certifications: `/uploads/certificates/${certificate.filename}`,
        };

      const profile = await WorkerProfile.findOneAndUpdate(
        { userId: request.user._id },
        updates,
        { new: true, upsert: true, runValidators: true }
      ).populate("userId", "name phone location");

      response.json({ success: true, data: profile, message: "Worker profile updated" });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/workers/:id — admin/coordinator updates a specific worker profile.
// Field whitelist prevents privilege escalation (e.g. directly setting verificationStatus).
router.patch(
  "/:id",
  requireAuth,
  requireRole("admin", "coordinator"),
  async (request, response, next) => {
    try {
      // Only these fields may be updated through this endpoint.
      // verificationStatus is intentionally excluded — use PATCH /:id/verification.
      const { skills, availability, photoUrl, certifications } = request.body;
      const safeUpdates = {};
      if (skills !== undefined) safeUpdates.skills = skills;
      if (availability !== undefined) safeUpdates.availability = availability;
      if (photoUrl !== undefined) safeUpdates.photoUrl = photoUrl;
      if (certifications !== undefined)
        safeUpdates.certifications = certifications;

      const profile = await WorkerProfile.findOneAndUpdate(
        { userId: request.params.id },
        safeUpdates,
        { new: true, runValidators: true }
      ).populate("userId", "name phone location");

      if (!profile) {
        return response
          .status(404)
          .json({ success: false, message: "Worker profile not found" });
      }
      response.json({ success: true, data: profile, message: "Worker updated" });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/workers/:id/verification — admin sets verification status
router.patch(
  "/:id/verification",
  requireAuth,
  requireRole("admin"),
  async (request, response, next) => {
    try {
      const { status } = request.body;
      if (!["verified", "rejected", "pending"].includes(status)) {
        return response
          .status(400)
          .json({ success: false, message: "Invalid verification status" });
      }
      if (status === "verified") {
        const existing = await WorkerProfile.findOne({
          userId: request.params.id,
        });
        if (!existing?.photoUrl) {
          return response.status(400).json({
            success: false,
            message: "Worker photo is required before verification",
          });
        }
      }
      const profile = await WorkerProfile.findOneAndUpdate(
        { userId: request.params.id },
        { verificationStatus: status },
        { new: true }
      ).populate("userId", "name phone location");

      if (!profile) {
        return response
          .status(404)
          .json({ success: false, message: "Worker profile not found" });
      }
      response.json({ success: true, data: profile, message: `Worker ${status}` });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
