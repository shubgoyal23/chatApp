import { createSlice } from "@reduxjs/toolkit";

const videoSlice = createSlice({
   name: "video",
   initialState: {
      isInCall: false,
      callType: {
         outgoingCall: null,
         incommingCall: null,
      },
   },
   reducers: {
      StartCall(state, action) {
         state.isInCall = true;
         state.callType.outgoingCall = action.payload;
      },
      EndCall(state, action) {
         state.isInCall = false;
         state.callType = {};
      },
      setIncommingCall(state, action) {
         state.isInCall = true;
         state.callType.incommingCall = action.payload;
      },
   },
});

export const { StartCall, EndCall, setIncommingCall } = videoSlice.actions;
export default videoSlice.reducer;
