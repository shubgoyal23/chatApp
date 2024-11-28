import React, { useState, useEffect } from "react";
import Sidebar from "./sidebar/Sidebar";
import MessageArea from "./messageArea/MessageArea";
import { useSelector } from "react-redux";
import EmptyMessageArea from "./EmptyMessageArea";
import SidebarRight from "./sidbarRight/SideBarRight";

function MessageAll() {
   const user = useSelector((state) => state.login.userdata);
   const chatwith = useSelector((state) => state.chat.chattingwith);
   const socket = useSelector((state) => state.socket);
   const [sidNav, setSideNav] = useState(true);
   const [showChattingWithUserDetails, setShowChattingWithUserDetails] =
      useState(false);
   const [userOnline, setUsersOnline] = useState([]);

   useEffect(() => {
      // socket.emit("addUser", user);
      // socket.on("getUsers", (allusers) => setUsersOnline(allusers));
      // socket.sendMessage()
      
   }, []);

   return (
      <div className="relative h-[100svh] w-screen overflow-hidden flex">
         <Sidebar sidNav={sidNav} setSideNav={setSideNav} />
         <SidebarRight
            sidNav={showChattingWithUserDetails}
            setSideNav={setShowChattingWithUserDetails}
         />
         {chatwith._id ? (
            <MessageArea
               sidNav={sidNav}
               setSideNav={setSideNav}
               userOnline={userOnline}
               showChattingWithDetails={showChattingWithUserDetails}
               setShowChattingWithDetails={setShowChattingWithUserDetails}
            />
         ) : (
            <EmptyMessageArea sidNav={sidNav} setSideNav={setSideNav} />
         )}
      </div>
   );
}

export default MessageAll;
