import { memo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setReplyto } from "../../store/chatSlice";
import { colorFor, formatTime } from "../../lib/format";
import { toast } from "../../lib/toast";
import Avatar from "../ui/Avatar";
import Icon from "../ui/Icon";

// Turns URLs into links; everything else stays plain text (React escapes it).
const URL_RE = /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"])/g;
function Linkified({ text }) {
   return text.split(URL_RE).map((part, i) =>
      i % 2 === 1 ? (
         <a key={i} href={part} target="_blank" rel="noopener noreferrer nofollow" className="underline underline-offset-2 break-all">
            {part}
         </a>
      ) : (
         part
      )
   );
}

const onlyEmoji = (text) =>
   text.length <= 12 && /^(\p{Extended_Pictographic}|\p{Emoji_Component}|\s)+$/u.test(text);

function MessageBubble({ message, mine, isGroup, first, last, reply, highlight, onJump }) {
   const dispatch = useDispatch();
   const sender = useSelector((s) => (isGroup && !mine ? s.chat.users[message.from] : null));
   const replySender = useSelector((s) =>
      reply && !reply.missing ? (reply.from === s.login.userdata._id ? { fullname: "You" } : s.chat.users[reply.from] ?? s.chat.contacts[reply.from]) : null
   );
   const big = onlyEmoji(message.message ?? "");
   const [accent] = colorFor(message.from);

   const copy = async () => {
      try {
         await navigator.clipboard.writeText(message.message);
         toast.success("Copied to clipboard", 1500);
      } catch {
         toast.error("Couldn't copy");
      }
   };

   // a small corner on the sender's side gives grouped bubbles a tail
   const corner = mine
      ? `${first ? "" : "rounded-tr-md"} rounded-br-md`
      : `${first ? "" : "rounded-tl-md"} rounded-bl-md`;

   return (
      <div
         data-mid={message._id}
         className={`group flex items-end gap-2 ${mine ? "justify-end" : "justify-start"} ${first ? "mt-3" : "mt-0.5"} animate-pop-in`}
      >
         {isGroup && !mine && (
            <div className="w-8 shrink-0">{last && <Avatar user={sender ?? { _id: message.from }} size="xs" className="size-8" />}</div>
         )}

         {mine && <Actions onReply={() => dispatch(setReplyto(message))} onCopy={copy} disabled={message.pending} />}

         <div
            className={`relative max-w-[min(78%,560px)] transition-shadow ${
               big
                  ? ""
                  : `px-3.5 pt-2 pb-1.5 rounded-[20px] ${corner} shadow-sm ${
                       mine
                          ? "brand-gradient text-white shadow-indigo-500/20"
                          : "bg-bubble-in text-fg border border-line"
                    }`
            } ${highlight ? "ring-4 ring-amber-400/60" : ""}`}
         >
            {isGroup && !mine && first && !big && (
               <p className="text-[12px] font-semibold mb-0.5" style={{ color: accent }}>
                  {sender?.fullname ?? "Member"}
               </p>
            )}

            {reply && (
               <button
                  onClick={() => !reply.missing && onJump(reply._id)}
                  className={`block w-full text-left mb-1.5 px-2.5 py-1.5 rounded-xl border-l-[3px] ${
                     mine ? "bg-white/15 border-white/70" : "bg-surface-2 border-indigo-400"
                  }`}
               >
                  <p className={`text-[11px] font-semibold ${mine ? "text-white/90" : "text-indigo-500"}`}>
                     {reply.missing ? "Reply" : replySender?.fullname ?? "Message"}
                  </p>
                  <p className={`text-[13px] line-clamp-2 ${mine ? "text-white/80" : "text-muted"}`}>
                     {reply.missing ? "Original message not loaded" : reply.message}
                  </p>
               </button>
            )}

            <p className={`whitespace-pre-wrap break-words ${big ? "text-5xl leading-tight" : "text-[15px] leading-relaxed"}`}>
               <Linkified text={message.message ?? ""} />
               {/* spacer so the timestamp never overlaps the last line */}
               {!big && <span className={`inline-block ${mine ? "w-[4.5rem]" : "w-14"}`} />}
            </p>
            <span
               className={`absolute bottom-1.5 right-3 flex items-center gap-0.5 text-[10.5px] ${
                  big ? "text-subtle static mt-1 justify-end" : mine ? "text-white/75" : "text-subtle"
               }`}
            >
               {formatTime(message.epoch)}
               {mine && <Icon name={message.pending ? "schedule" : "done"} size={14} />}
            </span>
         </div>

         {!mine && <Actions onReply={() => dispatch(setReplyto(message))} onCopy={copy} />}
      </div>
   );
}

function Actions({ onReply, onCopy, disabled }) {
   if (disabled) return null;
   return (
      <div className="flex self-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-70 transition-opacity">
         <button onClick={onReply} className="size-8 rounded-full flex items-center justify-center text-subtle hover:text-fg hover:bg-surface-2" aria-label="Reply" title="Reply">
            <Icon name="reply" size={18} />
         </button>
         <button onClick={onCopy} className="size-8 rounded-full flex items-center justify-center text-subtle hover:text-fg hover:bg-surface-2" aria-label="Copy" title="Copy">
            <Icon name="content_copy" size={16} />
         </button>
      </div>
   );
}

export default memo(MessageBubble);
