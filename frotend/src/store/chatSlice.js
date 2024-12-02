import { createSlice } from "@reduxjs/toolkit";

const chatSlice = createSlice({
   name: "chat",
   initialState: {
      chattingwith: {},
      connections: {},
      messagesQue: {},
   },
   reducers: {
      setChat(state, action) {
         state.chattingwith = action.payload;
      },
      setConnections(state, action) {
         action.payload.map((user) => {
            state.connections[user._id] = user;
         });
      },
      addConnection(state, action) {
         state.connections[action.payload._id] = action.payload;
      },
      messageHandler(state, action) {
         if (action.payload.self) {
            if (!state.messagesQue[action.payload.data.to]) {
               state.messagesQue[action.payload.data.to] = [
                  action.payload.data,
               ];
            } else {
               state.messagesQue[action.payload.data.to]?.unshift(
                  action.payload.data
               );
            }
         } else {
            if (!state.messagesQue[action.payload.data.from]) {
               state.messagesQue[action.payload.data.from] = [
                  action.payload.data,
               ];
            } else {
               state.messagesQue[action.payload.data.from]?.unshift(
                  action.payload.data
               );
            }
         }
      },
      EmptyMessages(state, action) {
         if (state.messagesQue[action.payload]) {
            state.messagesQue[action.payload] = [];
         }
      },
   },
});

export const { setChat, setConnections, messageHandler, addConnection, EmptyMessages } =
   chatSlice.actions;
export default chatSlice.reducer;
