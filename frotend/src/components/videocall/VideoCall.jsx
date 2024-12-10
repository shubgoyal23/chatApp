import React, { useEffect, useState } from "react";
import ReactPlayer from "react-player";
import {
   AddTrackToWebconn,
   CreateWebrtcIceConnection,
   GetVideoStream,
   HandleWebrtcAnswer,
   HandleWebrtcOffer,
   remotestream,
   setNewWebconn,
   stream,
   webconn,
} from "../../webrtc";
import { useSelector } from "react-redux";

function VideoCall() {
   const chatwith = useSelector((state) => state.chat.chattingwith);
   const user = useSelector((state) => state.login.userdata);
   const isinCall = useSelector((state) => state.video.isinCall);
   const callType = useSelector((state) => state.video.callType);

   const [incoCall, setIncoCall] = useState(false);
   const [remoteS, setRemoteS] = useState(remotestream);
   const [localS, setLocalS] = useState(stream);

   const [err, setErr] = useState(null);

   const HandelOutgoingCall = async () => {
      try {
         console.log("called outgoing call");
         await setNewWebconn();
         await GetVideoStream();
         await HandleWebrtcOffer({
            to: chatwith._id,
            from: user._id,
            type: "offer",
         });
         await AddTrackToWebconn();
         await CreateWebrtcIceConnection({
            to: chatwith._id,
            from: user._id,
            type: "candidate",
         });
         console.log(webconn.iceGatheringState)
      } catch (error) {
         console.log(error);
      }
   };

   const HandelIncommingCall = async () => {
      console.log("called incomming call");
      try {
         setIncoCall(false);
         await setNewWebconn();
         await GetVideoStream();
         await HandleWebrtcAnswer(callType.incommingCall);
         await AddTrackToWebconn();
         await CreateWebrtcIceConnection({
            type: "candidate",
            to: callType.incommingCall.from,
            from: callType.incommingCall.to,
         });
         console.log(webconn.iceGatheringState)
      } catch (error) {
         console.log(error);
      }
   };

   useEffect(() => {
      console.log("call type", callType);

      if (callType.outgoingCall) {
         HandelOutgoingCall();
      } else if (callType.incommingCall) {
         setIncoCall(true);
      }
   }, []);

   useEffect(() => {
      if (stream) {
         setLocalS(stream);
      }
      if (remotestream) {
         setRemoteS(remotestream);
      }
   }, [remotestream, stream]);

   // const startVideo = async (to, from) => {
   //    try {
   //       await GetVideoStream();
   //       await setNewWebconn();
   //       await AddTrackToWebconn();
   //       const off = {
   //          type: "offer",
   //          to,
   //          from,
   //       };
   //       await HandleWebrtcOffer(off);
   //       await CreateWebrtcIceConnection({ type: "candidate", to, from });
   //       // const remoteStream = remoteStreamHnandler();
   //       // setRemoteStream(remoteStream);
   //    } catch (error) {
   //       setErr("unable to get video stream");
   //       console.log(error);
   //    }
   // };

   // const HandelIncommingCall_old = async () => {
   //    setIncoCall(false);
   //    await GetVideoStream();
   //    await setNewWebconn();
   //    await AddTrackToWebconn();
   //    await HandleWebrtcAnswer(callType.incommingCall);
   //    console.log(callType.incommingCall);
   //    await remoteStreamHnandler();
   //    let ansData = {
   //       type: "candidate",
   //       to: callType.incommingCall.from,
   //       from: callType.incommingCall.to,
   //    };
   //    await CreateWebrtcIceConnection(ansData);
   // };
   // useEffect(() => {
   //    if (callType?.incommingCall) {
   //       setIncoCall(true);
   //    } else if (callType?.outgoingCall) {
   //       startVideo(chatwith._id, user._id);
   //    }
   //    // return () => {
   //    //    if (stream) {
   //    //       stream.getTracks().forEach((track) => track.stop());
   //    //    }
   //    // };
   // }, [callType]);

   // useEffect(() => {
   //    console.log(stream);
   //    if (stream) {
   //       setLocalS(stream);
   //    }
   //    // return () => {
   //    //    if (stream) {
   //    //       stream.getTracks().forEach((track) => track.stop());
   //    //    }
   //    // };
   // }, [stream]);
   // useEffect(() => {
   //    console.log(remotestream);
   //    if (remotestream) {
   //       setRemoteS(remotestream);
   //    }
   //    // return () => {
   //    //    if (se) {
   //    //       stream.getTracks().forEach((track) => track.stop());
   //    //    }
   //    // };
   // }, [remotestream]);

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
