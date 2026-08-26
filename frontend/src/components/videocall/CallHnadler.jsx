import React, { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { sendMessage } from "../../socket";
import Draggable from "react-draggable";
import {
   AddStreamToWebconn,
   CloseWebconn,
   CreatewebRTCOffer,
   GetLocalStreams,
   setNewWebconn,
   setOnRemoteStream,
   setOnConnectionState,
   toggleMute,
   toggleCamera,
} from "../../webrtc";
import { EndCall } from "../../store/callSlice";

function CallHnadler() {
   const callData = useSelector((state) => state.call.Data);
   const [incoCall, setIncoCall] = useState(false);
   const [localStream, setLocalStream] = useState(null);
   const [remoteStream, setRemoteStream] = useState(null);
   const [ringing, setRinging] = useState(false);
   const [callStatus, setCallStatus] = useState("connecting"); // connecting | ringing | connected | failed
   const [isMuted, setIsMuted] = useState(false);
   const [isCameraOff, setIsCameraOff] = useState(false);
   const dispatch = useDispatch();

   const localVideoRef = useRef(null);
   const remoteVideoRef = useRef(null);
   const ringtoneRef = useRef(null);
   const nodeRef = useRef(null);

   // Attach local stream to video element
   useEffect(() => {
      if (localVideoRef.current && localStream) {
         localVideoRef.current.srcObject = localStream;
      }
   }, [localStream]);

   // Attach remote stream to video element
   useEffect(() => {
      if (remoteVideoRef.current && remoteStream) {
         remoteVideoRef.current.srcObject = remoteStream;
      }
   }, [remoteStream]);

   // Set up remote stream callback
   useEffect(() => {
      setOnRemoteStream((stream) => {
         setRemoteStream(stream);
         setCallStatus("connected");
      });

      setOnConnectionState((state) => {
         if (state === "connected") {
            setCallStatus("connected");
         } else if (state === "failed" || state === "disconnected") {
            setCallStatus("failed");
         }
      });

      return () => {
         setOnRemoteStream(null);
         setOnConnectionState(null);
      };
   }, []);

   const CallAnswer = useCallback((data) => {
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
   }, [callData, dispatch]);

   const stopLocalStream = useCallback(() => {
      // Stop tracks on the React-state stream reference (may differ from module-level)
      if (localStream) {
         localStream.getTracks().forEach((track) => track.stop());
         setLocalStream(null);
      }
      // Clear video element srcObjects so browser releases camera
      if (localVideoRef.current) {
         localVideoRef.current.srcObject = null;
      }
      if (remoteVideoRef.current) {
         remoteVideoRef.current.srcObject = null;
      }
      setRemoteStream(null);
   }, [localStream]);

   const EndCallButtonHandler = useCallback(() => {
      stopLocalStream();
      CloseWebconn();
      if (callData) {
         sendMessage({
            from: callData.from,
            to: callData.to,
            type: "callend",
            message: "callend",
         });
      }
      dispatch(EndCall());
   }, [callData, dispatch, stopLocalStream]);

   const HandelCallType = useCallback(() => {
      if (!callData) return;

      if (callData.message === "offer") {
         setIncoCall(true);
         setRinging(true);
         setCallStatus("ringing");
      } else if (callData.message === "accept") {
         setCallStatus("connecting");
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
   }, [callData, dispatch]);

   const HandelOutgoingCall = async () => {
      try {
         let s = await GetLocalStreams(callData.media);
         setLocalStream(s);
         await setNewWebconn(callData);
         await AddStreamToWebconn();
         await CreatewebRTCOffer(callData);
      } catch (error) {
         console.error("Failed to setup outgoing call:", error);
         setCallStatus("failed");
      }
   };

   const HandelIncomingCall = async () => {
      try {
         await setNewWebconn(callData);
         let s = await GetLocalStreams(callData.media);
         setLocalStream(s);
         await AddStreamToWebconn();
         setIncoCall(false);
         setCallStatus("connecting");
      } catch (error) {
         console.error("Failed to setup incoming call:", error);
         setCallStatus("failed");
      }
   };

   const handleToggleMute = () => {
      const enabled = toggleMute();
      setIsMuted(!enabled);
   };

   const handleToggleCamera = () => {
      const enabled = toggleCamera();
      setIsCameraOff(!enabled);
   };

   useEffect(() => {
      if (callData) {
         HandelCallType();
      }
   }, [callData]);

   // Cleanup on unmount — stop the stateful stream too
   useEffect(() => {
      return () => {
         // Stop React-state stream tracks directly
         if (localStream) {
            localStream.getTracks().forEach((track) => track.stop());
         }
         if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
         }
         if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
         }
         CloseWebconn();
      };
   }, [localStream]);

   const isVideoCall = callData?.media === "video";

   const getStatusText = () => {
      switch (callStatus) {
         case "ringing": return "Ringing...";
         case "connecting": return "Connecting...";
         case "connected": return "";
         case "failed": return "Call Failed";
         default: return "";
      }
   };

   return (
      <div className="w-full h-full bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 overflow-hidden relative">
         {/* Ringtone audio */}
         {ringing && (
            <audio ref={ringtoneRef} src="/sounds/call.mp3" autoPlay loop />
         )}

         {/* Incoming call screen */}
         {incoCall ? (
            <div className="flex flex-col justify-center gap-6 items-center w-full h-full">
               {/* Pulsing avatar circle */}
               <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center animate-pulse">
                     <span className="material-symbols-outlined text-white text-5xl">person</span>
                  </div>
                  <div className="absolute inset-0 w-24 h-24 rounded-full border-2 border-indigo-400 animate-ping opacity-30"></div>
               </div>

               <div className="text-center">
                  <h2 className="text-white text-2xl font-semibold mb-1">Incoming {callData?.media} call</h2>
                  <p className="text-gray-400 text-sm animate-pulse">Ringing...</p>
               </div>

               <div className="flex gap-8 mt-4">
                  <button
                     className="w-16 h-16 bg-green-500 hover:bg-green-400 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 transition-all duration-200 hover:scale-110"
                     onClick={() => CallAnswer("accept")}
                  >
                     <span className="material-symbols-outlined text-white text-3xl">call</span>
                  </button>
                  <button
                     className="w-16 h-16 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 transition-all duration-200 hover:scale-110"
                     onClick={() => CallAnswer("reject")}
                  >
                     <span className="material-symbols-outlined text-white text-3xl">call_end</span>
                  </button>
               </div>
            </div>
         ) : (
            <div className="w-full h-full relative">
               {/* Remote video/audio — full screen */}
               <div className="absolute inset-0 flex items-center justify-center">
                  {remoteStream && isVideoCall ? (
                     <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                     />
                  ) : (
                     <div className="flex flex-col items-center gap-4">
                        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                           <span className="material-symbols-outlined text-white text-6xl">person</span>
                        </div>
                        {!isVideoCall && remoteStream && (
                           <audio ref={remoteVideoRef} autoPlay />
                        )}
                        {callStatus !== "connected" && (
                           <p className="text-gray-400 text-lg">{getStatusText()}</p>
                        )}
                        {callStatus === "connected" && !isVideoCall && (
                           <p className="text-green-400 text-lg font-medium">Connected</p>
                        )}
                     </div>
                  )}
               </div>

               {/* Status overlay for video calls */}
               {isVideoCall && callStatus !== "connected" && (
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
                     <div className="px-4 py-2 rounded-full bg-black/50 backdrop-blur-md text-white text-sm flex items-center gap-2">
                        {callStatus === "connecting" && (
                           <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
                        )}
                        {callStatus === "failed" && (
                           <span className="w-2 h-2 rounded-full bg-red-400"></span>
                        )}
                        {getStatusText()}
                     </div>
                  </div>
               )}

               {/* Local video PiP — draggable */}
               {localStream && isVideoCall && (
                  <Draggable nodeRef={nodeRef} bounds="parent">
                     <div ref={nodeRef} className="absolute bottom-28 right-4 w-36 h-48 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border-2 border-white/20 z-10 cursor-grab active:cursor-grabbing">
                        <video
                           ref={localVideoRef}
                           autoPlay
                           playsInline
                           muted
                           className={`w-full h-full object-cover ${isCameraOff ? 'hidden' : ''}`}
                        />
                        {isCameraOff && (
                           <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                              <span className="material-symbols-outlined text-gray-500 text-4xl">videocam_off</span>
                           </div>
                        )}
                     </div>
                  </Draggable>
               )}

               {/* Control bar */}
               <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
                  <div className="flex items-center gap-4 px-6 py-3 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
                     {/* Mute toggle */}
                     <button
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 ${isMuted ? 'bg-white text-gray-900' : 'bg-white/15 text-white hover:bg-white/25'}`}
                        onClick={handleToggleMute}
                        title={isMuted ? "Unmute" : "Mute"}
                     >
                        <span className="material-symbols-outlined">
                           {isMuted ? "mic_off" : "mic"}
                        </span>
                     </button>

                     {/* Camera toggle (video calls only) */}
                     {isVideoCall && (
                        <button
                           className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 ${isCameraOff ? 'bg-white text-gray-900' : 'bg-white/15 text-white hover:bg-white/25'}`}
                           onClick={handleToggleCamera}
                           title={isCameraOff ? "Turn camera on" : "Turn camera off"}
                        >
                           <span className="material-symbols-outlined">
                              {isCameraOff ? "videocam_off" : "videocam"}
                           </span>
                        </button>
                     )}

                     {/* End call */}
                     <button
                        className="w-14 h-14 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 transition-all duration-200 hover:scale-110"
                        onClick={EndCallButtonHandler}
                     >
                        <span className="material-symbols-outlined text-white text-2xl">call_end</span>
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
}

export default CallHnadler;
