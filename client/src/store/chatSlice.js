import { createSlice } from "@reduxjs/toolkit";

const chatSlice = createSlice({
   name: "chat",
   initialState: {
      chattingwith: undefined,
   },
   reducers: {
      setChat(state, action) {
         state.chattingwith = action.payload;
      },
   },
});

export const { setChat } = chatSlice.actions;
export default chatSlice.reducer;
