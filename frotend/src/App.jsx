import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { login, logout } from "./store/loginSlice";
import Auth from "./components/Auth/Auth";
import MessageApp from "./components/message/MessageApp";

function App() {
   const loginStatus = useSelector((state) => state.login);
   const dispatch = useDispatch();
   useEffect(() => {
      fetch("/api/v1/users/user")
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

   return loginStatus.isLoggedin ? <MessageApp /> : <Auth />;
}

export default App;
