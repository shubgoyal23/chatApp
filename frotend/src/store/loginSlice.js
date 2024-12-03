import { createSlice } from "@reduxjs/toolkit";
import { closeWebSocket } from "../socket";

const loginSlice = createSlice({
   name: "Login",
   initialState: {
      isLoggedin: false,
      userdata: null,
   },
   reducers: {
      login(state, action) {
         state.isLoggedin = true;
         state.userdata = action.payload;
      },
      logout(state, action) {
         closeWebSocket()
         state.isLoggedin = false;
         state.userdata = null;
      },
   },
});

export const { login, logout } = loginSlice.actions;
export default loginSlice.reducer;
