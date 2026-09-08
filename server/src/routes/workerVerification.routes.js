import { Router } from "express";
import rateLimit from "express-rate-limit";
import { uploadWorkerImages } from "../middlewares/upload.js";
import { uploadImageBuffer } from "../utils/cloudinary.js";
import { extractOcrFromBuffer, sanitizeText } from "../utils/ocrParser.js";
import { compareFaces } from "../utils/faceMatcher.js";
import Worker from "../models/Worker.js";

const router = Router();

/**
 * RATE LIMITER (Security Requirement):
 * Max 5 attempts per phone number (or client IP fallback) per 24 hours.
 * Uses express-rate-limit to protect against brute-force OCR abuse and API flooding.
 */
const verificationRateLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 5, // Limit each phone number / IP to 5 attempts per window
    validate: { keyGeneratorIpFallback: false },
    keyGenerator: (req) => {
        // Prioritize phone number from body, query or fallback to IP
        const phone = req.body?.phone || req.query?.phone;
        if (phone && typeof phone === "string" && phone.trim().length >= 10) {
            return `rate_phone_${phone.trim()}`;
        }
        return `rate_ip_${req.ip || "unknown"}`;
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: "Daily verification limit reached (maximum 5 attempts per day). Please try again after 24 hours or contact federation support.",
        });
    },
});

/**
 * POST /api/worker/extract-aadhaar
 * 
 * 1. Accepts Aadhaar card image via multer
 * 2. Uploads image to Cloudinary (secure URL returned)
 * 3. Runs Tesseract.js OCR to extract text
 * 4. Parses Name, DOB, and masked Aadhaar number (strictly last 4 digits)
 * 5. Sanitizes all data and returns JSON response
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

            // 1. Upload to Cloudinary concurrently with OCR extraction
            const [cloudinaryResult, ocrResult] = await Promise.all([
                uploadImageBuffer(imageBuffer, {
                    folder: "gigconnect/aadhaar-cards",
                    filename: `aadhaar-${Date.now()}`,
                }),
                extractOcrFromBuffer(imageBuffer),
            ]);

            const { extractedData, rawText } = ocrResult;

            // Security: Ensure full number was not leaked
            const maskedNumber = extractedData.aadhaarNumberMasked || "•••• •••• 0000";

            res.json({
                success: true,
                message: "Aadhaar card processed and text extracted successfully.",
                data: {
                    aadhaarCardImageUrl: cloudinaryResult.url,
                    aadhaarNumberMasked: maskedNumber,
                    name: extractedData.name,
                    dob: extractedData.dob,
                    address: extractedData.address,
                    rawExtractedSnippet: rawText.slice(0, 200), // sanitized preview
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
 * 
 * 1. Accepts Aadhaar card image URL and Selfie image URL (or base64 / upload)
 * 2. Compares faces using face-api.js SSD MobileNet + FaceRecognitionNet
 * 3. Calculates Euclidean distance and 0-100 similarity confidence score
 * 4. Evaluates thresholds:
 *    - Score > 85: 'auto_verified'
 *    - Score 60-85: 'pending' (needs admin review)
 *    - Score < 60: 'rejected'
 * 5. Persists Worker record in MongoDB
 * 6. Returns verification result to frontend
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
                return res.status(400).json({ success: false, message: "Worker phone number is required." });
            }

            // 1. Determine Aadhaar image source (uploaded file buffer or URL)
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

            // 2. Determine Selfie image source (uploaded file buffer, base64 data URI, or URL)
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
                // If sent as base64 string from react-webcam, convert to buffer and upload to Cloudinary
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

            // 3. Perform Biometric Face Match
            console.log(`[VerifyFace] Comparing faces for phone: ${phone}...`);
            const comparison = await compareFaces(aadhaarSource, selfieSource);
            const { faceMatchScore, verificationStatus, euclideanDistance } = comparison;

            // 4. Sanitize inputs before saving to DB
            const sanitizedName = sanitizeText(name) || "Worker";
            const sanitizedPhone = sanitizeText(phone);
            const sanitizedMaskedAadhaar = sanitizeText(aadhaarNumberMasked) || "•••• •••• 0000";
            const sanitizedDob = sanitizeText(dob);
            const sanitizedAddress = sanitizeText(address);

            // 5. Update or Create Worker in MongoDB
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

            // 6. Return response to frontend
            let statusMessage = "";
            if (verificationStatus === "auto_verified") {
                statusMessage = "Face match successful! Worker identity has been automatically verified.";
            } else if (verificationStatus === "pending") {
                statusMessage = "Face match score requires manual verification. Submitted to admin review queue.";
            } else {
                statusMessage = "Face match score below threshold. Verification rejected. Please retry with a clear photo.";
            }

            res.json({
                success: true,
                verificationStatus,
                faceMatchScore,
                euclideanDistance,
                message: statusMessage,
                data: worker,
            });
        } catch (error) {
            console.error("[VerifyFace Error]:", error);
            // Handle face detection specific error gracefully
            if (error.message && error.message.includes("No face could be detected")) {
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
