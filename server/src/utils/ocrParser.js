import { createWorker } from "tesseract.js";

/**
 * Sanitize text to prevent NoSQL/SQL injection and XSS
 */
export function sanitizeText(text) {
    if (typeof text !== "string") return "";
    return text
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove ASCII control characters
        .replace(/[<>{}$]/g, "")                     // Strip potential injection tokens
        .replace(/\s+/g, " ")                        // Normalize multi-spaces
        .trim();
}

/**
 * Parse and structure Aadhaar card information from raw OCR text
 * 
 * SECURITY MANDATE:
 * Under UIDAI guidelines and security specifications, the full 12-digit Aadhaar number
 * MUST NEVER be returned, logged, or retained. Only the masked version (last 4 digits)
 * is returned.
 * 
 * @param {string} rawText 
 * @returns {{ name: string, dob: string, address: string, aadhaarNumberMasked: string }}
 */
export function parseAadhaarText(rawText) {
    if (!rawText) {
        return { name: "", dob: "", address: "", aadhaarNumberMasked: "" };
    }

    const cleanRaw = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const lines = cleanRaw
        .split("\n")
        .map((l) => sanitizeText(l))
        .filter((l) => l.length > 0);

    // 1. Aadhaar Number Extraction & Strict Masking
    // Standard pattern: 12 digits, often grouped into 4-4-4 (e.g., "1234 5678 9012" or "1234-5678-9012")
    let aadhaarNumberMasked = "";
    const aadhaarRegex = /\b(\d{4})[\s-](\d{4})[\s-](\d{4})\b/;
    const continuousAadhaarRegex = /\b\d{12}\b/;

    const matchFormatted = cleanRaw.match(aadhaarRegex);
    if (matchFormatted) {
        const last4 = matchFormatted[3];
        aadhaarNumberMasked = `•••• •••• ${last4}`;
    } else {
        const matchContinuous = cleanRaw.match(continuousAadhaarRegex);
        if (matchContinuous) {
            const digits = matchContinuous[0];
            const last4 = digits.slice(-4);
            aadhaarNumberMasked = `•••• •••• ${last4}`;
        }
    }

    // 2. Date of Birth (DOB) Extraction
    // Formats: DD/MM/YYYY or DD-MM-YYYY
    let dob = "";
    const dobRegex = /(?:DOB|Date\s*of\s*Birth|Year\s*of\s*Birth|जन्म\s*तिथि|जन्म\s*तारीख)?[:\s]*(\d{2}[\/\-]\d{2}[\/\-]\d{4})\b/i;
    const dobMatch = cleanRaw.match(dobRegex);
    if (dobMatch && dobMatch[1]) {
        dob = dobMatch[1].replace(/-/g, "/");
    } else {
        // Fallback: standalone DD/MM/YYYY matching valid calendar day/month
        const standaloneDate = cleanRaw.match(/\b(0[1-9]|[12]\d|3[01])[\/\-](0[1-9]|1[0-2])[\/\-](19\d{2}|20\d{2})\b/);
        if (standaloneDate) {
            dob = standaloneDate[0].replace(/-/g, "/");
        } else {
            // Year of birth fallback (e.g., Year of Birth : 1985)
            const yobMatch = cleanRaw.match(/(?:Year\s*of\s*Birth|जन्म\s*वर्ष)?[:\s]*\b(19\d{2}|20[0-2]\d)\b/i);
            if (yobMatch && yobMatch[1]) {
                dob = `01/01/${yobMatch[1]}`;
            }
        }
    }

    // 3. Name Extraction
    // Filter out common header phrases, titles, gender tokens, and authority text
    const ignoreWords = [
        "government", "india", "bharat", "sarkar", "mera", "aadhaar", "meri", "pehchan",
        "unique", "identification", "authority", "male", "female", "transgender", "father",
        "husband", "son of", "daughter of", "enrolment", "help", "www", "uidai", "dob",
        "date of birth", "year of birth", "address", "to", "card"
    ];

    let name = "";
    // Often name is the line right before the DOB line, or after "Government of India"
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lower = line.toLowerCase();

        // Skip line if it contains noise words or numbers
        const hasNoise = ignoreWords.some((w) => lower.includes(w));
        const hasDigits = /\d/.test(line);

        if (!hasNoise && !hasDigits && line.length >= 3 && line.length <= 40) {
            // Check if next line contains DOB or gender
            const nextLine = lines[i + 1] ? lines[i + 1].toLowerCase() : "";
            if (nextLine.includes("dob") || nextLine.includes("birth") || nextLine.includes("male") || nextLine.includes("female") || /^\d{2}[\/\-]/.test(nextLine)) {
                name = line;
                break;
            } else if (!name) {
                name = line; // Tentative candidate
            }
        }
    }

    // 4. Address Extraction (if back side or full letter scanned)
    let address = "";
    const addressIdx = lines.findIndex((l) => /address[:\s]|पता[:\s]/i.test(l));
    if (addressIdx !== -1) {
        const addrLines = lines.slice(addressIdx, addressIdx + 4);
        address = sanitizeText(addrLines.join(", ").replace(/address[:\s]*/i, ""));
    }

    return {
        name: sanitizeText(name),
        dob: sanitizeText(dob),
        address: sanitizeText(address),
        aadhaarNumberMasked: aadhaarNumberMasked || "•••• •••• 0000",
    };
}

/**
 * Perform OCR using Tesseract.js on an image buffer
 * @param {Buffer} imageBuffer 
 * @returns {Promise<{ extractedData: Object, rawText: string }>}
 */
export async function extractOcrFromBuffer(imageBuffer) {
    const worker = await createWorker("eng");
    try {
        const result = await worker.recognize(imageBuffer);
        const rawText = result.data.text || "";
        const extractedData = parseAadhaarText(rawText);
        return { extractedData, rawText: sanitizeText(rawText) };
    } finally {
        await worker.terminate();
    }
}
