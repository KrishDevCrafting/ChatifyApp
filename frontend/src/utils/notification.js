/**
 * Web Notifications API Utility for Chatify
 * Handles browser permissions and native OS desktop alerts.
 */

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

// Trigger a native desktop notification when conditions are met
export const showDesktopNotification = ({
  title = "Chatify",
  body = "",
  icon = "/favicon.svg",
  tag = "chatify-message",
  onClick = null,
}) => {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== "granted") return;

  // Smart UX: Only show notification if the user is in another tab or minimized
  if (document.hidden) {
    try {
      const notification = new Notification(title, {
        body,
        icon,
        tag, // Groups/replaces active notification so screen is not spammed
        renotify: true, // Plays sound/vibrates even if replacing previous notification
      });

      notification.onclick = () => {
        window.focus();
        if (typeof onClick === "function") {
          onClick();
        }
        notification.close();
      };
    } catch (error) {
      console.error("Error displaying desktop notification:", error);
    }
  }
};
