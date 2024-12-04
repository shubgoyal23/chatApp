import React, { Suspense, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connectSocket } from "../../helper/ConnectSocket";
import { decryptDataAES, GetkeyAes } from "../../helper/AEShelper";
import { socket } from "../../socket";
import { messageHandler } from "../../store/chatSlice";

function SocketConnect() {
   const dispatch = useDispatch();

   const user = useSelector((state) => state.login.userdata);
   const [socketConnected, setScoketConnected] = useState(false);
   const [progress, setProgress] = useState(10);
   const MessageApp = React.lazy(() => import("./MessageApp"));

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
            await GetkeyAes(user, true); // for local key
            setScoketConnected(true);
            setProgress(100);
         }
      };
      conn();
   }, [user]);

   useEffect(() => {
      if (socket) {
         console.log("listing messages");
         socket.onmessage = async (event) => {
            const msg = await decryptDataAES(event.data);
            const data = JSON.parse(msg);
            if (data) {
               const d = {
                  self: data.from === user._id,
                  data: data,
               };
               dispatch(messageHandler(d));
            }
         };
      }
   }, [socket]);

   return (
      <div>
         {socketConnected ? (
            <Suspense>
               <MessageApp />
            </Suspense>
         ) : (
            <div className="h-screen w-screen flex flex-col justify-center items-center">
               <h1 className="mb-2 text-xl font-semibold">Loading Your Messages</h1>
               <div className="max-w-[420px] w-full h-[6px] m-0 p-0 flex justify-center items-center overflow-hidden rounded-full">
               <progress
                  className="max-w-[420px] w-full h-[6px] bg-lime-500 m-0"
                  value={progress}
                  max={100}
               />
               </div>
            </div>
         )}
      </div>
   );
}

export default SocketConnect;