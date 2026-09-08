import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import Worker from "../models/Worker.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

// Initial seed threads for cooperative workers
export const INITIAL_SEEDED_CHATS = [
  {
    _id: "66d000000000000000000001",
    workerId: "w1",
    name: "Rameshwar Kumar",
    trade: "Senior Co-op Plumber",
    avatar: "/illustrations/plumber.jpg",
    status: "online",
    verified: true,
    rating: 4.9,
    coopId: "DEL-PLUMB-2910",
    phone: "+91 98112 34567",
    unread: 1,
    lastMessage: "Main toolkit leke nikal gaya hoon. 15 minute mein aapke location par pahunch raha hoon. Cooperative standard rate ₹250 lagega, zero surge!",
    updatedAt: new Date(Date.now() - 5 * 60 * 1000),
    messages: [
      {
        _id: "msg_1",
        sender: "worker",
        senderModel: "Worker",
        text: "Namaste! Main Rameshwar, GigConnect Delhi Plumbers Cooperative se.",
        createdAt: new Date(Date.now() - 35 * 60 * 1000),
        time: "10:30 AM",
        isRead: true,
      },
      {
        _id: "msg_2",
        sender: "worker",
        senderModel: "Worker",
        text: "Aapki booking request receive hui hai. Main DLF Phase 3 ke paas hoon. Bathroom pipe leak ki photo bhej sakte hain?",
        createdAt: new Date(Date.now() - 33 * 60 * 1000),
        time: "10:32 AM",
        isRead: true,
      },
      {
        _id: "msg_3",
        sender: "user",
        senderModel: "User",
        text: "Haanji Rameshwar ji, kitchen sink ke neeche se paani drip ho raha hai. Kab tak aa sakte hain?",
        createdAt: new Date(Date.now() - 25 * 60 * 1000),
        time: "10:38 AM",
        isRead: true,
      },
      {
        _id: "msg_4",
        sender: "worker",
        senderModel: "Worker",
        text: "Main toolkit leke nikal gaya hoon. 15 minute mein aapke location par pahunch raha hoon. Cooperative standard rate ₹250 lagega, zero surge!",
        createdAt: new Date(Date.now() - 5 * 60 * 1000),
        time: "10:41 AM",
        isRead: false,
      },
    ],
  },
  {
    _id: "66d000000000000000000002",
    workerId: "w2",
    name: "Rajesh Verma",
    trade: "Certified Electrician",
    avatar: "/illustrations/electrician.jpg",
    status: "online",
    verified: true,
    rating: 4.8,
    coopId: "DEL-ELEC-4102",
    phone: "+91 98223 78901",
    unread: 0,
    lastMessage: "Short circuit ya heavy load ka issue ho sakta hai. Main Havells heavy-duty MCB spare part saath la raha hoon.",
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    messages: [
      {
        _id: "msg_21",
        sender: "worker",
        senderModel: "Worker",
        text: "Namaste! Main Rajesh Verma, Saket Ward 14 Electrician Guild.",
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
        time: "Yesterday",
        isRead: true,
      },
      {
        _id: "msg_22",
        sender: "user",
        senderModel: "User",
        text: "Bhaiya, drawing room ka main MCB bar-bar trip ho raha hai.",
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        time: "Yesterday",
        isRead: true,
      },
      {
        _id: "msg_23",
        sender: "worker",
        senderModel: "Worker",
        text: "Short circuit ya heavy load ka issue ho sakta hai. Main Havells heavy-duty MCB spare part saath la raha hoon. Standard union rates apply honge.",
        createdAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
        time: "Yesterday",
        isRead: true,
      },
    ],
  },
  {
    _id: "66d000000000000000000003",
    workerId: "w3",
    name: "Sunita Devi",
    trade: "Home Chef & Meal Prep",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=250&auto=format&fit=crop&q=80",
    status: "last seen today at 9:15 AM",
    verified: true,
    rating: 5.0,
    coopId: "DEL-CHEF-1044",
    phone: "+91 97114 55667",
    unread: 0,
    lastMessage: "Ji bilkul, theek 6:30 PM pahunch jaungi. Dhanyawad!",
    updatedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    messages: [
      {
        _id: "msg_31",
        sender: "worker",
        senderModel: "Worker",
        text: "Pranaam! Aaj shaam ke dinner ke liye Shahi Paneer, Dal Makhani aur phulke ready kar sakti hoon. Masale aur ingredients aapke ghar ke use honge.",
        createdAt: new Date(Date.now() - 49 * 60 * 60 * 1000),
        time: "Yesterday",
        isRead: true,
      },
      {
        _id: "msg_32",
        sender: "user",
        senderModel: "User",
        text: "Sunita ji, 4 logon ke liye preparation karni hai. 6:30 PM tak aa jaiyega.",
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        time: "Yesterday",
        isRead: true,
      },
      {
        _id: "msg_33",
        sender: "worker",
        senderModel: "Worker",
        text: "Ji bilkul, theek 6:30 PM pahunch jaungi. Dhanyawad!",
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        time: "Yesterday",
        isRead: true,
      },
    ],
  },
  {
    _id: "66d000000000000000000004",
    workerId: "w4",
    name: "Mohammad Irfan",
    trade: "AC & Refrigeration Specialist",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80",
    status: "last seen today at 8:40 AM",
    verified: true,
    rating: 4.9,
    coopId: "NOI-HVAC-8812",
    phone: "+91 99110 22334",
    unread: 0,
    lastMessage: "Thank you Irfan ji, bahut achhi cooling ho rahi hai.",
    updatedAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
    messages: [
      {
        _id: "msg_41",
        sender: "worker",
        senderModel: "Worker",
        text: "Jet pump cleaning aur gas pressure check ho gaya hai. AC 16°C par super chilled chal raha hai.",
        createdAt: new Date(Date.now() - 73 * 60 * 60 * 1000),
        time: "Sep 6",
        isRead: true,
      },
      {
        _id: "msg_42",
        sender: "user",
        senderModel: "User",
        text: "Thank you Irfan ji, bahut achhi cooling ho rahi hai.",
        createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
        time: "Sep 6",
        isRead: true,
      },
    ],
  },
  {
    _id: "66d000000000000000000005",
    workerId: "w5",
    name: "GigConnect Sahayata Kendra",
    trade: "Official Co-op Helpdesk",
    avatar: "/illustrations/happy-customer.jpg",
    status: "online",
    verified: true,
    rating: 5.0,
    coopId: "COOP-FED-001",
    phone: "1800-GIG-COOP",
    unread: 0,
    lastMessage: "Kisi bhi booking, bill, ya standard rate card ki jankari ke liye yahan message karein.",
    updatedAt: new Date(Date.now() - 120 * 60 * 60 * 1000),
    messages: [
      {
        _id: "msg_51",
        sender: "worker",
        senderModel: "Worker",
        text: "Namaste! GigConnect Sahakari Samiti Helpline par aapka swagat hai. Yahan sabhi karigar 100% Aadhaar verified aur cooperative ke barabar hissedar hain.",
        createdAt: new Date(Date.now() - 121 * 60 * 60 * 1000),
        time: "Aug 30",
        isRead: true,
      },
      {
        _id: "msg_52",
        sender: "worker",
        senderModel: "Worker",
        text: "Kisi bhi booking, bill, ya standard rate card ki jankari ke liye yahan message karein.",
        createdAt: new Date(Date.now() - 120 * 60 * 60 * 1000),
        time: "Aug 30",
        isRead: true,
      },
    ],
  },
];

/**
 * @desc Get all conversations for current logged-in user or worker
 * @route GET /api/chats
 * @access Private
 */
export const getConversations = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  let dbConversations = [];
  if (userId) {
    dbConversations = await Conversation.find({ participants: userId })
      .populate("participants", "name avatar phone role trade")
      .sort({ updatedAt: -1 })
      .lean();
  }

  // If MongoDB has real conversations, return them
  if (dbConversations.length > 0) {
    return res.status(200).json({
      success: true,
      data: dbConversations,
    });
  }

  // Otherwise return cooperative seeded threads
  return res.status(200).json({
    success: true,
    data: INITIAL_SEEDED_CHATS,
  });
});

/**
 * @desc Get message history for a specific conversation
 * @route GET /api/chats/:conversationId
 * @access Private
 */
export const getMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;

  if (!conversationId) {
    throw new ApiError(400, "conversationId parameter is required");
  }

  // Check MongoDB for messages
  let messages = [];
  try {
    messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .lean();
  } catch (err) {
    // Non-ObjectId or custom seed ID
  }

  if (messages.length > 0) {
    return res.status(200).json({
      success: true,
      data: messages,
    });
  }

  // Fallback to seeded thread messages if matched
  const seed = INITIAL_SEEDED_CHATS.find((c) => c._id === conversationId || c.workerId === conversationId);
  return res.status(200).json({
    success: true,
    data: seed ? seed.messages : [],
  });
});

/**
 * @desc Send a message in a conversation
 * @route POST /api/chats/:conversationId/messages
 * @access Private
 */
export const sendMessage = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { text, senderModel = "User" } = req.body;
  const senderId = req.user?._id;

  if (!text || !text.trim()) {
    throw new ApiError(400, "Message text is required");
  }

  let savedMessage;
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
    // Fallback object for seed/demo IDs
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

  res.status(201).json({
    success: true,
    data: savedMessage,
  });
});
