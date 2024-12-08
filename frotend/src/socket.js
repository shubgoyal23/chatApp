import conf from "./constance/conf";
import { encryptDataAES } from "./helper/AEShelper";
export let socket = null;

export const connectWebSocket = (token) => {
   // document.cookie = `ws=${token}; path=/; SameSite=None`
   let url = `${conf.WS_URL}/ws?token=${token}`;
   socket = new WebSocket(url);
   return socket;
};

export const sendMessage = async (message) => {
   if (socket && socket.readyState === WebSocket.OPEN) {
      const msgStr = JSON.stringify(message);
      const msg = await encryptDataAES(msgStr);
      socket.send(msg);
   } else {
      console.error("WebSocket is not connected.");
   }
};

export const closeWebSocket = () => {
   if (socket) {
      socket.close();
      socket = null;
   }
};
