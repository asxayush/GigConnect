import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import path from "path";
import dns from "node:dns";
import { fileURLToPath } from "url";
import User from "../models/User.js";
import WorkerProfile from "../models/WorkerProfile.js";
import Worker from "../models/Worker.js";
import Booking from "../models/Booking.js";

// Ensure DNS works smoothly for Mongo SRV records
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  "mongodb://127.0.0.1:27017/gigconnect";

export const DEMO_CUSTOMER_DATA = {
  name: "Ayush Sharma",
  phone: "9876543210",
  email: "customer.demo@gigconnect.coop",
  role: "customer",
  gender: "Male",
  isDemo: true,
  location: {
    lat: 28.6139,
    lng: 77.2090,
    area: "Connaught Place, New Delhi",
  },
};

export const DEMO_PLUMBER_DATA = {
  name: "Rajesh Kumar",
  phone: "9811041022",
  email: "plumber.demo@gigconnect.coop",
  role: "worker",
  gender: "Male",
  category: "Plumber",
  trade: "Plumber",
  experienceYears: 8,
  trustBadge: "Sahakari Bhai Trust ✓",
  typicalArrivalTime: "15 mins",
  hourlyRate: 250,
  ratingAvg: 4.92,
  rating: 4.92,
  jobsCompleted: 318,
  sakhiVerified: false,
  isDemo: true,
  skills: ["Plumber", "Pipe Fitting", "Leakage Repair", "Sanitary Fitting"],
  photoUrl: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&auto=format&fit=crop&q=80",
  location: {
    lat: 28.6215,
    lng: 77.2167,
    area: "Connaught Place, New Delhi",
  },
};

export async function runDemoSeed() {
  console.log("=================================================");
  console.log("🌱 Starting Seed for Demo Customer & Demo Plumber");
  console.log("=================================================");

  const conn = await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  });
  console.log(`✓ Connected to DB: ${conn.connection.host}`);

  // Clean ONLY previous demo seed entries without touching real users
  console.log("Cleaning previous demo-flagged entries...");
  await User.deleteMany({
    $or: [
      { isDemo: true },
      { email: { $in: [DEMO_CUSTOMER_DATA.email, DEMO_PLUMBER_DATA.email] } },
      { phone: { $in: [DEMO_CUSTOMER_DATA.phone, DEMO_PLUMBER_DATA.phone] } },
    ],
  });

  const passwordHash = await bcrypt.hash("Demo@123", 10);

  // 1. Insert Demo Customer
  console.log("Creating Demo Customer...");
  const customerUser = await User.create({
    ...DEMO_CUSTOMER_DATA,
    passwordHash,
  });
  console.log(`✓ Demo Customer created: ${customerUser.name} (${customerUser._id})`);

  // 2. Insert Demo Plumber (User + WorkerProfile + Worker)
  console.log("Creating Demo Plumber User & Profile...");
  const plumberUser = await User.create({
    name: DEMO_PLUMBER_DATA.name,
    phone: DEMO_PLUMBER_DATA.phone,
    email: DEMO_PLUMBER_DATA.email,
    role: "worker",
    gender: DEMO_PLUMBER_DATA.gender,
    location: DEMO_PLUMBER_DATA.location,
    avatar: DEMO_PLUMBER_DATA.photoUrl,
    passwordHash,
    isDemo: true,
  });

  // WorkerProfile
  await WorkerProfile.deleteMany({ userId: plumberUser._id });
  const plumberProfile = await WorkerProfile.create({
    userId: plumberUser._id,
    category: DEMO_PLUMBER_DATA.category,
    skills: DEMO_PLUMBER_DATA.skills,
    photoUrl: DEMO_PLUMBER_DATA.photoUrl,
    ratingAvg: DEMO_PLUMBER_DATA.ratingAvg,
    ratingCount: 48,
    jobsCompleted: DEMO_PLUMBER_DATA.jobsCompleted,
    experienceYears: DEMO_PLUMBER_DATA.experienceYears,
    trustBadge: DEMO_PLUMBER_DATA.trustBadge,
    typicalArrivalTime: DEMO_PLUMBER_DATA.typicalArrivalTime,
    sakhiVerified: false,
    isSakhiVerified: false,
    verificationStatus: "verified",
    availability: true,
    isDemo: true,
    location: {
      type: "Point",
      coordinates: [DEMO_PLUMBER_DATA.location.lng, DEMO_PLUMBER_DATA.location.lat],
    },
  });
  console.log(`✓ Demo Plumber Profile created: ${plumberProfile._id}`);

  // Worker verification entry
  await Worker.deleteMany({ phone: DEMO_PLUMBER_DATA.phone });
  await Worker.create({
    name: DEMO_PLUMBER_DATA.name,
    phone: DEMO_PLUMBER_DATA.phone,
    aadhaarNumberMasked: "XXXX-XXXX-4102",
    aadhaarCardImageUrl: "/uploads/aadhaar/demo-plumber-aadhaar.jpg",
    selfieImageUrl: DEMO_PLUMBER_DATA.photoUrl,
    faceMatchScore: 99,
    trade: DEMO_PLUMBER_DATA.trade,
    hourlyRate: DEMO_PLUMBER_DATA.hourlyRate,
    rating: DEMO_PLUMBER_DATA.rating,
    verificationStatus: "verified",
    sakhiVerified: false,
    isDemo: true,
  });

  // Clean old demo bookings
  await Booking.deleteMany({ isDemo: true });

  console.log("\n=================================================");
  console.log("✅ Seed Complete! Demo Accounts Ready:");
  console.log("-------------------------------------------------");
  console.log("👤 Demo Customer:");
  console.log(`   Name:     ${customerUser.name}`);
  console.log(`   Phone:    ${customerUser.phone}`);
  console.log(`   Email:    ${customerUser.email}`);
  console.log(`   Password: Demo@123 (or OTP 123456)`);
  console.log(`   ID:       ${customerUser._id}`);
  console.log("-------------------------------------------------");
  console.log("🔧 Demo Plumber:");
  console.log(`   Name:         ${plumberUser.name}`);
  console.log(`   Category:     ${DEMO_PLUMBER_DATA.category}`);
  console.log(`   Experience:   ${DEMO_PLUMBER_DATA.experienceYears} years`);
  console.log(`   Trust Badge:  ${DEMO_PLUMBER_DATA.trustBadge}`);
  console.log(`   Arrival Time: ${DEMO_PLUMBER_DATA.typicalArrivalTime}`);
  console.log(`   Phone:        ${plumberUser.phone}`);
  console.log(`   Email:        ${plumberUser.email}`);
  console.log(`   Password:     Demo@123 (or OTP 123456)`);
  console.log(`   User ID:      ${plumberUser._id}`);
  console.log("=================================================");

  return {
    customer: customerUser,
    plumber: plumberUser,
    plumberProfile,
  };
}

// Allow direct execution
if (process.argv[1] && process.argv[1].endsWith("seedDemo.js")) {
  runDemoSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seed failed:", err);
      process.exit(1);
    });
}
