import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    userName: {
      type: String,
      default: "Anonymous Member",
    },
    userPhone: {
      type: String,
      default: "9811000000",
    },
    issueDescription: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["General", "Payment", "Safety", "Service Quality", "Dispute", "Emergency"],
      default: "General",
    },
    status: {
      type: String,
      enum: ["ai-handled", "escalated", "in-progress", "resolved"],
      default: "ai-handled",
    },
    escalatedAt: {
      type: Date,
      default: Date.now,
    },
    assignedAdmin: {
      type: String,
      default: null,
    },
    resolutionNotes: {
      type: String,
      default: "",
    },
    messages: [
      {
        sender: {
          type: String,
          enum: ["user", "ai", "admin"],
          required: true,
        },
        text: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

const Ticket = mongoose.model("Ticket", ticketSchema);
export default Ticket;
