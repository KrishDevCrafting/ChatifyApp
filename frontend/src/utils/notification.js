/**
 * Web Notifications API Utility for Chatify
 * Handles browser permissions, native OS desktop alerts, and test triggers.
 */

// Generate a clean PNG data URL for maximum OS compatibility (Linux/Windows/macOS)
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

// Trigger a native desktop notification
export const showDesktopNotification = ({
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
    try {
      const finalIcon = icon || getNotificationIcon();
      const notification = new Notification(title, {
        body,
        icon: finalIcon,
        tag,
        renotify: true,
      });

      notification.onclick = () => {
        window.focus();
        if (typeof onClick === "function") {
          onClick();
        }
        notification.close();
      };

      return true;
    } catch (error) {
      console.error("Error creating Notification:", error);
      return false;
    }
  }

  return false;
};
