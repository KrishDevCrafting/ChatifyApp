import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { connectWs } from "../ws";
import { API_URL } from "../config";

// 🎨 Har user ke naam ke hisaab se distinct color
const getUserColor = (name, isDark = true) => {
  const darkColors = [
    "text-cyan-400",
    "text-amber-400",
    "text-emerald-400",
    "text-purple-400",
    "text-pink-400",
    "text-yellow-400",
    "text-sky-400",
    "text-rose-400",
  ];
  const lightColors = [
    "text-cyan-700",
    "text-amber-700",
    "text-emerald-700",
    "text-purple-700",
    "text-pink-700",
    "text-yellow-700",
    "text-sky-700",
    "text-rose-700",
  ];
  const colors = isDark ? darkColors : lightColors;
  if (!name) return isDark ? "text-blue-400" : "text-blue-600";
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash += name.charCodeAt(i);
  }
  return colors[hash % colors.length];
};

// 🕒 Timestamp format helper (e.g. "03:15 PM")
const formatTime = (timestamp) => {
  if (!timestamp) return "";
  try {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};

// 🔑 Helper: JWT token se current user nikalna
const getCurrentUsername = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return "";
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.username || "";
  } catch {
    return "";
  }
};

function HomePage() {
  const navigate = useNavigate();
  const socket = useRef(null);
  const currentUser = getCurrentUsername();

  // 🌓 Theme State (Persistent in localStorage)
  const [theme, setTheme] = useState(
    () => localStorage.getItem("chat_theme") || "dark",
  );
  const isDark = theme === "dark";

  const toggleTheme = () => {
    const nextTheme = isDark ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("chat_theme", nextTheme);
  };

  // 🏛️ State Management
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const activeRoomRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUser, setTypingUser] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal / Form state for creating room
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [roomError, setRoomError] = useState("");

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  // Keep activeRoomRef in sync with activeRoom state (prevents stale closure in socket events)
  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  // Auto-scroll to bottom of chat on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  // 🚪 Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    if (socket.current) {
      socket.current.disconnect();
    }
    navigate("/login");
  };

  // 📥 Fetch messages for a specific room
  const fetchRoomMessages = async (roomId) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/chat/messages/${roomId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.messages) {
        const formatted = data.messages.map((m) => ({
          type: "chat",
          username: m.username,
          text: m.content,
          created_at: m.created_at,
          roomId: m.room_id,
        }));
        setMessages(formatted);
      }
    } catch (err) {
      console.error("Error loading chat history:", err);
    }
  };

  // 🔄 Switch Active Room
  const switchRoom = (targetRoom) => {
    if (!targetRoom || activeRoom?.id === targetRoom.id) {
      setMobileSidebarOpen(false);
      return;
    }

    setActiveRoom(targetRoom);
    setMessages([]);
    setTypingUser("");
    setMobileSidebarOpen(false);

    // 1. Fetch message history for selected room
    fetchRoomMessages(targetRoom.id);

    // 2. Inform socket of room switch
    if (socket.current) {
      socket.current.emit("join room", {
        room: targetRoom.name,
        roomId: targetRoom.id,
      });
    }
  };

  // 🌟 Main Initialization Effect
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // 1️⃣ Fetch available rooms
    fetch(`${API_URL}/api/chat/rooms`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.rooms && data.rooms.length > 0) {
          setRooms(data.rooms);
          const defaultRoom =
            data.rooms.find((r) => r.name === "general") || data.rooms[0];
          setActiveRoom(defaultRoom);
          fetchRoomMessages(defaultRoom.id);

          initSocket(defaultRoom);
        } else {
          initSocket({ id: 1, name: "general" });
        }
      })
      .catch((err) => {
        console.error("Error loading rooms:", err);
        initSocket({ id: 1, name: "general" });
      });

    const initSocket = (initialRoom) => {
      socket.current = connectWs();

      socket.current.on("connect", () => {
        console.log("Connected to backend socket:", socket.current.id);
        socket.current.emit("join room", {
          room: initialRoom.name,
          roomId: initialRoom.id,
        });
      });

      socket.current.on("room users", (users) => {
        setOnlineUsers(users);
      });

      socket.current.on("chat message", (message) => {
        if (!message.roomId || message.roomId === activeRoomRef.current?.id) {
          setMessages((prev) => [
            ...prev,
            {
              type: "chat",
              username: message.username,
              text: message.text,
              created_at: message.created_at || new Date().toISOString(),
              roomId: message.roomId,
            },
          ]);
        }
      });

      socket.current.on("user joined", (msg) => {
        setMessages((prev) => [
          ...prev,
          {
            type: "notice",
            message: msg.message,
            created_at: new Date().toISOString(),
          },
        ]);
      });

      socket.current.on("user typing", ({ username }) => {
        if (username !== currentUser) {
          setTypingUser(username);
        }
      });

      socket.current.on("user stop typing", () => {
        setTypingUser("");
      });
    };

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, [navigate]);

  // ✍️ Input Typing handler with debouncing
  const handleInputChange = (e) => {
    setInputText(e.target.value);

    if (!activeRoom || !socket.current) return;

    if (!isTypingRef.current) {
      socket.current.emit("typing", activeRoom.name);
      isTypingRef.current = true;
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.current.emit("stop typing", activeRoom.name);
      isTypingRef.current = false;
    }, 1200);
  };

  // 📤 Send Message
  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!inputText.trim() || !activeRoom) return;

    clearTimeout(typingTimeoutRef.current);
    socket.current.emit("stop typing", activeRoom.name);
    isTypingRef.current = false;

    socket.current.emit("chat message", {
      room: activeRoom.name,
      roomId: activeRoom.id,
      text: inputText.trim(),
    });

    setInputText("");
  };

  // ➕ Create New Room Handler
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    const cleanName = newRoomName.trim().toLowerCase().replace(/\s+/g, "-");
    if (!cleanName) {
      setRoomError("Room name cannot be empty");
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/chat/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: cleanName }),
      });
      const data = await res.json();

      if (res.ok) {
        const createdRoom = {
          id: data.roomId,
          name: cleanName,
          creator: currentUser,
        };
        setRooms((prev) => [createdRoom, ...prev]);
        setNewRoomName("");
        setIsCreatingRoom(false);
        setRoomError("");
        switchRoom(createdRoom);
      } else {
        setRoomError(data.message || "Room creation failed");
      }
    } catch (err) {
      console.error("Error creating room:", err);
      setRoomError("Server error while creating room");
    }
  };

  // Filtered rooms based on search query
  const filteredRooms = rooms.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div
      className={`flex h-screen w-screen overflow-hidden font-sans antialiased transition-colors duration-200 relative ${
        isDark ? "bg-zinc-950 text-zinc-100" : "bg-slate-100 text-slate-800"
      }`}
    >
      {/* -------------------- 📱 MOBILE BACKDROP OVERLAY -------------------- */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* -------------------- 📱 LEFT SIDEBAR: CHANNELS & ROOMS -------------------- */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-80 md:relative md:translate-x-0 flex flex-col border-r backdrop-blur-xl select-none transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${
          isDark
            ? "border-zinc-800/80 bg-zinc-900 md:bg-zinc-900/60"
            : "border-slate-200 bg-white md:bg-white/80"
        }`}
      >
        {/* User Profile Bar */}
        <div
          className={`flex items-center justify-between p-4 border-b transition-colors duration-200 ${
            isDark
              ? "border-zinc-800/80 bg-zinc-900/80"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-white shadow-inner uppercase tracking-wider text-sm">
                {currentUser ? currentUser[0] : "U"}
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-zinc-900 animate-pulse" />
            </div>
            <div>
              <h2
                className={`font-semibold text-sm capitalize leading-tight ${
                  isDark ? "text-zinc-100" : "text-slate-900"
                }`}
              >
                {currentUser || "Guest"}
              </h2>
              <span className="text-[11px] text-emerald-500 font-medium flex items-center gap-1">
                Active Now
              </span>
            </div>
          </div>

          {/* Action Buttons: Theme Toggle & Logout */}
          <div className="flex items-center gap-1.5">
            {/* 🌓 Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className={`p-4 rounded-lg text-sm border transition-all cursor-pointer ${
                isDark
                  ? "bg-zinc-800/80 border-zinc-700/60 text-amber-300 hover:bg-zinc-700"
                  : "bg-slate-100 border-slate-200 text-indigo-600 hover:bg-slate-200"
              }`}
            >
              {isDark ? "☀️" : "🌙"}
            </button>

            {/* 🚪 Logout Button */}
            <button
              onClick={handleLogout}
              title="Sign out of Chatify"
              className={`flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                isDark
                  ? "text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border-transparent hover:border-red-500/20"
                  : "text-slate-500 hover:text-red-600 hover:bg-red-50 border-transparent hover:border-red-200"
              }`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>

            {/* ✕ Close Mobile Sidebar Button */}
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all cursor-pointer"
              title="Close channels menu"
              aria-label="Close channels menu"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Search & New Room Action Header */}
        <div
          className={`p-3 border-b flex flex-col gap-2 transition-colors duration-200 ${
            isDark ? "border-zinc-800/60" : "border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${
                isDark ? "text-zinc-400" : "text-slate-500"
              }`}
            >
              Channels
            </span>
            <button
              onClick={() => {
                setIsCreatingRoom(!isCreatingRoom);
                setRoomError("");
              }}
              className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-400 font-semibold px-2 py-0.5 rounded-md hover:bg-indigo-500/10 transition-all cursor-pointer"
            >
              <span>+</span>
              <span>New Room</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Find or jump to channel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full rounded-lg px-3 py-1.5 text-xs focus:outline-none transition-all ${
                isDark
                  ? "bg-zinc-800/70 border border-zinc-700/50 text-zinc-200 placeholder-zinc-500 focus:border-indigo-500/80"
                  : "bg-slate-100 border border-slate-300 text-slate-800 placeholder-slate-400 focus:border-indigo-500"
              }`}
            />
          </div>

          {/* Inline Create Room Form */}
          {isCreatingRoom && (
            <form
              onSubmit={handleCreateRoom}
              className={`mt-1 p-2.5 rounded-lg border flex flex-col gap-2 shadow-lg transition-colors duration-200 ${
                isDark
                  ? "bg-zinc-800/95 border-indigo-500/30"
                  : "bg-white border-indigo-500/30"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 text-xs font-bold">#</span>
                <input
                  type="text"
                  placeholder="e.g. design-ideas"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  autoFocus
                  className={`flex-1 border rounded px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-500 ${
                    isDark
                      ? "bg-zinc-900 border-zinc-700 text-white"
                      : "bg-slate-50 border-slate-300 text-slate-900"
                  }`}
                />
              </div>
              {roomError && (
                <span className="text-[11px] text-red-400">{roomError}</span>
              )}
              <div className="flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsCreatingRoom(false)}
                  className={`px-2 py-1 text-xs rounded ${
                    isDark
                      ? "text-zinc-400 hover:text-zinc-200"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-2.5 py-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded shadow-sm transition-all"
                >
                  Create
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Rooms / Channels List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
          {filteredRooms.length === 0 ? (
            <div
              className={`p-4 text-center text-xs ${
                isDark ? "text-zinc-500" : "text-slate-400"
              }`}
            >
              No channels found
            </div>
          ) : (
            filteredRooms.map((room) => {
              const isActive = activeRoom?.id === room.id;
              return (
                <button
                  key={room.id}
                  onClick={() => switchRoom(room)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    isActive
                      ? isDark
                        ? "bg-indigo-600/20 text-indigo-200 border border-indigo-500/30 shadow-sm"
                        : "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm font-semibold"
                      : isDark
                        ? "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border border-transparent"
                        : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span
                      className={`text-base font-bold ${
                        isActive
                          ? isDark
                            ? "text-indigo-400"
                            : "text-indigo-600"
                          : isDark
                            ? "text-zinc-500"
                            : "text-slate-400"
                      }`}
                    >
                      #
                    </span>
                    <span className="text-sm font-medium truncate capitalize">
                      {room.name}
                    </span>
                  </div>

                  {isActive && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isDark
                          ? "bg-indigo-400 shadow-[0_0_8px_#818cf8]"
                          : "bg-indigo-600"
                      }`}
                    />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer Brand Credit */}
        <div
          className={`p-3 border-t text-[11px] flex items-center justify-between transition-colors duration-200 ${
            isDark
              ? "border-zinc-800/60 bg-zinc-900/40 text-zinc-500"
              : "border-slate-200 bg-white/60 text-slate-500"
          }`}
        >
          <span
            className={`font-semibold ${
              isDark ? "text-zinc-400" : "text-slate-700"
            }`}
          >
            Chatify
          </span>
          <span>KrishDevCrafting</span>
        </div>
      </aside>

      {/* -------------------- 💬 RIGHT MAIN: ACTIVE CHAT ROOM -------------------- */}
      <main
        className={`flex-1 flex flex-col h-full w-full min-w-0 relative overflow-hidden transition-colors duration-200 ${
          isDark ? "bg-zinc-950" : "bg-slate-50"
        }`}
      >
        {/* Top Header Bar */}
        <header
          className={`h-16 px-3 sm:px-6 border-b backdrop-blur-md flex items-center justify-between z-10 transition-colors duration-200 ${
            isDark
              ? "border-zinc-800/80 bg-zinc-900/40"
              : "border-slate-200 bg-white/80"
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* 📱 Mobile Hamburger Button to open sidebar */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className={`md:hidden p-2 rounded-lg border transition-all cursor-pointer shrink-0 ${
                isDark
                  ? "bg-zinc-800/80 border-zinc-700/60 text-zinc-300 hover:text-white"
                  : "bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900"
              }`}
              title="Open channels"
              aria-label="Open channels"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <span
              className={`text-xl sm:text-2xl font-bold shrink-0 ${
                isDark ? "text-indigo-400" : "text-indigo-600"
              }`}
            >
              #
            </span>
            <div className="truncate">
              <h1
                className={`font-bold text-sm sm:text-base capitalize leading-tight truncate ${
                  isDark ? "text-zinc-100" : "text-slate-900"
                }`}
              >
                {activeRoom?.name || "General"}
              </h1>
              <p
                className={`text-[11px] sm:text-xs truncate ${
                  isDark ? "text-zinc-400" : "text-slate-500"
                }`}
              >
                Channel ID: {activeRoom?.id || 1}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* 🟢 Online Presence Badge */}
            <div
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border transition-colors duration-200 ${
                isDark
                  ? "bg-zinc-800/70 border-zinc-700/50 text-zinc-300"
                  : "bg-white border-slate-200 text-slate-700 shadow-xs"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] sm:text-xs font-medium">
                {onlineUsers.length <= 1
                  ? "1 online"
                  : `${onlineUsers.length} online`}
              </span>
            </div>
          </div>
        </header>

        {/* Chat Feed (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
          {messages.length === 0 ? (
            <div
              className={`h-full flex flex-col items-center justify-center text-center ${
                isDark ? "text-zinc-500" : "text-slate-400"
              }`}
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-3 shadow-inner ${
                  isDark
                    ? "bg-zinc-900 border border-zinc-800"
                    : "bg-white border border-slate-200 shadow-sm"
                }`}
              >
                💬
              </div>
              <h3
                className={`text-sm font-semibold ${
                  isDark ? "text-zinc-300" : "text-slate-700"
                }`}
              >
                Welcome to #{activeRoom?.name || "chat"}!
              </h3>
              <p
                className={`text-xs mt-1 max-w-xs ${
                  isDark ? "text-zinc-500" : "text-slate-400"
                }`}
              >
                This is the start of this channel. Send the first message to get
                the conversation going!
              </p>
            </div>
          ) : (
            messages.map((msg, index) => {
              // System / Notice message
              if (msg.type === "notice") {
                return (
                  <div key={index} className="flex justify-center my-2">
                    <span
                      className={`text-[11px] px-3 py-1 rounded-full shadow-xs border ${
                        isDark
                          ? "text-zinc-400 bg-zinc-900/80 border-zinc-800/80"
                          : "text-slate-600 bg-white/90 border-slate-200"
                      }`}
                    >
                      ✨ {msg.message}
                    </span>
                  </div>
                );
              }

              // Chat Message: Own vs Other user
              const isOwnMessage = msg.username === currentUser;

              return (
                <div
                  key={index}
                  className={`flex items-end gap-2.5 ${
                    isOwnMessage ? "justify-end" : "justify-start"
                  }`}
                >
                  {/* Avatar for other users */}
                  {!isOwnMessage && (
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold uppercase shadow-sm border ${
                        isDark
                          ? "bg-zinc-800 border-zinc-700/60"
                          : "bg-white border-slate-200"
                      } ${getUserColor(msg.username, isDark)}`}
                    >
                      {msg.username ? msg.username[0] : "?"}
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[85%] sm:max-w-md md:max-w-lg px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl shadow-sm text-sm relative group ${
                      isOwnMessage
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-br-xs shadow-md"
                        : isDark
                          ? "bg-zinc-800/90 border border-zinc-700/60 text-zinc-200 rounded-bl-xs"
                          : "bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-xs"
                    }`}
                  >
                    {!isOwnMessage && (
                      <span
                        className={`block text-[11px] font-semibold mb-0.5 capitalize ${getUserColor(
                          msg.username,
                          isDark,
                        )}`}
                      >
                        {msg.username}
                      </span>
                    )}

                    <p className="leading-relaxed break-words whitespace-pre-wrap">
                      {msg.text}
                    </p>

                    <div
                      className={`text-[10px] mt-1 text-right ${
                        isOwnMessage
                          ? "text-indigo-200/80"
                          : isDark
                            ? "text-zinc-400"
                            : "text-slate-400"
                      }`}
                    >
                      {formatTime(msg.created_at)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Live Typing Status Bar */}
        <div className="h-6 px-6 flex items-center">
          {typingUser && (
            <p
              className={`text-xs italic flex items-center gap-1.5 animate-pulse ${
                isDark ? "text-indigo-400" : "text-indigo-600"
              }`}
            >
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full animate-ping ${
                  isDark ? "bg-indigo-400" : "bg-indigo-600"
                }`}
              />
              <span>{typingUser} is typing...</span>
            </p>
          )}
        </div>

        {/* Bottom Message Input Bar */}
        <div
          className={`p-2.5 sm:p-4 border-t backdrop-blur-md transition-colors duration-200 ${
            isDark
              ? "border-zinc-800/80 bg-zinc-900/60"
              : "border-slate-200 bg-white/80"
          }`}
        >
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-2 sm:gap-3 max-w-4xl mx-auto"
          >
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={`Message #${activeRoom?.name || "chat"}...`}
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className={`w-full rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm focus:outline-none transition-all ${
                  isDark
                    ? "bg-zinc-800/80 border border-zinc-700/70 text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50"
                    : "bg-slate-100 border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50"
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 font-semibold text-sm text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer shrink-0"
            >
              <span className="hidden sm:inline">Send</span>
              <svg
                className="w-4 h-4 transform rotate-45 -mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default HomePage;
