import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { acceptCall, hangUp, onStreams, rejectCall, toggleTrack } from "../../lib/call";
import Avatar from "../ui/Avatar";
import { useBackHandler } from "../../lib/backStack";
import Icon from "../ui/Icon";

const STATUS_TEXT = {
   outgoing: "Calling…",
   incoming: "Incoming call",
   connecting: "Connecting…",
};

// Only this small component re-renders every second, not the video tree.
function Elapsed({ startedAt }) {
   return useElapsed(startedAt);
}

function useElapsed(startedAt) {
   const [now, setNow] = useState(() => Date.now());
   useEffect(() => {
      if (!startedAt) return;
      const t = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(t);
   }, [startedAt]);
   if (!startedAt) return "";
   const s = Math.max(0, Math.floor((now - startedAt) / 1000));
   const mm = String(Math.floor(s / 60) % 60).padStart(2, "0");
   const ss = String(s % 60).padStart(2, "0");
   return s >= 3600 ? `${Math.floor(s / 3600)}:${mm}:${ss}` : `${mm}:${ss}`;
}

function Video({ stream, muted, className, onAspect }) {
   const ref = useRef(null);
   useEffect(() => {
      if (ref.current && ref.current.srcObject !== stream) ref.current.srcObject = stream ?? null;
   }, [stream]);
   // "resize" fires whenever the incoming frame size changes, e.g. a phone rotating
   const report = (e) => {
      const { videoWidth: w, videoHeight: h } = e.currentTarget;
      if (w && h) onAspect?.(w / h);
   };
   return (
      <video
         ref={ref}
         autoPlay
         playsInline
         muted={muted}
         onLoadedMetadata={onAspect && report}
         onResize={onAspect && report}
         className={className}
      />
   );
}

function useWindowAspect() {
   const [aspect, setAspect] = useState(() => window.innerWidth / window.innerHeight);
   useEffect(() => {
      const onResize = () => setAspect(window.innerWidth / window.innerHeight);
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
   }, []);
   return aspect;
}

// Full-screen remote video. When the caller's camera and this screen have
// different orientations (a portrait phone on a landscape desktop), cropping
// to fill would zoom in heavily, so show the whole frame instead. (A blurred
// second copy behind it looked nice but decoding and blurring the video twice
// made calls stutter.)
function RemoteVideo({ stream }) {
   const [videoAspect, setVideoAspect] = useState(null);
   const screenAspect = useWindowAspect();
   const fit = videoAspect && videoAspect < 1 !== screenAspect < 1 ? "contain" : "cover";

   return (
      <Video
         stream={stream}
         onAspect={setVideoAspect}
         className={`absolute inset-0 size-full ${fit === "contain" ? "object-contain" : "object-cover"}`}
      />
   );
}

function Audio({ stream }) {
   const ref = useRef(null);
   useEffect(() => {
      if (ref.current) ref.current.srcObject = stream ?? null;
   }, [stream]);
   return <audio ref={ref} autoPlay />;
}

// Draggable picture-in-picture for the local camera.
function Pip({ stream, cameraOff }) {
   const [pos, setPos] = useState({ x: 16, y: 16 });
   const [aspect, setAspect] = useState(3 / 4);
   const drag = useRef(null);

   return (
      <div
         className={`absolute z-20 ${aspect >= 1 ? "w-36 sm:w-56" : "w-28 sm:w-40"} rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/20 bg-slate-800 touch-none cursor-grab active:cursor-grabbing`}
         style={{ right: pos.x, top: pos.y, aspectRatio: aspect }}
         onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = { sx: e.clientX, sy: e.clientY, ...pos };
         }}
         onPointerMove={(e) => {
            if (!drag.current) return;
            const { sx, sy, x, y } = drag.current;
            const box = e.currentTarget.parentElement.getBoundingClientRect();
            const w = e.currentTarget.offsetWidth;
            const h = e.currentTarget.offsetHeight;
            setPos({
               x: Math.min(Math.max(8, x - (e.clientX - sx)), box.width - w - 8),
               y: Math.min(Math.max(8, y + (e.clientY - sy)), box.height - h - 120),
            });
         }}
         onPointerUp={() => (drag.current = null)}
      >
         <Video stream={stream} muted onAspect={setAspect} className={`size-full object-cover ${cameraOff ? "hidden" : ""}`} />
         {cameraOff && (
            <div className="size-full flex items-center justify-center text-white/60">
               <Icon name="videocam_off" size={30} />
            </div>
         )}
      </div>
   );
}

function ControlButton({ icon, label, onClick, active, danger, big }) {
   return (
      <button
         onClick={onClick}
         aria-label={label}
         title={label}
         className={`${big ? "size-16" : "size-14"} rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ${
            danger
               ? "bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/40"
               : active
                 ? "bg-white text-slate-900"
                 : "bg-white/15 hover:bg-white/25 text-white"
         }`}
      >
         <Icon name={icon} fill size={big ? 30 : 26} />
      </button>
   );
}

function CallScreen() {
   const status = useSelector((s) => s.call.status);
   // back must not drop you out of a call; hang up with the button instead
   useBackHandler(status !== "idle", null, { sticky: true });
   // mounting per call resets mute/camera state between calls
   return status === "idle" ? null : <ActiveCall />;
}

function ActiveCall() {
   const { status, peer, media, startedAt, reason } = useSelector((s) => s.call);
   const [streams, setStreams] = useState({ local: null, remote: null });
   const [muted, setMuted] = useState(false);
   const [cameraOff, setCameraOff] = useState(false);

   useEffect(() => onStreams(setStreams), []);

   const video = media === "video";
   const remoteHasVideo = video && streams.remote?.getVideoTracks().length > 0 && status === "connected";
   const showLocalFull = video && !remoteHasVideo && streams.local && !cameraOff;

   return (
      <div className="fixed inset-0 z-50 bg-slate-950 text-white overflow-hidden animate-fade-in">
         {/* background */}
         {remoteHasVideo ? (
            <RemoteVideo stream={streams.remote} />
         ) : showLocalFull ? (
            <Video stream={streams.local} muted className="absolute inset-0 size-full object-cover opacity-40" />
         ) : (
            <div className="absolute inset-0 brand-gradient opacity-30" />
         )}
         <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" />
         {!remoteHasVideo && streams.remote && <Audio stream={streams.remote} />}
         {status === "incoming" && <audio src="/sounds/call.mp3" autoPlay loop />}

         {remoteHasVideo && streams.local && <Pip stream={streams.local} cameraOff={cameraOff} />}

         <div className="relative z-10 h-full flex flex-col items-center justify-between py-14 px-6">
            <div className={`flex flex-col items-center text-center ${remoteHasVideo ? "opacity-90" : "mt-[8vh]"}`}>
               {!remoteHasVideo && (
                  <div className="relative mb-6">
                     {(status === "incoming" || status === "outgoing") && (
                        <>
                           <span className="absolute inset-0 rounded-full bg-white/30 animate-ring" />
                           <span className="absolute inset-0 rounded-full bg-white/20 animate-ring [animation-delay:0.8s]" />
                        </>
                     )}
                     <Avatar user={peer} size="2xl" className="relative ring-4 ring-white/20" />
                  </div>
               )}
               <h2 className="text-2xl sm:text-3xl font-bold drop-shadow">{peer?.fullname ?? "Unknown"}</h2>
               <p className="mt-2 text-white/75 font-medium flex items-center gap-1.5">
                  <Icon name={video ? "videocam" : "call"} size={18} />
                  {status === "connected"
                     ? reason ?? <Elapsed startedAt={startedAt} />
                     : status === "incoming"
                       ? `Incoming ${video ? "video" : "voice"} call`
                       : STATUS_TEXT[status]}
               </p>
            </div>

            {status === "incoming" ? (
               <div className="flex items-center gap-16 mb-6">
                  <div className="flex flex-col items-center gap-2">
                     <ControlButton icon="call_end" label="Decline" danger big onClick={rejectCall} />
                     <span className="text-sm text-white/70">Decline</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                     <div className="relative">
                        <span className="absolute inset-0 rounded-full bg-emerald-400/60 animate-ring" />
                        <button
                           onClick={acceptCall}
                           aria-label="Accept"
                           className="relative size-16 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40 transition-transform hover:scale-105"
                        >
                           <Icon name={video ? "videocam" : "call"} fill size={30} />
                        </button>
                     </div>
                     <span className="text-sm text-white/70">Accept</span>
                  </div>
               </div>
            ) : (
               <div className="flex items-center gap-4 px-5 py-4 rounded-full bg-black/55 ring-1 ring-white/10 mb-2">
                  <ControlButton
                     icon={muted ? "mic_off" : "mic"}
                     label={muted ? "Unmute" : "Mute"}
                     active={muted}
                     onClick={() => setMuted(!toggleTrack("audio"))}
                  />
                  {video && (
                     <ControlButton
                        icon={cameraOff ? "videocam_off" : "videocam"}
                        label={cameraOff ? "Turn camera on" : "Turn camera off"}
                        active={cameraOff}
                        onClick={() => setCameraOff(!toggleTrack("video"))}
                     />
                  )}
                  <ControlButton icon="call_end" label="End call" danger onClick={() => hangUp()} />
               </div>
            )}
         </div>
      </div>
   );
}

export default CallScreen;
