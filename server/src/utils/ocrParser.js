import { createWorker } from "tesseract.js";

/**
 * Sanitize text to prevent NoSQL/SQL injection and XSS.
 */
export function sanitizeText(text) {
  if (typeof text !== "string") return "";
  return text
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove ASCII control characters
    .replace(/[<>{}$]/g, "") // Strip potential injection tokens
    .replace(/\s+/g, " ") // Normalize multi-spaces
    .trim();
}

/**
 * Parse and structure Aadhaar card information from raw OCR text.
 *
 * SECURITY MANDATE: Full 12-digit Aadhaar numbers are NEVER returned.
 * Only the masked version (last 4 digits) is returned.
 */
export function parseAadhaarText(rawText) {
  if (!rawText) return { name: "", dob: "", address: "", aadhaarNumberMasked: "" };

  const cleanRaw = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = cleanRaw
    .split("\n")
    .map((l) => sanitizeText(l))
    .filter((l) => l.length > 0);

  // 1. Aadhaar Number — strict last-4 masking
  let aadhaarNumberMasked = "";
  const aadhaarRegex = /\b(\d{4})[\s-](\d{4})[\s-](\d{4})\b/;
  const continuousAadhaarRegex = /\b\d{12}\b/;
  const matchFormatted = cleanRaw.match(aadhaarRegex);
  if (matchFormatted) {
    aadhaarNumberMasked = `•••• •••• ${matchFormatted[3]}`;
  } else {
    const matchContinuous = cleanRaw.match(continuousAadhaarRegex);
    if (matchContinuous) {
      aadhaarNumberMasked = `•••• •••• ${matchContinuous[0].slice(-4)}`;
    }
  }

  // 2. Date of Birth
  let dob = "";
  const dobRegex =
    /(?:DOB|Date\s*of\s*Birth|Year\s*of\s*Birth|जन्म\s*तिथि|जन्म\s*तारीख)?[:\s]*(\d{2}[\/\-]\d{2}[\/\-]\d{4})\b/i;
  const dobMatch = cleanRaw.match(dobRegex);
  if (dobMatch?.[1]) {
    dob = dobMatch[1].replace(/-/g, "/");
  } else {
    const standaloneDate = cleanRaw.match(
      /\b(0[1-9]|[12]\d|3[01])[\/\-](0[1-9]|1[0-2])[\/\-](19\d{2}|20\d{2})\b/
    );
    if (standaloneDate) {
      dob = standaloneDate[0].replace(/-/g, "/");
    } else {
      const yobMatch = cleanRaw.match(
        /(?:Year\s*of\s*Birth|जन्म\s*वर्ष)?[:\s]*\b(19\d{2}|20[0-2]\d)\b/i
      );
      if (yobMatch?.[1]) dob = `01/01/${yobMatch[1]}`;
    }
  }

  // 3. Name extraction
  const ignoreWords = [
    "government",
    "india",
    "bharat",
    "sarkar",
    "mera",
    "aadhaar",
    "meri",
    "pehchan",
    "unique",
    "identification",
    "authority",
    "male",
    "female",
    "transgender",
    "father",
    "husband",
    "son of",
    "daughter of",
    "enrolment",
    "help",
    "www",
    "uidai",
    "dob",
    "date of birth",
    "year of birth",
    "address",
    "to",
    "card",
  ];
  let name = "";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    const hasNoise = ignoreWords.some((w) => lower.includes(w));
    const hasDigits = /\d/.test(line);
    if (!hasNoise && !hasDigits && line.length >= 3 && line.length <= 40) {
      const nextLine = lines[i + 1] ? lines[i + 1].toLowerCase() : "";
      if (
        nextLine.includes("dob") ||
        nextLine.includes("birth") ||
        nextLine.includes("male") ||
        nextLine.includes("female") ||
        /^\d{2}[\/\-]/.test(nextLine)
      ) {
        name = line;
        break;
      } else if (!name) {
        name = line;
      }
    }
  }

  // 4. Address
  let address = "";
  const addressIdx = lines.findIndex((l) => /address[:\s]|पता[:\s]/i.test(l));
  if (addressIdx !== -1) {
    const addrLines = lines.slice(addressIdx, addressIdx + 4);
    address = sanitizeText(
      addrLines.join(", ").replace(/address[:\s]*/i, "")
    );
  }

  return {
    name: sanitizeText(name),
    dob: sanitizeText(dob),
    address: sanitizeText(address),
    aadhaarNumberMasked: aadhaarNumberMasked || "•••• •••• 0000",
  };
}

// ── Singleton Tesseract worker ──────────────────────────────────────────────
// Creating a new worker per request costs ~2-5 s of cold-start time.
// We reuse one worker for the lifetime of the server process.
// A simple boolean mutex serializes concurrent recognize() calls so they
// never corrupt the shared worker state.

let _tesseractWorker = null;
let _workerReady = false;
let _initPromise = null;
let _busy = false;

async function getTesseractWorker() {
  if (_workerReady && _tesseractWorker) return _tesseractWorker;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    console.log("[OCR] Initializing Tesseract singleton worker...");
    _tesseractWorker = await createWorker("eng");
    _workerReady = true;
    console.log("[OCR] Tesseract worker ready.");
    return _tesseractWorker;
  })();

  return _initPromise;
}

/**
 * Perform OCR using a singleton Tesseract.js worker.
 * Concurrent calls are serialized via a busy-wait to avoid worker corruption.
 *
 * @param {Buffer} imageBuffer
 * @returns {Promise<{ extractedData: object, rawText: string }>}
 */
export async function extractOcrFromBuffer(imageBuffer) {
  const worker = await getTesseractWorker();

  // Serialize: wait if another request is already using the worker
  while (_busy) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  _busy = true;
  try {
    const result = await worker.recognize(imageBuffer);
    const rawText = result.data.text || "";
    const extractedData = parseAadhaarText(rawText);
    return { extractedData, rawText: sanitizeText(rawText) };
  } finally {
    _busy = false;
  }
}
