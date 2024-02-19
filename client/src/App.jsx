import Auth from "./Auth";
import MessageApp from "./MessageApp";
import { useSelector } from "react-redux";

function App() {
   const loginStatus = useSelector((state) => state.login);

   return loginStatus.isLoggedin ? <MessageApp /> : <Auth />;
}

export default App;
