import {
   decryptDataAESLocal,
   encryptDataAESLocal,
   hasLocalKey,
} from "./AEShelper";

// A small encrypted per-conversation cache so chats open instantly; the
// server stays the source of truth.
const PREFIX = "chat:";
const LIMIT = 60;

export const readCache = async (chatId) => {
   if (!hasLocalKey()) return [];
   try {
      const raw = localStorage.getItem(PREFIX + chatId);
      if (!raw) return [];
      return JSON.parse(await decryptDataAESLocal(raw));
   } catch {
      // unreadable (e.g. the key changed after a profile edit): drop it
      localStorage.removeItem(PREFIX + chatId);
      return [];
   }
};

export const writeCache = async (chatId, messages) => {
   if (!hasLocalKey()) return;
   try {
      const slim = messages.filter((m) => m._id && !m.pending).slice(-LIMIT);
      localStorage.setItem(
         PREFIX + chatId,
         await encryptDataAESLocal(JSON.stringify(slim))
      );
   } catch {
      // storage full or unavailable: the cache is optional
   }
};

export const clearCache = () => {
   try {
      Object.keys(localStorage)
         .filter((k) => k.startsWith(PREFIX) || /^[0-9a-f]{24}$/.test(k))
         .forEach((k) => localStorage.removeItem(k));
   } catch {
      // ignore
   }
};
