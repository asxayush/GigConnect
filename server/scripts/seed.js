import mongoose from "mongoose";
import bcrypt from "bcrypt";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import WorkerProfile from "../src/models/WorkerProfile.js";
import Worker from "../src/models/Worker.js";
import Booking from "../models/Booking.js";
import Rating from "../src/models/Rating.js";

async function seed() {
  console.log("Connecting to MongoDB Atlas...");
  await connectDB();

  console.log("Clearing previous seed data (preserving customer accounts)...");
  await WorkerProfile.deleteMany({});
  await Worker.deleteMany({});
  await Booking.deleteMany({});
  await Rating.deleteMany({});
  await User.deleteMany({ role: { $in: ["worker", "coordinator", "admin"] } });

  const defaultPasswordHash = await bcrypt.hash("coop123456", 10);

  console.log("Seeding Administrative and Cooperative Staff Users...");
  const adminUser = await User.findOneAndUpdate(
    { phone: "+919999900001" },
    {
      name: "Rameshwar K. Sharma (Federation Trustee)",
      phone: "+919999900001",
      email: "admin@gigconnect.coop",
      role: "admin",
      passwordHash: defaultPasswordHash,
      location: { lat: 28.6315, lng: 77.2167, area: "Connaught Place, New Delhi" },
    },
    { upsert: true, new: true }
  );

  const coordinatorUser = await User.findOneAndUpdate(
    { phone: "+919999900002" },
    {
      name: "Suman Lata (Field Coordinator, Ward 14)",
      phone: "+919999900002",
      email: "coordinator@gigconnect.coop",
      role: "coordinator",
      passwordHash: defaultPasswordHash,
      location: { lat: 28.5244, lng: 77.2066, area: "South Delhi Coordination Hub" },
    },
    { upsert: true, new: true }
  );

  let customerUser = await User.findOne({ phone: "+919279026395" });
  if (!customerUser) {
    customerUser = await User.create({
      name: "Ayush Sinha (Co-op Patron)",
      phone: "+919279026395",
      email: "customer@gigconnect.coop",
      role: "customer",
      passwordHash: defaultPasswordHash,
      location: { lat: 28.6315, lng: 77.2167, area: "Connaught Place, New Delhi" },
    });
  } else {
    customerUser.name = "Ayush Sinha (Co-op Patron)";
    customerUser.location = { lat: 28.6315, lng: 77.2167, area: "Connaught Place, New Delhi" };
    await customerUser.save();
  }

  console.log("Seeding 16 Verified Cooperative Workers...");
  const workerRawData = [
    {
      name: "Rajesh Kumar Sharma",
      phone: "+919811100101",
      skills: ["Plumber", "Plumbing & Water Systems"],
      area: "Connaught Place, New Delhi",
      lat: 28.6315,
      lng: 77.2167,
      ratingAvg: 4.92,
      jobsCompleted: 318,
      photoUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80",
      certifications: ["/uploads/certificates/plumber_cert.pdf"],
    },
    {
      name: "Sunita Devi",
      phone: "+919811100102",
      skills: ["Domestic help", "House Cleaning", "Deep Cleaning & Sanitization"],
      area: "Dwarka Sector 12, Delhi",
      lat: 28.5921,
      lng: 77.0460,
      ratingAvg: 4.96,
      jobsCompleted: 420,
      photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80",
      certifications: ["/uploads/certificates/cleaning_lead.pdf"],
    },
    {
      name: "Arun V. Nair",
      phone: "+919811100103",
      skills: ["Electrician", "Electrical & Wiring"],
      area: "DLF Cyber City, Gurugram",
      lat: 28.4950,
      lng: 77.0895,
      ratingAvg: 4.88,
      jobsCompleted: 195,
      photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
      certifications: ["/uploads/certificates/govt_wireman.pdf"],
    },
    {
      name: "Mohammed Farhan",
      phone: "+919811100104",
      skills: ["Carpenter", "Carpentry & Woodcraft"],
      area: "Noida Sector 62",
      lat: 28.6280,
      lng: 77.3649,
      ratingAvg: 4.90,
      jobsCompleted: 160,
      photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80",
      certifications: ["/uploads/certificates/craft_guild.pdf"],
    },
    {
      name: "Meenakshi Sundaram",
      phone: "+919811100105",
      skills: ["Home Cooking", "Home Cooking & Meals"],
      area: "Hauz Khas, South Delhi",
      lat: 28.5494,
      lng: 77.2001,
      ratingAvg: 4.95,
      jobsCompleted: 280,
      photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80",
      certifications: ["/uploads/certificates/fssai_hygiene.pdf"],
    },
    {
      name: "Vikram Jadhav",
      phone: "+919811100106",
      skills: ["Electrician", "Appliance & HVAC Repair"],
      area: "Indirapuram, Ghaziabad",
      lat: 28.6415,
      lng: 77.3714,
      ratingAvg: 4.85,
      jobsCompleted: 142,
      photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80",
      certifications: ["/uploads/certificates/hvac_safety.pdf"],
    },
    {
      name: "Dinesh Prasad",
      phone: "+919811100107",
      skills: ["Driver", "Commercial Driver"],
      area: "Saket, South Delhi",
      lat: 28.5244,
      lng: 77.2066,
      ratingAvg: 4.89,
      jobsCompleted: 310,
      photoUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80",
      certifications: ["/uploads/certificates/commercial_dl.pdf"],
    },
    {
      name: "Mangal Singh",
      phone: "+919811100108",
      skills: ["Gardener", "Gardener & Landscaper"],
      area: "Vasant Kunj, New Delhi",
      lat: 28.5200,
      lng: 77.1560,
      ratingAvg: 4.93,
      jobsCompleted: 175,
      photoUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=600&auto=format&fit=crop&q=80",
      certifications: ["/uploads/certificates/horticulture_award.pdf"],
    },
    {
      name: "Manoj Verma",
      phone: "+919811100109",
      skills: ["Electrician", "Electrical & Wiring"],
      area: "Rohini Sector 15, Delhi",
      lat: 28.7180,
      lng: 77.1260,
      ratingAvg: 4.86,
      jobsCompleted: 110,
      photoUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&auto=format&fit=crop&q=80",
      certifications: ["/uploads/certificates/wireman_delhi.pdf"],
    },
    {
      name: "Geeta Bai",
      phone: "+919811100110",
      skills: ["Domestic help", "House Cleaning"],
      area: "Karol Bagh, Central Delhi",
      lat: 28.6514,
      lng: 77.1907,
      ratingAvg: 4.91,
      jobsCompleted: 230,
      photoUrl: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=600&auto=format&fit=crop&q=80",
      certifications: ["/uploads/certificates/cleaning_standard.pdf"],
    },
    {
      name: "Suresh M. Yadav",
      phone: "+919811100111",
      skills: ["Plumber", "Plumbing & Water Systems"],
      area: "Greater Kailash 2, New Delhi",
      lat: 28.5355,
      lng: 77.2425,
      ratingAvg: 4.94,
      jobsCompleted: 260,
      photoUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&auto=format&fit=crop&q=80",
      certifications: ["/uploads/certificates/plumbing_council.pdf"],
    },
    {
      name: "Harpreet Singh",
      phone: "+919811100112",
      skills: ["Carpenter", "Carpentry & Woodcraft"],
      area: "Rajouri Garden, West Delhi",
      lat: 28.6477,
      lng: 77.1215,
      ratingAvg: 4.97,
      jobsCompleted: 340,
      photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
      certifications: ["/uploads/certificates/master_woodcraft.pdf"],
    },
    {
      name: "Lakshmi Narayanan",
      phone: "+919811100113",
      skills: ["Home Cooking", "Home Cooking & Meals"],
      area: "Mayur Vihar Phase 1, Delhi",
      lat: 28.6080,
      lng: 77.2950,
      ratingAvg: 4.88,
      jobsCompleted: 155,
      photoUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&auto=format&fit=crop&q=80",
      certifications: ["/uploads/certificates/culinary_hygiene.pdf"],
    },
    {
      name: "Bablu Soren",
      phone: "+919811100114",
      skills: ["Gardener", "Gardener & Landscaper"],
      area: "Golf Course Road, Gurugram",
      lat: 28.4595,
      lng: 77.0988,
      ratingAvg: 4.90,
      jobsCompleted: 98,
      photoUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80",
      certifications: ["/uploads/certificates/plant_nursery.pdf"],
    },
    {
      name: "Anand R. Rao",
      phone: "+919811100115",
      skills: ["Driver", "Commercial Driver"],
      area: "Koramangala, Bengaluru",
      lat: 12.9352,
      lng: 77.6245,
      ratingAvg: 4.92,
      jobsCompleted: 215,
      photoUrl: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&auto=format&fit=crop&q=80",
      certifications: ["/uploads/certificates/heavy_transport.pdf"],
    },
    {
      name: "Kavita Murthy",
      phone: "+919811100116",
      skills: ["Domestic help", "House Cleaning"],
      area: "Indiranagar, Bengaluru",
      lat: 12.9784,
      lng: 77.6408,
      ratingAvg: 4.98,
      jobsCompleted: 480,
      photoUrl: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&auto=format&fit=crop&q=80",
      certifications: ["/uploads/certificates/guild_trustee.pdf"],
    },
  ];

  const createdWorkers = [];

  for (const w of workerRawData) {
    const user = await User.create({
      name: w.name,
      phone: w.phone,
      email: `${w.name.toLowerCase().replace(/[^a-z]/g, "")}@worker.gigconnect.coop`,
      role: "worker",
      passwordHash: defaultPasswordHash,
      location: { lat: w.lat, lng: w.lng, area: w.area },
    });

    const profile = await WorkerProfile.create({
      userId: user._id,
      skills: w.skills,
      certifications: w.certifications,
      photoUrl: w.photoUrl,
      verificationStatus: "verified",
      availability: true,
      ratingAvg: w.ratingAvg,
      jobsCompleted: w.jobsCompleted,
      location: {
        type: "Point",
        coordinates: [w.lng, w.lat],
      },
    });

    // Also create verified biometric Worker record
    await Worker.create({
      name: w.name,
      phone: w.phone,
      aadhaarNumberMasked: `•••• •••• ${w.phone.slice(-4)}`,
      aadhaarCardImageUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80",
      selfieImageUrl: w.photoUrl,
      faceMatchScore: 92.5,
      verificationStatus: "auto_verified",
      verifiedAt: new Date(Date.now() - 30 * 86400000),
      extractedOcrData: {
        name: w.name,
        dob: "15/08/1988",
        address: w.area,
      },
      reviewedBy: adminUser._id,
    });

    createdWorkers.push({ user, profile, raw: w });
  }

  console.log("Seeding 3 Pending Workers for Admin Review Queue...");
  const pendingWorkerSpecs = [
    {
      name: "Rameshwar Prasad Verma",
      phone: "+919811049281",
      trade: "Electrician",
      area: "South Delhi & Noida",
      score: 78.4,
      photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80",
    },
    {
      name: "Champa Soren",
      phone: "+919811049282",
      trade: "Domestic help",
      area: "Noida Sector 76",
      score: 74.1,
      photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80",
    },
    {
      name: "Amit B. Roy",
      phone: "+919811049283",
      trade: "Plumber",
      area: "DLF Phase 4, Gurugram",
      score: 64.8,
      photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80",
    },
  ];

  for (const p of pendingWorkerSpecs) {
    const user = await User.create({
      name: p.name,
      phone: p.phone,
      role: "worker",
      passwordHash: defaultPasswordHash,
      location: { lat: 28.5355, lng: 77.2425, area: p.area },
    });

    await WorkerProfile.create({
      userId: user._id,
      skills: [p.trade],
      photoUrl: p.photo,
      verificationStatus: "pending",
      availability: false,
      location: { type: "Point", coordinates: [77.2425, 28.5355] },
    });

    await Worker.create({
      name: p.name,
      phone: p.phone,
      aadhaarNumberMasked: `•••• •••• ${p.phone.slice(-4)}`,
      aadhaarCardImageUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80",
      selfieImageUrl: p.photo,
      faceMatchScore: p.score,
      verificationStatus: "pending",
      extractedOcrData: {
        name: p.name,
        dob: "12/04/1990",
        address: p.area,
      },
    });
  }

  console.log("Seeding 25+ Historical and Active Customer Bookings...");
  const bookingTemplates = [
    {
      serviceCategory: "Plumber",
      workerIdx: 0,
      address: "Flat 402, DLF Phase 2, Cyber City Corridor, Gurugram",
      status: "Assigned",
      price: 450,
      daysAgo: 0,
      hour: 14,
    },
    {
      serviceCategory: "Domestic help",
      workerIdx: 1,
      address: "B-12, Sector 12, Dwarka, New Delhi",
      status: "In Progress",
      price: 650,
      daysAgo: 0,
      hour: 10,
    },
    {
      serviceCategory: "Electrician",
      workerIdx: 2,
      address: "House 89, Sector 28, Golf Course Road, Gurugram",
      status: "Completed",
      price: 550,
      daysAgo: 1,
      hour: 11,
      rating: 5,
      comment: "Arun was very prompt and fixed our MCB tripping issue without unnecessary part replacements.",
    },
    {
      serviceCategory: "Carpenter",
      workerIdx: 3,
      address: "Tower 4, Express View Apartments, Sector 93, Noida",
      status: "Completed",
      price: 800,
      daysAgo: 2,
      hour: 16,
      rating: 5,
      comment: "Superb craftsmanship on our study bookshelf alignment. True cooperative professional.",
    },
    {
      serviceCategory: "Home Cooking",
      workerIdx: 4,
      address: "E-34, Hauz Khas Enclave, New Delhi",
      status: "Completed",
      price: 700,
      daysAgo: 3,
      hour: 18,
      rating: 5,
      comment: "Meenakshi ji made delicious, healthy meals for our family gathering. Very hygienic!",
    },
    {
      serviceCategory: "Domestic help",
      workerIdx: 1,
      address: "C-44, Janakpuri, West Delhi",
      status: "Completed",
      price: 1499,
      daysAgo: 4,
      hour: 9,
      rating: 5,
      comment: "Full deep cleaning done with precision. 90% payout direct to worker verified.",
    },
    {
      serviceCategory: "Plumber",
      workerIdx: 0,
      address: "Shop 12, Connaught Circus, New Delhi",
      status: "Completed",
      price: 350,
      daysAgo: 5,
      hour: 15,
      rating: 5,
      comment: "Quick leak fix in our boutique pantry. Master plumber indeed.",
    },
    {
      serviceCategory: "Electrician",
      workerIdx: 5,
      address: "Shipra Sun City, Indirapuram, Ghaziabad",
      status: "Completed",
      price: 600,
      daysAgo: 6,
      hour: 12,
      rating: 4,
      comment: "AC gas refill and copper pipe flare inspection completed cleanly.",
    },
    {
      serviceCategory: "Driver",
      workerIdx: 6,
      address: "Saket Metro Station to IGI Airport Terminal 3",
      status: "Completed",
      price: 750,
      daysAgo: 7,
      hour: 6,
      rating: 5,
      comment: "Dinesh was 15 mins early, drove very smoothly. Courteous cooperative driver.",
    },
    {
      serviceCategory: "Gardener",
      workerIdx: 7,
      address: "Pocket 2, Sector B, Vasant Kunj, New Delhi",
      status: "Completed",
      price: 500,
      daysAgo: 8,
      hour: 8,
      rating: 5,
      comment: "Pruned rose bushes and added organic compost. Garden looks rejuvenated.",
    },
    {
      serviceCategory: "Plumber",
      workerIdx: 10,
      address: "M-Block Market, GK 2, New Delhi",
      status: "Requested",
      price: 400,
      daysAgo: 0,
      hour: 17,
    },
    {
      serviceCategory: "Electrician",
      workerIdx: 8,
      address: "Sector 15, Rohini, North Delhi",
      status: "Cancelled",
      price: 350,
      daysAgo: 3,
      hour: 13,
    },
    { serviceCategory: "Plumber", workerIdx: 0, address: "Gurugram Cyber City", status: "Completed", price: 500, daysAgo: 9, hour: 11, rating: 5, comment: "Great plumbing service." },
    { serviceCategory: "Plumber", workerIdx: 10, address: "Gurugram Cyber City", status: "Completed", price: 550, daysAgo: 10, hour: 14, rating: 5, comment: "Punctual." },
    { serviceCategory: "Plumber", workerIdx: 0, address: "Dwarka Sector 12", status: "Completed", price: 400, daysAgo: 11, hour: 15, rating: 5, comment: "Fixed." },
    { serviceCategory: "Electrician", workerIdx: 2, address: "Gurugram Cyber City", status: "Completed", price: 600, daysAgo: 12, hour: 10, rating: 5, comment: "Efficient." },
    { serviceCategory: "Electrician", workerIdx: 2, address: "Connaught Place", status: "Completed", price: 450, daysAgo: 13, hour: 16, rating: 5, comment: "Good work." },
    { serviceCategory: "Domestic help", workerIdx: 1, address: "Gurugram Cyber City", status: "Completed", price: 850, daysAgo: 13, hour: 9, rating: 5, comment: "Top hygiene." },
    { serviceCategory: "Domestic help", workerIdx: 9, address: "Connaught Place", status: "Completed", price: 600, daysAgo: 14, hour: 10, rating: 5, comment: "Neat." },
    { serviceCategory: "Carpenter", workerIdx: 3, address: "Noida Sector 62", status: "Completed", price: 750, daysAgo: 12, hour: 15, rating: 5, comment: "Quality wood fitting." },
    { serviceCategory: "Carpenter", workerIdx: 11, address: "Dwarka Sector 12", status: "Completed", price: 650, daysAgo: 10, hour: 14, rating: 4, comment: "Good job." },
    { serviceCategory: "Home Cooking", workerIdx: 4, address: "South Delhi", status: "Completed", price: 550, daysAgo: 11, hour: 19, rating: 5, comment: "Delicious meal." },
    { serviceCategory: "Home Cooking", workerIdx: 12, address: "Connaught Place", status: "Completed", price: 600, daysAgo: 13, hour: 20, rating: 5, comment: "Awesome dinner." },
    { serviceCategory: "Driver", workerIdx: 6, address: "South Delhi", status: "Completed", price: 800, daysAgo: 10, hour: 7, rating: 5, comment: "Safe drive." },
    { serviceCategory: "Gardener", workerIdx: 7, address: "South Delhi", status: "Completed", price: 450, daysAgo: 9, hour: 8, rating: 5, comment: "Garden looks great." },
  ];

  for (const b of bookingTemplates) {
    const worker = createdWorkers[b.workerIdx];
    const schedDate = new Date();
    schedDate.setDate(schedDate.getDate() - b.daysAgo);
    schedDate.setHours(b.hour, 0, 0, 0);

    const booking = await Booking.create({
      customerId: customerUser._id,
      workerId: worker?.user?._id,
      serviceCategory: b.serviceCategory,
      address: b.address,
      location: { lat: worker?.raw?.lat || 28.6315, lng: worker?.raw?.lng || 77.2167 },
      scheduledAt: schedDate,
      status: b.status,
      price: b.price,
      paymentStatus: b.status === "Completed" ? "paid" : "unpaid",
      createdAt: schedDate,
    });

    if (b.rating && b.status === "Completed" && worker) {
      await Rating.create({
        bookingId: booking._id,
        customerId: customerUser._id,
        workerId: worker.user._id,
        stars: b.rating,
        comment: b.comment,
        createdAt: schedDate,
      });
    }
  }

  console.log("-------------------------------------------------------");
  console.log("✓ SUCCESS: Database seeded with realistic cooperative data!");
  console.log(`- Verified Workers: ${createdWorkers.length}`);
  console.log(`- Pending Verifications: ${pendingWorkerSpecs.length}`);
  console.log(`- Historical Bookings: ${bookingTemplates.length}`);
  console.log("- Accounts created:");
  console.log("  • Admin: admin@gigconnect.coop / +919999900001 (pass: coop123456)");
  console.log("  • Coordinator: coordinator@gigconnect.coop / +919999900002 (pass: coop123456)");
  console.log("  • Customer: customer@gigconnect.coop / +919279026395 (pass: coop123456)");
  console.log("-------------------------------------------------------");

  process.exit(0);
}

seed().catch((err) => {
  console.error("FATAL: Seeding failed:", err);
  process.exit(1);
});
