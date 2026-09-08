import multer from "multer";

/**
 * Multer memory storage configuration for memory buffers
 * This allows processing images with Tesseract and face-api.js directly in RAM,
 * before streaming to Cloudinary, ensuring zero leftover temporary plaintext data on disk.
 */
const storage = multer.memoryStorage();

// Allowed MIME types: JPG and PNG only
const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg"];

const fileFilter = (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type. Only JPG and PNG image formats are allowed."), false);
    }
};

export const uploadWorkerImages = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // Max 5MB file size limit
    },
    fileFilter,
});
