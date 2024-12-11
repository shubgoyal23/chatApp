import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { StartCall } from "../../store/callSlice";

function ConnectCall() {
   const chatwith = useSelector((state) => state.chat.chattingwith);
   const user = useSelector((state) => state.login.userdata);
   const dispatch = useDispatch();

   const Callhandler = (calltype) => {
      dispatch(
         StartCall({
            Calltype: calltype,
            to: chatwith._id,
            from: user._id,
         })
      );
   };

   return (
      <>
         <button
            onClick={() => Callhandler("audio")}
            className="text-sm text-gray-600 p-2 gap-1 hover:bg-gray-100 flex justify-start items-center w-full h-full"
         >
            <span className="material-symbols-outlined">phone</span>
            Audio Call
         </button>
         <button
            onClick={() => Callhandler("video")}
            className="text-sm text-gray-600 p-2 gap-1 hover:bg-gray-100 flex justify-start items-center"
         >
            <span className="material-symbols-outlined">videocam</span>
            Video Call
         </button>
      </>
   );
}

export default ConnectCall;
