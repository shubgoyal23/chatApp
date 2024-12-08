import { sendMessage } from "./socket";

export let webconn = null;
export let stream = null;
export let remotestream = null;
export const setNewWebconn = async () => {
   webconn = new RTCPeerConnection({
      iceServers: [
         { urls: "stun:stun.l.google.com:19302" },
         { urls: "stun:global.stun.twilio.com:3478" },
      ],
   });
   return webconn;
};

export const GetVideoStream = async () => {
   let s = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
   });
   stream = s;
   return s;
};

export const HandleWebrtcOffer = async (data) => {
   const offer = await webconn?.createOffer();
   webconn.setLocalDescription(offer);
   const ice = await webconn.getLocalPeerICECandidates();
   const f = JSON.stringify(offer);
   const i = JSON.stringify(ice);
   data.message = f;
   data.media = i;

   await sendMessage(data);
};
export const HandleWebrtcAnswer = async (data) => {
   await webconn.setRemoteDescription(JSON.parse(data.message));
   await webconn.seticeCandidates(JSON.parse(data.media));

   const answer = await webconn.createAnswer();
   const ice = await webconn.getLocalPeerICECandidates();
   await webconn.setLocalDescription(answer);
   let ansData = {
      type: "answer",
      message: JSON.stringify(answer),
      to: data.from,
      from: data.to,
      media: JSON.stringify(ice),
   };
   await sendMessage(ansData);
};
export const AcceptWebrtcAnswer = async (data) => {
   await webconn.setRemoteDescription(JSON.parse(data.message));
   await webconn.seticeCandidates(JSON.parse(data.media));
   await remoteStreamHnandler();
};

export const AddTrackToWebconn = async () => {
   const track = stream.getTracks();
   for (let k of track) {
      await webconn.addTrack(k, stream);
   }
};

export const remoteStreamHnandler = async () => {
   webconn.ontrack = (event) => {
      console.log("remote stream", event);
      remotestream = event.streams;
   };
   // webconn.addEventListener("track", (event) => {
   //    console.log(event);
   //    return event;
   // });
   // const remoteStream = event.streams;
   // return remoteStream;
};

export const CreateWebrtcIceConnection = async (data) => {
   const ice = await webconn.getLocalPeerICECandidates();
   data.message = JSON.stringify(ice);
   await sendMessage(data);
};
