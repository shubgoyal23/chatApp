import React, { useState, useEffect } from "react";
import Sidebar from "./sidebar/Sidebar";
import MessageArea from "./messageArea/MessageArea";
import { useDispatch, useSelector } from "react-redux";
import EmptyMessageArea from "./EmptyMessageArea";
import SidebarRight from "./sidbarRight/SideBarRight";
import { socket } from "../../socket";
import { messageHandler } from "../../store/chatSlice";
import { decryptDataAES } from "../../helper/AEShelper";

function MessageAll() {
   const dispatch = useDispatch();
   const user = useSelector((state) => state.login.userdata);
   const chatwith = useSelector((state) => state.chat.chattingwith);
   const [sidNav, setSideNav] = useState(true);
   const [showChattingWithUserDetails, setShowChattingWithUserDetails] =
      useState(false);
   const [userOnline, setUsersOnline] = useState([]);

   useEffect(() => {
      if (socket) {
         console.log("listing messages");
         socket.onmessage = async (event) => {
            const msg = await decryptDataAES(event.data);
            const data = JSON.parse(msg);
            if (data) {
               const d = {
                  self: data.from === user._id,
                  data: data,
               };
               dispatch(messageHandler(d));
            }
         };
      }
      // return () => {
      //    socket.close()
      // };
   }, [socket]);

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
