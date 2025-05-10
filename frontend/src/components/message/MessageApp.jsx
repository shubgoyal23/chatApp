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
      <div className="relative h-svh w-screen overflow-hidden flex bg-purple-50 bg-blend-luminosity border-gray-300">
         <Sidebar sidNav={sidNav} setSideNav={setSideNav} />
         <SidebarRight
            sidNav={showChattingWithUserDetails}
            setSideNav={setShowChattingWithUserDetails}
         />
         <main className="flex-1 w-full box-border h-screen">
            {chatwith._id ? (
            <MessageArea
               sidNav={sidNav}
               setSideNav={setSideNav}
               setShowChattingWithDetails={setShowChattingWithUserDetails}
            />
         ) : (
            <EmptyMessageArea sidNav={sidNav} setSideNav={setSideNav} />
         )}
         </main>
      </div>
   );
}
