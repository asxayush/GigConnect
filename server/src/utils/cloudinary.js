import { v2 as cloudinary } from "cloudinary";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fallbackDir = path.resolve(__dirname, "../../uploads/cloudinary-fallback");

// Ensure fallback directory exists if Cloudinary credentials are absent
if (!fs.existsSync(fallbackDir)) {
    fs.mkdirSync(fallbackDir, { recursive: true });
}

// Configure Cloudinary with environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

const isCloudinaryConfigured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

/**
 * Upload an image buffer to Cloudinary (or local fallback in dev if credentials not set)
 * @param {Buffer} buffer - Image buffer
 * @param {Object} options - Upload options (folder, filename)
 * @returns {Promise<{ url: string, public_id?: string }>}
 */
export const uploadImageBuffer = (buffer, options = {}) => {
    return new Promise((resolve, reject) => {
        if (!buffer || !Buffer.isBuffer(buffer)) {
            return reject(new Error("Valid image buffer is required for upload"));
        }

        const folder = options.folder || "gigconnect/workers";
        const filename = options.filename || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        if (isCloudinaryConfigured) {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder,
                    public_id: filename,
                    resource_type: "image",
                    format: options.format || "jpg",
                    overwrite: true,
                    // Secure / signed URL settings
                    secure: true,
                    transformation: [{ quality: "auto:good" }, { fetch_format: "auto" }],
                },
                (error, result) => {
                    if (error) {
                        console.error("[Cloudinary] Upload failed, falling back to local storage:", error.message);
                        return fallbackLocalSave(buffer, filename, resolve, reject);
                    }
                    resolve({
                        url: result.secure_url,
                        public_id: result.public_id,
                    });
                }
            );

            uploadStream.end(buffer);
        } else {
            // Graceful dev fallback if Cloudinary credentials are yet to be filled
            console.warn("[Cloudinary] Credentials not configured; saving to local static storage.");
            fallbackLocalSave(buffer, filename, resolve, reject);
        }
    });
};

function fallbackLocalSave(buffer, filename, resolve, reject) {
    try {
        const safeName = `${filename.replace(/[^a-zA-Z0-9_-]/g, "_")}.jpg`;
        const filePath = path.join(fallbackDir, safeName);
        fs.writeFileSync(filePath, buffer);
        resolve({
            url: `/uploads/cloudinary-fallback/${safeName}`,
            public_id: safeName,
        });
    } catch (err) {
        reject(err);
    }
}

export default cloudinary;
