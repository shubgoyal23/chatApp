import { createSlice } from "@reduxjs/toolkit";

// Serializable call state; media streams live in lib/call.js.
const initialState = {
   status: "idle", // idle | outgoing | incoming | connecting | connected | ended
   peer: null, // { _id, fullname, avatar }
   media: "audio",
   startedAt: null,
   reason: null,
};

const callSlice = createSlice({
   name: "call",
   initialState,
   reducers: {
      setCall(state, action) {
         return { ...state, ...action.payload };
      },
      resetCall() {
         return initialState;
      },
   },
});

export const { setCall, resetCall } = callSlice.actions;
export default callSlice.reducer;
