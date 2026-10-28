import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useBackHandler } from "../../lib/backStack";
import IconButton from "./IconButton";

function Modal({ open, onClose, title, children, width = "max-w-md" }) {
   useBackHandler(open, onClose);
   useEffect(() => {
      if (!open) return;
      const onKey = (e) => e.key === "Escape" && onClose?.();
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
   }, [open, onClose]);

   if (!open) return null;
   // portalled to <body>: a transformed ancestor (e.g. the sliding profile
   // panel) would otherwise confine this "fixed" overlay to its own box
   return createPortal(
      <div
         className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
         onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
      >
         <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`w-full ${width} max-h-[92svh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-surface border border-line shadow-2xl animate-pop-in`}
         >
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
               <h2 className="text-lg font-bold text-fg">{title}</h2>
               <IconButton icon="close" label="Close" onClick={onClose} />
            </div>
            <div className="px-6 pb-6 overflow-y-auto">{children}</div>
         </div>
      </div>,
      document.body
   );
}

export default Modal;
