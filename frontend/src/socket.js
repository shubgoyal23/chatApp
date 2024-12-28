import conf from "./constance/conf";
import { encryptDataAES } from "./helper/AEShelper";
export let socket = null;
export let token = null;

export const connectWebSocket = (tkn) => {
   token = tkn;
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
      if (!token) {
         return;
      }
      connectWebSocket();
      if (socket && socket.readyState === WebSocket.OPEN) {
         const msgStr = JSON.stringify(message);
         const msg = await encryptDataAES(msgStr);
         socket.send(msg);
      }
   }
};

export const closeWebSocket = () => {
   if (socket) {
      socket.close();
      socket = null;
   }
};
