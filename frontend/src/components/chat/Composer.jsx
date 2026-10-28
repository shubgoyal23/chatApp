import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { sendMessage } from "../../lib/socket";
import { playSound } from "../../lib/sounds";
import { useBackHandler } from "../../lib/backStack";
import { clearReplyto } from "../../store/chatSlice";
import Icon from "../ui/Icon";
import IconButton from "../ui/IconButton";
import EmojiPicker from "./EmojiPicker";

const MAX_LENGTH = 4000;
// phones and tablets: an on-screen keyboard appears whenever the input is focused
const isTouch = () => window.matchMedia("(hover: none)").matches;
const TYPING_EVERY = 2500;

function Composer({ chatId, contact, onPending }) {
   const dispatch = useDispatch();
   const me = useSelector((s) => s.login.userdata);
   const replyTo = useSelector((s) => s.chat.replyto);
   const replyName = useSelector((s) =>
      replyTo ? (replyTo.from === me._id ? "yourself" : s.chat.users[replyTo.from]?.fullname ?? contact?.fullname) : null
   );
   const [text, setText] = useState(() => {
      try {
         return sessionStorage.getItem(`draft:${chatId}`) ?? "";
      } catch {
         return "";
      }
   });
   const [emojiOpen, setEmojiOpen] = useState(false);
   const input = useRef(null);
   const lastTyping = useRef(0);
   const pickerRef = useRef(null);
   const type = contact?.accountType === "group" ? "group" : "user";
   useBackHandler(emojiOpen, () => setEmojiOpen(false));

   // per-chat drafts survive switching conversations
   useEffect(() => {
      try {
         if (text) sessionStorage.setItem(`draft:${chatId}`, text);
         else sessionStorage.removeItem(`draft:${chatId}`);
      } catch {
         // ignore
      }
   }, [text, chatId]);

   useEffect(() => {
      if (replyTo && !isTouch()) input.current?.focus();
   }, [replyTo]);

   // grow the textarea with its content, up to a limit
   useLayoutEffect(() => {
      const el = input.current;
      if (!el) return;
      el.style.height = "0px";
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
   }, [text]);

   useEffect(() => {
      if (!emojiOpen) return;
      const close = (e) => {
         if (!pickerRef.current?.contains(e.target)) setEmojiOpen(false);
      };
      document.addEventListener("mousedown", close);
      return () => document.removeEventListener("mousedown", close);
   }, [emojiOpen]);

   const notifyTyping = () => {
      const now = Date.now();
      if (now - lastTyping.current < TYPING_EVERY) return;
      lastTyping.current = now;
      sendMessage({ from: me._id, to: chatId, type: "typing", message: "typing" });
   };

   const send = () => {
      const message = text.trim();
      if (!message) return;
      const msg = {
         from: me._id,
         to: chatId,
         message: message.slice(0, MAX_LENGTH),
         type,
         media: "",
         ...(replyTo?._id && { replyTo: replyTo._id }),
      };
      onPending({ ...msg, epoch: Math.floor(Date.now() / 1000) });
      sendMessage(msg);
      playSound("sent");
      setText("");
      lastTyping.current = 0;
      dispatch(clearReplyto());
   };

   return (
      <div className="px-3 sm:px-5 pb-3 sm:pb-4 pt-2 bg-surface border-t border-line">
         {replyTo && (
            <div className="flex items-center gap-3 mb-2 pl-3 pr-1 py-2 rounded-2xl bg-surface-2 border-l-4 border-indigo-500 animate-pop-in">
               <Icon name="reply" className="text-indigo-500" />
               <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-indigo-500">Replying to {replyName}</p>
                  <p className="text-sm text-muted truncate">{replyTo.message}</p>
               </div>
               <IconButton icon="close" label="Cancel reply" onClick={() => dispatch(clearReplyto())} />
            </div>
         )}

         <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
               e.preventDefault();
               send();
            }}
         >
            <div className="relative flex-1 flex items-end gap-1 min-h-12 pl-1.5 pr-2 rounded-3xl bg-surface-2 border border-transparent focus-within:border-indigo-400/60 focus-within:bg-surface focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
               <div ref={pickerRef} className="relative self-end mb-1">
                  <IconButton
                     icon={emojiOpen ? "close" : "mood"}
                     label="Emoji"
                     active={emojiOpen}
                     onClick={() => {
                        // close the keyboard so the panel has room on phones
                        if (!emojiOpen && isTouch()) input.current?.blur();
                        setEmojiOpen((v) => !v);
                     }}
                  />
                  {emojiOpen && (
                     <div className="absolute bottom-12 left-0 z-20">
                        <EmojiPicker
                           onPick={(e) => {
                              setText((t) => (t + e).slice(0, MAX_LENGTH));
                              if (!isTouch()) input.current?.focus();
                           }}
                        />
                     </div>
                  )}
               </div>
               <textarea
                  ref={input}
                  autoFocus={!isTouch()}
                  onFocus={() => isTouch() && setEmojiOpen(false)}
                  rows={1}
                  value={text}
                  maxLength={MAX_LENGTH}
                  placeholder="Type a message"
                  aria-label="Message"
                  onChange={(e) => {
                     setText(e.target.value);
                     if (e.target.value) notifyTyping();
                  }}
                  onKeyDown={(e) => {
                     // Enter sends, Shift+Enter adds a line (on touch keyboards Enter adds a line)
                     if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && window.matchMedia("(hover: hover)").matches) {
                        e.preventDefault();
                        send();
                     }
                     if (e.key === "Escape") dispatch(clearReplyto());
                  }}
                  className="flex-1 min-w-0 resize-none bg-transparent outline-none py-3 text-[15px] leading-6 text-fg placeholder:text-subtle"
               />
            </div>
            <button
               type="submit"
               disabled={!text.trim()}
               aria-label="Send"
               className="size-12 shrink-0 rounded-full brand-gradient text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 transition-all hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:shadow-none"
            >
               <Icon name="send" fill size={22} className="translate-x-px" />
            </button>
         </form>
      </div>
   );
}

export default Composer;
