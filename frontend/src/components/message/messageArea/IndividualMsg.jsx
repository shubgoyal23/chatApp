import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { convertTime } from "../../../helper/convertDate";
import Action from "./Action";

function IndividualMsg({ data, msglist }) {
   const user = useSelector((state) => state.login.userdata);
   const connections = useSelector((state) => state.chat.connections);
   const [you, SetYou] = useState(false);
   const [reply, setReply] = useState({});
   const date = convertTime(data.epoch);

   useEffect(() => {
      if (data.from === user._id) {
         SetYou(true);
      }
      if (data.replyTo && data.replyTo != "") {
         let ms = msglist?.find((m) => m._id === data.replyTo);
         if (ms) {
            setReply(ms);
         }
      }
   }, [data]);

   if (data.type === "datechange") {
      return (
         <div className="w-full flex items-center py-3 z-10 justify-center">
            <span className="text-gray-500 text-xs font-medium bg-white rounded-full px-3 py-1 shadow-sm border border-gray-100">
               {data?.date}
            </span>
         </div>
      );
   }

   return (
      <div
         className={`w-full flex items-end px-3 lg:px-10 py-[3px] z-10 animate-messageAppear ${
            you ? "justify-end" : "justify-start"
         }`}
      >
         <div
            className={`relative flex flex-col max-w-[75%] min-w-[7rem] pl-3 pt-2 pb-1.5 pr-3 rounded-2xl group ${
               you
                  ? "bg-indigo-500 text-white rounded-br-sm"
                  : "bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100"
            }`}
         >
            <span className="absolute right-1 top-1 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-6 h-6 z-10">
               <span
                  className={`material-symbols-outlined text-lg ${you ? "text-indigo-200" : "text-gray-400"}`}
               >
                  keyboard_arrow_down
               </span>
               <Action data={data} className="hidden group-hover:block" />
            </span>
            {data?.type === "group" ? (
               <span
                  className={`text-[10px] w-full text-start font-semibold ${you ? "text-indigo-200" : "text-indigo-400"}`}
               >
                  {!you
                     ? connections[data?.from]?.fullname
                        ? connections[data?.from]?.fullname
                        : "anonymous"
                     : ""}
               </span>
            ) : (
               <span></span>
            )}
            {reply?.message && (
               <div
                  className={`w-full min-h-10 mb-1.5 rounded-lg px-2.5 py-2 ${
                     you
                        ? "bg-indigo-400/40 border-l-2 border-white/50"
                        : "bg-gray-100 border-l-2 border-indigo-400"
                  }`}
               >
                  <span
                     className={`block text-[10px] font-semibold mb-0.5 ${
                        you ? "text-white/70" : "text-indigo-500"
                     }`}
                  >
                     Reply
                  </span>
                  <span
                     className={`block text-sm leading-snug line-clamp-2 ${
                        you ? "text-white/90" : "text-gray-700"
                     }`}
                  >
                     {reply?.message}
                  </span>
               </div>
            )}
            <p className="pr-10 text-[14px] leading-relaxed pb-1 break-words whitespace-pre-wrap">
               {data?.message}
            </p>
            <span
               className={`text-[10px] w-full text-end -mt-1 ${you ? "text-indigo-200" : "text-gray-400"}`}
            >
               {date}
            </span>
         </div>
      </div>
   );
}

export default IndividualMsg;
