import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useTranslation } from "react-i18next";
import { showToast } from "../../toast";
import { API_URL } from "../../api";

const BACKEND_URL = API_URL;

// Web Audio API tone generator
const playTone = (type = "receive") => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "send") {
      osc.frequency.setValueAtTime(540, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === "confirm") {
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.09, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } else {
      osc.frequency.setValueAtTime(720, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(940, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    }
  } catch (e) {}
};

// 5 Demo Workers from Seed
const DEFAULT_CHATS = [
  {
    _id: "66d000000000000000000001",
    workerId: "w1",
    name: "Ramesh Kumar",
    trade: "Electrician",
    gender: "Male",
    hourlyRate: 250,
    sakhiVerified: false,
    avatar: "/illustrations/electrician.jpg",
    status: "online",
    verified: true,
    rating: 4.8,
    coopId: "DEL-ELEC-4102",
    unread: 1,
    lastMessage: "Namaste! Main Havells MCB switchboard spare part saath leke aa sakta hoon.",
    updatedAt: "10:41 AM",
    messages: [
      {
        _id: "m1",
        sender: "worker",
        senderModel: "Worker",
        text: "Namaste! Main Ramesh Kumar, Delhi Cooperative Electrician Guild se.",
        time: "10:30 AM",
        isRead: true,
      },
      {
        _id: "m2",
        sender: "worker",
        senderModel: "Worker",
        text: "Aapki booking request receive hui hai. Main Connaught Place area mein hoon. Short circuit ka problem hai?",
        time: "10:32 AM",
        isRead: true,
      },
      {
        _id: "m3",
        sender: "user",
        senderModel: "User",
        text: "Haanji Ramesh ji, bedroom ka switchboard spark kar raha hai. ₹200 mein inspection aur wiring check ho jayegi?",
        time: "10:38 AM",
        isRead: true,
      },
    ],
  },
  {
    _id: "66d000000000000000000002",
    workerId: "w2",
    name: "Sunita Devi",
    trade: "Beautician & Personal Care",
    gender: "Female",
    hourlyRate: 400,
    sakhiVerified: true,
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=250&auto=format&fit=crop&q=80",
    status: "online",
    verified: true,
    rating: 4.9,
    coopId: "DEL-SAKHI-2291",
    unread: 0,
    lastMessage: "Pranaam! ♀ Sakhi Verified kit saath hai. 4 PM appointment confirmed.",
    updatedAt: "Yesterday",
    messages: [
      {
        _id: "m21",
        sender: "worker",
        senderModel: "Worker",
        text: "Pranaam! Main Sunita Devi, ♀ Sakhi Trust Lead Guild se. 100% organic skincare products ke saath doorstep service available hai.",
        time: "Yesterday",
        isRead: true,
      },
      {
        _id: "m22",
        sender: "user",
        senderModel: "User",
        text: "Sunita ji, herbal facial aur hair spa service book karni hai South Delhi ke liye.",
        time: "Yesterday",
        isRead: true,
      },
    ],
  },
  {
    _id: "66d000000000000000000003",
    workerId: "w3",
    name: "Ali Raza",
    trade: "Carpenter",
    gender: "Male",
    hourlyRate: 350,
    sakhiVerified: false,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80",
    status: "last seen today at 9:15 AM",
    verified: true,
    rating: 4.5,
    coopId: "GUR-CARP-3384",
    unread: 0,
    lastMessage: "Wardrobe hydraulic hinges replace karne ke liye ₹300 fair standard rate rahega.",
    updatedAt: "Yesterday",
    messages: [
      {
        _id: "m31",
        sender: "worker",
        senderModel: "Worker",
        text: "Adaab! Main Ali Raza, modular kitchen aur wardrobe repairs Gurugram DLF area mein cover karta hoon.",
        time: "Yesterday",
        isRead: true,
      },
    ],
  },
  {
    _id: "66d000000000000000000004",
    workerId: "w4",
    name: "Priya Sharma",
    trade: "Appliance Repair & HVAC",
    gender: "Female",
    hourlyRate: 300,
    sakhiVerified: true,
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=250&auto=format&fit=crop&q=80",
    status: "last seen today at 8:40 AM",
    verified: true,
    rating: 4.7,
    coopId: "DEL-SAKHI-4475",
    unread: 0,
    lastMessage: "AC jet wash aur pressure check 45 minutes mein complete ho jayega.",
    updatedAt: "Sep 6",
    messages: [
      {
        _id: "m41",
        sender: "worker",
        senderModel: "Worker",
        text: "Namaste! Main Priya Sharma, ITI certified ♀ Sakhi AC & refrigerator technician. North Delhi Rohini sector.",
        time: "Sep 6",
        isRead: true,
      },
    ],
  },
  {
    _id: "66d000000000000000000005",
    workerId: "w5",
    name: "Vikram Singh",
    trade: "Plumber",
    gender: "Male",
    hourlyRate: 200,
    sakhiVerified: false,
    avatar: "/illustrations/plumber.jpg",
    status: "online",
    verified: true,
    rating: 4.6,
    coopId: "NOI-PLUMB-5566",
    unread: 0,
    lastMessage: "Main toolkit leke nikal gaya hoon. 15 minute mein aapke location par pahunch raha hoon.",
    updatedAt: "Aug 30",
    messages: [
      {
        _id: "m51",
        sender: "worker",
        senderModel: "Worker",
        text: "Namaste! Main Vikram Singh, Noida Sector 18 Plumber Guild. Kitchen sink leak ka standard ₹200 cooperative rate lagega.",
        time: "Aug 30",
        isRead: true,
      },
    ],
  },
];

const WORKER_REPLIES = [
  "Haanji, main message padh liya hai. 10-15 minute mein aapke gate par pahunch raha hoon.",
  "Ji theek hai, cooperative standard rates ke hisaab se hi bill banega. 0% extra surge.",
  "Tool kit saath hai, spare part ka original GST bill dunga. Aap fikar mat kijiye.",
  "Main guard ke paas entry ke liye khada hoon. Kripya gate pass allow kar dijiye.",
  "Bahut dhanyawad! Kaam complete hone par aap Jan Dhan direct UPI payment kar sakte hain.",
];

export default function Messages({ initialWorker, onNavigate }) {
  const { t } = useTranslation();
  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem("gigconnect_chats_v3");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return DEFAULT_CHATS;
  });

  const [activeChatId, setActiveChatId] = useState(() => {
    if (initialWorker?.name) {
      const match = DEFAULT_CHATS.find(
        (c) => c.name.toLowerCase() === initialWorker.name.toLowerCase() ||
               c.trade.toLowerCase().includes(initialWorker.category?.toLowerCase() || "")
      );
      if (match) return match._id;
    }
    return DEFAULT_CHATS[0]._id;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  // Role Simulator Toggle: Customer or Worker view
  const [simulatedRole, setSimulatedRole] = useState("user"); // 'user' | 'worker'

  // ================= FAIR-BID STATE =================
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidPrice, setBidPrice] = useState(200);
  const [bidNote, setBidNote] = useState("");

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const activeChat = chats.find((c) => c._id === activeChatId) || chats[0];

  useEffect(() => {
    localStorage.setItem("gigconnect_chats_v3", JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages, isTyping, showBidModal]);

  // ================= 1. SOCKET.IO INTEGRATION =================
  useEffect(() => {
    const socket = io(BACKEND_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketConnected(true);
      socket.emit("join_chat", { conversationId: activeChatId });
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    // Listen for regular and bid messages
    socket.on("receive_message", (data) => {
      if (!data) return;

      const incomingMsg = {
        _id: data._id || "msg_" + Date.now(),
        sender: data.sender || (data.senderModel === "Worker" ? "worker" : "user"),
        senderModel: data.senderModel || "Worker",
        type: data.type || "text",
        proposedPrice: data.proposedPrice,
        bidStatus: data.bidStatus || "pending",
        agreedPrice: data.agreedPrice,
        text: data.text,
        time: data.time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isRead: Boolean(data.isRead),
      };

      if (incomingMsg.sender === "worker" || incomingMsg.type === "bid") {
        playTone("receive");
      }

      setChats((prevChats) =>
        prevChats.map((c) =>
          c._id === data.conversationId || c._id === activeChatId
            ? {
                ...c,
                lastMessage: data.text,
                updatedAt: incomingMsg.time,
                messages: [...c.messages, incomingMsg],
              }
            : c
        )
      );
    });

    // Listen for bid acceptance event
    socket.on("bid_accepted", (data) => {
      playTone("confirm");
      showToast(`🎉 Booking Confirmed at ₹${data.agreedPrice}!`);

      setChats((prevChats) =>
        prevChats.map((c) =>
          c._id === data.conversationId || c._id === activeChatId
            ? {
                ...c,
                lastMessage: `🎉 Fare Accepted at ₹${data.agreedPrice}`,
                messages: c.messages.map((m) =>
                  m.type === "bid" ? { ...m, bidStatus: "accepted", agreedPrice: data.agreedPrice } : m
                ),
              }
            : c
        )
      );
    });

    // Typing indicators
    socket.on("typing", (data) => {
      if (data.conversationId === activeChatId) setIsTyping(true);
    });

    socket.on("stop_typing", (data) => {
      if (data.conversationId === activeChatId) setIsTyping(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [activeChatId]);

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
    setShowBidModal(false);
    if (socketRef.current) {
      socketRef.current.emit("join_chat", { conversationId: chatId });
    }
    setChats((prev) =>
      prev.map((c) => (c._id === chatId ? { ...c, unread: 0 } : c))
    );
  };

  // ================= 2. SEND STANDARD TEXT MESSAGE =================
  const handleSendMessage = (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    playTone("send");

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const clientTempId = "temp_" + Date.now();

    const userMsg = {
      _id: clientTempId,
      sender: simulatedRole === "worker" ? "worker" : "user",
      senderModel: simulatedRole === "worker" ? "Worker" : "User",
      text,
      time: timeStr,
      isRead: false,
    };

    setChats((prev) =>
      prev.map((c) =>
        c._id === activeChatId
          ? {
              ...c,
              lastMessage: text,
              updatedAt: timeStr,
              messages: [...c.messages, userMsg],
            }
          : c
      )
    );

    setInputText("");

    // Emit send_message via Socket.io
    if (socketRef.current) {
      socketRef.current.emit("send_message", {
        conversationId: activeChatId,
        senderId: simulatedRole === "worker" ? "worker_current" : "customer_current",
        senderModel: simulatedRole === "worker" ? "Worker" : "User",
        text,
        clientTempId,
      });
      socketRef.current.emit("stop_typing", { conversationId: activeChatId });
    }

    // Auto-worker response simulation
    if (simulatedRole === "user") {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        playTone("receive");

        const randomReply = WORKER_REPLIES[Math.floor(Math.random() * WORKER_REPLIES.length)];
        const workerReply = {
          _id: "reply_" + Date.now(),
          sender: "worker",
          senderModel: "Worker",
          text: randomReply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isRead: true,
        };

        setChats((prev) =>
          prev.map((c) =>
            c._id === activeChatId
              ? {
                  ...c,
                  lastMessage: randomReply,
                  updatedAt: workerReply.time,
                  messages: [...c.messages, workerReply],
                }
              : c
          )
        );
      }, 1400);
    }
  };

  // ================= 3. FEATURE 3: SEND FAIR-BID (PROPOSE FARE) =================
  const handleSendBid = (e) => {
    e?.preventDefault();
    const priceNum = Number(bidPrice);
    if (!priceNum || priceNum <= 0) {
      showToast("Please enter a valid fare offer amount.");
      return;
    }

    playTone("send");
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const bidId = "bid_" + Date.now();

    const bidMsg = {
      _id: bidId,
      conversationId: activeChatId,
      sender: simulatedRole === "worker" ? "worker" : "user",
      senderModel: simulatedRole === "worker" ? "Worker" : "User",
      type: "bid",
      proposedPrice: priceNum,
      serviceTitle: activeChat.trade,
      note: bidNote || "Cooperative Fair-Bid Proposal",
      bidStatus: "pending",
      text: `💰 Fare Proposal: ₹${priceNum}`,
      time: timeStr,
      isRead: false,
    };

    // Update local state instantly
    setChats((prev) =>
      prev.map((c) =>
        c._id === activeChatId
          ? {
              ...c,
              lastMessage: `💰 Fare Proposed: ₹${priceNum}`,
              updatedAt: timeStr,
              messages: [...c.messages, bidMsg],
            }
          : c
      )
    );

    setShowBidModal(false);
    setBidNote("");
    showToast(`Fair-bid offer of ₹${priceNum} sent to ${activeChat.name}!`);

    // Emit send_bid over Socket.io
    if (socketRef.current) {
      socketRef.current.emit("send_bid", {
        conversationId: activeChatId,
        proposedPrice: priceNum,
        senderId: simulatedRole === "worker" ? "worker_current" : "customer_current",
        senderModel: simulatedRole === "worker" ? "Worker" : "User",
        serviceTitle: activeChat.trade,
        note: bidNote,
      });
    }

    // If customer sent bid, simulate worker accepting or reacting
    if (simulatedRole === "user") {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        handleAcceptBid(bidId, priceNum, activeChat.name);
      }, 2500);
    }
  };

  // ================= 4. FEATURE 3: ACCEPT FAIR-BID =================
  const handleAcceptBid = (bidId, agreedPrice, workerName = activeChat.name) => {
    playTone("confirm");
    showToast(`Booking Confirmed at ₹${agreedPrice}!`);

    // Emit accept_bid over Socket.io
    if (socketRef.current) {
      socketRef.current.emit("accept_bid", {
        conversationId: activeChatId,
        bidId,
        agreedPrice: Number(agreedPrice),
        acceptedBy: workerName,
      });
    }

    // Update local state
    setChats((prev) =>
      prev.map((c) =>
        c._id === activeChatId
          ? {
              ...c,
              lastMessage: `🎉 Fare Accepted at ₹${agreedPrice}`,
              messages: [
                ...c.messages.map((m) =>
                  m._id === bidId ? { ...m, bidStatus: "accepted", agreedPrice } : m
                ),
                {
                  _id: "conf_" + Date.now(),
                  sender: "system",
                  senderModel: "System",
                  type: "confirmation",
                  agreedPrice,
                  text: `✓ Booking Confirmed with ${workerName} at ₹${agreedPrice}! Escrow & insurance active.`,
                  time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                },
              ],
            }
          : c
      )
    );
  };

  const quickActionChips = [
    "📍 Share my live location",
    "⏱️ Kab tak aa rahe hain?",
    "💰 Send cooperative tariff estimate",
    "🏠 Main ghar par hi hoon",
    "✅ Service completed, sending payment",
  ];

  const filteredChats = chats.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.trade.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-[calc(100vh-80px)] flex bg-white font-sans overflow-hidden">
      
      {/* ================= LEFT SIDEBAR (w-1/3 max-w-sm) ================= */}
      <aside className="w-full md:w-1/3 md:max-w-sm bg-white border-r border-slate-200 flex flex-col h-full flex-shrink-0 z-10">
        
        {/* Sidebar Header & Search */}
        <div className="p-3.5 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-slate-900 tracking-tight">Messages</span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-xl text-[11px] font-bold border border-emerald-200 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${socketConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`} />
                {socketConnected ? "Live Socket" : "Online"}
              </span>
            </div>

            {/* Role Simulation Switch for SIH Demo */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setSimulatedRole("user")}
                className={`px-2 py-0.5 text-[11px] font-bold rounded-lg transition-colors border-none cursor-pointer ${
                  simulatedRole === "user" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 bg-transparent"
                }`}
                title="View as Customer"
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => setSimulatedRole("worker")}
                className={`px-2 py-0.5 text-[11px] font-bold rounded-lg transition-colors border-none cursor-pointer ${
                  simulatedRole === "worker" ? "bg-white text-emerald-700 shadow-xs" : "text-slate-500 bg-transparent"
                }`}
                title="Simulate as Worker"
              >
                Worker
              </button>
            </div>
          </div>

          <div className="relative flex items-center bg-slate-100 rounded-xl px-3 py-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/30 transition-all border border-transparent focus-within:border-emerald-400">
            <span className="material-symbols-outlined text-[19px] text-slate-400 mr-2">search</span>
            <input
              type="text"
              placeholder="Search chats or trades..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none border-none"
            />
          </div>
        </div>

        {/* Active Chats List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredChats.map((chat) => {
            const isActive = chat._id === activeChatId;

            return (
              <div
                key={chat._id}
                onClick={() => handleSelectChat(chat._id)}
                className={`p-3.5 flex items-center gap-3 cursor-pointer transition-all ${
                  isActive ? "bg-slate-100/80 border-l-4 border-emerald-500" : "hover:bg-slate-50"
                }`}
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={chat.avatar}
                    alt={chat.name}
                    className={`w-12 h-12 rounded-2xl object-cover border ${
                      chat.sakhiVerified ? "border-pink-300 ring-2 ring-pink-400/40" : "border-slate-200"
                    }`}
                  />
                  {chat.status === "online" && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-bold text-slate-900 truncate flex items-center gap-1">
                      {chat.name}
                      {chat.sakhiVerified && (
                        <span className="text-[11px] text-pink-600 font-extrabold" title="♀ Sakhi Verified">
                          ♀
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium flex-shrink-0">
                      {chat.updatedAt}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500 truncate m-0 max-w-[210px]">
                      {chat.lastMessage}
                    </p>

                    {chat.unread > 0 && (
                      <span className="w-5 h-5 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0 ml-1.5 shadow-2xs">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Guarantee */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center flex-shrink-0">
          <span className="text-[11px] text-slate-500 font-medium flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-emerald-600">shield</span>
            Fair-Bid &amp; 0% Commission Direct Worker Guarantee
          </span>
        </div>
      </aside>

      {/* ================= RIGHT CHAT AREA (w-2/3 flex-1) ================= */}
      <main className="w-full md:w-2/3 flex-1 flex flex-col h-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] relative overflow-hidden">
        
        {/* Chat Header Bar */}
        <div className="h-16 px-6 bg-white/95 backdrop-blur-md border-b border-slate-200 flex items-center justify-between flex-shrink-0 z-10 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <img
                src={activeChat.avatar}
                alt={activeChat.name}
                className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-sm"
              />
              {activeChat.status === "online" && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-extrabold text-slate-900 m-0 truncate">
                  {activeChat.name}
                </h3>
                {activeChat.sakhiVerified ? (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.2 bg-gradient-to-r from-pink-50 to-purple-50 text-pink-700 border border-pink-200 rounded-md text-[10px] font-extrabold">
                    ♀ Sakhi Safe
                  </span>
                ) : (
                  <span className="inline-flex items-center px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold">
                    Co-op Certified
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 m-0 truncate">
                {isTyping ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    typing<span className="animate-pulse">...</span>
                  </span>
                ) : activeChat.status === "online" ? (
                  <span className="text-emerald-600 font-semibold">
                    online • {activeChat.trade} • Base: ₹{activeChat.hourlyRate}/hr
                  </span>
                ) : (
                  <span>{activeChat.status}</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate("booking", activeChat)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all border-none cursor-pointer flex items-center gap-1 shadow-sm active:scale-95"
            >
              <span className="material-symbols-outlined text-[15px]">calendar_month</span>
              <span>Book Direct</span>
            </button>
          </div>
        </div>

        {/* Top Warning Banner with lock icon */}
        <div className="px-4 pt-3 flex-shrink-0">
          <div className="max-w-2xl mx-auto p-2.5 bg-[#fef3c7] border border-[#fde68a] text-[#92400e] rounded-xl text-center shadow-2xs">
            <p className="text-xs m-0 font-medium flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#b45309]">lock</span>
              <span>
                Direct end-to-end chat with <strong>{activeChat.name}</strong>. Rates protected under Multi-State Cooperative guidelines.
              </span>
            </p>
          </div>
        </div>

        {/* Date Divider */}
        <div className="flex justify-center my-2 flex-shrink-0">
          <span className="px-3 py-1 bg-white/90 backdrop-blur rounded-full text-[11px] font-bold text-slate-500 shadow-2xs uppercase tracking-wider">
            TODAY
          </span>
        </div>

        {/* Message Bubbles Scrolling Feed */}
        <div className="flex-1 overflow-y-auto px-6 py-2 space-y-3.5">
          {activeChat.messages.map((msg) => {
            const isUser = msg.sender === "user" || msg.senderModel === "User";
            const isSystem = msg.sender === "system" || msg.type === "confirmation";
            const isBid = msg.type === "bid";

            // System Confirmation Bubble
            if (isSystem) {
              return (
                <div key={msg._id} className="flex justify-center my-3 animate-in zoom-in-95">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl max-w-md text-center shadow-sm">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-800 mb-0.5">
                      <span className="material-symbols-outlined text-[18px] text-emerald-600">verified</span>
                      <span>Booking Confirmed via Cooperative Fair-Bid</span>
                    </div>
                    <p className="text-xs m-0 text-emerald-700">{msg.text}</p>
                    <span className="text-[10px] text-emerald-600 block mt-1">{msg.time}</span>
                  </div>
                </div>
              );
            }

            // ================= FEATURE 3: IN-CHAT FAIR-BID CARD =================
            if (isBid) {
              const isAccepted = msg.bidStatus === "accepted";

              return (
                <div
                  key={msg._id}
                  className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <img
                      src={activeChat.avatar}
                      alt={activeChat.name}
                      className="w-7 h-7 rounded-xl object-cover mb-1 flex-shrink-0 border border-slate-200"
                    />
                  )}

                  {/* Mini-Invoice Styled Bid Card */}
                  <div className="bg-white border-2 border-emerald-500/80 rounded-2xl p-4 max-w-sm sm:max-w-md shadow-md text-slate-900 animate-in zoom-in-95">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px] text-emerald-600">receipt_long</span>
                        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                          Fair-Bid Proposal
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${
                          isAccepted
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {isAccepted ? "Accepted ✓" : "Pending Acceptance"}
                      </span>
                    </div>

                    {/* Proposal Details */}
                    <div className="mb-3">
                      <span className="text-xs text-slate-500 block">
                        {isUser ? "Customer proposes:" : `${activeChat.name} proposes:`}
                      </span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-2xl font-black text-emerald-700">₹{msg.proposedPrice}</span>
                        <span className="text-xs text-slate-400 line-through">₹{activeChat.hourlyRate || 350}</span>
                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                          0% Middleman Surge
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 m-0">
                        {msg.note || `Cooperative standard tariff deal for ${activeChat.trade}.`}
                      </p>
                    </div>

                    {/* Fair Tariff Breakdown */}
                    <div className="bg-slate-50 rounded-xl p-2.5 mb-3 text-[11px] text-slate-600 space-y-1 border border-slate-100">
                      <div className="flex justify-between">
                        <span>Worker Payout:</span>
                        <span className="font-bold text-slate-900">₹{msg.proposedPrice} (100% Direct)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Platform Commission:</span>
                        <span className="font-bold text-emerald-600">₹0 (Co-op Guarantee)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Accident &amp; Escrow Insurance:</span>
                        <span className="font-bold text-emerald-600">FREE</span>
                      </div>
                    </div>

                    {/* Accept & Counter Action Buttons */}
                    {!isAccepted ? (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleAcceptBid(msg._id, msg.proposedPrice, activeChat.name)}
                          className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 border-none cursor-pointer flex items-center justify-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[15px]">check_circle</span>
                          <span>Accept ₹{msg.proposedPrice}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setBidPrice(msg.proposedPrice + 50);
                            setShowBidModal(true);
                          }}
                          className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all border border-slate-200 cursor-pointer"
                        >
                          Counter Offer
                        </button>
                      </div>
                    ) : (
                      <div className="p-2 bg-emerald-50 rounded-xl text-center text-xs font-bold text-emerald-800 flex items-center justify-center gap-1 border border-emerald-200">
                        <span className="material-symbols-outlined text-[16px]">verified</span>
                        <span>Locked &amp; Confirmed at ₹{msg.agreedPrice || msg.proposedPrice}</span>
                      </div>
                    )}

                    <div className="text-right text-[10px] text-slate-400 mt-2">{msg.time}</div>
                  </div>
                </div>
              );
            }

            // Standard Text Chat Bubble
            return (
              <div
                key={msg._id}
                className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <img
                    src={activeChat.avatar}
                    alt={activeChat.name}
                    className="w-7 h-7 rounded-xl object-cover mb-1 flex-shrink-0 border border-slate-200"
                  />
                )}

                <div
                  className={`relative max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                    isUser
                      ? "bg-[#dcf8c6] text-slate-900 rounded-tr-none"
                      : "bg-white text-slate-900 rounded-tl-none border border-slate-100"
                  }`}
                >
                  <p className="m-0 leading-relaxed text-[13.5px] whitespace-pre-wrap">{msg.text}</p>
                  <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-500 font-medium select-none">
                    <span>{msg.time}</span>
                    {isUser && (
                      <span className="text-[#53bdeb] font-bold text-[13px]">✓✓</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-end gap-2 justify-start animate-in fade-in duration-200">
              <img
                src={activeChat.avatar}
                alt={activeChat.name}
                className="w-7 h-7 rounded-xl object-cover mb-1 flex-shrink-0 border border-slate-200"
              />
              <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ================= FEATURE 3: INLINE FAIR-BID PROPOSAL INPUT ================= */}
        {showBidModal && (
          <div className="mx-4 mb-2 p-3.5 bg-gradient-to-r from-emerald-50 via-white to-emerald-50 border-2 border-emerald-500/70 rounded-2xl shadow-lg animate-in slide-in-from-bottom-3 duration-200 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[20px] text-emerald-600">gavel</span>
                <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Fair-Bid Fare Negotiation
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowBidModal(false)}
                className="text-slate-400 hover:text-slate-600 material-symbols-outlined text-[18px] border-none bg-transparent cursor-pointer"
              >
                close
              </button>
            </div>

            <form onSubmit={handleSendBid} className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[140px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-slate-700">₹</span>
                <input
                  type="number"
                  min="50"
                  step="10"
                  value={bidPrice}
                  onChange={(e) => setBidPrice(e.target.value)}
                  placeholder="Proposed Fare (₹)"
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Quick Price Buttons */}
              <div className="flex items-center gap-1">
                {[150, 200, 250, 300].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setBidPrice(preset)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-all ${
                      bidPrice === preset
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-emerald-50"
                    }`}
                  >
                    ₹{preset}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all border-none cursor-pointer flex items-center gap-1 flex-shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
                <span>Send Bid Card</span>
              </button>
            </form>
          </div>
        )}

        {/* Quick Action Chips Row + Bargain Trigger */}
        <div className="px-4 py-2 bg-white/80 backdrop-blur border-t border-slate-200/70 flex items-center gap-2 overflow-x-auto no-scrollbar flex-shrink-0">
          {/* Prominent Bargain / Fair-Bid Button */}
          <button
            type="button"
            onClick={() => setShowBidModal(!showBidModal)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-full text-xs font-black whitespace-nowrap shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0 active:scale-95 border-none"
          >
            <span className="material-symbols-outlined text-[15px]">gavel</span>
            <span>Bargain / Propose Fare</span>
          </button>

          {quickActionChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(chip)}
              className="px-3 py-1.5 bg-white hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 border border-slate-200 hover:border-emerald-300 rounded-full text-xs font-semibold whitespace-nowrap shadow-2xs transition-all cursor-pointer flex-shrink-0 active:scale-95"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="h-16 px-4 bg-white border-t border-slate-200 flex items-center gap-2.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => handleSendMessage("📎 [Attached photo of issue for estimate]")}
            title="Attach File / Photo"
            className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors border-none bg-transparent cursor-pointer flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[22px]">attach_file</span>
          </button>

          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Type a message to worker..."
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                if (socketRef.current) {
                  socketRef.current.emit("typing", {
                    conversationId: activeChatId,
                    senderName: simulatedRole === "worker" ? activeChat.name : "Customer",
                  });
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="w-full py-2.5 px-5 bg-slate-100 border border-transparent focus:border-emerald-500 focus:bg-white rounded-full text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-all shadow-inner"
            />
          </div>

          {inputText.trim() ? (
            <button
              type="button"
              onClick={() => handleSendMessage()}
              title="Send Message"
              className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-all border-none cursor-pointer shadow-sm active:scale-95 flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[19px]">send</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSendMessage("🎙️ Voice Note (0:12) sent: 'Bhaiya rates check kar lijiye.'")}
              title="Send Voice Note"
              className="w-10 h-10 rounded-full hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors border-none bg-transparent cursor-pointer flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[22px]">mic</span>
            </button>
          )}
        </div>

      </main>
    </div>
  );
}
