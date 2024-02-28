import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import MessageArea from "./MessageArea";
import { useSelector } from "react-redux";
import EmptyMessageArea from "./EmptyMessageArea";
import { socket } from "./socket";


function MessageAll() {
   const user = useSelector(state => state.login.userdata)
   const chatwith = useSelector(state => state.chat.chattingwith)
   const [sidNav, setSideNav] = useState(true)
   const [userOnline, setUsersOnline] = useState([]);

   useEffect(() => {
      socket.emit("addUser", user)
      socket.on("getUsers", (allusers) => setUsersOnline(allusers));
   }, []);

   return (
      <div className="relative h-screen w-screen overflow-hidden flex">
         <Sidebar sidNav={sidNav} setSideNav={setSideNav} />
         {chatwith._id? <MessageArea sidNav={sidNav} setSideNav={setSideNav} userOnline={userOnline} /> : <EmptyMessageArea sidNav={sidNav} setSideNav={setSideNav} />}
      </div>
   );
}

export default MessageAll;
