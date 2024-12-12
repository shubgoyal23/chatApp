import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { convertTime } from "../../../helper/convertDate";
import Action from "./Action";

function IndividualMsg({ data }) {
   const user = useSelector((state) => state.login.userdata);
   const connections = useSelector((state) => state.chat.connections);
   const [you, SetYou] = useState(false);
   const date = convertTime(data.epoch);

   if (data.type === "datechange") {
      return (
         <div className="w-full flex items-center py-2 z-10 justify-center">
            <span className=" text-gray-500 text-sm bg-gray-200 rounded-lg px-2 py-[2px] shadow-md shadow-gray-400">
               {data?.date}
            </span>
         </div>
      );
   }

   useEffect(() => {
      if (data.from === user._id) {
         SetYou(true);
      }
   }, [data]);

   return (
      <div
         className={`w-full flex items-center p-2 px-10 z-10 ${
            you ? "justify-end" : "justify-start"
         }`}
      >
         <div
            className={`relative flex flex-col max-w-[80%] w-content pl-2 pt-2 pb-1 pr-1 rounded-lg shadow-lg shadow-gray-400 ${
               you ? " bg-lime-400" : "bg-amber-200 "
            }`}
         >
            <span className="absolute right-0 top-1 cursor-pointer opacity-0 hover:opacity-100 group w-6 h-6">
               <span className="material-symbols-outlined">
                  keyboard_arrow_down
               </span>
               <Action data={data} className="hidden group-hover:block" />
            </span>
            <span
               className={`border-4 absolute top-3 rotate-45 z-0 shadow-sm ${
                  you
                     ? "left-full -translate-x-1 border-lime-400"
                     : "-left-1 border-amber-200"
               }`}
            ></span>
            {data?.type === "group" ? (
               <span className="text-[10px] text-gray-600 w-full text-start bottom-0 right-0">
                  {!you
                     ? connections[data?.from]?.fullname
                        ? connections[data?.from]?.fullname
                        : "anonymous"
                     : ""}
               </span>
            ) : (
               <span></span>
            )}
            <h2 className="mb-1 pr-6">{data?.message}</h2>
            <span className="text-[10px] w-full text-end bottom-0 right-0">
               {date}
            </span>
         </div>
      </div>
   );
}

export default IndividualMsg;
