import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import convertDate from "./convertDate";

function IndividualMsg({ data }) {
   const user = useSelector((state) => state.login.userdata);
   const [you, SetYou] = useState(false);
   const [date, setDate] = useState(convertDate(data.createdAt));

   useEffect(() => {
      if (data.from === user._id) {
         SetYou(true);
      }
   }, [data]);

   return (
      <div
         className={`w-full flex items-center p-2 px-4 z-10 ${
            you ? "justify-end" : "justify-start"
         }`}
      >
         <div
            className={`relative flex flex-col max-w-[80%] w-content pl-2 pt-2 pb-1 pr-1 rounded-lg shadow ${
               you ? " bg-lime-400" : "bg-amber-200 "
            }`}
         >
            <span
               className={`border-4 absolute top-3 rotate-45 z-0 shadow-sm ${
                  you
                     ? "left-full -translate-x-1 border-lime-400"
                     : "-left-1 border-amber-200"
               }`}
            ></span>
            <h2 className="mb-1 pr-4">{data?.message}</h2>
            <span className="text-[10px] w-full text-end bottom-0 right-0">{date}</span>
         </div>
      </div>
   );
}

export default IndividualMsg;
