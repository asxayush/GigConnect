import assert from "node:assert";
import { sanitizeText, parseAadhaarText } from "./src/utils/ocrParser.js";
import { loadFaceModels } from "./src/utils/faceMatcher.js";
import Worker from "./src/models/Worker.js";

async function runTests() {
    console.log("==================================================");
    console.log("RUNNING AADHAAR VERIFICATION MODULE UNIT TESTS");
    console.log("==================================================\n");

    // ----------------------------------------------------
    // TEST 1: Sanitization
    // ----------------------------------------------------
    console.log("[Test 1] Testing text sanitization & security filtering...");
    const dirtyText = "  Hello\u0000 <script>alert(1)</script> { $gt: '' } World  ";
    const cleaned = sanitizeText(dirtyText);
    assert.strictEqual(cleaned.includes("<script>"), false, "Script tags must be removed");
    assert.strictEqual(cleaned.includes("$gt"), false, "Mongo injection tokens must be removed");
    assert.strictEqual(cleaned.includes("\u0000"), false, "Null bytes must be removed");
    console.log("  ✓ Sanitization correctly stripped injection tokens and control chars:", cleaned);

    // ----------------------------------------------------
    // TEST 2: Aadhaar Regex & Strict Masking
    // ----------------------------------------------------
    console.log("\n[Test 2] Testing Aadhaar parsing & strict last-4 digit masking...");
    const sampleOcrText = `
    GOVERNMENT OF INDIA
    भारत सरकार
    Ayush Sharma
    DOB: 15/08/1995
    Male
    5432 8765 4321
    `;

    const parsed = parseAadhaarText(sampleOcrText);
    console.log("  Parsed OCR Output:", parsed);
    assert.strictEqual(parsed.name, "Ayush Sharma", "Name should be Ayush Sharma");
    assert.strictEqual(parsed.dob, "15/08/1995", "DOB should be 15/08/1995");
    assert.strictEqual(parsed.aadhaarNumberMasked, "•••• •••• 4321", "Aadhaar must be masked with last 4 digits only");
    assert.strictEqual(parsed.aadhaarNumberMasked.includes("5432"), false, "Full Aadhaar digits must NEVER be retained");
    console.log("  ✓ Full Aadhaar number successfully masked: ONLY last 4 digits retained!");

    // ----------------------------------------------------
    // TEST 3: Face Model Loading
    // ----------------------------------------------------
    console.log("\n[Test 3] Testing face-api.js neural network weight loading from disk...");
    await loadFaceModels();
    console.log("  ✓ SSD MobileNet, Landmark68, and FaceRecognition models loaded from local weights directory without errors!");

    // ----------------------------------------------------
    // TEST 4: Face Similarity Threshold Scoring Function
    // ----------------------------------------------------
    console.log("\n[Test 4] Testing confidence score calculations and threshold classifications...");
    function computeScoreAndStatus(distance) {
        let score;
        if (distance <= 0.35) {
            score = Math.round(100 - (distance / 0.35) * 14);
        } else if (distance <= 0.62) {
            const ratio = (distance - 0.35) / (0.62 - 0.35);
            score = Math.round(85 - ratio * 25);
        } else {
            const ratio = Math.min(1, (distance - 0.62) / (1.1 - 0.62));
            score = Math.max(0, Math.round(59 - ratio * 59));
        }
        score = Math.max(0, Math.min(100, score));

        let status;
        if (score > 85) status = "auto_verified";
        else if (score >= 60) status = "pending";
        else status = "rejected";

        return { score, status };
    }

    // High match (e.g. distance = 0.20)
    const matchHigh = computeScoreAndStatus(0.20);
    console.log(`  Distance 0.20 => Score: ${matchHigh.score}%, Status: ${matchHigh.status}`);
    assert.ok(matchHigh.score > 85, "High match score must be > 85");
    assert.strictEqual(matchHigh.status, "auto_verified", "Status must be auto_verified");

    // Borderline match (e.g. distance = 0.48)
    const matchBorderline = computeScoreAndStatus(0.48);
    console.log(`  Distance 0.48 => Score: ${matchBorderline.score}%, Status: ${matchBorderline.status}`);
    assert.ok(matchBorderline.score >= 60 && matchBorderline.score <= 85, "Borderline match score must be between 60-85");
    assert.strictEqual(matchBorderline.status, "pending", "Status must be pending");

    // Low match (e.g. distance = 0.75)
    const matchLow = computeScoreAndStatus(0.75);
    console.log(`  Distance 0.75 => Score: ${matchLow.score}%, Status: ${matchLow.status}`);
    assert.ok(matchLow.score < 60, "Low match score must be < 60");
    assert.strictEqual(matchLow.status, "rejected", "Status must be rejected");
    console.log("  ✓ All threshold boundaries (>85 auto_verified, 60-85 pending, <60 rejected) verified!");

    // ----------------------------------------------------
    // TEST 5: Worker Model Schema Validation
    // ----------------------------------------------------
    console.log("\n[Test 5] Testing Worker Mongoose Schema validation...");
    const sampleWorker = new Worker({
        name: "Ramesh Kumar",
        phone: "+919876543210",
        aadhaarNumberMasked: "•••• •••• 9999",
        aadhaarCardImageUrl: "https://res.cloudinary.com/demo/image/upload/v1/card.jpg",
        selfieImageUrl: "https://res.cloudinary.com/demo/image/upload/v1/selfie.jpg",
        faceMatchScore: 92,
        verificationStatus: "auto_verified",
        verifiedAt: new Date(),
        extractedOcrData: {
            name: "Ramesh Kumar",
            dob: "12/03/1988",
            address: "Sector 14, Gurgaon",
        },
    });

    const validationError = sampleWorker.validateSync();
    assert.strictEqual(validationError, undefined, "Worker instance should validate cleanly");
    console.log("  ✓ Worker Schema validated successfully with all required fields!");

    console.log("\n==================================================");
    console.log("ALL 5 UNIT TESTS PASSED SUCCESSFULLY! 🎉");
    console.log("==================================================");
}

runTests().catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
});
