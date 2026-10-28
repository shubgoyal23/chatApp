import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { dayKey, formatDay } from "../../lib/format";
import Icon from "../ui/Icon";
import Spinner from "../ui/Spinner";
import Button from "../ui/Button";
import MessageBubble from "./MessageBubble";

// consecutive messages from one sender within this window are grouped
const GROUP_WINDOW = 5 * 60;

function MessageList({ chat, contact }) {
   const { messages, status, hasMore, loadingOlder, loadOlder, retry } = chat;
   const me = useSelector((s) => s.login.userdata._id);
   const scroller = useRef(null);
   const atBottom = useRef(true);
   const restore = useRef(null);
   const [showJump, setShowJump] = useState(false);
   const [newBelow, setNewBelow] = useState(0);
   const lastCount = useRef(0);
   const [highlight, setHighlight] = useState(null);

   const byId = new Map(messages.map((m) => [m._id, m]));

   const scrollToBottom = (smooth) => {
      const el = scroller.current;
      if (!el) return;
      el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
      setNewBelow(0);
   };

   // keep position stable when older messages are prepended, otherwise
   // follow new messages if the user is at the bottom
   useLayoutEffect(() => {
      const el = scroller.current;
      if (!el) return;
      if (restore.current) {
         el.scrollTop = el.scrollHeight - restore.current;
         restore.current = null;
      } else if (atBottom.current) {
         el.scrollTop = el.scrollHeight;
      } else if (messages.length > lastCount.current) {
         setNewBelow((n) => n + (messages.length - lastCount.current));
      }
      lastCount.current = messages.length;
   }, [messages]);

   // always jump to the newest message when we send one
   useEffect(() => {
      const last = messages.at(-1);
      if (last?.from === me && (last.pending || Date.now() / 1000 - last.epoch < 5)) {
         scrollToBottom(true);
      }
   }, [messages, me]);

   const onScroll = async () => {
      const el = scroller.current;
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      atBottom.current = distance < 80;
      setShowJump(distance > 400);
      if (atBottom.current) setNewBelow(0);
      if (el.scrollTop < 120 && hasMore && !loadingOlder && status === "ready") {
         restore.current = el.scrollHeight - el.scrollTop;
         const n = await loadOlder();
         if (!n) restore.current = null;
      }
   };

   const jumpTo = (id) => {
      const node = scroller.current?.querySelector(`[data-mid="${id}"]`);
      if (!node) return;
      node.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlight(id);
      setTimeout(() => setHighlight(null), 1400);
   };

   return (
      <div className="relative flex-1 min-h-0 chat-pattern">
         <div ref={scroller} onScroll={onScroll} className="h-full overflow-y-auto px-3 sm:px-6 lg:px-10 py-4">
            {loadingOlder && (
               <div className="flex justify-center py-2 text-subtle">
                  <Spinner className="size-5" />
               </div>
            )}
            {!hasMore && messages.length > 0 && (
               <div className="flex justify-center mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/10 text-amber-700 dark:text-amber-300 text-xs">
                     <Icon name="lock" size={14} /> Messages are encrypted in transit
                  </span>
               </div>
            )}

            {status === "loading" && messages.length === 0 && (
               <div className="h-full flex items-center justify-center text-subtle">
                  <Spinner className="size-6" />
               </div>
            )}

            {status === "error" && messages.length === 0 && (
               <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
                  <Icon name="cloud_off" size={36} className="text-subtle" />
                  <p className="text-muted">Couldn&apos;t load messages.</p>
                  <Button variant="secondary" icon="refresh" onClick={retry}>Try again</Button>
               </div>
            )}

            {status === "ready" && messages.length === 0 && (
               <div className="h-full flex flex-col items-center justify-center text-center px-6">
                  <div className="text-5xl mb-4">👋</div>
                  <p className="font-semibold text-fg">Start the conversation</p>
                  <p className="mt-1 text-sm text-muted">
                     Say hello to {contact?.fullname?.split(" ")[0] ?? "them"}.
                  </p>
               </div>
            )}

            {messages.map((m, i) => {
               const prev = messages[i - 1];
               const next = messages[i + 1];
               const newDay = !prev || dayKey(prev.epoch) !== dayKey(m.epoch);
               const groupedWithPrev =
                  !newDay && prev?.from === m.from && m.epoch - prev.epoch < GROUP_WINDOW;
               const groupedWithNext =
                  next && next.from === m.from && dayKey(next.epoch) === dayKey(m.epoch) && next.epoch - m.epoch < GROUP_WINDOW;
               return (
                  <Fragment key={m._id ?? m.tempId}>
                     {newDay && (
                        <div className="sticky top-0 z-[1] flex justify-center py-3">
                           <span className="px-3 py-1 rounded-full bg-surface/90 backdrop-blur border border-line text-[11px] font-semibold text-muted shadow-sm">
                              {formatDay(m.epoch)}
                           </span>
                        </div>
                     )}
                     <MessageBubble
                        message={m}
                        mine={m.from === me}
                        isGroup={contact?.accountType === "group"}
                        first={!groupedWithPrev}
                        last={!groupedWithNext}
                        reply={m.replyTo ? byId.get(m.replyTo) ?? { missing: true } : null}
                        highlight={highlight === m._id}
                        onJump={jumpTo}
                     />
                  </Fragment>
               );
            })}
         </div>

         {(showJump || newBelow > 0) && (
            <button
               onClick={() => scrollToBottom(true)}
               className="absolute right-4 bottom-4 size-11 rounded-full bg-surface border border-line shadow-lg flex items-center justify-center text-muted hover:text-fg animate-pop-in"
               aria-label="Scroll to latest"
            >
               <Icon name="keyboard_arrow_down" size={26} />
               {newBelow > 0 && (
                  <span className="absolute -top-1.5 -right-1 min-w-5 h-5 px-1 rounded-full brand-gradient text-white text-[11px] font-bold flex items-center justify-center">
                     {newBelow}
                  </span>
               )}
            </button>
         )}
      </div>
   );
}

export default MessageList;
