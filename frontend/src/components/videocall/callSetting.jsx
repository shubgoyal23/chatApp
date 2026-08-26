import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { StartCall } from "../../store/callSlice";
import { sendMessage } from "../../socket";

function ConnectCall() {
   const chatwith = useSelector((state) => state.chat.chattingwith);
   const user = useSelector((state) => state.login.userdata);
   const dispatch = useDispatch();

   const Callhandler = (media) => {
      const callData = {
         from: user._id,
         to: chatwith._id,
         type: "call",
         message: "offer",
         media: media,
      };
      sendMessage(callData);
      // Pass call data so CallHandler knows who we're calling and what media
      dispatch(StartCall({
         from: user._id,
         to: chatwith._id,
         media: media,
         message: "accept", // The caller's own flow goes straight to outgoing setup
      }));
   };

   return (
      <>
         <button
            onClick={() => Callhandler("audio")}
            className="text-sm text-gray-700 p-2 gap-2 hover:bg-indigo-50 flex justify-start items-center w-full h-full rounded-lg transition-colors duration-200"
         >
            <span className="material-symbols-outlined text-indigo-500">phone</span>
            Audio Call
         </button>
         <button
            onClick={() => Callhandler("video")}
            className="text-sm text-gray-700 p-2 gap-2 hover:bg-indigo-50 flex justify-start items-center rounded-lg transition-colors duration-200"
         >
            <span className="material-symbols-outlined text-indigo-500">videocam</span>
            Video Call
         </button>
      </>
   );
}

export default ConnectCall;
