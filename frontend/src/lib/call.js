import conf from "../constance/conf";
import store from "../store/store";
import { resetCall, setCall } from "../store/callSlice";
import { sendMessage } from "./socket";
import { toast } from "./toast";

/**
 * Call signalling over the chat socket:
 *   caller  --call/offer-->   callee     (ring)
 *   caller  <--call/accept--  callee     (callee already has its peer connection)
 *   caller  --offer(SDP)-->   callee
 *   caller  <--answer(SDP)--  callee
 *   both    <--candidate-->   both       (queued until a remote description exists)
 *   either  --callend-->      other
 * plus call/reject, call/busy and call/offline (sent back by the server).
 */

const RING_TIMEOUT = 45_000;

let pc = null;
let localStream = null;
let remoteStream = null;
let pendingCandidates = [];
let ringTimer = null;
let failTimer = null;
const streamListeners = new Set();

const state = () => store.getState().call;
const selfId = () => store.getState().login.userdata?._id;

export const getStreams = () => ({ local: localStream, remote: remoteStream });

export const onStreams = (listener) => {
   streamListeners.add(listener);
   listener(getStreams());
   return () => streamListeners.delete(listener);
};
const emitStreams = () => streamListeners.forEach((l) => l(getStreams()));

const signal = (type, message, extra = {}) =>
   sendMessage({
      from: selfId(),
      to: state().peer?._id,
      type,
      message,
      ...extra,
   });

const cleanup = () => {
   clearTimeout(ringTimer);
   clearTimeout(failTimer);
   localStream?.getTracks().forEach((t) => t.stop());
   pc?.close();
   pc = null;
   localStream = null;
   remoteStream = null;
   pendingCandidates = [];
   emitStreams();
};

const finish = (reason) => {
   cleanup();
   if (reason) toast.info(reason);
   store.dispatch(resetCall());
};

const getMedia = async (media) => {
   try {
      localStream = await navigator.mediaDevices.getUserMedia({
         audio: { echoCancellation: true, noiseSuppression: true },
         video:
            media === "video"
               ? { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30, max: 30 } }
               : false,
      });
      emitStreams();
      return true;
   } catch (err) {
      toast.error(
         err?.name === "NotAllowedError"
            ? "Microphone/camera permission was denied."
            : "Could not access your microphone or camera."
      );
      return false;
   }
};

const createPeer = () => {
   pc = new RTCPeerConnection({ iceServers: conf.ICE_SERVERS });
   remoteStream = new MediaStream();
   localStream?.getTracks().forEach((track) => {
      // prefer smooth motion over sharpness: a face on a call is "motion"
      if (track.kind === "video" && "contentHint" in track) track.contentHint = "motion";
      const sender = pc.addTrack(track, localStream);
      if (track.kind === "video") {
         // when bandwidth drops, lower resolution instead of frame rate
         const params = sender.getParameters();
         params.degradationPreference = "maintain-framerate";
         sender.setParameters(params).catch(() => {});
      }
   });

   pc.onicecandidate = (e) => {
      if (e.candidate) signal("candidate", JSON.stringify(e.candidate));
   };
   pc.ontrack = (e) => {
      const tracks = e.streams[0]?.getTracks() ?? [e.track];
      tracks.forEach((t) => {
         if (!remoteStream.getTracks().includes(t)) remoteStream.addTrack(t);
      });
      emitStreams();
   };
   pc.onconnectionstatechange = () => {
      const s = pc?.connectionState;
      if (s === "connected") {
         clearTimeout(failTimer);
         if (state().status !== "connected") {
            store.dispatch(setCall({ status: "connected", startedAt: Date.now(), reason: null }));
         }
      } else if (s === "disconnected") {
         // often recovers on its own; give it a moment
         store.dispatch(setCall({ reason: "Reconnecting…" }));
         clearTimeout(failTimer);
         failTimer = setTimeout(() => {
            if (pc?.connectionState !== "connected") hangUp("Call connection lost");
         }, 12_000);
      } else if (s === "failed") {
         hangUp("Call failed to connect. A TURN server may be required.");
      }
   };
};

const flushCandidates = async () => {
   for (const c of pendingCandidates.splice(0)) {
      try {
         await pc.addIceCandidate(c);
      } catch (err) {
         console.warn("bad ICE candidate", err);
      }
   }
};

export const startCall = async (peer, media) => {
   if (state().status !== "idle") return;
   if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Calls are not supported in this browser.");
      return;
   }
   store.dispatch(setCall({ status: "outgoing", peer, media, reason: null }));
   // preview local media while ringing, which also asks for permission early
   if (!(await getMedia(media))) {
      store.dispatch(resetCall());
      return;
   }
   if (state().status !== "outgoing") return;
   signal("call", "offer", { media });
   ringTimer = setTimeout(() => {
      if (state().status === "outgoing") {
         signal("callend", "callend");
         finish("No answer");
      }
   }, RING_TIMEOUT);
};

export const acceptCall = async () => {
   const { status, media } = state();
   if (status !== "incoming") return;
   clearTimeout(ringTimer);
   store.dispatch(setCall({ status: "connecting" }));
   if (!(await getMedia(media))) {
      signal("call", "reject");
      finish();
      return;
   }
   createPeer();
   signal("call", "accept", { media });
};

export const rejectCall = () => {
   if (state().status !== "incoming") return;
   signal("call", "reject");
   finish();
};

export const hangUp = (reason) => {
   if (state().status === "idle") return;
   signal("callend", "callend");
   finish(reason);
};

export const toggleTrack = (kind) => {
   const track =
      kind === "audio" ? localStream?.getAudioTracks()[0] : localStream?.getVideoTracks()[0];
   if (!track) return false;
   track.enabled = !track.enabled;
   return track.enabled;
};

const fromPeer = (data) => data.from === state().peer?._id;

// Routes a call-related socket message. Returns true if it was one.
export const handleCallSignal = async (data, lookupPeer) => {
   const { status } = state();
   switch (data.type) {
      case "call":
         if (data.message === "offer") {
            if (status !== "idle") {
               // already on a call: tell the caller we're busy
               sendMessage({ from: selfId(), to: data.from, type: "call", message: "busy" });
               return true;
            }
            store.dispatch(
               setCall({
                  status: "incoming",
                  peer: lookupPeer(data.from),
                  media: data.media === "video" ? "video" : "audio",
                  reason: null,
               })
            );
            ringTimer = setTimeout(() => {
               if (state().status === "incoming") finish("Missed call");
            }, RING_TIMEOUT + 5_000);
            return true;
         }
         if (!fromPeer(data)) return true;
         if (data.message === "accept" && status === "outgoing") {
            clearTimeout(ringTimer);
            store.dispatch(setCall({ status: "connecting" }));
            createPeer();
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            signal("offer", JSON.stringify(offer));
         } else if (data.message === "reject") {
            finish("Call declined");
         } else if (data.message === "busy") {
            finish("User is on another call");
         } else if (data.message === "offline") {
            finish("User is offline");
         }
         return true;

      case "offer":
         if (!fromPeer(data) || !pc) return true;
         await pc.setRemoteDescription(JSON.parse(data.message));
         await flushCandidates();
         {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            signal("answer", JSON.stringify(answer));
         }
         return true;

      case "answer":
         if (!fromPeer(data) || !pc) return true;
         await pc.setRemoteDescription(JSON.parse(data.message));
         await flushCandidates();
         return true;

      case "candidate":
         if (!fromPeer(data)) return true;
         {
            const candidate = JSON.parse(data.message);
            if (pc?.remoteDescription) {
               await pc.addIceCandidate(candidate).catch(() => {});
            } else {
               pendingCandidates.push(candidate);
            }
         }
         return true;

      case "callend":
         if (fromPeer(data) && status !== "idle") {
            finish(status === "incoming" ? "Missed call" : "Call ended");
         }
         return true;

      default:
         return false;
   }
};
