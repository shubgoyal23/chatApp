import { useEffect } from "react";
import Auth from "./Auth";
import MessageApp from "./MessageApp";
import { useSelector, useDispatch } from "react-redux";
import { login, logout } from "./store/loginSlice";

function App() {
   const loginStatus = useSelector((state) => state.login);
   const dispatch = useDispatch();
   useEffect(() => {
      fetch("/api/v1/users/user")
         .then((res) => res.json())
         .then((data) => {
            if (data) {
               if(data.success){
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
