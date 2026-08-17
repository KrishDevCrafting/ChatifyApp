import { io } from "socket.io-client";

export function connectWs() {
  return io(import.meta.env.VITE_SOCKET_URL || "http://localhost:3000");
}
