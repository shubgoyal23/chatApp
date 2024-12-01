import { createSlice } from "@reduxjs/toolkit";

const chatSlice = createSlice({
   name: "chat",
   initialState: {
      chattingwith: {},
      connections: {},
   },
   reducers: {
      setChat(state, action) {
         state.chattingwith = action.payload;
      },
      setConnections(state, action) {
         let a = {};
         action.payload.map((user) => {
            user.messages = [];
            a[user._id] = user;
         });
         state.connections = a;
      },
      messageHandler(state, action) {
         console.log(action.payload);
         state.connections[action.payload.to]?.messages.prepend(action.payload);
      },
   },
});

export const { setChat, setConnections, messageHandler } = chatSlice.actions;
export default chatSlice.reducer;
