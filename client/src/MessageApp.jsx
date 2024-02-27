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

   useEffect(() => {
      socket.emit("addUser", user)
      socket.on("getUsers", allusers => console.log(allusers))
   }, []);

   return (
      <div className="relative h-screen w-screen overflow-hidden flex">
         <Sidebar sidNav={sidNav} setSideNav={setSideNav} />
         {chatwith._id? <MessageArea sidNav={sidNav} setSideNav={setSideNav} /> : <EmptyMessageArea />}
      </div>
   );
}

export default MessageAll;
