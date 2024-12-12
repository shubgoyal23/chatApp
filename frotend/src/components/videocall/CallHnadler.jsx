import React, { useEffect, useState } from "react";
import ReactPlayer from "react-player";
import {
   AddTrackToWebconn,
   GetVideoStream,
   HandleWebrtcAnswer,
   HandleWebrtcOffer,
   remotestream,
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

   const [err, setErr] = useState(null);

   const HandelOutgoingCall = async () => {
      try {
         await setNewWebconn();
         const s = await GetVideoStream(callType.outgoingCall.media);
         setLocalS(s);
         await HandleWebrtcOffer({
            to: callType.outgoingCall.to,
            from: callType.outgoingCall.from,
            type: "offer",
            media: callType.outgoingCall.media,
         });
         await AddTrackToWebconn();
         // await CreateWebrtcIceConnection({
         //    to: callType.outgoingCall.to,
         //    from: callType.outgoingCall.from,
         //    type: "candidate",
         //    media: callType.outgoingCall.media,
         // });
         console.log(webconn.iceGatheringState);
      } catch (error) {
         console.log(error);
      }
   };

   const HandelIncommingCall = async () => {
      console.log("called incomming call");
      try {
         setIncoCall(false);
         await setNewWebconn({
            to: callType.incommingCall.to,
            from: callType.incommingCall.from,
         });
         const s = await GetVideoStream(callType.incommingCall.media);
         console.log(s);
         setLocalS(s);
         await HandleWebrtcAnswer(callType.incommingCall);
         await AddTrackToWebconn();
         // await CreateWebrtcIceConnection({
         //    type: "candidate",
         //    to: callType.incommingCall.from,
         //    from: callType.incommingCall.to,
         //    media: callType.incommingCall.media,
         // });
         console.log(webconn.iceGatheringState);
      } catch (error) {
         console.log(error);
      }
   };

   useEffect(() => {
      if (callType?.outgoingCall) {
         HandelOutgoingCall();
      } else if (callType?.incommingCall) {
         setIncoCall(true);
      }
   }, [isinCall]);

   useEffect(() => {
      if (remotestream) {
         setRemoteS(remotestream);
      }
   }, [remotestream]);

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
