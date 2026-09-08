import * as faceapi from "face-api.js";
import { Canvas, Image, ImageData, loadImage } from "@napi-rs/canvas";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const weightsDir = path.resolve(__dirname, "../../weights");

// Monkey patch face-api.js environment with @napi-rs/canvas
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

let modelsLoaded = false;
let modelLoadingPromise = null;

/**
 * Load face-api.js pretrained neural network models from disk.
 * Models used:
 * - SSD MobileNet V1: Robust deep learning face detector
 * - Face Landmark 68: Maps 68 facial features for alignment
 * - Face Recognition: Deep ResNet-34 producing 128-dimensional biometric embeddings
 */
export async function loadFaceModels() {
    if (modelsLoaded) return;
    if (modelLoadingPromise) return modelLoadingPromise;

    modelLoadingPromise = (async () => {
        console.log("[FaceAPI] Loading SSD MobileNet, Landmark68, and Recognition models from disk...");
        await faceapi.nets.ssdMobilenetv1.loadFromDisk(weightsDir);
        await faceapi.nets.faceLandmark68Net.loadFromDisk(weightsDir);
        await faceapi.nets.faceRecognitionNet.loadFromDisk(weightsDir);
        modelsLoaded = true;
        console.log("[FaceAPI] Pretrained face models successfully initialized.");
    })();

    return modelLoadingPromise;
}

/**
 * Helper to load an image source into a canvas-compatible Image object
 * Supports:
 * - Direct Buffer
 * - Data URI (base64 string)
 * - Local filesystem path
 * - Remote HTTP/HTTPS URL
 */
export async function resolveImage(input) {
    if (!input) throw new Error("Image input is required");

    if (Buffer.isBuffer(input)) {
        return loadImage(input);
    }

    if (typeof input === "string") {
        // Base64 data URI
        if (input.startsWith("data:image")) {
            const base64Data = input.replace(/^data:image\/\w+;base64,/, "");
            const buffer = Buffer.from(base64Data, "base64");
            return loadImage(buffer);
        }

        // Relative local path (e.g. /uploads/...)
        if (input.startsWith("/uploads")) {
            const localPath = path.resolve(__dirname, "../../", input.slice(1));
            if (fs.existsSync(localPath)) {
                const buffer = fs.readFileSync(localPath);
                return loadImage(buffer);
            }
        }

        // Remote URL (Cloudinary or CDN)
        if (input.startsWith("http://") || input.startsWith("https://")) {
            const response = await fetch(input);
            if (!response.ok) {
                throw new Error(`Failed to fetch image from URL (${response.status} ${response.statusText}): ${input}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            return loadImage(Buffer.from(arrayBuffer));
        }

        // Local file path
        if (fs.existsSync(input)) {
            const buffer = fs.readFileSync(input);
            return loadImage(buffer);
        }
    }

    throw new Error("Unsupported image input format. Must be a Buffer, Base64 data URI, local path, or HTTP URL.");
}

/**
 * Compare two face images and calculate similarity score (0 to 100)
 * 
 * ============================================================================
 * FACE-MATCH CONFIDENCE THRESHOLD LOGIC:
 * 
 * 1. Deep Feature Descriptors:
 *    The faceRecognitionNet generates a 128-dimensional normalized unit vector
 *    for each detected and aligned face.
 * 
 * 2. Euclidean Distance (d):
 *    Calculated as d = ||descriptor_1 - descriptor_2||_2.
 *    - d = 0.00: Identical face embedding
 *    - d <= 0.35: Strong biometric match (same person under varying lighting/expression)
 *    - d = 0.60: Standard dlib/face-api decision threshold for 99% accuracy
 *    - d >= 0.70: Distinct identities
 * 
 * 3. Confidence Mapping (0 to 100):
 *    - d <= 0.35  -> Score 86 to 100%  -> Auto-verified
 *    - 0.35 < d <= 0.62 -> Score 60 to 85%   -> Pending (queued for admin review)
 *    - d > 0.62   -> Score 0 to 59%    -> Rejected
 * ============================================================================
 * 
 * @param {Buffer|string} aadhaarImageInput - Aadhaar card photo or buffer
 * @param {Buffer|string} selfieImageInput - Live selfie photo or buffer
 * @returns {Promise<{ faceMatchScore: number, verificationStatus: string, euclideanDistance: number }>}
 */
export async function compareFaces(aadhaarImageInput, selfieImageInput) {
    await loadFaceModels();

    // 1. Resolve and load images
    const [aadhaarImg, selfieImg] = await Promise.all([
        resolveImage(aadhaarImageInput),
        resolveImage(selfieImageInput),
    ]);

    // 2. Detect single face and extract 128-d descriptor from Aadhaar card
    // Lower threshold minConfidence: 0.4 helps detect older printed photos on ID cards
    const aadhaarDetection = await faceapi
        .detectSingleFace(aadhaarImg, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

    if (!aadhaarDetection) {
        throw new Error("No face could be detected in the Aadhaar card image. Please ensure the card photo is clear, upright, and unblurred.");
    }

    // 3. Detect single face and extract 128-d descriptor from live selfie
    const selfieDetection = await faceapi
        .detectSingleFace(selfieImg, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

    if (!selfieDetection) {
        throw new Error("No face could be detected in the selfie. Please look directly into the camera in a well-lit environment.");
    }

    // 4. Calculate Euclidean distance between the two 128-dimensional vectors
    const distance = faceapi.euclideanDistance(aadhaarDetection.descriptor, selfieDetection.descriptor);

    // 5. Convert Euclidean distance into a 0-100 similarity confidence score
    let score;
    if (distance <= 0.35) {
        // High confidence match: maps d in [0, 0.35] to [86, 100]
        score = Math.round(100 - (distance / 0.35) * 14);
    } else if (distance <= 0.62) {
        // Moderate confidence / borderline: maps d in [0.35, 0.62] to [60, 85]
        const ratio = (distance - 0.35) / (0.62 - 0.35);
        score = Math.round(85 - ratio * 25);
    } else {
        // Discrepancy / poor match: maps d in [0.62, 1.1] to [0, 59]
        const ratio = Math.min(1, (distance - 0.62) / (1.1 - 0.62));
        score = Math.max(0, Math.round(59 - ratio * 59));
    }

    // Ensure strict bounding between 0 and 100
    score = Math.max(0, Math.min(100, score));

    // 6. Verification Status assignment according to project requirements:
    // - If score > 85: 'auto_verified'
    // - If score between 60-85: 'pending' (needs manual review)
    // - If score < 60: 'rejected'
    let verificationStatus;
    if (score > 85) {
        verificationStatus = "auto_verified";
    } else if (score >= 60) {
        verificationStatus = "pending";
    } else {
        verificationStatus = "rejected";
    }

    return {
        faceMatchScore: score,
        verificationStatus,
        euclideanDistance: Number(distance.toFixed(4)),
    };
}
