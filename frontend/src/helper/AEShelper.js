import CryptoJS from "crypto-js";
import base64 from "base64-js";

let rawKey;
let rawKeyLocal;

export const decryptDataAES = async (text, userdata) => {
   try {
      // Decode base64
      const encryptedArray = base64.toByteArray(text);
      // Extract IV and ciphertext
      const iv = encryptedArray.slice(0, 12);
      const ciphertext = encryptedArray.slice(12);

      // Generate CryptoKey
      if (userdata) {
         await GetkeyAes(userdata);
      }

      // Decrypt
      const plaintextBuffer = await crypto.subtle.decrypt(
         { name: "AES-GCM", iv },
         rawKey,
         ciphertext
      );

      // Decode plaintext
      const plaintext = new TextDecoder().decode(plaintextBuffer);
      return plaintext;
   } catch (error) {
      console.error("Decryption failed:", error);
      throw error;
   }
};

export const encryptDataAES = async (plaintext, userdata) => {
   // Generate CryptoKey
   if (userdata) {
      await GetkeyAes(userdata);
   }

   const iv = crypto.getRandomValues(new Uint8Array(12));
   const ciphertextBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      rawKey,
      new TextEncoder().encode(plaintext)
   );
   const encryptedArray = new Uint8Array([
      ...iv,
      ...new Uint8Array(ciphertextBuffer),
   ]);
   return base64.fromByteArray(encryptedArray);
};

export const GetkeyAes = async (userdata, local) => {
   let key;
   if (local) {
      key = `${userdata._id}${userdata.email}${userdata.username}`;
   } else {
      key = `${userdata._id}${userdata.email}${userdata.username}${userdata.key}`;
   }
   const keyHash = CryptoJS.MD5(key).toString();
   const k = new Uint8Array(
      keyHash.match(/.{2}/g).map((byte) => parseInt(byte, 16))
   );
   const cryptoKey = await crypto.subtle.importKey(
      "raw",
      k,
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"]
   );
   if (local) {
      rawKeyLocal = cryptoKey
   } else {
      rawKey = cryptoKey;
   }
};

export const decryptDataAESLocal = async (text, userdata) => {
   try {
      // Decode base64
      const encryptedArray = base64.toByteArray(text);
      // Extract IV and ciphertext
      const iv = encryptedArray.slice(0, 12);
      const ciphertext = encryptedArray.slice(12);

      // Generate CryptoKey
      if (userdata) {
         await GetkeyAes(userdata, true);
      }

      // Decrypt
      const plaintextBuffer = await crypto.subtle.decrypt(
         { name: "AES-GCM", iv },
         rawKeyLocal,
         ciphertext
      );

      // Decode plaintext
      const plaintext = new TextDecoder().decode(plaintextBuffer);
      return plaintext;
   } catch (error) {
      console.error("Decryption failed:", error);
      throw error;
   }
};

export const encryptDataAESLocal = async (plaintext, userdata) => {
   // Generate CryptoKey
   if (userdata) {
      await GetkeyAes(userdata, true);
   }

   const iv = crypto.getRandomValues(new Uint8Array(12));
   const ciphertextBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      rawKeyLocal,
      new TextEncoder().encode(plaintext)
   );
   const encryptedArray = new Uint8Array([
      ...iv,
      ...new Uint8Array(ciphertextBuffer),
   ]);
   return base64.fromByteArray(encryptedArray);
};
