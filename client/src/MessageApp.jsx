import React from "react";
import Sidebar from "./Sidebar";
import MessageArea from "./MessageArea";

function MessageAll() {
   return (
      <div className="h-screen w-screen overflow-hidden flex">
         <Sidebar />
         <MessageArea />
      </div>
   );
}

export default MessageAll;
