import { sendMessage } from "./socket";

export let webconn = null;
export let stream = null;
export let remotestream = null;

var configuration = {
   iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun.l.google.com:5349" },
   ],
};
export const setNewWebconn = async (data) => {
   webconn = new RTCPeerConnection(configuration);

   addEventListener("icecandidate", (event) => {
      console.log("ice", event);
      if (event.candidate) {
         console.log(event.candidate);
         let d = {
            type: "candidate",
            message: JSON.stringify(event.candidate),
            to: data.to,
            from: data.from,
         };
         sendMessage(d);
      }
   });

   webconn.onicecandidate = async (event) => {
      console.log("ice", event);
      if (event.candidate) {
         console.log(event.candidate);
         let d = {
            type: "candidate",
            message: JSON.stringify(event.candidate),
            to: data.to,
            from: data.from,
         };
         await sendMessage(d);
      }
   };
   return webconn;
};

export const GetVideoStream = async (media) => {
   if (media === "audio") {
      let s = await navigator.mediaDevices.getUserMedia({
         video: false,
         audio: true,
      });
      stream = s;
      return s;
   }
   if (media === "video") {
      let s = await navigator.mediaDevices.getUserMedia({
         video: true,
         audio: true,
      });
      stream = s;
      return s;
   }
};

export const HandleWebrtcOffer = async (data) => {
   const offer = await webconn?.createOffer();
   webconn?.setLocalDescription(offer);
   const f = JSON.stringify(offer);
   data.message = f;
   await sendMessage(data);
};
export const HandleWebrtcAnswer = async (data) => {
   await webconn.setRemoteDescription(JSON.parse(data.message));

   const answer = await webconn.createAnswer();
   await webconn.setLocalDescription(answer);
   let ansData = {
      type: "answer",
      message: JSON.stringify(answer),
      to: data.from,
      from: data.to,
   };
   await sendMessage(ansData);
};

export const AddTrackToWebconn = async () => {
   const track = stream.getTracks();
   for (let k of track) {
      await webconn.addTrack(k, stream);
   }
};

export const AcceptWebrtcAnswer = async (data) => {
   await webconn.setRemoteDescription(JSON.parse(data.message));
};

export const remoteStreamHnandler = async () => {
   webconn.ontrack = (event) => {
      console.log("remote stream", event);
      remotestream = event.streams;
   };
};

// export const CreateWebrtcIceConnection = async (data) => {
//    console.log(data)
//    data.message = JSON.stringify(data.message);
//    await sendMessage(data);
// };

// new RTCSessionDescription(offer)

export const AcceptWebrtcIceConnection = async (data) => {
   let i = JSON.parse(data.message);
   await webconn.addIceCandidate(i);
};
