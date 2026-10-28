import { useEffect, useRef } from "react";

/**
 * Makes the browser/phone back button close the top-most open layer (a
 * chat, panel, dialog...) instead of leaving the app. Each open layer adds
 * one history entry; back pops it and closes that layer. Closing a layer
 * from the UI removes its entry again so history stays in step.
 */
const stack = [];
let ignorePops = 0;

window.addEventListener("popstate", () => {
   if (ignorePops > 0) {
      ignorePops--;
      return;
   }
   const layer = stack.pop();
   if (!layer) return;
   if (layer.sticky) {
      // can't be closed with back (e.g. an active call): put the entry back
      stack.push(layer);
      history.pushState({ chatzzLayer: layer.id }, "");
      return;
   }
   layer.onBack();
});

let nextId = 0;

function pushLayer(onBack, sticky) {
   const id = ++nextId;
   stack.push({ id, onBack, sticky });
   history.pushState({ chatzzLayer: id }, "");
   return () => {
      const i = stack.findIndex((l) => l.id === id);
      if (i === -1) return; // already closed by the back button
      stack.splice(i, 1);
      ignorePops++;
      history.back();
   };
}

// While `active`, the back button calls onBack (or, with sticky, does nothing).
export function useBackHandler(active, onBack, { sticky = false } = {}) {
   const handler = useRef(onBack);
   useEffect(() => {
      handler.current = onBack;
   });
   useEffect(() => {
      if (!active) return;
      return pushLayer(() => handler.current?.(), sticky);
   }, [active, sticky]);
}
