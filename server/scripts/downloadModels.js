import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const weightsDir = path.resolve(__dirname, "../weights");

if (!fs.existsSync(weightsDir)) {
    fs.mkdirSync(weightsDir, { recursive: true });
}

const BASE_URL = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights";

const files = [
    "ssd_mobilenetv1_model-weights_manifest.json",
    "ssd_mobilenetv1_model-shard1",
    "ssd_mobilenetv1_model-shard2",
    "face_landmark_68_model-weights_manifest.json",
    "face_landmark_68_model-shard1",
    "face_recognition_model-weights_manifest.json",
    "face_recognition_model-shard1",
    "face_recognition_model-shard2",
];

async function downloadFile(filename) {
    const filePath = path.join(weightsDir, filename);
    if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
        console.log(`[Weights] Already exists: ${filename}`);
        return;
    }

    const url = `${BASE_URL}/${filename}`;
    console.log(`[Weights] Downloading: ${filename}...`);
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to download ${filename}: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
    console.log(`[Weights] Saved: ${filename} (${arrayBuffer.byteLength} bytes)`);
}

async function main() {
    for (const file of files) {
        await downloadFile(file);
    }
    console.log("[Weights] All face-api.js model weights successfully downloaded.");
}

main().catch((err) => {
    console.error("[Weights] Error downloading models:", err);
    process.exit(1);
});
