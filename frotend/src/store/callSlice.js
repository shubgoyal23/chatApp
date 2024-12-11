import { createSlice } from "@reduxjs/toolkit";

const callSlice = createSlice({
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

export const { StartCall, EndCall, setIncommingCall } = callSlice.actions;
export default callSlice.reducer;
