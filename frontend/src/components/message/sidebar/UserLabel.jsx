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
         }else{
            setLastMsg("");
            setMsgNum(0);
         }
      }
   }, [messagesQue[data?._id]]);
   return (
      <div
         className="flex justify-between items-center w-full h-20 px-4 hover:bg-gray-100 bg-white cursor-pointer"
         onClick={() => {
            dispatch(setChat(data));
            setSideNav((prev) => !prev);
         }}
      >
         <div className="size-14 rounded-full overflow-hidden mr-2">
            <img
               src={`${Cloudinay_URL}/${data?.avatar || avatar_public_ids[0]}`}
               alt="avatar"
               className="w-full"
            />
         </div>

         <div className="flex-1 h-full flex items-center justify-between gap-4 border-b-2 border-gray-200">
            <div>
               <h1 className="text-xl font-sans capitalize">
                  {data?.fullname || "anonymous"}
               </h1>
               <p className="text-sm text-gray-500 line-clamp-1 w-2/3">
                  {lastmsg}
               </p>
            </div>

            <div>
               {msgNum > 0 ? (
                  <span className="inline-flex items-center justify-center w-6 h-6 text-white font-semibold text-xs bg-lime-400 rounded-full">
                     {msgNum}
                  </span>
               ) : (
                  <span className="flex justify-center items-center text-xl">
                     <span className="material-symbols-outlined ">
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
