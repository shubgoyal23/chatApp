import React, { useState } from "react";
import Sidebar from "./sidebar/Sidebar";
import MessageArea from "./messageArea/MessageArea";
import { useSelector } from "react-redux";
import EmptyMessageArea from "./EmptyMessageArea";
import SidebarRight from "./sidbarRight/SideBarRight";

export default function MessageApp() {
   const chatwith = useSelector((state) => state.chat.chattingwith);
   const [sidNav, setSideNav] = useState(true);
   const [showChattingWithUserDetails, setShowChattingWithUserDetails] =
      useState(false);

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
               setShowChattingWithDetails={setShowChattingWithUserDetails}
            />
         ) : (
            <EmptyMessageArea sidNav={sidNav} setSideNav={setSideNav} />
         )}
      </div>
   );
}
