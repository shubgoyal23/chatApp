import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { api } from "../../lib/api";
import { sendMessage, onConnectionState } from "../../lib/socket";
import { startCall } from "../../lib/call";
import { isGroup, knowUsers, openChat, upsertContact } from "../../store/chatSlice";
import Avatar from "../ui/Avatar";
import IconButton from "../ui/IconButton";
import MessageList from "./MessageList";
import Composer from "./Composer";
import { useChatMessages } from "./useChatMessages";

function ChatWindow({ chatId, infoOpen, onToggleInfo }) {
   const dispatch = useDispatch();
   const me = useSelector((s) => s.login.userdata);
   const contact = useSelector((s) => s.chat.contacts[chatId]);
   const presence = useSelector((s) => s.chat.presence[chatId]);
   const typing = useSelector((s) => s.chat.typing[chatId]);
   const users = useSelector((s) => s.chat.users);
   const callStatus = useSelector((s) => s.call.status);
   const group = isGroup(contact);
   const chat = useChatMessages(chatId, me._id);

   // presence for 1:1 chats, refreshed periodically and after reconnects
   useEffect(() => {
      if (group) return;
      const ask = () => sendMessage({ from: me._id, to: chatId, type: "useronline", message: "useronline" });
      const t = setInterval(ask, 30_000);
      const off = onConnectionState((s) => s === "connected" && ask());
      return () => {
         clearInterval(t);
         off();
      };
   }, [chatId, group, me._id]);

   // group members, for sender names and the header subtitle
   useEffect(() => {
      if (!group) return;
      api(`/users/info?id=${chatId}`)
         .then((info) => {
            dispatch(knowUsers(info.members ?? []));
            dispatch(upsertContact(info));
         })
         .catch(() => {});
   }, [chatId, group, dispatch]);

   const typingName = typing
      ? group
         ? `${users[typing.userId]?.fullname?.split(" ")[0] ?? "Someone"} is typing…`
         : "typing…"
      : null;

   const subtitle = typingName
      ? typingName
      : group
        ? `${contact?.members?.length ?? 0} members`
        : presence === "online"
          ? "online"
          : `@${contact?.username ?? ""}`;

   return (
      <section className="flex-1 min-w-0 flex flex-col h-full">
         {/* Header */}
         <header className="flex items-center gap-2 sm:gap-3 h-[68px] px-2 sm:px-4 border-b border-line bg-surface/90 backdrop-blur z-10">
            <IconButton icon="arrow_back" label="Back" className="md:hidden" onClick={() => dispatch(openChat(null))} />
            <button onClick={onToggleInfo} className="flex items-center gap-3 min-w-0 flex-1 text-left rounded-xl py-1">
               <Avatar user={contact} online={!group && presence === "online"} />
               <div className="min-w-0">
                  <p className="font-semibold text-fg truncate">{contact?.fullname ?? "Loading…"}</p>
                  <p className={`text-xs truncate ${typingName || presence === "online" ? "text-indigo-500 font-medium" : "text-subtle"}`}>
                     {subtitle}
                  </p>
               </div>
            </button>
            {!group && (
               <>
                  <IconButton
                     icon="call"
                     label="Voice call"
                     disabled={callStatus !== "idle"}
                     onClick={() => startCall(contact, "audio")}
                  />
                  <IconButton
                     icon="videocam"
                     label="Video call"
                     disabled={callStatus !== "idle"}
                     onClick={() => startCall(contact, "video")}
                  />
               </>
            )}
            <IconButton icon="info" label="Details" active={infoOpen} onClick={onToggleInfo} />
         </header>

         <MessageList chat={chat} contact={contact} />

         <Composer chatId={chatId} contact={contact} onPending={chat.addPending} />
      </section>
   );
}

export default ChatWindow;
