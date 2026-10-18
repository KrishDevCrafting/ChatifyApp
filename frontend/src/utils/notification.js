/**
 * Web Notifications API Utility for Chatify
 * Handles browser permissions, native OS desktop alerts, mobile Service Worker alerts, and test triggers.
 */

// Generate a clean PNG data URL for maximum OS compatibility (Linux/Windows/macOS/Android)
let cachedIconUrl = null;
const getNotificationIcon = () => {
  if (cachedIconUrl) return cachedIconUrl;
  if (typeof document === "undefined") return undefined;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    // Indigo rounded badge
    ctx.fillStyle = "#6366f1";
    ctx.beginPath();
    ctx.roundRect(0, 0, 64, 64, 14);
    ctx.fill();

    // Chat bubble emoji
    ctx.fillStyle = "#ffffff";
    ctx.font = "32px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("💬", 32, 34);

    cachedIconUrl = canvas.toDataURL("image/png");
    return cachedIconUrl;
  } catch {
    return "/favicon.svg";
  }
};

// Check if browser supports the Web Notification API
export const isNotificationSupported = () => {
  return typeof window !== "undefined" && "Notification" in window;
};

// Register Service Worker for Mobile (Android Chrome / Pixel) notification support
export const registerServiceWorker = async () => {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      return reg;
    } catch (err) {
      console.warn("Service Worker registration failed:", err);
      return null;
    }
  }
  return null;
};

// Auto-register service worker in browser environments
if (typeof window !== "undefined") {
  registerServiceWorker();
}

// Get current permission: 'default' | 'granted' | 'denied' | 'unsupported'
export const getNotificationPermission = () => {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
};

// Request permission from the user
export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) return "unsupported";

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return "denied";
  }
};

// Trigger a native desktop or mobile notification
export const showDesktopNotification = async ({
  title = "Chatify",
  body = "",
  icon = null,
  tag = "chatify-message",
  onClick = null,
  force = false, // When true, bypasses document.hidden / hasFocus checks (great for test alerts)
}) => {
  if (!isNotificationSupported()) {
    console.warn("Desktop notifications not supported in this browser.");
    return false;
  }

  if (Notification.permission !== "granted") {
    console.warn("Notification permission is not granted:", Notification.permission);
    return false;
  }

  // Check if user is away: tab is hidden OR window is not focused
  const isAway =
    document.hidden ||
    (typeof document.hasFocus === "function" && !document.hasFocus());

  // Show if forced (e.g. testing) OR if user is away/unfocused
  if (force || isAway) {
    const finalIcon = icon || getNotificationIcon();
    const options = {
      body,
      icon: finalIcon,
      badge: finalIcon,
      tag,
      renotify: true,
      vibrate: [200, 100, 200], // 📳 Haptic vibration for Android / Pixel!
    };

    // 📱 Strategy 1 (Android / Mobile Chrome / Pixel):
    // Chrome on Android bans `new Notification()`. It requires `ServiceWorkerRegistration.showNotification()`
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && typeof registration.showNotification === "function") {
          await registration.showNotification(title, options);
          return true;
        }
      } catch (swErr) {
        console.warn("ServiceWorker showNotification failed, trying fallback:", swErr);
      }
    }

    // 💻 Strategy 2 (Desktop / PC fallback): new Notification(...)
    try {
      const notification = new Notification(title, options);

      notification.onclick = () => {
        window.focus();
        if (typeof onClick === "function") {
          onClick();
        }
        notification.close();
      };

      return true;
    } catch (error) {
      console.error("Error creating Notification constructor:", error);
      return false;
    }
  }

  return false;
};
