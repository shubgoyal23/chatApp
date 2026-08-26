import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setChat } from "../../../store/chatSlice";
import { Cloudinay_URL, avatar_public_ids } from "../../../constance/data";

function UserLabel({ data, setSideNav }) {
   const messagesQue = useSelector((state) => state.chat.messagesQue);
   const [lastmsg, setLastMsg] = useState("");
   const [msgNum, setMsgNum] = useState(0);
   const dispatch = useDispatch();
   useEffect(() => {
      if (messagesQue[data?._id]) {
         const m = messagesQue[data?._id];
         if (m.length > 0) {
            setLastMsg(m[m.length - 1].message);
            setMsgNum(m.length);
         } else {
            setLastMsg(data?.lastMessage?.message);
            setMsgNum(0);
         }
      }
   }, [messagesQue[data?._id]]);
   return (
      <div
         className="flex justify-between items-center w-full h-[72px] px-4 hover:bg-indigo-50/50 bg-white cursor-pointer transition-colors duration-200 group"
         onClick={() => {
            dispatch(setChat(data));
            setSideNav((prev) => !prev);
         }}
      >
         <div className="size-12 rounded-full overflow-hidden mr-3 shrink-0">
            <img
               src={`${Cloudinay_URL}/${data?.avatar || avatar_public_ids[0]}`}
               alt="avatar"
               className="w-full h-full object-cover object-top"
            />
         </div>

         <div className="flex-1 h-full flex items-center justify-between gap-3 border-b border-gray-100">
            <div className="overflow-hidden">
               <h1 className="text-[15px] font-semibold capitalize text-gray-800 group-hover:text-indigo-600 transition-colors duration-200">
                  {data?.fullname || "anonymous"}
               </h1>
               <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">
                  {lastmsg || data?.lastMessage?.message}
               </p>
            </div>

            <div className="shrink-0">
               {msgNum > 0 ? (
                  <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 text-white font-semibold text-[11px] bg-indigo-500 rounded-full">
                     {msgNum}
                  </span>
               ) : (
                  <span className="flex justify-center items-center text-gray-300 group-hover:text-indigo-400 transition-colors duration-200">
                     <span className="material-symbols-outlined text-xl">
                        chevron_right
                     </span>
                  </span>
               )}
            </div>
         </div>
      </div>
   );
}

export default UserLabel;
