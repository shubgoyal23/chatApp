import { createSlice } from "@reduxjs/toolkit";
// import WebSocketClient from "../socket.js";

const socketSlice = createSlice({
   name: "socketconn",
   initialState: {
      socket: null,
      isConnected: false,
   },
   reducers: {
      setSocket(state, action) {
        console.log(action.payload)
         // state.socket = new WebSocketClient(JSON.stringify(j));
         // state.socket.connect();
      },
   },
});

export const { setSocket } = socketSlice.actions;
export default socketSlice.reducer;
