import Ticket from "../models/Ticket.js";

/**
 * Socket.io Support & Escalation Handlers
 * Handles: join_admin_room, escalate_ticket, admin_take_over, resolve_ticket
 */
export const registerSupportHandlers = (io, socket) => {
  // 1. Admin joins 'admin_room' to receive real-time grievance escalation alerts
  socket.on("join_admin_room", () => {
    socket.join("admin_room");
    console.log(`[Socket.io] Admin joined 'admin_room': ${socket.id}`);
  });

  // 2. Customer/Worker escalates an AI support ticket to Human Admin
  socket.on("escalate_ticket", async (data) => {
    const {
      userId,
      userName = "GigConnect Member",
      userPhone = "9811000000",
      issueDescription,
      category = "General",
      messages = [],
    } = data;

    if (!issueDescription || !issueDescription.trim()) {
      return;
    }

    console.log(`[Socket.io] Escalating ticket from ${userName}: ${issueDescription}`);

    let savedTicket = null;

    try {
      savedTicket = await Ticket.create({
        userId: userId || null,
        userName,
        userPhone,
        issueDescription: issueDescription.trim(),
        category,
        status: "escalated",
        escalatedAt: new Date(),
        messages: Array.isArray(messages) ? messages : [],
      });
    } catch (err) {
      console.warn("[Socket.io] Ticket DB save fallback:", err.message);
      savedTicket = {
        _id: "tkt_" + Date.now(),
        userName,
        userPhone,
        issueDescription: issueDescription.trim(),
        category,
        status: "escalated",
        escalatedAt: new Date(),
        createdAt: new Date(),
        messages: messages || [],
      };
    }

    const ticketPayload = {
      ...(savedTicket.toObject ? savedTicket.toObject() : savedTicket),
      formattedTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    // Immediately broadcast high-priority new_admin_alert to 'admin_room'
    io.to("admin_room").emit("new_admin_alert", {
      type: "escalation",
      title: "🚨 Urgent: New Support Escalation from AI Triage",
      ticket: ticketPayload,
      timestamp: new Date(),
    });

    // Also notify the sender that their ticket has been routed to the desk
    socket.emit("ticket_escalated_ack", {
      success: true,
      ticketId: ticketPayload._id,
      message: "Ticket successfully escalated to Federation Desk Admin.",
    });
  });

  // 3. Admin takes over the live ticket
  socket.on("admin_take_over", async ({ ticketId, adminName = "Federation Desk Steward" }) => {
    if (!ticketId) return;

    try {
      if (!ticketId.startsWith("tkt_")) {
        await Ticket.findByIdAndUpdate(ticketId, {
          status: "in-progress",
          assignedAdmin: adminName,
        });
      }
    } catch (e) {}

    io.to("admin_room").emit("ticket_updated", {
      ticketId,
      status: "in-progress",
      assignedAdmin: adminName,
      message: `${adminName} has taken over Ticket #${ticketId.slice(-6)}`,
    });
  });

  // 4. Admin resolves the ticket
  socket.on("resolve_ticket", async ({ ticketId, resolutionNotes = "Resolved by Federation Desk" }) => {
    if (!ticketId) return;

    try {
      if (!ticketId.startsWith("tkt_")) {
        await Ticket.findByIdAndUpdate(ticketId, {
          status: "resolved",
          resolutionNotes,
        });
      }
    } catch (e) {}

    io.to("admin_room").emit("ticket_updated", {
      ticketId,
      status: "resolved",
      resolutionNotes,
      message: `Ticket #${ticketId.slice(-6)} resolved.`,
    });
  });
};
