import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import path from "path";
import dns from "node:dns";
import { fileURLToPath } from "url";
import Worker from "../models/Worker.js";
import User from "../models/User.js";
import WorkerProfile from "../models/WorkerProfile.js";

// Ensure Node.js DNS resolver handles Atlas SRV records smoothly on Windows
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb://127.0.0.1:27017/gigconnect";

const DEFAULT_PASSWORD_PLAIN = "Demo@123";

const SEED_WORKERS_DATA = [
  {
    name: "Ramesh Kumar",
    phone: "9999999991",
    trade: "Electrician",
    gender: "Male",
    hourlyRate: 250,
    rating: 4.8,
    sakhiVerified: false,
    lng: 77.2090,
    lat: 28.6139,
    area: "Connaught Place, Central Delhi",
    aadhaarNumberMasked: "XXXX-XXXX-1101",
    aadhaarCardImageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80",
    selfieImageUrl: "/illustrations/electrician.jpg",
  },
  {
    name: "Sunita Devi",
    phone: "9999999992",
    trade: "Cleaner",
    gender: "Female",
    hourlyRate: 400,
    rating: 4.9,
    sakhiVerified: true,
    lng: 77.2588,
    lat: 28.5355,
    area: "South Delhi & Saket Hub",
    aadhaarNumberMasked: "XXXX-XXXX-2202",
    aadhaarCardImageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80",
    selfieImageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=250&auto=format&fit=crop&q=80",
  },
  {
    name: "Ali Raza",
    phone: "9999999993",
    trade: "Carpenter",
    gender: "Male",
    hourlyRate: 350,
    rating: 4.5,
    sakhiVerified: false,
    lng: 77.2784,
    lat: 28.6276,
    area: "East Delhi & Laxmi Nagar",
    aadhaarNumberMasked: "XXXX-XXXX-3303",
    aadhaarCardImageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80",
    selfieImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80",
  },
  {
    name: "Priya Sharma",
    phone: "9999999994",
    trade: "Technician",
    gender: "Female",
    hourlyRate: 300,
    rating: 4.7,
    sakhiVerified: true,
    lng: 77.1025,
    lat: 28.7041,
    area: "Rohini Sector 14, North Delhi",
    aadhaarNumberMasked: "XXXX-XXXX-4404",
    aadhaarCardImageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80",
    selfieImageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=250&auto=format&fit=crop&q=80",
  },
  {
    name: "Vikram Singh",
    phone: "9999999995",
    trade: "Plumber",
    gender: "Male",
    hourlyRate: 200,
    rating: 4.6,
    sakhiVerified: false,
    lng: 77.0266,
    lat: 28.4595,
    area: "Gurugram Cyber City & DLF",
    aadhaarNumberMasked: "XXXX-XXXX-5505",
    aadhaarCardImageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80",
    selfieImageUrl: "/illustrations/plumber.jpg",
  },
  {
    name: "Kavita Rao",
    phone: "9999999996",
    trade: "Domestic Helper",
    gender: "Female",
    hourlyRate: 200,
    rating: 4.92,
    sakhiVerified: true,
    lng: 77.0500,
    lat: 28.5800,
    area: "Dwarka Sector 10, West Delhi",
    aadhaarNumberMasked: "XXXX-XXXX-6606",
    aadhaarCardImageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80",
    selfieImageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80",
  },
  {
    name: "Shanti Devi",
    phone: "9999999997",
    trade: "Caregiver",
    gender: "Female",
    hourlyRate: 350,
    rating: 4.98,
    sakhiVerified: true,
    lng: 77.1550,
    lat: 28.5200,
    area: "Vasant Kunj & South Delhi",
    aadhaarNumberMasked: "XXXX-XXXX-7707",
    aadhaarCardImageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80",
    selfieImageUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=250&auto=format&fit=crop&q=80",
  },
  {
    name: "Rajeshwar Yadav",
    phone: "9999999998",
    trade: "Painter",
    gender: "Male",
    hourlyRate: 300,
    rating: 4.75,
    sakhiVerified: false,
    lng: 77.2900,
    lat: 28.6300,
    area: "Laxmi Nagar & East Delhi",
    aadhaarNumberMasked: "XXXX-XXXX-8808",
    aadhaarCardImageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80",
    selfieImageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=250&auto=format&fit=crop&q=80",
  },
  {
    name: "Harish Chandra",
    phone: "9999999999",
    trade: "Driver",
    gender: "Male",
    hourlyRate: 350,
    rating: 4.88,
    sakhiVerified: false,
    lng: 77.0300,
    lat: 28.4700,
    area: "Gurugram & Delhi NCR",
    aadhaarNumberMasked: "XXXX-XXXX-9909",
    aadhaarCardImageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80",
    selfieImageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80",
  },
  {
    name: "Babulal Saini",
    phone: "9999999910",
    trade: "Gardener",
    gender: "Male",
    hourlyRate: 250,
    rating: 4.85,
    sakhiVerified: false,
    lng: 77.2400,
    lat: 28.5500,
    area: "Greater Kailash & South Delhi",
    aadhaarNumberMasked: "XXXX-XXXX-1010",
    aadhaarCardImageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80",
    selfieImageUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=250&auto=format&fit=crop&q=80",
  },
];

async function seedWorkers() {
  console.log("=================================================");
  console.log("🚀 [GigConnect] Starting Database Worker Reset...");
  console.log("=================================================");

  try {
    // 1. Connect to MongoDB
    console.log("⏳ Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("✓ Connected to MongoDB successfully.");

    // 2. Wipe existing Worker testing records
    console.log("🧹 Wiping existing Worker collection records...");
    const deleteResult = await Worker.deleteMany({});
    console.log(`✓ Deleted ${deleteResult.deletedCount} existing worker records.`);

    // 3. Hash default presentation password (Demo@123)
    console.log(`🔐 Hashing default presentation password: "${DEFAULT_PASSWORD_PLAIN}"...`);
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD_PLAIN, saltRounds);

    // 4. Map workers to Mongoose document payload
    const workerDocuments = SEED_WORKERS_DATA.map((w) => ({
      name: w.name,
      phone: w.phone,
      trade: w.trade,
      gender: w.gender,
      hourlyRate: w.hourlyRate,
      rating: w.rating,
      sakhiVerified: w.sakhiVerified,
      verificationStatus: "verified",
      verifiedAt: new Date(),
      faceMatchScore: 98.6,
      aadhaarNumberMasked: w.aadhaarNumberMasked,
      aadhaarCardImageUrl: w.aadhaarCardImageUrl,
      selfieImageUrl: w.selfieImageUrl,
      locationCoords: {
        lat: w.lat,
        lng: w.lng,
      },
      extractedOcrData: {
        name: w.name,
        dob: "1990-01-01",
        address: `${w.area}, Delhi NCR`,
      },
      adminNotes: "Pre-verified demonstration account with full Cooperative Federation credentials.",
    }));

    // 5. Insert the 5 verified workers using insertMany
    console.log("📥 Inserting 5 verified demo workers into MongoDB Worker collection...");
    const insertedWorkers = await Worker.insertMany(workerDocuments);

    // 6. Synchronize User & WorkerProfile credentials for password login capability
    for (const w of SEED_WORKERS_DATA) {
      const email = `${w.name.toLowerCase().replace(/\s+/g, "")}@gigconnect.in`;

      // Upsert User with passwordHash so login works during live presentations
      let user = await User.findOne({
        $or: [{ phone: w.phone }, { email }],
      });

      if (!user) {
        user = await User.create({
          name: w.name,
          phone: w.phone,
          email,
          passwordHash,
          role: "worker",
          gender: w.gender,
          avatar: w.selfieImageUrl,
          location: { lat: w.lat, lng: w.lng, area: w.area },
        });
      } else {
        user.name = w.name;
        user.phone = w.phone;
        user.email = email;
        user.passwordHash = passwordHash;
        user.role = "worker";
        user.gender = w.gender;
        user.avatar = w.selfieImageUrl;
        user.location = { lat: w.lat, lng: w.lng, area: w.area };
        await user.save();
      }

      // Upsert GeoJSON WorkerProfile for distance and location clustering
      let profile = await WorkerProfile.findOne({ userId: user._id });
      if (!profile) {
        await WorkerProfile.create({
          userId: user._id,
          skills: [w.trade],
          certifications: ["UIDAI e-KYC Verified", "Co-op Federation Guild #204"],
          photoUrl: w.selfieImageUrl,
          verificationStatus: "verified",
          availability: true,
          ratingAvg: w.rating,
          jobsCompleted: Math.floor(Math.random() * 120) + 40,
          location: {
            type: "Point",
            coordinates: [w.lng, w.lat],
          },
        });
      } else {
        profile.skills = [w.trade];
        profile.ratingAvg = w.rating;
        profile.verificationStatus = "verified";
        profile.location = {
          type: "Point",
          coordinates: [w.lng, w.lat],
        };
        await profile.save();
      }
    }

    console.log("=================================================");
    console.log(`✅ Successfully seeded ${insertedWorkers.length} verified demo workers!`);
    console.log("-------------------------------------------------");
    insertedWorkers.forEach((w, idx) => {
      console.log(
        `${idx + 1}. ${w.name.padEnd(16)} | Phone: ${w.phone} | Trade: ${w.trade.padEnd(18)} | Rate: ₹${w.hourlyRate}/hr | Sakhi: ${w.sakhiVerified ? "♀ YES" : "NO"} | Status: ${w.verificationStatus}`
      );
    });
    console.log("-------------------------------------------------");
    console.log(`🔑 Login Password for all 5 accounts: "${DEFAULT_PASSWORD_PLAIN}"`);
    console.log("=================================================");

    await mongoose.disconnect();
    console.log("✓ Disconnected from MongoDB. Clean slate ready for demo.");
    process.exit(0);
  } catch (error) {
    console.error("❌ [Seed Error]:", error);
    try {
      await mongoose.disconnect();
    } catch (e) {}
    process.exit(1);
  }
}

seedWorkers();
