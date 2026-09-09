import React, { useState, useEffect, useRef } from "react";
import { DEFAULT_MALE_AVATAR, DEFAULT_FEMALE_AVATAR } from "../../assets/avatars";

// Web Audio API beep generator for authentic WhatsApp send & receive sounds
const playChatSound = (type = "receive") => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "send") {
      osc.frequency.setValueAtTime(540, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else {
      osc.frequency.setValueAtTime(740, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(960, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    }
  } catch (e) {
    // AudioContext blocked or not supported
  }
};

const INITIAL_THREADS = [
  {
    id: "t1",
    workerId: "w1",
    name: "Rameshwar Kumar",
    trade: "Senior Co-op Plumber",
    avatar: DEFAULT_MALE_AVATAR,
    status: "online",
    verified: true,
    rating: 4.9,
    coopId: "DEL-PLUMB-2910",
    phone: "+91 98112 34567",
    unread: 1,
    messages: [
      {
        id: "m1",
        sender: "worker",
        text: "Namaste! Main Rameshwar, GigConnect Delhi Plumbers Cooperative se.",
        time: "10:30 AM",
        status: "read",
      },
      {
        id: "m2",
        sender: "worker",
        text: "Aapki booking request receive hui hai. Main DLF Phase 3 ke paas hoon. Bathroom pipe leak ki photo bhej sakte hain?",
        time: "10:32 AM",
        status: "read",
      },
      {
        id: "m3",
        sender: "user",
        text: "Haanji Rameshwar ji, kitchen sink ke neeche se paani drip ho raha hai. Kab tak aa sakte hain?",
        time: "10:38 AM",
        status: "read",
      },
      {
        id: "m4",
        sender: "worker",
        text: "Main toolkit leke nikal gaya hoon. 15 minute mein aapke location par pahunch raha hoon. Cooperative standard rate ₹250 lagega, zero surge!",
        time: "10:41 AM",
        status: "delivered",
      },
    ],
  },
  {
    id: "t2",
    workerId: "w2",
    name: "Rajesh Verma",
    trade: "Certified Electrician",
    avatar: DEFAULT_MALE_AVATAR,
    status: "online",
    verified: true,
    rating: 4.8,
    coopId: "DEL-ELEC-4102",
    phone: "+91 98223 78901",
    unread: 0,
    messages: [
      {
        id: "m21",
        sender: "worker",
        text: "Namaste! Main Rajesh Verma, Saket Ward 14 Electrician Guild.",
        time: "Yesterday",
        status: "read",
      },
      {
        id: "m22",
        sender: "user",
        text: "Bhaiya, drawing room ka main MCB bar-bar trip ho raha hai.",
        time: "Yesterday",
        status: "read",
      },
      {
        id: "m23",
        sender: "worker",
        text: "Short circuit ya heavy load ka issue ho sakta hai. Main Havells heavy-duty MCB spare part saath la raha hoon. Standard union rates apply honge.",
        time: "Yesterday",
        status: "read",
      },
    ],
  },
  {
    id: "t3",
    workerId: "w3",
    name: "Sunita Devi",
    trade: "Home Chef & Meal Prep",
    avatar: DEFAULT_FEMALE_AVATAR,
    status: "last seen today at 9:15 AM",
    verified: true,
    rating: 5.0,
    coopId: "DEL-CHEF-1044",
    phone: "+91 97114 55667",
    unread: 0,
    messages: [
      {
        id: "m31",
        sender: "worker",
        text: "Pranaam! Aaj shaam ke dinner ke liye Shahi Paneer, Dal Makhani aur phulke ready kar sakti hoon. Masale aur ingredients aapke ghar ke use honge.",
        time: "Yesterday",
        status: "read",
      },
      {
        id: "m32",
        sender: "user",
        text: "Sunita ji, 4 logon ke liye preparation karni hai. 6:30 PM tak aa jaiyega.",
        time: "Yesterday",
        status: "read",
      },
      {
        id: "m33",
        sender: "worker",
        text: "Ji bilkul, theek 6:30 PM pahunch jaungi. Dhanyawad!",
        time: "Yesterday",
        status: "read",
      },
    ],
  },
  {
    id: "t4",
    workerId: "w4",
    name: "Mohammad Irfan",
    trade: "AC & Refrigeration Specialist",
    avatar: DEFAULT_MALE_AVATAR,
    status: "last seen today at 8:40 AM",
    verified: true,
    rating: 4.9,
    coopId: "NOI-HVAC-8812",
    phone: "+91 99110 22334",
    unread: 0,
    messages: [
      {
        id: "m41",
        sender: "worker",
        text: "Jet pump cleaning aur gas pressure check ho gaya hai. AC 16°C par super chilled chal raha hai.",
        time: "Sep 6",
        status: "read",
      },
      {
        id: "m42",
        sender: "user",
        text: "Thank you Irfan ji, bahut achhi cooling ho rahi hai.",
        time: "Sep 6",
        status: "read",
      },
    ],
  },
  {
    id: "t5",
    workerId: "w5",
    name: "GigConnect Sahayata Kendra",
    trade: "Official Co-op Helpdesk",
    avatar: DEFAULT_FEMALE_AVATAR,
    status: "online",
    verified: true,
    rating: 5.0,
    coopId: "COOP-FED-001",
    phone: "1800-GIG-COOP",
    unread: 0,
    messages: [
      {
        id: "m51",
        sender: "worker",
        text: "Namaste! GigConnect Sahakari Samiti Helpline par aapka swagat hai. Yahan sabhi karigar 100% Aadhaar verified aur cooperative ke barabar hissedar hain.",
        time: "Aug 30",
        status: "read",
      },
      {
        id: "m52",
        sender: "worker",
        text: "Kisi bhi booking, bill, ya standard rate card ki jankari ke liye yahan message karein.",
        time: "Aug 30",
        status: "read",
      },
    ],
  },
];

const WORKER_AUTO_REPLIES = [
  "Haanji, main message padh liya hai. Main 10-15 minute mein location par pahunch raha hoon.",
  "Ji theek hai, cooperative standard rates ke hisaab se hi bill banega. Koi extra surge charge nahi hai.",
  "Tool kit saath hai, spare part ka original GST bill dunga. Aap fikar mat kijiye.",
  "Main aapke gate ke paas pahunchne wala hoon. Guard ko bol dijiye entry ke liye.",
  "Bahut dhanyawad! Kaam poora hone ke baad aap platform par rating aur Jan Dhan UPI direct payment kar sakte hain.",
];

export default function CoopWhatsAppChat({ initialWorker, onNavigate }) {
  const [threads, setThreads] = useState(() => {
    const saved = localStorage.getItem("gigconnect_chats");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_THREADS;
  });

  // If opened with a specific worker from another screen, select or create thread
  const [activeThreadId, setActiveThreadId] = useState(() => {
    if (initialWorker?.name) {
      const match = INITIAL_THREADS.find(
        (t) => t.name.toLowerCase() === initialWorker.name.toLowerCase() || t.trade.toLowerCase().includes(initialWorker.category?.toLowerCase() || "")
      );
      if (match) return match.id;
    }
    return "t1";
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState("all");
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [callingModal, setCallingModal] = useState(null);
  const [showMobileChatList, setShowMobileChatList] = useState(true);

  const messagesEndRef = useRef(null);

  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0];

  // Save threads to localStorage
  useEffect(() => {
    localStorage.setItem("gigconnect_chats", JSON.stringify(threads));
  }, [threads]);

  // Scroll to bottom on messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread?.messages, isTyping]);

  // If selected thread changes on mobile, hide chat list
  const handleSelectThread = (threadId) => {
    setActiveThreadId(threadId);
    setShowMobileChatList(false);

    // Mark messages in thread as read
    setThreads((prev) =>
      prev.map((t) =>
        t.id === threadId
          ? {
              ...t,
              unread: 0,
              messages: t.messages.map((m) => ({ ...m, status: "read" })),
            }
          : t
      )
    );
  };

  const handleSendMessage = (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    playChatSound("send");

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const newMessage = {
      id: "usr_" + Date.now(),
      sender: "user",
      text,
      time: timeStr,
      status: "sent",
    };

    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThreadId
          ? {
              ...t,
              messages: [...t.messages, newMessage],
            }
          : t
      )
    );

    setInputMessage("");

    // Simulate worker typing and reply
    setIsTyping(true);
    const replyDelay = Math.floor(Math.random() * 1200) + 1200;

    setTimeout(() => {
      setIsTyping(false);
      playChatSound("receive");

      const replyIndex = Math.floor(Math.random() * WORKER_AUTO_REPLIES.length);
      const workerReply = {
        id: "wrk_" + Date.now(),
        sender: "worker",
        text: WORKER_AUTO_REPLIES[replyIndex],
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "read",
      };

      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThreadId
            ? {
                ...t,
                messages: [...t.messages, workerReply],
              }
            : t
        )
      );
    }, replyDelay);
  };

  const handleQuickAction = (actionText) => {
    handleSendMessage(actionText);
  };

  // Filtered threads list
  const filteredThreads = threads.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.trade.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterTab === "unread") return t.unread > 0;
    if (filterTab === "plumbers") return t.trade.toLowerCase().includes("plumb");
    if (filterTab === "electricians") return t.trade.toLowerCase().includes("elec");
    return true;
  });

  return (
    <div className="w-full bg-[#f0f2f5] py-4 sm:py-6 px-2 sm:px-6 min-h-[92vh] flex items-center justify-center font-sans">
      {/* Outer WhatsApp Web Window Container */}
      <div className="w-full max-w-6xl h-[86vh] bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-gray-200 overflow-hidden flex flex-col md:flex-row relative">

        {/* ================= LEFT SIDEBAR (CHATS LIST) ================= */}
        <div
          className={`w-full md:w-[380px] lg:w-[420px] bg-white border-r border-gray-200 flex flex-col flex-shrink-0 h-full ${
            showMobileChatList ? "flex" : "hidden md:flex"
          }`}
        >
          {/* Sidebar Top Header (WhatsApp Signature) */}
          <div className="h-16 px-4 bg-[#f0f2f5] border-b border-gray-200 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={DEFAULT_MALE_AVATAR}
                  alt="My Profile"
                  className="w-10 h-10 rounded-full object-cover border border-gray-300 shadow-sm"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#00a884] rounded-full ring-2 ring-white" />
              </div>
              <div>
                <span className="text-sm font-bold text-gray-800 block leading-tight">Co-op Member</span>
                <span className="text-[11px] text-[#00a884] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-pulse" />
                  Live WhatsApp Link
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-gray-600">
              <button
                type="button"
                onClick={() => onNavigate("find-help")}
                title="Find more workers to chat"
                className="w-9 h-9 rounded-full hover:bg-gray-200/80 flex items-center justify-center text-gray-600 transition-colors border-none bg-transparent cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">person_add</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate("home")}
                title="Back to Platform Home"
                className="w-9 h-9 rounded-full hover:bg-gray-200/80 flex items-center justify-center text-gray-600 transition-colors border-none bg-transparent cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">home</span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-2.5 bg-white border-b border-gray-100 flex-shrink-0">
            <div className="relative flex items-center bg-[#f0f2f5] rounded-xl px-3 py-1.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#00a884]/40 transition-all">
              <span className="material-symbols-outlined text-[19px] text-gray-500 mr-2">search</span>
              <input
                type="text"
                placeholder="Search or start new worker chat"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-500 focus:outline-none border-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="material-symbols-outlined text-[16px] text-gray-400 hover:text-gray-600 border-none bg-transparent cursor-pointer p-0"
                >
                  close
                </button>
              )}
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: "all", label: "All" },
                { id: "unread", label: "Unread" },
                { id: "plumbers", label: "Plumbers" },
                { id: "electricians", label: "Electricians" },
              ].map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setFilterTab(chip.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border-none cursor-pointer flex-shrink-0 ${
                    filterTab === chip.id
                      ? "bg-[#00a884] text-white"
                      : "bg-[#f0f2f5] text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Threads List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <span className="material-symbols-outlined text-4xl mb-2 text-gray-300">chat_error</span>
                <p className="text-sm m-0">No matching conversations found.</p>
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isActive = thread.id === activeThreadId;
                const lastMsg = thread.messages[thread.messages.length - 1];

                return (
                  <div
                    key={thread.id}
                    onClick={() => handleSelectThread(thread.id)}
                    className={`px-3.5 py-3 flex items-center gap-3 cursor-pointer transition-colors ${
                      isActive ? "bg-[#f0f2f5]" : "hover:bg-[#f5f6f6]"
                    }`}
                  >
                    {/* Worker Avatar with online badge */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={thread.avatar}
                        alt={thread.name}
                        className="w-12 h-12 rounded-full object-cover border border-gray-200"
                      />
                      {thread.status === "online" && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#00a884] rounded-full ring-2 ring-white" />
                      )}
                    </div>

                    {/* Chat summary details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-bold text-gray-900 truncate flex items-center gap-1">
                          {thread.name}
                          {thread.verified && (
                            <span className="material-symbols-outlined text-[15px] text-[#00a884]" title="Cooperative Verified">
                              verified
                            </span>
                          )}
                        </span>
                        <span className="text-[11px] text-gray-400 font-medium flex-shrink-0">
                          {lastMsg?.time || "10:30 AM"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500 truncate m-0 flex items-center gap-1">
                          {lastMsg?.sender === "user" && (
                            <span className="text-[#53bdeb] text-[13px] font-bold">✓✓</span>
                          )}
                          <span className="truncate">{lastMsg?.text || thread.trade}</span>
                        </p>
                        {thread.unread > 0 && (
                          <span className="w-5 h-5 bg-[#00a884] text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0 ml-1.5">
                            {thread.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Left Footer: Cooperative Trust Notice */}
          <div className="p-3 bg-[#f0f2f5] border-t border-gray-200 text-center flex-shrink-0">
            <span className="text-[11px] text-gray-500 font-medium flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-[#00a884]">shield</span>
              Direct WhatsApp chat • 0% middleman fees
            </span>
          </div>
        </div>

        {/* ================= RIGHT MAIN PANEL (ACTIVE CHAT WINDOW) ================= */}
        <div
          className={`flex-1 flex flex-col h-full bg-[#efeae2] relative ${
            !showMobileChatList ? "flex" : "hidden md:flex"
          }`}
          style={{
            backgroundImage: `radial-gradient(#d1d7db 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        >
          {/* Active Chat Header */}
          <div className="h-16 px-4 bg-[#f0f2f5] border-b border-gray-200 flex items-center justify-between flex-shrink-0 shadow-sm z-10">
            <div className="flex items-center gap-3 min-w-0">
              {/* Back button on mobile */}
              <button
                type="button"
                onClick={() => setShowMobileChatList(true)}
                className="md:hidden w-8 h-8 flex items-center justify-center text-gray-600 border-none bg-transparent cursor-pointer p-0"
              >
                <span className="material-symbols-outlined text-[22px]">arrow_back</span>
              </button>

              <div className="relative flex-shrink-0 cursor-pointer" onClick={() => setCallingModal(activeThread)}>
                <img
                  src={activeThread.avatar}
                  alt={activeThread.name}
                  className="w-10 h-10 rounded-full object-cover border border-gray-300"
                />
                {activeThread.status === "online" && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#00a884] rounded-full ring-2 ring-white" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-gray-900 m-0 truncate">
                    {activeThread.name}
                  </h3>
                  {activeThread.verified && (
                    <span className="inline-flex items-center px-1.5 py-0.2 bg-green-50 text-[#00a884] border border-green-200 rounded text-[10px] font-bold">
                      Co-op Certified
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 m-0 truncate">
                  {isTyping ? (
                    <span className="text-[#00a884] font-bold flex items-center gap-1">
                      typing<span className="animate-pulse">...</span>
                    </span>
                  ) : activeThread.status === "online" ? (
                    <span className="text-[#00a884] font-semibold">online • {activeThread.trade}</span>
                  ) : (
                    <span>{activeThread.status}</span>
                  )}
                </p>
              </div>
            </div>

            {/* Call and Quick Actions */}
            <div className="flex items-center gap-1 sm:gap-2 text-gray-600">
              <button
                type="button"
                onClick={() => setCallingModal(activeThread)}
                title="Voice Call via WhatsApp Web"
                className="w-9 h-9 rounded-full hover:bg-gray-200/80 flex items-center justify-center text-gray-700 transition-colors border-none bg-transparent cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">call</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate("booking", activeThread)}
                title="Book this worker now"
                className="hidden sm:inline-flex px-3 py-1.5 bg-[#00a884] hover:bg-[#008069] text-white rounded-lg text-xs font-bold transition-all border-none cursor-pointer items-center gap-1 shadow-sm"
              >
                <span className="material-symbols-outlined text-[15px]">calendar_month</span>
                <span>Book Service</span>
              </button>
            </div>
          </div>

          {/* Chat Messages Scrolling Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* End to End Security Banner */}
            <div className="max-w-md mx-auto my-2 p-2.5 bg-[#ffeecd] border border-[#ffd279]/60 rounded-xl text-center shadow-xs">
              <p className="text-[11px] text-[#544321] m-0 font-medium leading-relaxed flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-[#8c6b1f]">lock</span>
                <span>
                  Direct end-to-end chat with <strong>{activeThread.name}</strong>. Rates protected under Multi-State Cooperative guidelines.
                </span>
              </p>
            </div>

            {/* Date Pill */}
            <div className="flex justify-center my-2">
              <span className="px-3 py-1 bg-white/80 backdrop-blur-xs rounded-lg text-[11px] font-semibold text-gray-600 shadow-xs uppercase tracking-wider">
                Today
              </span>
            </div>

            {/* Message Bubbles */}
            {activeThread.messages.map((msg) => {
              const isUser = msg.sender === "user";

              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-1.5 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <img
                      src={activeThread.avatar}
                      alt={activeThread.name}
                      className="w-7 h-7 rounded-full object-cover mb-1 flex-shrink-0 border border-gray-200"
                    />
                  )}

                  <div
                    className={`relative max-w-[85%] sm:max-w-[70%] px-3.5 py-2 rounded-2xl text-sm shadow-xs ${
                      isUser
                        ? "bg-[#d9fdd3] text-gray-900 rounded-br-none"
                        : "bg-white text-gray-900 rounded-bl-none border border-gray-100"
                    }`}
                  >
                    <p className="m-0 leading-relaxed text-[13.5px] whitespace-pre-wrap">{msg.text}</p>
                    <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-gray-500 font-medium select-none">
                      <span>{msg.time}</span>
                      {isUser && (
                        <span className="text-[#53bdeb] font-bold text-[12px]">✓✓</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator Bubble */}
            {isTyping && (
              <div className="flex items-end gap-1.5 justify-start animate-in fade-in duration-200">
                <img
                  src={activeThread.avatar}
                  alt={activeThread.name}
                  className="w-7 h-7 rounded-full object-cover mb-1 flex-shrink-0 border border-gray-200"
                />
                <div className="bg-white px-4 py-2.5 rounded-2xl rounded-bl-none shadow-xs border border-gray-100 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#00a884] animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-[#00a884] animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-[#00a884] animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Reply Suggestion Chips */}
          <div className="px-4 py-2 bg-white/70 backdrop-blur-md border-t border-gray-200/60 flex items-center gap-2 overflow-x-auto no-scrollbar flex-shrink-0">
            {[
              "📍 Share my live location",
              "⏱️ Kab tak aa rahe hain?",
              "💰 Send cooperative tariff estimate",
              "🏠 Main ghar par hi hoon",
              "✅ Service completed, sending payment",
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickAction(chip)}
                className="px-3 py-1 bg-white hover:bg-[#d9fdd3] text-gray-700 hover:text-green-900 border border-gray-200 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shadow-2xs"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Bar (Authentic WhatsApp Web) */}
          <div className="h-16 px-4 bg-[#f0f2f5] border-t border-gray-200 flex items-center gap-2 flex-shrink-0">
            {/* Attachment Button */}
            <button
              type="button"
              onClick={() => handleSendMessage("📎 [Photo of plumbing issue attached for estimate]")}
              title="Attach Photo / Document"
              className="w-10 h-10 rounded-full hover:bg-gray-200/80 flex items-center justify-center text-gray-600 transition-colors border-none bg-transparent cursor-pointer"
            >
              <span className="material-symbols-outlined text-[22px]">attach_file</span>
            </button>

            {/* Input Field */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Type a message to worker..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="w-full h-11 py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884] transition-all shadow-2xs"
              />
            </div>

            {/* Send or Voice Note Button */}
            {inputMessage.trim() ? (
              <button
                type="button"
                onClick={() => handleSendMessage()}
                title="Send Message"
                className="w-11 h-11 rounded-full bg-[#00a884] hover:bg-[#008069] text-white flex items-center justify-center transition-all border-none cursor-pointer shadow-sm active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSendMessage("🎙️ Voice Note (0:14) sent: 'Bhaiya kitchen sink check kar lijiye...'")}
                title="Send Voice Memo"
                className="w-11 h-11 rounded-full bg-white hover:bg-gray-100 text-gray-600 flex items-center justify-center transition-all border border-gray-200 cursor-pointer shadow-2xs active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px] text-gray-600">mic</span>
              </button>
            )}
          </div>

        </div>
      </div>

      {/* WhatsApp Voice Call Simulation Modal */}
      {callingModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#075e54] text-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center animate-in zoom-in-95 duration-200 flex flex-col items-center">
            <div className="relative mb-6">
              <img
                src={callingModal.avatar}
                alt={callingModal.name}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-white/30 shadow-lg"
              />
              <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center ring-2 ring-[#075e54]">
                <span className="material-symbols-outlined text-[16px] text-white">call</span>
              </span>
            </div>

            <h3 className="text-xl font-extrabold m-0 tracking-tight">{callingModal.name}</h3>
            <p className="text-xs text-green-200 mt-1 uppercase tracking-wider font-semibold">
              {callingModal.trade} • {callingModal.coopId}
            </p>

            <div className="my-6 px-4 py-2 bg-white/10 rounded-full text-xs font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
              <span>WhatsApp Audio Call • Ringing...</span>
            </div>

            <p className="text-xs text-white/70 mb-8 max-w-xs leading-relaxed">
              Cooperative direct audio link. Standard call encryption active.
            </p>

            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => setCallingModal(null)}
                className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition-transform active:scale-90 border-none cursor-pointer"
                title="End Call"
              >
                <span className="material-symbols-outlined text-[28px]">call_end</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
