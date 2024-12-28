import React, { useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player";
import { useDispatch, useSelector } from "react-redux";
import { sendMessage } from "../../socket";
import Draggable from "react-draggable";
import {
   AddStreamToWebconn,
   CloseWebconn,
   CreatewebRTCOffer,
   GetLocalStreams,
   remotestream,
   setNewWebconn,
} from "../../webrtc";
import { EndCall } from "../../store/callSlice";

function CallHnadler() {
   const isinCall = useSelector((state) => state.call.isinCall);
   const callData = useSelector((state) => state.call.Data);
   const [incoCall, setIncoCall] = useState(false);
   const [localStream, setLocalStream] = useState(null);
   const [remoteStream, setRemoteStream] = useState(remotestream);
   const [ringing, setRinging] = useState(false);
   const dispatch = useDispatch();

   const CallAnswer = (data) => {
      setRinging(false);
      if (data === "accept") {
         sendMessage({
            from: callData.from,
            to: callData.to,
            type: "call",
            message: "accept",
            media: callData.media,
         });
         HandelIncomingCall();
      } else if (data === "reject") {
         dispatch(EndCall());
         sendMessage({
            from: callData.from,
            to: callData.to,
            type: "call",
            message: "reject",
         });
      }
   };
   const EndCallButtonHandler = () => {
      CloseWebconn();
      dispatch(EndCall());
      sendMessage({
         from: callData.from,
         to: callData.to,
         type: "callend",
         message: "callend",
      });
   };

   const HandelCallType = () => {
      if (callData.message === "offer") {
         setIncoCall(true);
         setRinging(true);
      } else if (callData.message === "accept") {
         HandelOutgoingCall();
      } else if (callData.message === "busy") {
         CloseWebconn();
         dispatch(EndCall());
      } else if (callData.message === "reject") {
         CloseWebconn();
         dispatch(EndCall());
      } else if (callData.message === "offline") {
         CloseWebconn();
         dispatch(EndCall());
      }
   };

   const HandelOutgoingCall = async () => {
      let s = await GetLocalStreams(callData.media);
      setNewWebconn(callData);
      AddStreamToWebconn();
      setLocalStream(s);
      await CreatewebRTCOffer(callData);
   };

   const HandelIncomingCall = async () => {
      setNewWebconn(callData);
      let s = await GetLocalStreams(callData.media);
      AddStreamToWebconn();
      setLocalStream(s);
      setIncoCall(false);
   };

   useEffect(() => {
      if (callData) {
         HandelCallType();
      }
   }, [callData]);

   return (
      <div className="w-full h-full text-black bg-[url('/bg.webp')] object-cover overflow-hidden">
         {incoCall ? (
            <ReactPlayer
               url="/sounds/call.mp3"
               playing={ringing}
               width={0}
               height={0}
            />
         ) : (
            ""
         )}
         {incoCall ? (
            <div className="flex flex-col justify-center gap-4 items-center w-full h-full">
               Incomming {callData.media} Call
               <div className="flex gap-4">
                  <button
                     className="bg-green-500 w-32 h-10 flex items-center justify-center gap-2 rounded-full shadow-md shadow-gray-500"
                     onClick={() => CallAnswer("accept")}
                  >
                     <span class="material-symbols-outlined">call</span>
                     Answer
                  </button>
                  <button
                     className="bg-red-500 w-32 h-10 flex items-center justify-center gap-2 rounded-full shadow-md shadow-gray-500"
                     onClick={() => CallAnswer("reject")}
                  >
                     <span class="material-symbols-outlined">call_end</span>
                     End
                  </button>
               </div>
            </div>
         ) : (
            <div className="w-full h-full p-2 relative">
               {remoteStream && (
                  <div className="w-auto h-auto overflow-hidden">
                     <ReactPlayer
                        playing
                        height="100%"
                        width="100%"
                        url={remoteStream}
                     />
                  </div>
               )}
               {localStream && (
                  <Draggable>
                     <div className="absolute bottom-24 right-24 w-24 h-24 rounded-md overflow-hidden shadow-md shadow-black">
                        <ReactPlayer
                           playing
                           muted
                           height="100%"
                           width="100%"
                           className="rounded full"
                           url={localStream}
                        />
                     </div>
                  </Draggable>
               )}
            </div>
         )}
         {!incoCall && (
            <div className="absolute bottom-4 w-screen flex justify-center">
               <button
                  className="bg-red-500 w-32 h-10 rounded-full shadow-md shadow-gray-500 flex justify-center items-center gap-2"
                  onClick={() => EndCallButtonHandler()}
               >
                  <span class="material-symbols-outlined">call_end</span>
                  End
               </button>
            </div>
         )}
      </div>
   );
}

export default CallHnadler;
