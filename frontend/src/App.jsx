import { lazy, Suspense, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { login, logout } from "./store/loginSlice";
import { api } from "./lib/api";
import AuthPage from "./components/auth/AuthPage";
import Toaster from "./components/ui/Toaster";
import Splash from "./components/ui/Splash";

const ChatApp = lazy(() => import("./components/chat/ChatApp"));

function App() {
   const { status, isLoggedin } = useSelector((state) => state.login);
   const dispatch = useDispatch();

   useEffect(() => {
      let cancelled = false;
      api("/users/user")
         .then((user) => !cancelled && dispatch(login(user)))
         .catch(() => !cancelled && dispatch(logout()));
      return () => {
         cancelled = true;
      };
   }, [dispatch]);

   useEffect(() => {
      const onExpired = () => dispatch(logout());
      window.addEventListener("auth:expired", onExpired);
      return () => window.removeEventListener("auth:expired", onExpired);
   }, [dispatch]);

   return (
      <>
         {status === "checking" ? (
            <Splash />
         ) : isLoggedin ? (
            <Suspense fallback={<Splash />}>
               <ChatApp />
            </Suspense>
         ) : (
            <AuthPage />
         )}
         <Toaster />
      </>
   );
}

export default App;
