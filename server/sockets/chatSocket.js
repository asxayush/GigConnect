import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";

/**
 * Socket.io Real-Time Messaging Handlers
 * Handles: join_chat, send_message (with MongoDB persistence), typing, stop_typing
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

  // 2. Handle send_message: persist to MongoDB & broadcast receive_message
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

    // Broadcast message to everyone in the conversation room (including sender)
    io.to(`chat_${conversationId}`).emit("receive_message", payload);
  });

  // 3. Typing event
  socket.on("typing", ({ conversationId, senderName }) => {
    if (conversationId) {
      socket.to(`chat_${conversationId}`).emit("typing", { conversationId, senderName });
    }
  });

  // 4. Stop typing event
  socket.on("stop_typing", ({ conversationId }) => {
    if (conversationId) {
      socket.to(`chat_${conversationId}`).emit("stop_typing", { conversationId });
    }
  });
};
