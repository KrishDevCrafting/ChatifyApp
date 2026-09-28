import { io } from "socket.io-client";
import { SOCKET_URL } from "./config";

export function connectWs() {
  const token = localStorage.getItem("token");

  return io(SOCKET_URL, {
    auth: {
      token,
    },
  });
}
