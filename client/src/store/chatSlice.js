import { createSlice } from "@reduxjs/toolkit";

const chatSlice = createSlice({
   name: "chat",
   initialState: {
      chattingwith: {
         _id: "65d600295e49924b7bcb03b4",
         fullname: "shubham goyal",
         username: "goyal",
      },
   },
   reducers: {
      setChat(state, action) {
         state.chattingwith = action.payload;
      },
   },
});

export const { setChat } = chatSlice.actions;
export default chatSlice.reducer;
