import { useEffect, useRef, useState } from "react";
import { connectWs } from "../ws";

// 🎨 Har user ke naam ke hisaab se distinct color
const getUserColor = (name) => {
  const colors = [
    "text-cyan-400",
    "text-amber-400",
    "text-emerald-400",
    "text-purple-400",
    "text-pink-400",
    "text-yellow-400",
    "text-sky-400",
  ];
  if (!name) return "text-blue-400";
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash += name.charCodeAt(i);
  }
  return colors[hash % colors.length];
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
  const socket = useRef(null);
  const room = "general";
  const currentUser = getCurrentUsername();
  const [update, setupdate] = useState("");
  const [messages, setMessage] = useState([]);
  const [typingUser, setTypingUser] = useState("");
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  useEffect(() => {
    const token = localStorage.getItem("token");

    // 1️⃣ Chat history load karo
    fetch("http://localhost:3000/api/chat/messages/1", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.messages) {
          const formatted = data.messages.map((m) => ({
            type: "chat",
            username: m.username,
            text: m.content,
          }));
          setMessage(formatted);
        }
      })
      .catch((err) => console.error("Error loading chat history", err));

    // 2️⃣ Socket connection
    socket.current = connectWs();

    socket.current.on("room users", (users) => {
      setOnlineUsers(users);
    });

    socket.current.on("connect", () => {
      console.log("connected to backend:", socket.current.id);
      socket.current.emit("join room", "general");
    });

    socket.current.on("chat message", (message) => {
      setMessage((previousMessages) => [
        ...previousMessages,
        { type: "chat", ...message },
      ]);
    });

    socket.current.on("user joined", (message) => {
      setMessage((previousMessages) => [
        ...previousMessages,
        { type: "notice", ...message },
      ]);
    });

    // ✍️ Real-time Typing Listeners
    socket.current.on("user typing", ({ username }) => {
      setTypingUser(username);
    });

    socket.current.on("user stop typing", () => {
      setTypingUser("");
    });

    return () => {
      socket.current.disconnect();
    };
  }, []);

  const handleChange = (event) => {
    setupdate(event.target.value);

    // Agar abhi typing broadcast nahi kiya, toh bhej do
    if (!isTypingRef.current) {
      socket.current.emit("typing", room);
      isTypingRef.current = true;
    }

    // Debouncing: 1 second tak rukne par auto "stop typing"
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.current.emit("stop typing", room);
      isTypingRef.current = false;
    }, 1000);
  };

  const handleSend = () => {
    if (update.trim() === "") return;

    // Send hote hi typing indicator cancel
    clearTimeout(typingTimeoutRef.current);
    socket.current.emit("stop typing", room);
    isTypingRef.current = false;

    socket.current.emit("chat message", {
      room,
      text: update,
    });
    setupdate("");
  };

  return (
    <>
      <div className="flex min-h-screen justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-red-600 font-mono">
              ChatUp
            </h1>

            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-zinc-800/80 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {onlineUsers.length <= 1
                  ? "Just you online"
                  : `${onlineUsers.length} online (${onlineUsers
                      .map((u) => (u === currentUser ? "You" : u))
                      .join(", ")})`}
              </span>
            </div>
          </div>

          <div>
            {messages.map((message, index) => (
              <p
                key={index}
                className={`border m-1.5 p-3.5 rounded ${
                  message.type === "notice"
                    ? "border-green-500 text-green-400"
                    : `border-zinc-600 ${getUserColor(message.username)}`
                }`}
              >
                {message.type === "notice"
                  ? message.message
                  : `${message.username}: ${message.text}`}
              </p>
            ))}
          </div>

          <div className="mt-8">
            {typingUser && (
              <p className="text-xs text-zinc-400 italic mb-2 animate-pulse">
                ✍️ {typingUser} is typing...
              </p>
            )}

            <div className="flex gap-2">
              <input
                placeholder="Type here:"
                type="text"
                value={update}
                onChange={handleChange}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 rounded border border-zinc-600 bg-zinc-800 px-3 py-2 text-white outline-none"
              />
              <button
                onClick={handleSend}
                type="button"
                className="rounded bg-blue-600 px-4 py-2 font-semibold text-white cursor-pointer"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default HomePage;
