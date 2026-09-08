import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Worker from "../models/Worker.js";
import WorkerProfile from "../models/WorkerProfile.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

export const DEMO_WORKERS = [
  {
    name: "Ramesh Kumar",
    phone: "9811012345",
    trade: "Electrician",
    gender: "Male",
    rating: 4.8,
    hourlyRate: 250,
    sakhiVerified: false,
    experience: "10 Years",
    area: "Connaught Place & Central Delhi",
    lat: 28.6139,
    lng: 77.2090,
    aadhaarNumberMasked: "XXXX - XXXX - 1102",
    aadhaarCardImageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80",
    photoUrl: "/illustrations/electrician.jpg",
    bio: "Certified Delhi Cooperative Electrical Guild Member #DEL-ELEC-4102. Specializes in home MCB, wiring, and appliance setups.",
  },
  {
    name: "Sunita Devi",
    phone: "9811023456",
    trade: "Beautician & Personal Care",
    gender: "Female",
    rating: 4.9,
    hourlyRate: 400,
    sakhiVerified: true,
    experience: "8 Years",
    area: "South Delhi & Noida Sector 62",
    lat: 28.5355,
    lng: 77.3910,
    aadhaarNumberMasked: "XXXX - XXXX - 2291",
    aadhaarCardImageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80",
    photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=250&auto=format&fit=crop&q=80",
    bio: "Cooperative Beauty Guild Lead. Background verified with ♀ Sakhi Trust certification for safe in-home services.",
  },
  {
    name: "Ali Raza",
    phone: "9811034567",
    trade: "Carpenter",
    gender: "Male",
    rating: 4.5,
    hourlyRate: 350,
    sakhiVerified: false,
    experience: "12 Years",
    area: "Gurugram Cyber City & DLF Phase 2",
    lat: 28.4595,
    lng: 77.0266,
    aadhaarNumberMasked: "XXXX - XXXX - 3384",
    aadhaarCardImageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80",
    bio: "Woodcraft specialist in modular kitchens, custom wardrobes, door repairs, and lock replacement.",
  },
  {
    name: "Priya Sharma",
    phone: "9811045678",
    trade: "Appliance Repair & HVAC",
    gender: "Female",
    rating: 4.7,
    hourlyRate: 300,
    sakhiVerified: true,
    experience: "7 Years",
    area: "Rohini & North Delhi",
    lat: 28.7041,
    lng: 77.1025,
    aadhaarNumberMasked: "XXXX - XXXX - 4475",
    aadhaarCardImageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80",
    photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=250&auto=format&fit=crop&q=80",
    bio: "ITI Certified Appliance & AC Maintenance technician with ♀ Sakhi Trust verified security rating.",
  },
  {
    name: "Vikram Singh",
    phone: "9811056789",
    trade: "Plumber",
    gender: "Male",
    rating: 4.6,
    hourlyRate: 200,
    sakhiVerified: false,
    experience: "9 Years",
    area: "Noida Sector 18 & Indirapuram",
    lat: 28.5700,
    lng: 77.3200,
    aadhaarNumberMasked: "XXXX - XXXX - 5566",
    aadhaarCardImageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80",
    photoUrl: "/illustrations/plumber.jpg",
    bio: "Master Plumber #DEL-PLUMB-2910 with experience in CPVC piping, kitchen drain unclogging, and overhead tank pumps.",
  },
];

export const seedDatabase = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await connectDB();
    }

    console.log("[Seed] Seeding 5 Delhi NCR cooperative demo workers...");

    for (const data of DEMO_WORKERS) {
      // 1. Upsert User
      let user = await User.findOne({ phone: data.phone });
      if (!user) {
        user = await User.create({
          name: data.name,
          phone: data.phone,
          email: `${data.name.toLowerCase().replace(/\s+/g, "")}@gigconnect.in`,
          role: "worker",
          gender: data.gender,
          avatar: data.photoUrl,
          location: {
            lat: data.lat,
            lng: data.lng,
            area: data.area,
          },
        });
      } else {
        user.name = data.name;
        user.gender = data.gender;
        user.avatar = data.photoUrl;
        user.location = { lat: data.lat, lng: data.lng, area: data.area };
        await user.save();
      }

      // 2. Upsert Worker verification record
      let workerRecord = await Worker.findOne({ phone: data.phone });
      if (!workerRecord) {
        workerRecord = await Worker.create({
          name: data.name,
          phone: data.phone,
          gender: data.gender,
          trade: data.trade,
          hourlyRate: data.hourlyRate,
          rating: data.rating,
          sakhiVerified: data.sakhiVerified,
          aadhaarNumberMasked: data.aadhaarNumberMasked,
          aadhaarCardImageUrl: data.aadhaarCardImageUrl,
          selfieImageUrl: data.photoUrl,
          faceMatchScore: 98.4,
          verificationStatus: "verified",
          verifiedAt: new Date(),
          locationCoords: { lat: data.lat, lng: data.lng },
          extractedOcrData: {
            name: data.name,
            address: `${data.area}, Delhi NCR`,
          },
        });
      } else {
        workerRecord.gender = data.gender;
        workerRecord.trade = data.trade;
        workerRecord.hourlyRate = data.hourlyRate;
        workerRecord.rating = data.rating;
        workerRecord.sakhiVerified = data.sakhiVerified;
        workerRecord.locationCoords = { lat: data.lat, lng: data.lng };
        workerRecord.verificationStatus = "verified";
        await workerRecord.save();
      }

      // 3. Upsert WorkerProfile
      let profile = await WorkerProfile.findOne({ userId: user._id });
      if (!profile) {
        await WorkerProfile.create({
          userId: user._id,
          skills: [data.trade],
          certifications: ["UIDAI e-KYC Verified", "Co-op Federation Guild #204"],
          photoUrl: data.photoUrl,
          verificationStatus: "verified",
          availability: true,
          ratingAvg: data.rating,
          jobsCompleted: Math.floor(Math.random() * 150) + 50,
          location: {
            type: "Point",
            coordinates: [data.lng, data.lat],
          },
        });
      } else {
        profile.skills = [data.trade];
        profile.ratingAvg = data.rating;
        profile.location = {
          type: "Point",
          coordinates: [data.lng, data.lat],
        };
        await profile.save();
      }
    }

    console.log("[Seed] Successfully seeded 5 demo workers with Sakhi Trust and Delhi NCR geo-coordinates.");
  } catch (error) {
    console.error("[Seed Error]:", error);
  }
};

// Execute if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedDatabase().then(() => {
    mongoose.disconnect();
    process.exit(0);
  });
}
