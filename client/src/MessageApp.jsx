import React, { useState } from "react";
import Sidebar from "./Sidebar";
import MessageArea from "./MessageArea";

function MessageAll() {
   const [sidNav, setSideNav] = useState(false)
   return (
      <div className="relative h-screen w-screen overflow-hidden flex">
         <Sidebar sidNav={sidNav} setSideNav={setSideNav} />
         <MessageArea sidNav={sidNav} setSideNav={setSideNav} />
      </div>
   );
}

export default MessageAll;
