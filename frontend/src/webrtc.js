import { sendMessage } from "./socket";

export let webconn = null;
export let stream = null;
export let remotestream = new MediaStream();

var configuration = {
   iceServers: [
      {
         urls: [
            "stun:stun1.l.google.com:19302",
            "stun:stun2.l.google.com:19302",
         ],
      },
   ],
};
export const setNewWebconn = async (data) => {
   webconn = new RTCPeerConnection(configuration);
   listners(webconn, data);
   return webconn;
};

const listners = (webconn, dataD) => {
   let data = { ...dataD };
   webconn.onicecandidate = async (event) => {
      if (event.candidate) {
         data.type = "candidate";
         data.message = JSON.stringify(event.candidate);
         await sendMessage(data);
      }
   };
   webconn.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
         remotestream.addTrack(track);
      });
   };
};

export const GetLocalStreams = async (media) => {
   try {
      if (media === "audio") {
         let s = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
         });
         stream = s;
      }
      if (media === "video") {
         let s = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
         });
         stream = s;
      }
      return stream;
   } catch (error) {
      console.log(error);
   }
};

export const AddStreamToWebconn = async () => {
   stream?.getTracks().forEach((track) => {
      webconn.addTrack(track, stream);
   });
};

export const CreatewebRTCOffer = async (dataf) => {
   let data = { ...dataf };
   const offer = await webconn?.createOffer();
   webconn?.setLocalDescription(offer);
   const f = JSON.stringify(offer);
   data.type = "offer";
   data.message = f;
   await sendMessage(data);
};
export const CreatewebRTCAnswer = async (data) => {
   const answer = await webconn?.createAnswer();
   webconn?.setLocalDescription(answer);
   const f = JSON.stringify(answer);
   let d = {
      from: data.to,
      to: data.from,
      type: "answer",
      message: f,
   };
   await sendMessage(d);
};
export const AcceptWebrtcAnswer = async (data) => {
   let answer = new RTCSessionDescription(JSON.parse(data.message));
   await webconn.setRemoteDescription(answer);
};
export const AcceptWebrtcOffer = async (data) => {
   let offer = new RTCSessionDescription(JSON.parse(data.message));
   await webconn.setRemoteDescription(offer);
   CreatewebRTCAnswer(data);
};

export const AcceptWebrtcIceConnection = async (data) => {
   let i = new RTCIceCandidate(JSON.parse(data.message));
   await webconn.addIceCandidate(i);
};

export const WebRtcWeMessageHandler = async (data) => {
   if (data.type === "offer") {
      AcceptWebrtcOffer(data);
   } else if (data.type === "answer") {
      AcceptWebrtcAnswer(data);
   } else if (data.type === "candidate") {
      AcceptWebrtcIceConnection(data);
   }
};

export const CloseWebconn = () => {
   webconn?.close();
   stream?.getTracks().forEach((track) => {
      track.stop();
   });
};