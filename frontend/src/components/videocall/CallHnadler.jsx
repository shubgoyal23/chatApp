import React, { useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player";
import { useSelector } from "react-redux";
import { sendMessage } from "../../socket";
import {
   AddStreamToWebconn,
   CreatewebRTCOffer,
   GetLocalStreams,
   remotestream,
   setNewWebconn,
} from "../../webrtc";

function CallHnadler() {
   const isinCall = useSelector((state) => state.call.isinCall);
   const callData = useSelector((state) => state.call.Data);
   const [incoCall, setIncoCall] = useState(false);
   const [localStream, setLocalStream] = useState(null);
   const [remoteStream, setRemoteStream] = useState(remotestream);
   // const callerTune = new Audio("/sounds/call.mp3");
   // const callerTune = useRef(new Audio("/sounds/call.mp3"));



   const CallAnswer = (data) => {
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
         sendMessage({
            from: callData.from,
            to: callData.to,
            type: "call",
            message: "reject",
         });
      }
   };

   const HandelCallType = () => {
      if (callData.message === "offer") {
         setIncoCall(true);
      } else if (callData.message === "accept") {
         HandelOutgoingCall();
      } else if (callData.message === "busy") {
      } else if (callData.message === "reject") {
      } else if (callData.message === "offline") {
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
      <div className="w-full h-full text-black">
         {incoCall ? <ReactPlayer url="/sounds/call.mp3" /> : ""}
         {incoCall ? (
            <div className="flex justify-center gap-4 items-center w-full h-full">
               incomming call
               <button
                  className="bg-green-500"
                  onClick={() => CallAnswer("accept")}
               >
                  Accept
               </button>
               <button
                  className="bg-red-500"
                  onAbort={() => CallAnswer("reject")}
               >
                  reject
               </button>
            </div>
         ) : (
            <div className="w-screen h-[svh] p-2 md:p-4 lg:p-6 relative">
               {localStream && (
                  <div className="absolute bottom-20 right-20 w-20 h-20 z-50">
                     <ReactPlayer
                        playing
                        muted
                        height="100%"
                        width="200%"
                        className="rounded full"
                        url={localStream}
                     />
                  </div>
               )}
               {remoteStream && (
                  <div className="w-[90svw] h-[90svh]">
                     <ReactPlayer
                        playing
                        height="100%"
                        width="100%"
                        url={remoteStream}
                     />
                  </div>
               )}
            </div>
         )}
      </div>
   );
}

export default CallHnadler;
