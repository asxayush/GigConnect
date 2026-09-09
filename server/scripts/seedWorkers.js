import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import path from "path";
import dns from "node:dns";
import { fileURLToPath } from "url";
import Worker from "../models/Worker.js";
import User from "../models/User.js";
import WorkerProfile from "../models/WorkerProfile.js";
import Booking from "../models/Booking.js";

// Ensure Node.js DNS resolver handles Atlas SRV records smoothly
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb://127.0.0.1:27017/gigconnect";

const DEMO_PASSWORD_PLAIN = "Demo@123";
const MOCK_GOVT_ID = "XXXX-XXXX-1234";

/**
 * EXACT 6 WORKERS SPECIFICATION FOR SIH PROTOTYPE
 */
const SIX_DEMO_WORKERS = [
  {
    name: "Ramesh Kumar",
    phone: "9811000001",
    email: "ramesh.kumar@gigconnect.coop",
    trade: "Electrician",
    gender: "Male",
    hourlyRate: 250,
    rating: 4.85,
    sakhiVerified: false,
    status: "verified", // Verified
    locationCoords: [77.2090, 28.6139], // [lng, lat]
    area: "Connaught Place, Central Delhi",
    skills: ["Electrician", "Switchboard Repair", "MCB Wiring", "Inverter Setup"],
  },
  {
    name: "Sunita Devi",
    phone: "9811000002",
    email: "sunita.devi@gigconnect.coop",
    trade: "Beautician",
    gender: "Female",
    hourlyRate: 400,
    rating: 4.96,
    sakhiVerified: true,
    status: "verified", // Verified
    locationCoords: [77.2588, 28.5355], // [lng, lat]
    area: "Saket & South Delhi",
    skills: ["Beautician", "Bridal Makeup", "Herbal Facial", "Skin Care"],
  },
  {
    name: "Priya Sharma",
    phone: "9811000003",
    email: "priya.sharma@gigconnect.coop",
    trade: "Plumber",
    gender: "Female",
    hourlyRate: 300,
    rating: 4.90,
    sakhiVerified: true,
    status: "verified", // Verified
    locationCoords: [77.1025, 28.7041], // [lng, lat]
    area: "Rohini Sector 14, North Delhi",
    skills: ["Plumber", "Pipe Fitting", "Leakage Repair", "Sanitary Fitting"],
  },
  {
    name: "Kavita Rao",
    phone: "9811000004",
    email: "kavita.rao@gigconnect.coop",
    trade: "Domestic Help",
    gender: "Female",
    hourlyRate: 200,
    rating: 4.80,
    sakhiVerified: true,
    status: "verified", // Verified
    locationCoords: [77.0266, 28.4595], // [lng, lat]
    area: "Cyber City, Gurugram",
    skills: ["Domestic Help", "Deep Cleaning", "Meal Prep", "Elder Care"],
  },
  {
    name: "Meenakshi",
    phone: "9811000005",
    email: "meenakshi@gigconnect.coop",
    trade: "Carpenter",
    gender: "Female",
    hourlyRate: 350,
    rating: 4.75,
    sakhiVerified: true,
    status: "verified", // Verified
    locationCoords: [77.2784, 28.6276], // [lng, lat]
    area: "Laxmi Nagar, East Delhi",
    skills: ["Carpenter", "Furniture Assembly", "Door Lock Repair", "Modular Fitting"],
  },
  {
    name: "Vikram Singh",
    phone: "9811000006",
    email: "vikram.singh@gigconnect.coop",
    trade: "Painter",
    gender: "Male",
    hourlyRate: 200,
    rating: 4.50,
    sakhiVerified: false,
    status: "unverified", // status: 'unverified'
    locationCoords: [77.3910, 28.5355], // [lng, lat]
    area: "Sector 62, Noida",
    skills: ["Painter", "Wall Distemper", "Waterproofing", "Texture Paint"],
  },
];

const DEMO_CUSTOMER = {
  name: "Ayush Sharma",
  phone: "9876543210",
  email: "customer.demo@gigconnect.in",
  role: "customer",
  gender: "Male",
  location: {
    lat: 28.6139,
    lng: 77.2090,
    area: "Connaught Place, New Delhi",
  },
};

async function seedDatabase() {
  console.log("=================================================");
  console.log("🚀 Starting GigConnect Database Reset & Seed Script");
  console.log(`📡 Connecting to MongoDB at: ${MONGO_URI.split("@").pop()}`);
  console.log("=================================================");

  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("✓ MongoDB Connected Successfully.");

    // 1. Wipe collections
    console.log("\n🧹 Wiping Worker collection & demo accounts...");
    await Worker.deleteMany({});
    
    // Clean demo users & worker profiles
    const demoPhones = [...SIX_DEMO_WORKERS.map((w) => w.phone), DEMO_CUSTOMER.phone];
    await User.deleteMany({ phone: { $in: demoPhones } });
    await WorkerProfile.deleteMany({});

    console.log("✓ Cleaned collections: Worker, User (demo), WorkerProfile.");

    // 2. Hash default presentation password: "Demo@123"
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD_PLAIN, salt);
    console.log(`✓ Generated bcrypt password hash for '${DEMO_PASSWORD_PLAIN}'`);

    // 3. Create Demo Customer Account
    const customerUser = await User.create({
      name: DEMO_CUSTOMER.name,
      phone: DEMO_CUSTOMER.phone,
      email: DEMO_CUSTOMER.email,
      passwordHash: passwordHash,
      role: "customer",
      gender: DEMO_CUSTOMER.gender,
      location: DEMO_CUSTOMER.location,
      avatar: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%231e293b'/><circle cx='50' cy='38' r='18' fill='%2394a3b8'/><path d='M20 86 c0-18 14-30 30-30 s30 12 30 30 Z' fill='%2394a3b8'/></svg>",
    });
    console.log(`\n👤 Created Demo Customer: ${customerUser.name} (${customerUser.phone} / ${DEMO_PASSWORD_PLAIN})`);

    // 4. Insert Exactly 6 Demo Workers
    console.log("\n👷 Seeding 6 Distinct GigConnect Demo Workers:");
    console.log("-------------------------------------------------");

    const createdWorkerDocs = [];

    for (const w of SIX_DEMO_WORKERS) {
      const isVerified = w.status === "verified";
      const verificationStatus = isVerified ? "verified" : "pending";

      // 4A. Create User Account (for Auth login)
      const userDoc = await User.create({
        name: w.name,
        phone: w.phone,
        email: w.email,
        passwordHash: passwordHash,
        role: "worker",
        gender: w.gender,
        location: {
          lat: w.locationCoords[1],
          lng: w.locationCoords[0],
          area: w.area,
        },
      });

      // 4B. Create Worker Compliance & Legal Schema Document
      const workerDoc = await Worker.create({
        name: w.name,
        phone: w.phone,
        aadhaarNumberMasked: MOCK_GOVT_ID,
        aadhaarCardImageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80",
        selfieImageUrl: "",
        faceMatchScore: isVerified ? 98 : 45,
        gender: w.gender,
        trade: w.trade,
        hourlyRate: w.hourlyRate,
        rating: w.rating,
        sakhiVerified: w.sakhiVerified,
        locationCoords: {
          lat: w.locationCoords[1],
          lng: w.locationCoords[0],
        },
        verificationStatus: verificationStatus,
        verifiedAt: isVerified ? new Date() : undefined,
        extractedOcrData: {
          name: w.name,
          dob: "01/01/1990",
          address: w.area,
        },
        socialSecurity: {
          hasLifeInsurance: isVerified,
          providerName: "PMJJBY / GigConnect Cooperative Fund",
          policyNumber: isVerified ? `POL-COOP-${Math.floor(100000 + Math.random() * 900000)}` : "",
          enrolledViaCooperative: isVerified,
        },
        legalConsent: {
          termsAccepted: true,
          privacyAccepted: true,
          consentTimestamp: new Date(),
          dpdpCompliant: true,
        },
      });

      // 4C. Create WorkerProfile Document (for geo queries & discovery)
      await WorkerProfile.create({
        userId: userDoc._id,
        skills: w.skills,
        verificationStatus: isVerified ? "verified" : "pending",
        sakhiVerified: w.sakhiVerified,
        isSakhiVerified: w.sakhiVerified,
        availability: true,
        ratingAvg: w.rating,
        ratingCount: isVerified ? 48 : 0,
        jobsCompleted: isVerified ? 124 : 0,
        location: {
          type: "Point",
          coordinates: w.locationCoords, // [lng, lat]
        },
        socialSecurity: {
          hasLifeInsurance: isVerified,
          providerName: "PMJJBY / GigConnect Cooperative Fund",
          policyNumber: isVerified ? `POL-COOP-${Math.floor(100000 + Math.random() * 900000)}` : "",
          enrolledViaCooperative: isVerified,
        },
        legalConsent: {
          termsAccepted: true,
          privacyAccepted: true,
          consentTimestamp: new Date(),
          dpdpCompliant: true,
        },
      });

      createdWorkerDocs.push({
        name: w.name,
        trade: w.trade,
        rate: `₹${w.hourlyRate}/hr`,
        sakhi: w.sakhiVerified ? "♀ Sakhi Verified" : "Standard",
        status: w.status.toUpperCase(),
        location: `[${w.locationCoords[0]}, ${w.locationCoords[1]}]`,
        phone: w.phone,
        password: DEMO_PASSWORD_PLAIN,
      });
    }

    console.table(createdWorkerDocs);

    console.log("=================================================");
    console.log("🎉 SUCCESS: All 6 Demo Workers & 1 Customer Seeded!");
    console.log(`🔑 Login Password for ALL accounts: '${DEMO_PASSWORD_PLAIN}'`);
    console.log("=================================================");
  } catch (error) {
    console.error("❌ Seed Script Error:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB.");
    process.exit(0);
  }
}

seedDatabase();
