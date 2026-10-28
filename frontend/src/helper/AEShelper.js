import MD5 from "crypto-js/md5";

// Session key shared with the socket server, and a separate key for the local
// message cache. Both are AES-GCM keys derived the same way the server does.
let rawKey;
let rawKeyLocal;

const toBase64 = (bytes) => {
   let s = "";
   for (let i = 0; i < bytes.length; i += 0x8000) {
      s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
   }
   return btoa(s);
};

const fromBase64 = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

const deriveKey = async (material) => {
   const hex = MD5(material).toString();
   const bytes = new Uint8Array(hex.match(/.{2}/g).map((b) => parseInt(b, 16)));
   return crypto.subtle.importKey("raw", bytes, { name: "AES-GCM" }, false, [
      "encrypt",
      "decrypt",
   ]);
};

export const GetkeyAes = async (userdata, local) => {
   const base = `${userdata._id}${userdata.email}${userdata.username}`;
   if (local) {
      rawKeyLocal = await deriveKey(base);
   } else {
      rawKey = await deriveKey(`${base}${userdata.key}`);
   }
};

const encrypt = async (key, plaintext) => {
   const iv = crypto.getRandomValues(new Uint8Array(12));
   const ct = new Uint8Array(
      await crypto.subtle.encrypt(
         { name: "AES-GCM", iv },
         key,
         new TextEncoder().encode(plaintext)
      )
   );
   const out = new Uint8Array(iv.length + ct.length);
   out.set(iv);
   out.set(ct, iv.length);
   return toBase64(out);
};

const decrypt = async (key, text) => {
   const data = fromBase64(text);
   const pt = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: data.slice(0, 12) },
      key,
      data.slice(12)
   );
   return new TextDecoder().decode(pt);
};

export const encryptDataAES = async (plaintext, userdata) => {
   if (userdata) await GetkeyAes(userdata);
   return encrypt(rawKey, plaintext);
};

export const decryptDataAES = async (text, userdata) => {
   if (userdata) await GetkeyAes(userdata);
   return decrypt(rawKey, text);
};

export const encryptDataAESLocal = async (plaintext, userdata) => {
   if (userdata) await GetkeyAes(userdata, true);
   return encrypt(rawKeyLocal, plaintext);
};

export const decryptDataAESLocal = async (text, userdata) => {
   if (userdata) await GetkeyAes(userdata, true);
   return decrypt(rawKeyLocal, text);
};

export const hasLocalKey = () => Boolean(rawKeyLocal);
