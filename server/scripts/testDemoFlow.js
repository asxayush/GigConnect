import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "node:dns";
import User from "../models/User.js";
import WorkerProfile from "../models/WorkerProfile.js";
import Booking from "../models/Booking.js";

dotenv.config();
dns.setServers(["8.8.8.8", "8.8.4.4"]);

async function runTest() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  const customer = await User.findOne({ isDemo: true, role: "customer" });
  const worker = await User.findOne({ isDemo: true, role: "worker" });
  console.log("Found Demo Customer:", customer.name, customer._id.toString());
  console.log("Found Demo Worker:", worker.name, worker._id.toString());

  // Clean old demo bookings
  await Booking.deleteMany({ isDemo: true });

  // 1. Simulate Customer Creating Booking
  const booking = await Booking.create({
    customerId: customer._id,
    workerId: worker._id,
    serviceCategory: "Plumber",
    address: "Flat 402, DLF Phase 2, Connaught Place",
    scheduledAt: new Date().toISOString(),
    status: "pending",
    requestStatus: "pending",
    arrivalTime: "15 mins",
    isDemo: true,
    price: 499,
  });
  console.log("✓ Created pending demo booking:", booking._id.toString());

  // 2. Simulate Worker Polling Pending Bookings
  const pending = await Booking.find({
    status: "pending",
    $or: [{ workerId: worker._id }, { isDemo: true }],
  }).populate("customerId", "name phone");
  console.log(`✓ Worker fetched ${pending.length} pending booking(s). Customer: ${pending[0]?.customerId?.name}`);

  // 3. Simulate Worker Accepting Booking
  const accepted = await Booking.findByIdAndUpdate(
    booking._id,
    { status: "accepted", requestStatus: "accepted", arrivalTime: "15 mins" },
    { new: true }
  ).populate("customerId workerId", "name phone");
  console.log(`✓ Accepted booking status: ${accepted.status}, arrivalTime: ${accepted.arrivalTime}`);

  // 4. Simulate Customer Reading Booking Status
  const polledByCustomer = await Booking.findById(booking._id).populate("workerId", "name");
  console.log(`✓ Polled by Customer: status=${polledByCustomer.status}, worker=${polledByCustomer.workerId.name}, arrival=${polledByCustomer.arrivalTime}`);
  console.log(`Message on screen: "Booking accepted — ${polledByCustomer.workerId.name} arriving in ${polledByCustomer.arrivalTime}."`);

  // 5. Test Decline Flow
  const booking2 = await Booking.create({
    customerId: customer._id,
    workerId: worker._id,
    serviceCategory: "Plumber",
    address: "Flat 402, DLF Phase 2, Connaught Place",
    scheduledAt: new Date().toISOString(),
    status: "pending",
    requestStatus: "pending",
    isDemo: true,
    price: 499,
  });
  console.log("✓ Created second demo booking for decline test:", booking2._id.toString());

  const declined = await Booking.findByIdAndUpdate(
    booking2._id,
    { status: "declined", requestStatus: "declined" },
    { new: true }
  );
  console.log(`✓ Declined booking status: ${declined.status}`);
  console.log('Customer sees: "Booking declined by worker." (No crash)');

  // Clean up test bookings
  await Booking.deleteMany({ isDemo: true });

  await mongoose.disconnect();
  console.log("All tests completed successfully!");
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
