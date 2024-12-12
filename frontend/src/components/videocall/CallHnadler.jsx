import React, { useEffect, useState } from "react";
import ReactPlayer from "react-player";
import {
   AddTrackToWebconn,
   GetVideoStream,
   HandleWebrtcAnswer,
   HandleWebrtcOffer,
   remotestream,
   remoteStreamHnandler,
   setNewWebconn,
   stream,
   webconn,
} from "../../webrtc";
import { useSelector } from "react-redux";

function CallHnadler() {
   const isinCall = useSelector((state) => state.call.isinCall);
   const callType = useSelector((state) => state.call.callType);

   const [incoCall, setIncoCall] = useState(false);
   const [remoteS, setRemoteS] = useState(remotestream);
   const [localS, setLocalS] = useState(stream);

   const HandelOutgoingCall = async () => {
      try {
         const s = await GetVideoStream(callType.outgoingCall.media);
         setLocalS(s);
         await setNewWebconn({
            to: callType.outgoingCall.to,
            from: callType.outgoingCall.from,
         });
         await HandleWebrtcOffer({
            to: callType.outgoingCall.to,
            from: callType.outgoingCall.from,
            type: "offer",
            media: callType.outgoingCall.media,
         });
         await AddTrackToWebconn();
         remoteStreamHnandler()
      } catch (error) {
         console.log(error);
      }
   };

   const HandelIncommingCall = async () => {
      console.log("called incomming call");
      try {
         setIncoCall(false);
         await setNewWebconn({
            to: callType.incommingCall.from,
            from: callType.incommingCall.to,
         });
         const s = await GetVideoStream(callType.incommingCall.media);
         setLocalS(s);
         await HandleWebrtcAnswer(callType.incommingCall);
         await AddTrackToWebconn();
         remoteStreamHnandler();
      } catch (error) {
         console.log(error);
      }
   };

   useEffect(() => {
      if (callType.outgoingCall) {
         HandelOutgoingCall();
      }
      if (callType.incommingCall) {
         setIncoCall(true);
      }
   }, [isinCall]);

   return (
      <div className="w-full h-full text-black">
         {incoCall ? (
            <div>
               incomming call
               <button onClick={HandelIncommingCall}>Accept</button>
               <button>reject</button>
            </div>
         ) : (
            <div>
               {localS && (
                  <>
                     <h1>My Stream</h1>
                     <ReactPlayer
                        playing
                        muted
                        height="100px"
                        width="200px"
                        url={localS}
                     />
                  </>
               )}
               {remoteS && (
                  <>
                     <h1>Remote Stream</h1>
                     <ReactPlayer
                        playing
                        muted
                        height="100px"
                        width="200px"
                        url={remoteS}
                     />
                  </>
               )}
            </div>
         )}
      </div>
   );
}

export default CallHnadler;
