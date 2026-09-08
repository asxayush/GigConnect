import mongoose from "mongoose";
import dns from "node:dns";

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is missing from server/.env");

  const dnsServers = process.env.MONGO_DNS_SERVERS?.split(",").map((s) => s.trim()).filter(Boolean);
  if (dnsServers?.length) dns.setServers(dnsServers);

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: Number(process.env.MONGO_TIMEOUT_MS || 10000),
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    throw new Error(`MongoDB connection failed: ${error.message}`);
  }
};

export default connectDB;
