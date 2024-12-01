import { configureStore } from "@reduxjs/toolkit";
import loginSlice from "./loginSlice";
import chatSlice from "./chatSlice";
const chatStore = configureStore({
   reducer: {
      login: loginSlice,
      chat: chatSlice,
   },
});

export default chatStore;
