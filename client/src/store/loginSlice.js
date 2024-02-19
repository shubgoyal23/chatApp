import { createSlice } from "@reduxjs/toolkit";

const loginSlice = createSlice({
   name: "Login",
   initialState: {
      isLoggedin: true,
      userdata: null,
   },
   reducers: {
      login(state, action) {
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
