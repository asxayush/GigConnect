import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useTranslation } from "react-i18next";

const BACKEND_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");

// Sound effect generator using Web Audio API
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

const DEFAULT_CHATS = [
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
    unread: 1,
    lastMessage: "Main toolkit leke nikal gaya hoon. 15 minute mein aapke location par pahunch raha hoon. Cooperative standard rate ₹250 lagega, zero surge!",
    updatedAt: "10:41 AM",
    messages: [
      {
        _id: "m1",
        sender: "worker",
        senderModel: "Worker",
        text: "Namaste! Main Rameshwar, GigConnect Delhi Plumbers Cooperative se.",
        time: "10:30 AM",
        isRead: true,
      },
      {
        _id: "m2",
        sender: "worker",
        senderModel: "Worker",
        text: "Aapki booking request receive hui hai. Main DLF Phase 3 ke paas hoon. Bathroom pipe leak ki photo bhej sakte hain?",
        time: "10:32 AM",
        isRead: true,
      },
      {
        _id: "m3",
        sender: "user",
        senderModel: "User",
        text: "Haanji Rameshwar ji, kitchen sink ke neeche se paani drip ho raha hai. Kab tak aa sakte hain?",
        time: "10:38 AM",
        isRead: true,
      },
      {
        _id: "m4",
        sender: "worker",
        senderModel: "Worker",
        text: "Main toolkit leke nikal gaya hoon. 15 minute mein aapke location par pahunch raha hoon. Cooperative standard rate ₹250 lagega, zero surge!",
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
    unread: 0,
    lastMessage: "Short circuit ya heavy load ka issue ho sakta hai. Main Havells heavy-duty MCB spare part saath la raha hoon.",
    updatedAt: "Yesterday",
    messages: [
      {
        _id: "m21",
        sender: "worker",
        senderModel: "Worker",
        text: "Namaste! Main Rajesh Verma, Saket Ward 14 Electrician Guild.",
        time: "Yesterday",
        isRead: true,
      },
      {
        _id: "m22",
        sender: "user",
        senderModel: "User",
        text: "Bhaiya, drawing room ka main MCB bar-bar trip ho raha hai.",
        time: "Yesterday",
        isRead: true,
      },
      {
        _id: "m23",
        sender: "worker",
        senderModel: "Worker",
        text: "Short circuit ya heavy load ka issue ho sakta hai. Main Havells heavy-duty MCB spare part saath la raha hoon. Standard union rates apply honge.",
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
    unread: 0,
    lastMessage: "Ji bilkul, theek 6:30 PM pahunch jaungi. Dhanyawad!",
    updatedAt: "Yesterday",
    messages: [
      {
        _id: "m31",
        sender: "worker",
        senderModel: "Worker",
        text: "Pranaam! Aaj shaam ke dinner ke liye Shahi Paneer, Dal Makhani aur phulke ready kar sakti hoon. Masale aur ingredients aapke ghar ke use honge.",
        time: "Yesterday",
        isRead: true,
      },
      {
        _id: "m32",
        sender: "user",
        senderModel: "User",
        text: "Sunita ji, 4 logon ke liye preparation karni hai. 6:30 PM tak aa jaiyega.",
        time: "Yesterday",
        isRead: true,
      },
      {
        _id: "m33",
        sender: "worker",
        senderModel: "Worker",
        text: "Ji bilkul, theek 6:30 PM pahunch jaungi. Dhanyawad!",
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
    unread: 0,
    lastMessage: "Thank you Irfan ji, bahut achhi cooling ho rahi hai.",
    updatedAt: "Sep 6",
    messages: [
      {
        _id: "m41",
        sender: "worker",
        senderModel: "Worker",
        text: "Jet pump cleaning aur gas pressure check ho gaya hai. AC 16°C par super chilled chal raha hai.",
        time: "Sep 6",
        isRead: true,
      },
      {
        _id: "m42",
        sender: "user",
        senderModel: "User",
        text: "Thank you Irfan ji, bahut achhi cooling ho rahi hai.",
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
    unread: 0,
    lastMessage: "Kisi bhi booking, bill, ya standard rate card ki jankari ke liye yahan message karein.",
    updatedAt: "Aug 30",
    messages: [
      {
        _id: "m51",
        sender: "worker",
        senderModel: "Worker",
        text: "Namaste! GigConnect Sahakari Samiti Helpline par aapka swagat hai. Yahan sabhi karigar 100% Aadhaar verified aur cooperative ke barabar hissedar hain.",
        time: "Aug 30",
        isRead: true,
      },
      {
        _id: "m52",
        sender: "worker",
        senderModel: "Worker",
        text: "Kisi bhi booking, bill, ya standard rate card ki jankari ke liye yahan message karein.",
        time: "Aug 30",
        isRead: true,
      },
    ],
  },
];

const WORKER_REPLIES = [
  "Haanji, main message check kar liya hai. 10-15 minute mein location par pahunch raha hoon.",
  "Ji theek hai, cooperative standard rates ke hisaab se hi bill banega. Koi extra surge charge nahi hai.",
  "Tool kit saath hai, spare part ka original GST bill dunga. Aap bilkul nishchint rahiye.",
  "Main aapke gate ke paas pahunch gaya hoon. Guard ko bol dijiye entry ke liye.",
  "Bahut dhanyawad! Kaam poora hone ke baad aap platform par Jan Dhan UPI direct payment kar sakte hain.",
];

export default function Messages({ initialWorker, onNavigate }) {
  const { t } = useTranslation();
  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem("gigconnect_chats_v2");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return DEFAULT_CHATS;
  });

  // Select initial conversation
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

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const activeChat = chats.find((c) => c._id === activeChatId) || chats[0];

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("gigconnect_chats_v2", JSON.stringify(chats));
  }, [chats]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages, isTyping]);

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

    // Listen for incoming messages
    socket.on("receive_message", (data) => {
      if (!data) return;

      const incomingMsg = {
        _id: data._id || "msg_" + Date.now(),
        sender: data.senderModel === "Worker" || data.sender === "worker" ? "worker" : "user",
        senderModel: data.senderModel || "Worker",
        text: data.text,
        time: data.time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isRead: Boolean(data.isRead),
      };

      // Play sound
      if (incomingMsg.sender === "worker") {
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

    // Listen for typing events
    socket.on("typing", (data) => {
      if (data.conversationId === activeChatId) {
        setIsTyping(true);
      }
    });

    socket.on("stop_typing", (data) => {
      if (data.conversationId === activeChatId) {
        setIsTyping(false);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [activeChatId]);

  // Handle selecting a chat
  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
    if (socketRef.current) {
      socketRef.current.emit("join_chat", { conversationId: chatId });
    }
    // Mark as read
    setChats((prev) =>
      prev.map((c) => (c._id === chatId ? { ...c, unread: 0 } : c))
    );
  };

  // ================= 2. SEND MESSAGE =================
  const handleSendMessage = (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    playTone("send");

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const clientTempId = "temp_" + Date.now();

    const userMsg = {
      _id: clientTempId,
      sender: "user",
      senderModel: "User",
      text,
      time: timeStr,
      isRead: false,
    };

    // 1. Instantly update local state
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

    // 2. Emit send_message via Socket.io
    if (socketRef.current) {
      socketRef.current.emit("send_message", {
        conversationId: activeChatId,
        senderId: "customer_current",
        senderModel: "User",
        text,
        clientTempId,
      });
      socketRef.current.emit("stop_typing", { conversationId: activeChatId });
    }

    // 3. Simulated Worker Response (Real-Time Experience)
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
  };

  // Quick Action Chips requested
  const quickActionChips = [
    "📍 Share my live location",
    "⏱️ Kab tak aa rahe hain?",
    "💰 Send cooperative tariff estimate",
    "🏠 Main ghar par hi hoon",
    "✅ Service completed, sending payment",
  ];

  const filteredChats = chats.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.trade.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-[calc(100vh-80px)] flex bg-white font-sans overflow-hidden">
      
      {/* ================= PART 1: LEFT SIDEBAR (w-1/3 max-w-sm) ================= */}
      <aside className="w-full md:w-1/3 md:max-w-sm bg-white border-r border-slate-200 flex flex-col h-full flex-shrink-0 z-10">
        
        {/* Sidebar Header & Search Bar */}
        <div className="p-3.5 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-slate-900 tracking-tight">Messages</span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-bold border border-emerald-200 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${socketConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`} />
                {socketConnected ? "Live Socket" : "Online"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("find-help")}
              title="Find more workers"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100/70 px-2.5 py-1 rounded-lg border-none cursor-pointer transition-colors"
            >
              + New Chat
            </button>
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

        {/* List of Active Chats */}
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
                {/* Avatar with online indicator */}
                <div className="relative flex-shrink-0">
                  <img
                    src={chat.avatar}
                    alt={chat.name}
                    className="w-12 h-12 rounded-full object-cover border border-slate-200"
                  />
                  {chat.status === "online" && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white" />
                  )}
                </div>

                {/* Conversation preview */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-bold text-slate-900 truncate">
                      {chat.name}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium flex-shrink-0">
                      {chat.updatedAt}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500 truncate m-0 flex items-center gap-1 max-w-[210px]">
                      <span className="truncate">{chat.lastMessage}</span>
                    </p>

                    {/* Unread message badge (green circle) */}
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

        {/* Co-op Notice Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center flex-shrink-0">
          <span className="text-[11px] text-slate-500 font-medium flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-emerald-600">shield</span>
            Sahakari Direct Worker Messaging • Zero Intermediaries
          </span>
        </div>
      </aside>

      {/* ================= PART 2: RIGHT CHAT AREA (w-2/3 flex-1) ================= */}
      <main className="w-full md:w-2/3 flex-1 flex flex-col h-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] relative overflow-hidden">
        
        {/* Chat Header Bar */}
        <div className="h-16 px-6 bg-white/95 backdrop-blur-md border-b border-slate-200 flex items-center justify-between flex-shrink-0 z-10 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <img
                src={activeChat.avatar}
                alt={activeChat.name}
                className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm"
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
                {activeChat.verified && (
                  <span className="inline-flex items-center px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
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
                  <span className="text-emerald-600 font-semibold">online • {activeChat.trade}</span>
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
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all border-none cursor-pointer flex items-center gap-1 shadow-sm active:scale-95"
            >
              <span className="material-symbols-outlined text-[15px]">calendar_month</span>
              <span>Book Service</span>
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

        {/* Message Bubbles Scrolling Area */}
        <div className="flex-1 overflow-y-auto px-6 py-2 space-y-3.5">
          {activeChat.messages.map((msg) => {
            const isUser = msg.sender === "user";

            return (
              <div
                key={msg._id}
                className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {/* Worker Avatar next to bubble */}
                {!isUser && (
                  <img
                    src={activeChat.avatar}
                    alt={activeChat.name}
                    className="w-7 h-7 rounded-full object-cover mb-1 flex-shrink-0 border border-slate-200"
                  />
                )}

                {/* Bubble */}
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
                className="w-7 h-7 rounded-full object-cover mb-1 flex-shrink-0 border border-slate-200"
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

        {/* ================= PART 3: QUICK ACTION CHIPS ================= */}
        <div className="px-4 py-2 bg-white/80 backdrop-blur border-t border-slate-200/70 flex items-center gap-2 overflow-x-auto no-scrollbar flex-shrink-0">
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

        {/* ================= PART 4: INPUT AREA ================= */}
        <div className="h-16 px-4 bg-white border-t border-slate-200 flex items-center gap-2.5 flex-shrink-0">
          {/* Paperclip attachment icon */}
          <button
            type="button"
            onClick={() => handleSendMessage("📎 [Attached photo of pipe issue for work estimate]")}
            title="Attach File / Photo"
            className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors border-none bg-transparent cursor-pointer flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[22px]">attach_file</span>
          </button>

          {/* Rounded-full Text Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Type a message to worker..."
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                if (socketRef.current) {
                  socketRef.current.emit("typing", { conversationId: activeChatId, senderName: "Customer" });
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

          {/* Microphone Icon or Send Button */}
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
              onClick={() => handleSendMessage("🎙️ Voice Note (0:12) sent: 'Bhaiya kitchen sink leak check kar lijiye.'")}
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
