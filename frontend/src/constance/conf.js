// constant files
const env = import.meta.env;

// WebSocket needs ws:// or wss://; accept http(s) URLs in the env for convenience.
const toWs = (url = "") => url.replace(/^http(s?):\/\//, "ws$1://");

const iceServers = [
   { urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"] },
];
// A TURN server is needed for calls between users behind strict NATs.
if (env.VITE_TURN_URL) {
   iceServers.push({
      urls: env.VITE_TURN_URL.split(","),
      username: env.VITE_TURN_USERNAME,
      credential: env.VITE_TURN_CREDENTIAL,
   });
}

const conf = {
   WS_URL: toWs(env.VITE_WS_URL),
   API_URL: env.VITE_API_URL,
   GIN_URL: env.VITE_GIN_URL,
   ICE_SERVERS: iceServers,
};
export default conf;
