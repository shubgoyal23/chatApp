import { memo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { openChat } from "../../store/chatSlice";
import { formatListTime } from "../../lib/format";
import Avatar from "../ui/Avatar";
import Icon from "../ui/Icon";

function preview(contact, me, users) {
   const m = contact.lastMessage;
   if (!m?.message) return contact.accountType === "group" ? "Group created" : "Say hi 👋";
   const fromMe = m.from === me;
   if (contact.accountType === "group" && !fromMe) {
      const name = users[m.from]?.fullname?.split(" ")[0];
      return name ? `${name}: ${m.message}` : m.message;
   }
   return m.message;
}

function ConversationItem({ contact, active }) {
   const dispatch = useDispatch();
   const me = useSelector((s) => s.login.userdata?._id);
   const unread = useSelector((s) => s.chat.unread[contact._id] ?? 0);
   const typing = useSelector((s) => s.chat.typing[contact._id]);
   const online = useSelector((s) => s.chat.presence[contact._id] === "online");
   const users = useSelector((s) => s.chat.users);
   const fromMe = contact.lastMessage?.from === me && contact.lastMessage?.message;

   return (
      <button
         onClick={() => dispatch(openChat(contact._id))}
         className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-colors ${
            active ? "bg-indigo-500/10" : "hover:bg-surface-2"
         }`}
      >
         <Avatar user={contact} size="lg" online={online && contact.accountType !== "group"} />
         <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
               <p className={`flex-1 truncate font-semibold ${active ? "text-indigo-600 dark:text-indigo-300" : "text-fg"}`}>
                  {contact.fullname || "Unknown"}
               </p>
               <span className={`shrink-0 text-[11px] ${unread ? "text-indigo-500 font-semibold" : "text-subtle"}`}>
                  {formatListTime(contact.lastMessage?.epoch)}
               </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
               {typing ? (
                  <p className="flex-1 truncate text-sm font-medium text-indigo-500">typing…</p>
               ) : (
                  <p className={`flex-1 truncate text-sm ${unread ? "text-fg font-medium" : "text-muted"}`}>
                     {fromMe && <Icon name="done" size={15} className="mr-1 align-[-3px] text-indigo-400" />}
                     {preview(contact, me, users)}
                  </p>
               )}
               {unread > 0 && (
                  <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full brand-gradient text-white text-[11px] font-bold flex items-center justify-center">
                     {unread > 99 ? "99+" : unread}
                  </span>
               )}
            </div>
         </div>
      </button>
   );
}

export default memo(ConversationItem);
