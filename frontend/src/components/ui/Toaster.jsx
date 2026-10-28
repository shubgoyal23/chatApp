import { useEffect, useState } from "react";
import { subscribeToasts } from "../../lib/toast";
import Icon from "./Icon";

const STYLES = {
   success: { icon: "check_circle", color: "text-emerald-500" },
   error: { icon: "error", color: "text-rose-500" },
   info: { icon: "info", color: "text-indigo-500" },
};

function Toaster() {
   const [toasts, setToasts] = useState([]);

   useEffect(
      () =>
         subscribeToasts((t) => {
            setToasts((list) => [...list.slice(-3), t]);
            setTimeout(() => setToasts((list) => list.filter((x) => x.id !== t.id)), t.duration);
         }),
      []
   );

   return (
      <div className="fixed z-[60] bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0 flex flex-col gap-2 w-[calc(100%-2rem)] sm:w-96 pointer-events-none">
         {toasts.map((t) => (
            <div
               key={t.id}
               role="status"
               className="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl bg-surface border border-line shadow-xl animate-pop-in"
            >
               <Icon name={STYLES[t.type].icon} fill className={STYLES[t.type].color} />
               <p className="text-sm text-fg leading-snug pt-0.5">{t.message}</p>
            </div>
         ))}
      </div>
   );
}

export default Toaster;
