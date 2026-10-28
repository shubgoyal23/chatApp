import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import { GetkeyAes } from "../../helper/AEShelper";
import { clearCache } from "../../helper/MessageStorage";
import { api } from "../../lib/api";
import { createTokenProvider } from "../../lib/session";
import { reconnectNow, setMessageHandler, startSocket, stopSocket } from "../../lib/socket";
import { handleCallSignal, hangUp } from "../../lib/call";
import { toast } from "../../lib/toast";
import { playSound } from "../../lib/sounds";
import { useBackHandler } from "../../lib/backStack";
import { logout } from "../../store/loginSlice";
import {
   clearTyping,
   receiveMessage,
   resetChat,
   setContacts,
   setPresence,
   setTyping,
   upsertContact,
   openChat,
} from "../../store/chatSlice";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import EmptyState from "./EmptyState";
import InfoPanel from "./InfoPanel";
import ConnectionBanner from "./ConnectionBanner";
import CallScreen from "../call/CallScreen";
import Splash from "../ui/Splash";

function ChatApp() {
   const dispatch = useDispatch();
   const store = useStore();
   const user = useSelector((s) => s.login.userdata);
   const activeId = useSelector((s) => s.chat.activeId);
   const unreadTotal = useSelector((s) =>
      Object.values(s.chat.unread).reduce((a, b) => a + b, 0)
   );
   const [ready, setReady] = useState(false);
   // the details panel is open for this chat id; switching chats closes it
   const [infoFor, setInfoFor] = useState(null);
   const showInfo = Boolean(activeId) && infoFor === activeId;
   const userRef = useRef(user);
   const fetching = useRef(new Set());

   useEffect(() => {
      userRef.current = user;
   }, [user]);

   // back button: info panel first, then the open chat
   useBackHandler(Boolean(activeId), () => dispatch(openChat(null)));
   useBackHandler(showInfo, () => setInfoFor(null));

   // Fetches details for a conversation we have not seen yet (e.g. a new
   // contact messaging us, or a group we were just added to).
   const ensureContact = useCallback(
      (id) => {
         if (store.getState().chat.contacts[id] || fetching.current.has(id)) return;
         fetching.current.add(id);
         api(`/users/info?id=${id}`)
            .then((info) => {
               const { incoming } = store.getState().chat;
               const last = incoming[id]?.at(-1);
               dispatch(upsertContact({ ...info, lastMessage: last }));
            })
            .catch(() => {})
            .finally(() => fetching.current.delete(id));
      },
      [dispatch, store]
   );

   const onSocketMessage = useCallback(
      (data) => {
         const me = userRef.current?._id;
         switch (data.type) {
            case "user":
            case "group": {
               const self = data.from === me;
               const chatId = data.type === "group" || self ? data.to : data.from;
               dispatch(receiveMessage({ msg: data, chatId, self }));
               // our own messages echo back from the server; only others' make a sound
               if (!self) playSound("received");
               ensureContact(chatId);
               return;
            }
            case "useronline":
               dispatch(setPresence({ id: data.to, status: data.message }));
               return;
            case "typing": {
               const { contacts } = store.getState().chat;
               const chatId = contacts[data.to]?.accountType === "group" ? data.to : data.from;
               dispatch(setTyping({ chatId, userId: data.from, at: Date.now() }));
               dispatch(setPresence({ id: data.from, status: "online" }));
               return;
            }
            default:
               handleCallSignal(data, (id) => {
                  const { contacts, users } = store.getState().chat;
                  return contacts[id] ?? users[id] ?? { _id: id, fullname: "Unknown" };
               }).catch((err) => {
                  console.error("call signal failed", err);
                  hangUp("Call failed");
               });
         }
      },
      [dispatch, ensureContact, store]
   );

   // connect once per login; reconnects happen inside lib/socket
   useEffect(() => {
      let cancelled = false;
      (async () => {
         await GetkeyAes(userRef.current, true);
         if (cancelled) return;
         setMessageHandler(onSocketMessage);
         startSocket({
            provider: () => createTokenProvider(userRef.current)(),
            userId: userRef.current._id,
            onAuthFailure: () => window.dispatchEvent(new Event("auth:expired")),
         });
         setReady(true);
      })();
      return () => {
         cancelled = true;
         stopSocket();
      };
   }, [onSocketMessage]);

   // username/email are part of the socket and cache keys
   const keyMaterial = `${user?.email}|${user?.username}`;
   const firstKey = useRef(keyMaterial);
   useEffect(() => {
      if (firstKey.current === keyMaterial) return;
      firstKey.current = keyMaterial;
      GetkeyAes(userRef.current, true).then(reconnectNow);
   }, [keyMaterial]);

   useEffect(() => {
      api("/message/contacts", { body: {} })
         .then((list) => dispatch(setContacts((list ?? []).filter((c) => c._id !== user?._id))))
         .catch((err) => toast.error(err.message));
   }, [dispatch, user?._id]);

   // expire typing indicators that stopped arriving
   useEffect(() => {
      const t = setInterval(() => {
         const { typing } = store.getState().chat;
         const now = Date.now();
         for (const [chatId, v] of Object.entries(typing)) {
            if (now - v.at > 4000) dispatch(clearTyping(chatId));
         }
      }, 1000);
      return () => clearInterval(t);
   }, [dispatch, store]);

   useEffect(() => {
      document.title = unreadTotal ? `(${unreadTotal}) Chatzz` : "Chatzz";
   }, [unreadTotal]);

   useEffect(() => () => {
      document.title = "Chatzz";
   }, []);

   const onLogout = useCallback(async () => {
      hangUp();
      try {
         await api("/users/logout", { method: "POST", auth: false });
      } catch {
         // log out locally even if the server is unreachable
      }
      stopSocket();
      clearCache();
      dispatch(resetChat());
      dispatch(logout());
   }, [dispatch]);

   if (!ready) return <Splash label="Connecting" />;

   return (
      <div className="h-full w-full bg-app lg:p-4 xl:p-5">
         <ConnectionBanner />
         <div className="relative h-full w-full max-w-[1680px] mx-auto flex overflow-hidden bg-surface lg:rounded-[28px] lg:border border-line lg:shadow-2xl lg:shadow-indigo-950/5">
            <Sidebar onLogout={onLogout} hidden={Boolean(activeId)} />
            <main className={`flex-1 min-w-0 ${activeId ? "flex" : "hidden md:flex"}`}>
               {activeId ? (
                  <ChatWindow
                     key={activeId}
                     chatId={activeId}
                     infoOpen={showInfo}
                     onToggleInfo={() => setInfoFor(showInfo ? null : activeId)}
                  />
               ) : (
                  <EmptyState />
               )}
            </main>
            {activeId && showInfo && <InfoPanel chatId={activeId} onClose={() => setInfoFor(null)} />}
         </div>
         <CallScreen />
      </div>
   );
}

export default ChatApp;
