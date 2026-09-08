import { Router } from "express";
import rateLimit from "express-rate-limit";
import { uploadWorkerImages } from "../middlewares/upload.js";
import { uploadImageBuffer } from "../utils/cloudinary.js";
import { extractOcrFromBuffer, sanitizeText } from "../utils/ocrParser.js";
import { compareFaces } from "../utils/faceMatcher.js";
import Worker from "../models/Worker.js";
import WorkerProfile from "../models/WorkerProfile.js";
import User from "../models/User.js";

const router = Router();

/**
 * Rate limiter: max 5 biometric verification attempts per phone / IP per 24 hours.
 */
const verificationRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 5,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: (req) => {
    const phone = req.body?.phone || req.query?.phone;
    if (phone && typeof phone === "string" && phone.trim().length >= 10) {
      return `rate_phone_${phone.trim()}`;
    }
    return `rate_ip_${req.ip || "unknown"}`;
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message:
        "Daily verification limit reached (maximum 5 attempts per day). Please try again after 24 hours or contact federation support.",
    });
  },
});

/**
 * POST /api/worker/extract-aadhaar
 * Accepts Aadhaar card image (multipart), runs OCR, returns masked data.
 */
router.post(
  "/extract-aadhaar",
  verificationRateLimiter,
  uploadWorkerImages.single("aadhaarCard"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Aadhaar card image file is required (JPG or PNG, max 5MB).",
        });
      }

      const imageBuffer = req.file.buffer;

      // Upload to Cloudinary and run OCR concurrently
      const [cloudinaryResult, ocrResult] = await Promise.all([
        uploadImageBuffer(imageBuffer, {
          folder: "gigconnect/aadhaar-cards",
          filename: `aadhaar-${Date.now()}`,
        }),
        extractOcrFromBuffer(imageBuffer),
      ]);

      const { extractedData, rawText } = ocrResult;

      res.json({
        success: true,
        message: "Aadhaar card processed and text extracted successfully.",
        data: {
          aadhaarCardImageUrl: cloudinaryResult.url,
          aadhaarNumberMasked:
            extractedData.aadhaarNumberMasked || "•••• •••• 0000",
          name: extractedData.name,
          dob: extractedData.dob,
          address: extractedData.address,
          rawExtractedSnippet: rawText.slice(0, 200),
        },
      });
    } catch (error) {
      console.error("[ExtractAadhaar Error]:", error);
      next(error);
    }
  }
);

/**
 * POST /api/worker/verify-face
 * Accepts Aadhaar image URL + selfie (base64 or file), runs face comparison,
 * persists Worker record, and — if auto_verified — syncs WorkerProfile.verificationStatus
 * so the worker appears immediately in the public directory (GET /api/workers).
 */
router.post(
  "/verify-face",
  verificationRateLimiter,
  uploadWorkerImages.fields([
    { name: "aadhaarCard", maxCount: 1 },
    { name: "selfie", maxCount: 1 },
  ]),
  async (req, res, next) => {
    try {
      const {
        phone,
        name,
        aadhaarNumberMasked,
        aadhaarCardImageUrl: bodyAadhaarUrl,
        selfieImageUrl: bodySelfieUrl,
        selfieBase64,
        dob,
        address,
      } = req.body;

      if (!phone || !phone.trim()) {
        return res
          .status(400)
          .json({ success: false, message: "Worker phone number is required." });
      }

      // ── Aadhaar image source ────────────────────────────────────────
      let aadhaarSource = bodyAadhaarUrl;
      let finalAadhaarUrl = bodyAadhaarUrl;
      if (req.files?.aadhaarCard?.[0]) {
        const buffer = req.files.aadhaarCard[0].buffer;
        aadhaarSource = buffer;
        const uploaded = await uploadImageBuffer(buffer, {
          folder: "gigconnect/aadhaar-cards",
          filename: `aadhaar-${Date.now()}`,
        });
        finalAadhaarUrl = uploaded.url;
      }
      if (!aadhaarSource) {
        return res.status(400).json({
          success: false,
          message: "Aadhaar card image is required (URL or file).",
        });
      }

      // ── Selfie image source ─────────────────────────────────────────
      let selfieSource = bodySelfieUrl || selfieBase64;
      let finalSelfieUrl = bodySelfieUrl;
      if (req.files?.selfie?.[0]) {
        const buffer = req.files.selfie[0].buffer;
        selfieSource = buffer;
        const uploaded = await uploadImageBuffer(buffer, {
          folder: "gigconnect/selfies",
          filename: `selfie-${Date.now()}`,
        });
        finalSelfieUrl = uploaded.url;
      } else if (selfieBase64 && !finalSelfieUrl) {
        // base64 data URI sent as JSON from react-webcam
        const base64Data = selfieBase64.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        const uploaded = await uploadImageBuffer(buffer, {
          folder: "gigconnect/selfies",
          filename: `selfie-${Date.now()}`,
        });
        finalSelfieUrl = uploaded.url;
      }
      if (!selfieSource) {
        return res.status(400).json({
          success: false,
          message: "Live selfie image is required (webcam capture or file).",
        });
      }

      // ── Face comparison ─────────────────────────────────────────────
      console.log(`[VerifyFace] Comparing faces for phone: ${phone}...`);
      const comparison = await compareFaces(aadhaarSource, selfieSource);
      const { faceMatchScore, verificationStatus, euclideanDistance } = comparison;

      // ── Sanitize inputs ─────────────────────────────────────────────
      const sanitizedPhone = sanitizeText(phone);
      const sanitizedName = sanitizeText(name) || "Worker";
      const sanitizedMaskedAadhaar =
        sanitizeText(aadhaarNumberMasked) || "•••• •••• 0000";
      const sanitizedDob = sanitizeText(dob);
      const sanitizedAddress = sanitizeText(address);

      // ── Persist Worker (biometric store) ───────────────────────────
      const worker = await Worker.findOneAndUpdate(
        { phone: sanitizedPhone },
        {
          name: sanitizedName,
          phone: sanitizedPhone,
          aadhaarNumberMasked: sanitizedMaskedAadhaar,
          aadhaarCardImageUrl: finalAadhaarUrl || "stored_url",
          selfieImageUrl: finalSelfieUrl || "",
          faceMatchScore,
          verificationStatus,
          verifiedAt: new Date(),
          extractedOcrData: {
            name: sanitizedName,
            dob: sanitizedDob,
            address: sanitizedAddress,
          },
        },
        { new: true, upsert: true, runValidators: true }
      );

      // ── Sync WorkerProfile if auto_verified ────────────────────────
      // Without this step, auto-verified workers never appear in GET /api/workers
      // because that endpoint filters WorkerProfile.verificationStatus === "verified".
      if (verificationStatus === "auto_verified") {
        try {
          const linkedUser = await User.findOne({ phone: sanitizedPhone });
          if (linkedUser) {
            await WorkerProfile.findOneAndUpdate(
              { userId: linkedUser._id },
              { verificationStatus: "verified" }
            );
            console.log(
              `[VerifyFace] WorkerProfile synced to verified for user ${linkedUser._id}`
            );
          }
        } catch (syncErr) {
          // Non-fatal — biometric result was saved; admin can manually verify if needed
          console.warn(
            "[VerifyFace] WorkerProfile sync failed:",
            syncErr.message
          );
        }
      }

      // ── Build status message ────────────────────────────────────────
      const statusMessages = {
        auto_verified:
          "Face match successful! Worker identity has been automatically verified.",
        pending:
          "Face match score requires manual verification. Submitted to admin review queue.",
        rejected:
          "Face match score below threshold. Verification rejected. Please retry with a clear photo.",
      };

      res.json({
        success: true,
        verificationStatus,
        faceMatchScore,
        euclideanDistance,
        message:
          statusMessages[verificationStatus] || "Verification complete.",
        data: worker,
      });
    } catch (error) {
      console.error("[VerifyFace Error]:", error);
      if (error.message?.includes("No face could be detected")) {
        return res.status(422).json({
          success: false,
          verificationStatus: "rejected",
          faceMatchScore: 0,
          message: error.message,
        });
      }
      next(error);
    }
  }
);

export default router;
