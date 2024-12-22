import React, { Suspense, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connectSocket } from "../../helper/ConnectSocket";
import { decryptDataAES, GetkeyAes } from "../../helper/AEShelper";
import { sendMessage, socket } from "../../socket";
import { messageHandler } from "../../store/chatSlice";
import { SetCallSettings } from "../../store/callSlice";
import { WebRtcWeMessageHandler } from "../../webrtc";
import CallHnadler from "../videocall/CallHnadler";

function SocketConnect() {
   const dispatch = useDispatch();

   const user = useSelector((state) => state.login.userdata);
   const isInCall = useSelector((state) => state.call.isInCall);
   const [socketConnected, setScoketConnected] = useState(false);
   const [progress, setProgress] = useState(10);
   const [call, setcall] = useState(false);
   const MessageApp = React.lazy(() => import("./MessageApp"));

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

   useEffect(() => {
      const conn = async () => {
         if (user) {
            await connectSocket(user);
            await GetkeyAes(user, true);
            setScoketConnected(true);
            setProgress(100);
         }
      };
      conn();
   }, [user]);

   useEffect(() => {
      let interval;
      if (socket) {
         console.log("listing messages");
         socket.onmessage = async (event) => {
            const msg = await decryptDataAES(event.data);
            const data = JSON.parse(msg);
            if (data.type === "call" && data.to == user._id) {
               if (isInCall && data.message === "offer") {
                  sendMessage({
                     from: data.to,
                     to: data.from,
                     type: "call",
                     message: "busy",
                  });
               } else if (data.message == "offer") {
                  dispatch(SetCallSettings(data));
               } else {
                  dispatch(SetCallSettings(data));
               }
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
         };

         interval = setInterval(() => {
            sendMessage({
               from: user._id,
               type: "ping",
               message: "ping",
            });
         }, 60000);
      }

      return () => {
         clearInterval(interval);
      };
   }, [socket]);

   return (
      <div className="h-[100svh] w-screen">
         {call ? (
            <div className="h-[100svh] w-screen flex flex-col justify-center items-center">
               <CallHnadler />
            </div>
         ) : (
            <div className="h-[100svh] w-screen bg-[url('/earth.webp')] bg-cover">
               {socketConnected ? (
                  <Suspense>
                     <MessageApp />
                  </Suspense>
               ) : (
                  <div className="h-[100svh] w-screen flex flex-col justify-center items-center">
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
      </div>
   );
}

export default SocketConnect;
