import React, { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connectSocket } from "../../helper/ConnectSocket";
import { decryptDataAES, GetkeyAes } from "../../helper/AEShelper";
import { sendMessage, socket, setConnectionStateCallback, setOnMessageHandler } from "../../socket";
import { messageHandler, SetUserOnlineStatus } from "../../store/chatSlice";
import { EndCall, SetCallSettings } from "../../store/callSlice";
import { CloseWebconn, WebRtcWeMessageHandler } from "../../webrtc";
import CallHnadler from "../videocall/CallHnadler";

function SocketConnect() {
   const dispatch = useDispatch();

   const user = useSelector((state) => state.login.userdata);
   const isInCall = useSelector((state) => state.call.isInCall);
   const [socketConnected, setScoketConnected] = useState(false);
   const [progress, setProgress] = useState(10);
   const [call, setcall] = useState(false);
   const [connectionStatus, setConnectionStatus] = useState("disconnected");
   const MessageApp = React.lazy(() => import("./MessageApp"));
   const isInCallRef = useRef(isInCall);

   // Keep ref in sync with Redux state
   useEffect(() => {
      isInCallRef.current = isInCall;
   }, [isInCall]);

   useEffect(() => {
      if (isInCall) {
         setcall(true);
      } else {
         setcall(false);
      }
   }, [isInCall]);

   useEffect(() => {
      let interval = setInterval(() => {
         setProgress((prev) => {
            if (prev >= 100) {
               clearInterval(interval);
               return 100;
            }
            return Math.min(prev + 1, 90);
         });
      }, 100);

      return () => clearInterval(interval);
   }, []);

   // Setup message handler
   const handleMessage = useCallback(async (event) => {
      try {
         const msg = await decryptDataAES(event.data);
         const data = JSON.parse(msg);

         if (data.type === "pong") {
            return;
         }
         if (data.type === "call") {
            if (isInCallRef.current && data.message === "offer") {
               sendMessage({
                  from: data.to,
                  to: data.from,
                  type: "call",
                  message: "busy",
               });
            } else {
               dispatch(SetCallSettings(data));
            }
            return;
         }
         if (data.type === "callend") {
            CloseWebconn();
            dispatch(EndCall());
            return;
         }
         if (data.type === "useronline") {
            dispatch(SetUserOnlineStatus(data.message));
            return;
         }
         if (
            data.type === "offer" ||
            data.type === "answer" ||
            data.type === "candidate"
         ) {
            WebRtcWeMessageHandler(data);
            return;
         }
         if (data) {
            const d = {
               self: data.from === user._id,
               data: data,
            };
            dispatch(messageHandler(d));
         }
      } catch (error) {
         console.error("Error processing message:", error);
      }
   }, [dispatch, user]);

   useEffect(() => {
      const conn = async () => {
         if (user) {
            await connectSocket(user);
            await GetkeyAes(user, true);
            setScoketConnected(true);
            setProgress(100);

            // Register the message handler
            setOnMessageHandler(handleMessage);
         }
      };
      conn();
   }, [user, handleMessage]);

   // Listen for connection state changes
   useEffect(() => {
      setConnectionStateCallback((state) => {
         setConnectionStatus(state);
         if (state === "connected" && socketConnected) {
            // Re-register message handler on reconnect
            setOnMessageHandler(handleMessage);
         }
      });

      return () => {
         setConnectionStateCallback(null);
      };
   }, [socketConnected, handleMessage]);

   // Ping interval to keep connection alive
   useEffect(() => {
      let interval;
      if (socketConnected && user) {
         interval = setInterval(() => {
            sendMessage({
               from: user._id,
               to: user._id,
               type: "ping",
               message: "ping",
            });
         }, 60000);
      }

      return () => {
         if (interval) clearInterval(interval);
      };
   }, [socketConnected, user]);

   const getConnectionBanner = () => {
      if (connectionStatus === "reconnecting") {
         return (
            <div className="fixed top-0 left-0 right-0 z-50 animate-slideDown">
               <div className="flex items-center justify-center gap-2 py-2 px-4 bg-amber-500 text-white text-sm font-medium">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Reconnecting...
               </div>
            </div>
         );
      }
      if (connectionStatus === "disconnected" && socketConnected) {
         return (
            <div className="fixed top-0 left-0 right-0 z-50 animate-slideDown">
               <div className="flex items-center justify-center gap-2 py-2 px-4 bg-red-500 text-white text-sm font-medium">
                  <span className="material-symbols-outlined text-base">wifi_off</span>
                  Connection lost. Please check your internet.
               </div>
            </div>
         );
      }
      return null;
   };

   return (
      <main className="h-svh w-full max-w-screen overflow-hidden">
         {getConnectionBanner()}
         {call ? (
            <CallHnadler />
         ) : (
            <div className="h-full w-full max-w-screen overflow-hidden bg-[url('/earth.webp')] bg-cover">
               {socketConnected ? (
                  <Suspense>
                     <MessageApp />
                  </Suspense>
               ) : (
                  <div className="h-full w-full flex flex-col justify-center items-center">
                     <h1 className="mb-4 text-3xl text-white font-bold">
                        Loading Your Messages
                     </h1>
                     <div className="lg:max-w-[420px] w-3/5 h-1 m-0 p-0 flex justify-center items-center overflow-hidden rounded-full">
                        <progress
                           className="lg:max-w-[420px] w-full h-1 m-0"
                           value={progress}
                           max={100}
                        />
                     </div>
                  </div>
               )}
            </div>
         )}
      </main>
   );
}

export default SocketConnect;
