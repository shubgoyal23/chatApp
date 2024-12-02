import conf from "./constance/conf";
import { decryptDataAES, encryptDataAES } from "./helper/AEShelper";
export let socket = null;

export const connectWebSocket = (token) => {
   // if (socket) {
   //    socket.close();
   //    socket = null;
   // }
   document.cookie = `ws=${token}; path=/; SameSite=None`
   let url = `${conf.WS_URL}/ws?token=${token}`;
   socket = new WebSocket(url);

   socket.onopen = () => {
      console.log("WebSocket connected.");
   };

   // socket.onmessage = (event) => {
   //    const msg = decryptDataAES(event.data);
   //    const msgJson = JSON.parse(msg);
   //    dispatch()
   //    console.log("WebSocket message received:", event.data);
   // };

   socket.onerror = (error) => {
      console.error("WebSocket error:", error);
   };

   socket.onclose = () => {
      console.log("WebSocket connection closed.");
      socket = null; // Reset socket on close
   };

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
