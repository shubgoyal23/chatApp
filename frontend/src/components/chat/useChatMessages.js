import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useStore } from "react-redux";
import { api } from "../../lib/api";
import { readCache, writeCache } from "../../helper/MessageStorage";
import { takeIncoming } from "../../store/chatSlice";

const PAGE = 30;

// Union of two message lists, de-duplicated by _id and ordered by time.
// Epochs have one-second resolution, so the sort is stable: messages from the
// same second keep the order they arrived in.
const merge = (a, b) => {
   const byId = new Map();
   const pending = [];
   for (const m of [...a, ...b]) {
      if (m.pending) pending.push(m);
      else if (m._id) byId.set(m._id, m);
   }
   const list = [...byId.values()].sort((x, y) => (x.epoch ?? 0) - (y.epoch ?? 0));
   return [...list, ...pending];
};

/**
 * Message history for one conversation: cached messages render instantly,
 * the server's latest page replaces them, older pages load on demand and
 * live messages stream in from the socket.
 */
export function useChatMessages(chatId, selfId) {
   const dispatch = useDispatch();
   const store = useStore();
   const [messages, setMessages] = useState([]);
   const [status, setStatus] = useState("loading"); // loading | ready | error
   const [hasMore, setHasMore] = useState(true);
   const [loadingOlder, setLoadingOlder] = useState(false);
   const page = useRef(1);

   const loadLatest = useCallback(async () => {
      try {
         const latest = (await api("/message/all", { body: { to: chatId, page: 1, limit: PAGE } })) ?? [];
         page.current = 1;
         setHasMore(latest.length === PAGE);
         setMessages((prev) => merge(prev, latest));
         setStatus("ready");
      } catch {
         setStatus((s) => (s === "ready" ? s : "error"));
      }
   }, [chatId]);

   useEffect(() => {
      let cancelled = false;
      readCache(chatId).then((cached) => {
         if (cancelled) return;
         if (cached.length) {
            setMessages((prev) => merge(cached, prev));
            setStatus("ready");
         }
         loadLatest();
      });
      return () => {
         cancelled = true;
      };
   }, [chatId, loadLatest]);

   // live messages from the socket, handed over through the store
   useEffect(() => {
      const take = () => {
         const incoming = store.getState().chat.incoming[chatId];
         if (!incoming?.length) return;
         dispatch(takeIncoming(chatId));
         setMessages((prev) => {
            let list = prev;
            for (const msg of incoming) {
               if (msg.from === selfId) {
                  // our own message came back from the server: drop its placeholder
                  const i = list.findIndex((m) => m.pending && m.message === msg.message);
                  if (i !== -1) list = [...list.slice(0, i), ...list.slice(i + 1)];
               }
            }
            return merge(list, incoming);
         });
      };
      const unsubscribe = store.subscribe(take);
      queueMicrotask(take);
      return unsubscribe;
   }, [store, chatId, dispatch, selfId]);

   // keep the local cache warm
   useEffect(() => {
      if (status !== "ready") return;
      const t = setTimeout(() => writeCache(chatId, messages), 400);
      return () => clearTimeout(t);
   }, [messages, status, chatId]);

   const loadOlder = useCallback(async () => {
      if (loadingOlder || !hasMore) return 0;
      setLoadingOlder(true);
      try {
         const next = page.current + 1;
         const older = (await api("/message/all", { body: { to: chatId, page: next, limit: PAGE } })) ?? [];
         page.current = next;
         setHasMore(older.length === PAGE);
         setMessages((prev) => merge(older, prev));
         return older.length;
      } catch {
         return 0;
      } finally {
         setLoadingOlder(false);
      }
   }, [chatId, hasMore, loadingOlder]);

   const addPending = useCallback((msg) => {
      setMessages((prev) => [...prev, { ...msg, pending: true, tempId: crypto.randomUUID() }]);
   }, []);

   return { messages, status, hasMore, loadingOlder, loadOlder, addPending, retry: loadLatest };
}
