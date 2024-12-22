import { createSlice } from "@reduxjs/toolkit";

const callSlice = createSlice({
   name: "video",
   initialState: {
      isInCall: false,
      Data: null,
   },
   reducers: {
      StartCall(state, action) {
         state.isInCall = true;
      },
      EndCall(state, action) {
         state.isInCall = false;
         state.callType = {};
      },
      SetCallSettings(state, action) {
         state.isInCall = true;
         let to = action.payload.from;
         action.payload.from = action.payload.to;
         action.payload.to = to;
         state.Data = action.payload;
      },
   },
});

export const { StartCall, EndCall, SetCallSettings } = callSlice.actions;
export default callSlice.reducer;
