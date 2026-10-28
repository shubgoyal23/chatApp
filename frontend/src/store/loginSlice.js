import { createSlice } from "@reduxjs/toolkit";

const loginSlice = createSlice({
   name: "Login",
   initialState: {
      // "checking" until the initial session probe finishes
      status: "checking",
      isLoggedin: false,
      userdata: null,
   },
   reducers: {
      login(state, action) {
         state.status = "ready";
         state.isLoggedin = true;
         state.userdata = action.payload;
      },
      updateUser(state, action) {
         state.userdata = { ...state.userdata, ...action.payload };
      },
      logout(state) {
         state.status = "ready";
         state.isLoggedin = false;
         state.userdata = null;
      },
   },
});

export const { login, logout, updateUser } = loginSlice.actions;
export default loginSlice.reducer;
