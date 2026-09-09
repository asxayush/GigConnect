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

// Helper for Haversine distance in KM
function getHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// GET /api/workers — robust geospatial worker directory with 2dsphere matching & dynamic ETA
router.get("/", async (request, response, next) => {
  try {
    const filter = {
      verificationStatus: "verified",
      availability: true, // Only match available workers (not currently on job)
    };

    // Category / Skill filter
    const searchCategory =
      request.query.serviceCategory ||
      request.query.category ||
      request.query.skill;

    if (searchCategory && searchCategory !== "all") {
      filter.skills = { $regex: new RegExp(searchCategory, "i") };
    }

    // Sakhi Mode Enforcement: Filter for female / Sakhi verified cooperative members
    const isSakhiOnly =
      request.query.sakhiOnly === "true" || request.query.sakhiMode === "true";
    if (isSakhiOnly) {
      filter.$or = [{ sakhiVerified: true }, { isSakhiVerified: true }];
    }

    const hasCoords =
      request.query.lat !== undefined &&
      request.query.lng !== undefined &&
      !isNaN(Number(request.query.lat)) &&
      !isNaN(Number(request.query.lng));

    const userLat = hasCoords ? Number(request.query.lat) : 28.6139; // Delhi NCR default
    const userLng = hasCoords ? Number(request.query.lng) : 77.209;
    const radiusKm = Number(request.query.radiusKm || 30);
    const maxDistanceMeters = radiusKm * 1000;

    let profiles;

    if (hasCoords) {
      // 2dsphere geospatial search using $nearSphere
      profiles = await WorkerProfile.find({
        ...filter,
        location: {
          $nearSphere: {
            $geometry: {
              type: "Point",
              coordinates: [userLng, userLat],
            },
            $maxDistance: maxDistanceMeters,
          },
        },
      })
        .populate("userId", "name phone email location gender avatar")
        .lean();
    } else {
      profiles = await WorkerProfile.find(filter)
        .populate("userId", "name phone email location gender avatar")
        .sort({ ratingAvg: -1 })
        .lean();
    }

    // Map profiles and calculate exact distance + dynamic ETA (speed = 25 km/h urban)
    const enrichedWorkers = profiles.map((p) => {
      let distanceKm = null;
      let etaMinutes = null;
      const coords = p.location?.coordinates;

      if (Array.isArray(coords) && coords.length === 2) {
        const [wLng, wLat] = coords;
        const dist = getHaversineDistanceKm(userLat, userLng, wLat, wLng);
        distanceKm = Math.round(dist * 10) / 10;
        // ETA based on 25 km/h urban transit speed, minimum 5 mins
        etaMinutes = Math.max(5, Math.round((distanceKm / 25) * 60));
      }

      return {
        ...p,
        distanceKm,
        etaMinutes,
        calculatedEta: etaMinutes ? `${etaMinutes} mins` : "15 mins",
        distanceText: distanceKm !== null ? `${distanceKm} km away` : "Nearby",
      };
    });

    // If coordinates provided, sort by distance ascending
    if (hasCoords) {
      enrichedWorkers.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    }

    response.json({
      success: true,
      count: enrichedWorkers.length,
      data: enrichedWorkers,
      userLocation: { lat: userLat, lng: userLng },
      message: `${enrichedWorkers.length} cooperative workers matched`,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/workers/location — update worker's live location & availability (for demo simulation & live GPS)
router.patch("/location", requireAuth, async (request, response, next) => {
  try {
    const { lat, lng, coordinates, availability } = request.body;
    let targetCoords = null;

    if (Array.isArray(coordinates) && coordinates.length === 2) {
      targetCoords = [Number(coordinates[0]), Number(coordinates[1])];
    } else if (lat !== undefined && lng !== undefined) {
      targetCoords = [Number(lng), Number(lat)];
    }

    const updates = {};
    if (targetCoords) {
      updates.location = {
        type: "Point",
        coordinates: targetCoords,
      };
    }
    if (availability !== undefined) {
      updates.availability = Boolean(availability);
    }

    const profile = await WorkerProfile.findOneAndUpdate(
      { $or: [{ userId: request.user._id }, { _id: request.user._id }] },
      updates,
      { new: true, runValidators: true }
    ).populate("userId", "name phone location gender avatar");

    if (!profile) {
      return response.status(404).json({
        success: false,
        message: "Worker profile not found for authenticated user",
      });
    }

    response.json({
      success: true,
      data: profile,
      message: "Worker live coordinates & availability updated successfully",
    });
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
        socialSecurity: bodySocialSecurity,
        legalConsent: bodyLegalConsent,
      } = request.body;
      const skills =
        typeof request.body.skills === "string"
          ? JSON.parse(request.body.skills)
          : request.body.skills || [];
      const parsedLocation =
        typeof location === "string" ? JSON.parse(location) : location;
      const parsedSocialSecurity =
        typeof bodySocialSecurity === "string"
          ? JSON.parse(bodySocialSecurity)
          : bodySocialSecurity || { hasLifeInsurance: true, providerName: "PMJJBY / Cooperative Group Life" };
      const parsedLegalConsent =
        typeof bodyLegalConsent === "string"
          ? JSON.parse(bodyLegalConsent)
          : bodyLegalConsent || { termsAccepted: true, privacyAccepted: true, consentTimestamp: new Date(), dpdpCompliant: true };
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
          socialSecurity: parsedSocialSecurity,
          legalConsent: parsedLegalConsent,
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
            socialSecurity: parsedSocialSecurity,
            legalConsent: parsedLegalConsent,
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
