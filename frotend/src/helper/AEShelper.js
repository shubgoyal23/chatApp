import CryptoJS from "crypto-js";
import base64 from "base64-js";

export const decryptData = async (key, text) => {
   try {
      // Decode base64
      const encryptedArray = base64.toByteArray(text);

      // Extract IV and ciphertext
      const iv = encryptedArray.slice(0, 12);
      const ciphertext = encryptedArray.slice(12);

      // Generate CryptoKey
      const keyHash = CryptoJS.MD5(key).toString();
      const rawKey = new Uint8Array(
         keyHash.match(/.{2}/g).map((byte) => parseInt(byte, 16))
      );
      const cryptoKey = await crypto.subtle.importKey(
         "raw",
         rawKey,
         { name: "AES-GCM" },
         false,
         ["decrypt"]
      );

      // Decrypt
      const plaintextBuffer = await crypto.subtle.decrypt(
         { name: "AES-GCM", iv },
         cryptoKey,
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

async function encryptData(key, plaintext) {
   const keyHash = CryptoJS.MD5(key).toString();
   const cryptoKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(keyHash),
      { name: "AES-GCM" },
      false,
      ["encrypt"]
   );

   const iv = crypto.getRandomValues(new Uint8Array(12));
   const ciphertextBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      cryptoKey,
      new TextEncoder().encode(plaintext)
   );

   const encryptedArray = new Uint8Array([
      ...iv,
      ...new Uint8Array(ciphertextBuffer),
   ]);
   return base64.fromByteArray(encryptedArray);
}

// (async () => {
//    const key = "your-key-string";
//    const plaintext = "Hello, AES-GCM!";

//    const encryptedText = await encryptData(key, plaintext);
//    console.log("Encrypted text:", encryptedText);

//    const decryptedText = await decryptData(key, encryptedText);
//    console.log("Decrypted text:", decryptedText);
// })();
