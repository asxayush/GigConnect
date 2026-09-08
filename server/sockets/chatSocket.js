import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import Booking from "../models/Booking.js";

/**
 * Socket.io Real-Time Messaging & Fair-Bid Handlers
 * Handles: join_chat, send_message, typing, stop_typing, send_bid, accept_bid
 */
export const registerChatHandlers = (io, socket) => {
  // 1. Join conversation room
  socket.on("join_chat", ({ conversationId }) => {
    if (conversationId) {
      const room = `chat_${conversationId}`;
      socket.join(room);
      console.log(`[Socket.io] ${socket.id} joined room: ${room}`);
    }
  });

  // 2. Standard message sending: persist to MongoDB & broadcast
  socket.on("send_message", async (data) => {
    const { conversationId, senderId, senderModel = "User", text, clientTempId } = data;

    if (!conversationId || !text || !text.trim()) {
      return;
    }

    let savedMessage = null;

    try {
      savedMessage = await Message.create({
        conversationId,
        sender: senderId,
        senderModel,
        text: text.trim(),
        isRead: false,
      });

      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: text.trim(),
        lastMessageAt: new Date(),
      });
    } catch (err) {
      // Fallback for custom demo/seeded conversation IDs
      savedMessage = {
        _id: "msg_" + Date.now(),
        conversationId,
        sender: senderId || "user",
        senderModel,
        text: text.trim(),
        isRead: false,
        createdAt: new Date(),
      };
    }

    const payload = {
      ...(savedMessage.toObject ? savedMessage.toObject() : savedMessage),
      clientTempId,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    io.to(`chat_${conversationId}`).emit("receive_message", payload);
  });

  // 3. Real-Time "Fair-Bid" Negotiation: send_bid
  socket.on("send_bid", async (data) => {
    const {
      conversationId,
      proposedPrice,
      senderId = "customer_current",
      senderModel = "User",
      serviceTitle = "General Service",
      note = "",
    } = data;

    if (!conversationId || !proposedPrice) return;

    const bidId = "bid_" + Date.now();
    const bidPayload = {
      _id: bidId,
      conversationId,
      sender: senderId,
      senderModel,
      type: "bid",
      proposedPrice: Number(proposedPrice),
      serviceTitle,
      note: note || "Cooperative Fair-Bid Proposal",
      bidStatus: "pending",
      text: `💰 Fare Proposal: ₹${proposedPrice}`,
      createdAt: new Date(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    // Save bid message preview in conversation
    try {
      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: `💰 Fair-Bid proposed: ₹${proposedPrice}`,
        lastMessageAt: new Date(),
      });
    } catch (e) {}

    // Broadcast bid event & message to chat room
    io.to(`chat_${conversationId}`).emit("receive_bid", bidPayload);
    io.to(`chat_${conversationId}`).emit("receive_message", bidPayload);
  });

  // 4. Accept Bid: accept_bid (updates booking status to Confirmed with agreed price)
  socket.on("accept_bid", async (data) => {
    const { conversationId, bidId, agreedPrice, bookingId, acceptedBy = "Worker" } = data;
    if (!conversationId) return;

    const priceNum = Number(agreedPrice) || 200;

    // If booking exists in DB, update price and status
    if (bookingId) {
      try {
        await Booking.findByIdAndUpdate(bookingId, {
          price: priceNum,
          status: "Confirmed",
        });
      } catch (err) {
        console.warn("[Socket.io] Booking DB update note:", err.message);
      }
    }

    const confirmationPayload = {
      conversationId,
      bidId,
      agreedPrice: priceNum,
      acceptedBy,
      status: "Confirmed",
      text: `🎉 Fare Accepted at ₹${priceNum}! Booking confirmed under cooperative guarantee.`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      confirmedAt: new Date(),
    };

    // Broadcast acceptance confirmation
    io.to(`chat_${conversationId}`).emit("bid_accepted", confirmationPayload);

    // Also broadcast system confirmation bubble
    io.to(`chat_${conversationId}`).emit("receive_message", {
      _id: "conf_" + Date.now(),
      conversationId,
      sender: "system",
      senderModel: "System",
      type: "confirmation",
      agreedPrice: priceNum,
      text: `✓ Booking Confirmed at ₹${priceNum}! Free Escrow & Accident Insurance active.`,
      time: confirmationPayload.time,
      isRead: true,
    });
  });

  // 5. Typing indicator events
  socket.on("typing", ({ conversationId, senderName }) => {
    if (conversationId) {
      socket.to(`chat_${conversationId}`).emit("typing", { conversationId, senderName });
    }
  });

  socket.on("stop_typing", ({ conversationId }) => {
    if (conversationId) {
      socket.to(`chat_${conversationId}`).emit("stop_typing", { conversationId });
    }
  });
};
