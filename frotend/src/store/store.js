import { configureStore } from "@reduxjs/toolkit";
import loginSlice from "./loginSlice";
import chatSlice from "./chatSlice";
import callSlice from "./callSlice";
const chatStore = configureStore({
   reducer: {
      login: loginSlice,
      chat: chatSlice,
      call: callSlice,
   },
});

export default chatStore;
