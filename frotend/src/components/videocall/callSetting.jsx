import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { StartCall } from "../../store/videoSlice";

function ConnectCall() {
   const chatwith = useSelector((state) => state.chat.chattingwith);
   const user = useSelector((state) => state.login.userdata);
   const dispatch = useDispatch();

   const Callhandler = () => {
      dispatch(
         StartCall({
            Calltype: "video",
            to: chatwith._id,
            from: user._id,
         })
      );
   };

   return (
      <div className="">
         <button
            onClick={Callhandler}
            className="text-sm text-gray-600 p-2 gap-1 hover:bg-gray-100 flex justify-start items-center"
         >
            <span className="material-symbols-outlined">videocam</span>
            Video Call
         </button>
      </div>
   );
}

export default ConnectCall;
