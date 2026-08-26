import { sendMessage } from "./socket";

export let webconn = null;
export let stream = null;
export let remotestream = null;

// Callback to notify components when remote stream updates
let onRemoteStreamCallback = null;
// Callback to notify components of connection state changes
let onConnectionStateCallback = null;

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

export const setOnRemoteStream = (callback) => {
   onRemoteStreamCallback = callback;
};

export const setOnConnectionState = (callback) => {
   onConnectionStateCallback = callback;
};

export const getRemoteStream = () => remotestream;

export const setNewWebconn = async (data) => {
   try {
      // Always create a fresh remote stream for each call
      remotestream = new MediaStream();

      webconn = new RTCPeerConnection(configuration);
      setupListeners(webconn, data);
      return webconn;
   } catch (error) {
      console.error("Failed to create RTCPeerConnection:", error);
      if (onConnectionStateCallback) {
         onConnectionStateCallback("failed");
      }
      throw error;
   }
};

const setupListeners = (webconn, dataD) => {
   let data = { ...dataD };

   webconn.onicecandidate = async (event) => {
      if (event.candidate) {
         try {
            data.type = "candidate";
            data.message = JSON.stringify(event.candidate);
            await sendMessage(data);
         } catch (error) {
            console.error("Failed to send ICE candidate:", error);
         }
      }
   };

   webconn.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
         remotestream.addTrack(track);
      });
      // Notify component that remote stream has tracks
      if (onRemoteStreamCallback) {
         onRemoteStreamCallback(remotestream);
      }
   };

   webconn.oniceconnectionstatechange = () => {
      const state = webconn.iceConnectionState;
      if (onConnectionStateCallback) {
         onConnectionStateCallback(state);
      }
   };

   webconn.onconnectionstatechange = () => {
      const state = webconn.connectionState;
      if (state === "failed" || state === "disconnected") {
         if (onConnectionStateCallback) {
            onConnectionStateCallback(state);
         }
      }
   };
};

export const GetLocalStreams = async (media) => {
   try {
      if (media === "audio") {
         stream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
         });
      }
      if (media === "video") {
         stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
         });
      }
      return stream;
   } catch (error) {
      console.error("Failed to get local media stream:", error);
      throw error;
   }
};

export const AddStreamToWebconn = async () => {
   if (!webconn) {
      console.error("No RTCPeerConnection available");
      return;
   }
   stream?.getTracks().forEach((track) => {
      webconn.addTrack(track, stream);
   });
};

export const CreatewebRTCOffer = async (dataf) => {
   try {
      let data = { ...dataf };
      const offer = await webconn?.createOffer();
      await webconn?.setLocalDescription(offer);
      const f = JSON.stringify(offer);
      data.type = "offer";
      data.message = f;
      await sendMessage(data);
   } catch (error) {
      console.error("Failed to create/send offer:", error);
      throw error;
   }
};

export const CreatewebRTCAnswer = async (data) => {
   try {
      const answer = await webconn?.createAnswer();
      await webconn?.setLocalDescription(answer);
      const f = JSON.stringify(answer);
      let d = {
         from: data.to,
         to: data.from,
         type: "answer",
         message: f,
      };
      await sendMessage(d);
   } catch (error) {
      console.error("Failed to create/send answer:", error);
      throw error;
   }
};

export const AcceptWebrtcAnswer = async (data) => {
   try {
      let answer = new RTCSessionDescription(JSON.parse(data.message));
      await webconn.setRemoteDescription(answer);
   } catch (error) {
      console.error("Failed to accept answer:", error);
   }
};

export const AcceptWebrtcOffer = async (data) => {
   try {
      let offer = new RTCSessionDescription(JSON.parse(data.message));
      await webconn.setRemoteDescription(offer);
      await CreatewebRTCAnswer(data);
   } catch (error) {
      console.error("Failed to accept offer:", error);
   }
};

export const AcceptWebrtcIceConnection = async (data) => {
   try {
      if (webconn && webconn.remoteDescription) {
         let i = new RTCIceCandidate(JSON.parse(data.message));
         await webconn.addIceCandidate(i);
      } else {
         console.warn("Received ICE candidate before remote description was set");
      }
   } catch (error) {
      console.error("Failed to add ICE candidate:", error);
   }
};

export const WebRtcWeMessageHandler = async (data) => {
   if (data.type === "offer") {
      await AcceptWebrtcOffer(data);
   } else if (data.type === "answer") {
      await AcceptWebrtcAnswer(data);
   } else if (data.type === "candidate") {
      await AcceptWebrtcIceConnection(data);
   }
};

export const toggleMute = () => {
   if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
         audioTrack.enabled = !audioTrack.enabled;
         return audioTrack.enabled;
      }
   }
   return true;
};

export const toggleCamera = () => {
   if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
         videoTrack.enabled = !videoTrack.enabled;
         return videoTrack.enabled;
      }
   }
   return true;
};

export const CloseWebconn = () => {
   // Stop local stream tracks
   stream?.getTracks().forEach((track) => {
      track.stop();
   });
   stream = null;

   // Stop remote stream tracks
   remotestream?.getTracks().forEach((track) => {
      track.stop();
   });
   remotestream = null;

   // Close peer connection
   webconn?.close();
   webconn = null;

   // Clear callbacks
   onRemoteStreamCallback = null;
   onConnectionStateCallback = null;
};