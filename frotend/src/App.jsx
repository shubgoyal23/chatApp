import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { login, logout } from "./store/loginSlice";
import Auth from "./components/Auth/Auth";
import SocketConnect from "./components/message/SocketConnect";
import conf from "./constance/conf";

function App() {
   const loginStatus = useSelector((state) => state.login);
   const dispatch = useDispatch();
   useEffect(() => {
      fetch(`${conf.API_URL}/users/user`, {
         credentials: "include",
         headers: {
            "Content-Type": "application/json",
         },
      })
         .then((res) => res.json())
         .then((data) => {
            if (data) {
               if (data.success) {
                  dispatch(login(data.data));
               }
            } else {
               dispatch(logout());
            }
         })
         .catch((error) => console.log(error));
   }, []);

   return loginStatus.isLoggedin ? <SocketConnect /> : <Auth />;
}

export default App;
