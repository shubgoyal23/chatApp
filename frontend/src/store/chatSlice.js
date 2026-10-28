import { createSlice } from "@reduxjs/toolkit";

/**
 * contacts: conversations (users and groups) keyed by id, each with lastMessage
 * users:    directory of known people, used for group sender names
 * incoming: messages received for a chat, waiting for its window to take them
 */
const chatSlice = createSlice({
   name: "chat",
   initialState: {
      activeId: null,
      contacts: {},
      users: {},
      unread: {},
      incoming: {},
      presence: {},
      typing: {},
      replyto: null,
      contactsLoaded: false,
   },
   reducers: {
      setContacts(state, action) {
         for (const c of action.payload) {
            state.contacts[c._id] = { ...state.contacts[c._id], ...c };
            if (c.accountType !== "group") state.users[c._id] = c;
         }
         state.contactsLoaded = true;
      },
      upsertContact(state, action) {
         const c = action.payload;
         state.contacts[c._id] = { ...state.contacts[c._id], ...c };
         if (c.accountType !== "group") state.users[c._id] = c;
      },
      removeContact(state, action) {
         delete state.contacts[action.payload];
         if (state.activeId === action.payload) state.activeId = null;
      },
      knowUsers(state, action) {
         for (const u of action.payload) {
            if (u?._id) state.users[u._id] = { ...state.users[u._id], ...u };
         }
      },
      openChat(state, action) {
         state.activeId = action.payload;
         state.replyto = null;
         if (action.payload) delete state.unread[action.payload];
      },
      receiveMessage(state, action) {
         const { msg, chatId, self } = action.payload;
         (state.incoming[chatId] ??= []).push(msg);
         const contact = state.contacts[chatId];
         if (contact) {
            contact.lastMessage = msg;
         }
         if (!self && state.activeId !== chatId) {
            state.unread[chatId] = (state.unread[chatId] ?? 0) + 1;
         }
         if (state.typing[chatId]?.userId === msg.from) {
            delete state.typing[chatId];
         }
      },
      takeIncoming(state, action) {
         delete state.incoming[action.payload];
      },
      markRead(state, action) {
         delete state.unread[action.payload];
      },
      setPresence(state, action) {
         state.presence[action.payload.id] = action.payload.status;
      },
      setTyping(state, action) {
         const { chatId, userId, at } = action.payload;
         state.typing[chatId] = { userId, at };
      },
      clearTyping(state, action) {
         delete state.typing[action.payload];
      },
      setReplyto(state, action) {
         state.replyto = action.payload;
      },
      clearReplyto(state) {
         state.replyto = null;
      },
      resetChat() {
         return chatSlice.getInitialState();
      },
   },
});

export const {
   setContacts,
   upsertContact,
   removeContact,
   knowUsers,
   openChat,
   receiveMessage,
   takeIncoming,
   markRead,
   setPresence,
   setTyping,
   clearTyping,
   setReplyto,
   clearReplyto,
   resetChat,
} = chatSlice.actions;
export default chatSlice.reducer;

export const isGroup = (c) => c?.accountType === "group";
