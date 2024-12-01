import { createSlice } from "@reduxjs/toolkit";
import { connectSocket } from "../helper/ConnectSocket";

const loginSlice = createSlice({
   name: "Login",
   initialState: {
      isLoggedin: false,
      userdata: null,
   },
   reducers: {
      login(state, action) {
         connectSocket(action.payload);
         state.isLoggedin = true;
         state.userdata = action.payload;
      },
      logout(state, action) {
         state.isLoggedin = false;
         state.userdata = null;
      },
   },
});

export const { login, logout } = loginSlice.actions;
export default loginSlice.reducer;
