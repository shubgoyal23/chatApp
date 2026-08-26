import conf from "./constance/conf";
import { encryptDataAES } from "./helper/AEShelper";

export let socket = null;
export let token = null;

// Connection state management
let connectionState = "disconnected"; // connected | disconnected | reconnecting
let connectionStateCallback = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 15;
const BASE_DELAY = 1000;
const MAX_DELAY = 30000;
let reconnectTimer = null;
let messageQueue = [];
let onMessageHandler = null;

export const setConnectionStateCallback = (callback) => {
   connectionStateCallback = callback;
   // Immediately report current state
   if (callback) callback(connectionState);
};

export const getConnectionState = () => connectionState;

const updateConnectionState = (state) => {
   connectionState = state;
   if (connectionStateCallback) {
      connectionStateCallback(state);
   }
};

export const setOnMessageHandler = (handler) => {
   onMessageHandler = handler;
   // Re-attach if socket already exists
   if (socket && socket.readyState === WebSocket.OPEN) {
      socket.onmessage = handler;
   }
};

export const connectWebSocket = (tkn) => {
   if (tkn) {
      token = tkn;
   }
   if (!token) {
      console.error("No token available for WebSocket connection");
      return null;
   }

   // Clear any pending reconnect
   if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
   }

   // Close existing connection if any
   if (socket) {
      try {
         socket.onclose = null; // Prevent reconnect loop
         socket.close();
      } catch (e) {
         // ignore
      }
   }

   let url = `${conf.WS_URL}/ws?token=${token}`;
   socket = new WebSocket(url);

   socket.onopen = () => {
      reconnectAttempts = 0;
      updateConnectionState("connected");

      // Re-attach message handler
      if (onMessageHandler) {
         socket.onmessage = onMessageHandler;
      }

      // Flush queued messages
      flushMessageQueue();
   };

   socket.onclose = (event) => {
      console.log("WebSocket closed:", event.code, event.reason);
      if (connectionState !== "disconnected") {
         attemptReconnect();
      }
   };

   socket.onerror = (error) => {
      console.error("WebSocket error:", error);
   };

   return socket;
};

const attemptReconnect = () => {
   if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error("Max reconnection attempts reached");
      updateConnectionState("disconnected");
      return;
   }

   updateConnectionState("reconnecting");
   reconnectAttempts++;

   // Exponential backoff with jitter
   const delay = Math.min(
      BASE_DELAY * Math.pow(2, reconnectAttempts - 1) + Math.random() * 1000,
      MAX_DELAY
   );

   console.log(`Reconnecting in ${Math.round(delay)}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);

   reconnectTimer = setTimeout(() => {
      connectWebSocket();
   }, delay);
};

const flushMessageQueue = () => {
   while (messageQueue.length > 0 && socket?.readyState === WebSocket.OPEN) {
      const msg = messageQueue.shift();
      try {
         socket.send(msg);
      } catch (error) {
         console.error("Failed to flush queued message:", error);
         messageQueue.unshift(msg);
         break;
      }
   }
};

export const sendMessage = async (message) => {
   const msgStr = JSON.stringify(message);
   const msg = await encryptDataAES(msgStr);

   if (socket && socket.readyState === WebSocket.OPEN) {
      try {
         socket.send(msg);
      } catch (error) {
         console.error("Failed to send message, queueing:", error);
         messageQueue.push(msg);
      }
   } else {
      // Queue the message for when connection is restored
      messageQueue.push(msg);

      // Trigger reconnect if not already in progress
      if (connectionState !== "reconnecting" && token) {
         attemptReconnect();
      }
   }
};

export const closeWebSocket = () => {
   // Clear reconnection timer
   if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
   }

   updateConnectionState("disconnected");
   reconnectAttempts = MAX_RECONNECT_ATTEMPTS; // Prevent auto-reconnect

   if (socket) {
      socket.onclose = null; // Prevent reconnect on intentional close
      socket.close();
      socket = null;
   }

   messageQueue = [];
   token = null;
   onMessageHandler = null;
   connectionStateCallback = null;
};
