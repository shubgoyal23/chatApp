import CryptoJS from "crypto-js";

export const encryptData = (data, secretKey) => {
   const ciphertext = CryptoJS.AES.encrypt(
      JSON.stringify(data),
      secretKey
   ).toString();
   return ciphertext;
};

export const decryptData = async (ciphertext, secretKey) => {
   try {
      secretKey = generateMD5(secretKey);
      const keyBuffer = Uint8Array.from(
         secretKey.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
      );

      // Decode the base64 encrypted data to a Uint8Array
      const encryptedData = Uint8Array.from(atob(ciphertext), (char) =>
         char.charCodeAt(0)
      );

      // Extract the nonce (first 12 bytes) and ciphertext
      const nonce = encryptedData.slice(0, 12); // First 12 bytes are the nonce
      const cipherText = encryptedData.slice(12); // Remaining bytes are the ciphertext

      // Import the AES key derived from MD5
      const cryptoKey = await crypto.subtle.importKey(
         "raw", // Key format
         keyBuffer, // Key buffer
         { name: "AES-GCM" }, // Algorithm
         false, // Extractable
         ["decrypt"] // Key usage
      );

      // Decrypt the ciphertext
      const decryptedBuffer = await crypto.subtle.decrypt(
         {
            name: "AES-GCM",
            iv: nonce, // Nonce extracted from the encrypted data
         },
         cryptoKey, // AES key
         cipherText // Encrypted data without the nonce
      );

      // Decode the decrypted data (from ArrayBuffer to string)
      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
   } catch (error) {
      console.error("Decryption failed:", error);
      throw new Error("Decryption failed");
   }

   // console.log(secretKey);
   // secretKey = generateMD5(secretKey);
   // const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
   // console.log(bytes);
   // // const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
   // return bytes.toString(CryptoJS.enc.Utf8);
};

export const generateMD5 = (text) => {
   return CryptoJS.MD5(text).toString(CryptoJS.enc.Hex);
};
