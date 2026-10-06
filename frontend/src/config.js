// 🌐 Smart URL Detection: Production vs Development
const isLocalhost = typeof window !== "undefined" && window.location.hostname === "localhost";

const PRODUCTION_API = "https://chatifyapp-yy6k.onrender.com";

export const API_URL =
  import.meta.env.VITE_API_URL || (isLocalhost ? "http://localhost:3000" : PRODUCTION_API);

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || (isLocalhost ? "http://localhost:3000" : PRODUCTION_API);
