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
} from "../../webrtc";
import { useSelector } from "react-redux";
import { set } from "lodash";

function VideoCall() {
   const chatwith = useSelector((state) => state.chat.chattingwith);
   const user = useSelector((state) => state.login.userdata);
   const callType = useSelector((state) => state.video.callType);
   const [incoCall, setIncoCall] = useState(false);
   const [remoteS, setRemoteS] = useState(null);
   const [localS, setLocalS] = useState(null);

   const [err, setErr] = useState(null);

   const startVideo = async (to, from) => {
      try {
         await GetVideoStream();
         await setNewWebconn();
         await AddTrackToWebconn();
         const off = {
            type: "offer",
            to,
            from,
         };
         await HandleWebrtcOffer(off);
         // const remoteStream = remoteStreamHnandler();
         // setRemoteStream(remoteStream);
      } catch (error) {
         setErr("unable to get video stream");
         console.log(error);
      }
   };

   const HandelIncommingCall = async () => {
      setIncoCall(false);
      await GetVideoStream();
      await setNewWebconn();
      await AddTrackToWebconn();
      await HandleWebrtcAnswer(callType.incommingCall);
      await remoteStreamHnandler();
   };
   useEffect(() => {
      if (callType?.incommingCall) {
         setIncoCall(true);
      } else if (callType?.outgoingCall) {
         startVideo(chatwith._id, user._id);
      }
      // return () => {
      //    if (stream) {
      //       stream.getTracks().forEach((track) => track.stop());
      //    }
      // };
   }, [callType]);

   useEffect(() => {
      console.log(stream);
      if (stream) {
         setLocalS(stream);
      }
      // return () => {
      //    if (stream) {
      //       stream.getTracks().forEach((track) => track.stop());
      //    }
      // };
   }, [stream]);
   useEffect(() => {
      console.log(remotestream);
      if (remotestream) {
         setRemoteS(remotestream);
      }
      // return () => {
      //    if (se) {
      //       stream.getTracks().forEach((track) => track.stop());
      //    }
      // };
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
               {/* <ReactPlayer url={stream} autoPlay muted />
               <ReactPlayer url={remotestream} autoPlay /> */}
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

export default VideoCall;
