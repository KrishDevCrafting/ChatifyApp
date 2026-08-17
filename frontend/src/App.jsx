import { useEffect, useRef, useState } from "react";
import { connectWs } from "./ws";

function App() {
  const socket = useRef(null);
  const room = "general";
  const [username, setUsername] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [update, setupdate] = useState("");
  const [messages, setMessage] = useState([]);

  useEffect(() => {
    socket.current = connectWs();

    socket.current.on("connect", () => {
      console.log("connected to backend:", socket.current.id);
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

    return () => {
      socket.current.disconnect();
    };
  }, []);

  const handleChange = (event) => {
    setupdate(event.target.value);
  };

  const handleJoin = () => {
    if (username.trim() === "") return;

    socket.current.emit("join room", {
      username,
      room,
    });
    setIsJoined(true);
  };

  const handleSend = () => {
    if (update.trim() === "") return;

    socket.current.emit("chat message", {
      username,
      room,
      text: update,
    });
    setupdate("");
  };

  return (
    <>
      <div className="flex min-h-screen justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold  text-red-600 mb-8 text-center font-mono">
            ChatUp
          </h1>

          {!isJoined && (
            <div className="mb-8 flex gap-2">
              <input
                placeholder="Enter username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="flex-1 rounded border border-zinc-600 bg-zinc-800 px-3 py-2 text-white outline-none"
              />
              <button
                onClick={handleJoin}
                type="button"
                className="rounded bg-blue-600 px-4 py-2 font-semibold text-white"
              >
                Join
              </button>
            </div>
          )}

          <div>
            {messages.map((message, index) => (
              <p
                key={index}
                className={`border m-1.5 p-3.5 ${
                  message.type === "notice"
                    ? "border-green-500 text-green-400"
                    : "border-zinc-600 text-blue-400"
                }`}
              >
                {message.type === "notice"
                  ? message.message
                  : `${message.username}: ${message.text}`}
              </p>
            ))}
          </div>

          {isJoined && (
            <>
              <input
                placeholder="Type here:"
                type="text"
                value={update}
                onChange={handleChange}
                className="mt-8 w-full rounded border border-zinc-600 bg-zinc-800 px-3 py-2 text-white outline-none"
              />
              <button
                onClick={handleSend}
                type="button"
                className="send-button"
              >
                Send
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
