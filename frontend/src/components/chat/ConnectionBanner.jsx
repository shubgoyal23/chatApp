import { useEffect, useState } from "react";
import { onConnectionState, reconnectNow } from "../../lib/socket";
import Icon from "../ui/Icon";
import Spinner from "../ui/Spinner";

function ConnectionBanner() {
   const [state, setState] = useState("connecting");
   // the state that has lasted long enough to show; avoids flashing the
   // banner for a reconnect that finishes quickly
   const [settled, setSettled] = useState(null);

   useEffect(() => onConnectionState(setState), []);

   useEffect(() => {
      const t = setTimeout(() => setSettled(state), state === "replaced" ? 0 : 1500);
      return () => clearTimeout(t);
   }, [state]);

   if (settled !== state || state === "connected" || state === "idle") return null;

   const config = {
      connecting: { cls: "bg-amber-500", icon: <Spinner className="size-4" />, text: "Connecting…" },
      reconnecting: { cls: "bg-amber-500", icon: <Spinner className="size-4" />, text: "Reconnecting… messages you send will be delivered once you're back." },
      offline: { cls: "bg-rose-500", icon: <Icon name="wifi_off" size={18} />, text: "You're offline. Check your internet connection." },
      replaced: { cls: "bg-slate-800", icon: <Icon name="devices" size={18} />, text: "Chatzz is open in another window." },
   }[state];
   if (!config) return null;

   return (
      <div className="fixed top-0 inset-x-0 z-40 flex justify-center pointer-events-none animate-slide-down">
         <div className={`pointer-events-auto mt-2 mx-3 flex items-center gap-3 px-4 py-2.5 rounded-2xl text-white text-sm font-medium shadow-xl ${config.cls}`}>
            {config.icon}
            <span>{config.text}</span>
            {(state === "replaced" || state === "offline" || state === "reconnecting") && (
               <button onClick={reconnectNow} className="ml-1 px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 font-semibold">
                  {state === "replaced" ? "Use here" : "Retry"}
               </button>
            )}
         </div>
      </div>
   );
}

export default ConnectionBanner;
