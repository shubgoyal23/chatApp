import { createSlice } from "@reduxjs/toolkit";
import { SetMessageToLS } from "../helper/MessageStorage";

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
               state.messagesQue[action.payload.data.to]?.push(
                  action.payload.data
               );
            }
            SetMessageToLS(action.payload.data, true)
         } else {
            if (!state.messagesQue[action.payload.data.from]) {
               state.messagesQue[action.payload.data.from] = [
                  action.payload.data,
               ];
            } else {
               state.messagesQue[action.payload.data.from]?.push(
                  action.payload.data
               );
            }
            SetMessageToLS(action.payload.data, false)
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
