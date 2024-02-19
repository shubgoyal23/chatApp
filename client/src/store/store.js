import { configureStore } from "@reduxjs/toolkit";
import loginSlice from "./loginSlice";

const chatStore = configureStore({
   reducer: {
      login: loginSlice,
   },
});

export default chatStore
