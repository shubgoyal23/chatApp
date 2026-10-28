import conf from "../constance/conf";
import { decryptDataAES, encryptDataAES } from "../helper/AEShelper";

// Close code the server sends when this user connected from another tab/device.
const CLOSE_REPLACED = 4000;
const PING_EVERY = 25_000;
// no traffic (not even a pong) for this long means the link is dead
const STALE_AFTER = 70_000;
const MAX_DELAY = 30_000;

let socket = null;
let tokenProvider = null;
let selfId = null;
let state = "idle"; // idle | connecting | connected | reconnecting | offline | replaced
let attempts = 0;
let retryTimer = null;
let pingTimer = null;
let lastSeen = 0;
let stopped = true;
let queue = []; // plaintext chat messages waiting for a connection
let messageHandler = null;
let authFailureHandler = null;
let decodeChain = Promise.resolve();
const stateListeners = new Set();

const setState = (s) => {
   state = s;
   stateListeners.forEach((l) => l(s));
};

export const getConnectionState = () => state;

export const onConnectionState = (listener) => {
   stateListeners.add(listener);
   listener(state);
   return () => stateListeners.delete(listener);
};

export const setMessageHandler = (handler) => {
   messageHandler = handler;
};

const clearTimers = () => {
   clearTimeout(retryTimer);
   clearInterval(pingTimer);
   retryTimer = null;
   pingTimer = null;
};

const scheduleReconnect = () => {
   if (stopped) return;
   clearTimeout(retryTimer);
   if (!navigator.onLine) {
      setState("offline");
      return;
   }
   setState("reconnecting");
   const delay = Math.min(1000 * 2 ** attempts, MAX_DELAY) + Math.random() * 800;
   attempts++;
   retryTimer = setTimeout(connect, delay);
};

const rawSend = async (message) => {
   const ws = socket;
   if (!ws || ws.readyState !== WebSocket.OPEN) return false;
   const payload = await encryptDataAES(JSON.stringify(message));
   if (ws !== socket || ws.readyState !== WebSocket.OPEN) return false;
   ws.send(payload);
   return true;
};

const flushQueue = async () => {
   while (queue.length && socket?.readyState === WebSocket.OPEN) {
      const msg = queue[0];
      if (!(await rawSend(msg))) return;
      queue.shift();
   }
};

const startPing = () => {
   clearInterval(pingTimer);
   pingTimer = setInterval(() => {
      if (Date.now() - lastSeen > STALE_AFTER) {
         // half-open TCP connection: the browser won't notice on its own
         socket?.close(4001, "stale");
         return;
      }
      rawSend({ from: selfId, to: selfId, type: "ping", message: "ping" });
   }, PING_EVERY);
};

async function connect() {
   clearTimeout(retryTimer);
   if (stopped || !tokenProvider) return;
   if (!navigator.onLine) {
      setState("offline");
      return;
   }
   if (socket && socket.readyState <= WebSocket.OPEN) return;
   setState(attempts === 0 ? "connecting" : "reconnecting");

   let token;
   try {
      token = await tokenProvider();
   } catch (err) {
      if (err?.status === 401) {
         authFailureHandler?.();
         return;
      }
      scheduleReconnect();
      return;
   }
   if (stopped) return;

   const ws = new WebSocket(`${conf.WS_URL}/ws?token=${encodeURIComponent(token)}`);
   socket = ws;

   ws.onopen = () => {
      if (ws !== socket) return;
      attempts = 0;
      lastSeen = Date.now();
      setState("connected");
      startPing();
      // ask once right away so presence is fresh after a reconnect
      rawSend({ from: selfId, to: selfId, type: "ping", message: "ping" });
      flushQueue();
   };

   ws.onmessage = (event) => {
      if (ws !== socket) return;
      lastSeen = Date.now();
      // decrypt sequentially so messages are handled in arrival order
      decodeChain = decodeChain.then(async () => {
         let data;
         try {
            data = JSON.parse(await decryptDataAES(event.data));
         } catch {
            return;
         }
         if (data?.type === "pong") return;
         try {
            messageHandler?.(data);
         } catch (err) {
            console.error("message handler failed", err);
         }
      });
   };

   ws.onclose = (event) => {
      if (ws !== socket) return;
      socket = null;
      clearInterval(pingTimer);
      if (stopped) return;
      if (event.code === CLOSE_REPLACED) {
         setState("replaced");
         return;
      }
      scheduleReconnect();
   };

   ws.onerror = () => {
      // onclose always follows and handles the retry
   };
}

const onOnline = () => {
   if (stopped || state === "replaced") return;
   attempts = 0;
   connect();
};
const onOffline = () => {
   if (!stopped) setState("offline");
};
const onVisible = () => {
   if (document.visibilityState !== "visible" || stopped) return;
   if (state === "reconnecting" || state === "offline") {
      attempts = 0;
      connect();
   } else if (state === "connected" && Date.now() - lastSeen > STALE_AFTER) {
      socket?.close(4001, "stale");
   }
};

export const startSocket = ({ provider, userId, onAuthFailure }) => {
   stopSocket();
   stopped = false;
   tokenProvider = provider;
   selfId = userId;
   authFailureHandler = onAuthFailure;
   attempts = 0;
   window.addEventListener("online", onOnline);
   window.addEventListener("offline", onOffline);
   document.addEventListener("visibilitychange", onVisible);
   connect();
};

// Reconnects now, e.g. "Use here" after another tab took the session over,
// or after profile changes that alter the session key.
export const reconnectNow = () => {
   if (stopped) return;
   attempts = 0;
   const ws = socket;
   socket = null;
   ws?.close(1000, "reconnect");
   clearTimers();
   connect();
};

export const stopSocket = () => {
   stopped = true;
   clearTimers();
   window.removeEventListener("online", onOnline);
   window.removeEventListener("offline", onOffline);
   document.removeEventListener("visibilitychange", onVisible);
   const ws = socket;
   socket = null;
   ws?.close(1000, "logout");
   queue = [];
   tokenProvider = null;
   setState("idle");
};

/**
 * Sends a message. Chat messages are queued while disconnected and delivered
 * on reconnect; signalling (typing, calls, presence) is dropped instead,
 * since it would be stale by then. Returns true if sent immediately.
 */
export const sendMessage = async (message) => {
   const persistent = message.type === "user" || message.type === "group";
   try {
      if (await rawSend(message)) return true;
   } catch (err) {
      console.error("send failed", err);
   }
   if (persistent) {
      queue.push(message);
      if (state !== "connecting" && state !== "reconnecting") onOnline();
   }
   return false;
};
