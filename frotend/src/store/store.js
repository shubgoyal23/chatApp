import { configureStore } from "@reduxjs/toolkit";
import loginSlice from "./loginSlice";
import chatSlice from "./chatSlice";
import Socket from "./socketSlice";
const chatStore = configureStore({
   reducer: {
      login: loginSlice,
      chat: chatSlice,
      Socket: Socket,
   },
});

export default chatStore;
