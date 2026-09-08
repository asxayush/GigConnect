import { Server } from "socket.io";
import { registerChatHandlers } from "./chatSocket.js";

let ioInstance = null;

export const initBookingSocket = (httpServer) => {
  const allowedOrigins = (process.env.CLIENT_URL || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  ioInstance = new Server(httpServer, {
    cors: {
      origin: allowedOrigins.length ? allowedOrigins : "*",
      methods: ["GET", "POST", "PATCH"],
      credentials: true,
    },
  });

  ioInstance.on("connection", (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Register Chat Handlers (join_chat, send_message, typing, stop_typing)
    registerChatHandlers(ioInstance, socket);

    // Worker registers to their private room
    socket.on("joinWorker", ({ workerId }) => {
      if (workerId) {
        socket.join(`worker_${workerId}`);
        console.log(`[Socket.io] Worker ${workerId} joined room: worker_${workerId}`);
      }
    });

    // Customer registers to their private user room
    socket.on("joinUser", ({ userId }) => {
      if (userId) {
        socket.join(`user_${userId}`);
        console.log(`[Socket.io] User ${userId} joined room: user_${userId}`);
      }
    });

    // Join specific booking room for real-time tracking
    socket.on("joinBooking", ({ bookingId }) => {
      if (bookingId) {
        socket.join(`booking_${bookingId}`);
      }
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return ioInstance;
};

export const getIO = () => {
  if (!ioInstance) {
    throw new Error("Socket.io has not been initialized. Call initBookingSocket first.");
  }
  return ioInstance;
};
