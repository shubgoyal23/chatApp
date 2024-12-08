import { configureStore } from "@reduxjs/toolkit";
import loginSlice from "./loginSlice";
import chatSlice from "./chatSlice";
import videoSlice from "./videoSlice";
const chatStore = configureStore({
   reducer: {
      login: loginSlice,
      chat: chatSlice,
      video: videoSlice,
   },
});

export default chatStore;
