// Generate a public/private key pair
const generateKey = async () => {
   const key = await crypto.subtle.generateKey(
       {
           name: "RSA-OAEP",
           modulusLength: 2048,
           publicExponent: new Uint8Array([1, 0, 1]),
           hash: "SHA-256",
       },
       true,
       ["encrypt", "decrypt"]
   );
   return key;
};
const exportAndStoreKey = async (key) => {
   const exportedKey = await crypto.subtle.exportKey("jwk", key.privateKey);
   const db = await indexedDB.open("KeysDB", 1);
   db.onupgradeneeded = (event) => {
       const db = event.target.result;
       db.createObjectStore("keys", { keyPath: "id" });
   };
   db.onsuccess = (event) => {
       const transaction = event.target.result.transaction("keys", "readwrite");
       const store = transaction.objectStore("keys");
       store.put({ id: "privateKey", key: exportedKey });
   };
};

const getKeyFromDB = async () => {
   const db = await indexedDB.open("KeysDB", 1);
   return new Promise((resolve) => {
       db.onsuccess = (event) => {
           const transaction = event.target.result.transaction("keys", "readonly");
           const store = transaction.objectStore("keys");
           const request = store.get("privateKey");
           request.onsuccess = () => resolve(request.result.key);
       };
   });
};



async function decryptPrivateKey(password) {
   const encryptedKey = localStorage.getItem("encryptedPrivateKey");
   const enc = new TextEncoder();
   const keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      "PBKDF2",
      false,
      ["deriveKey"]
   );

   const derivedKey = await crypto.subtle.deriveKey(
      {
         name: "PBKDF2",
         salt: enc.encode("unique_salt"),
         iterations: 100000,
         hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
   );

   const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: enc.encode("unique_iv") },
      derivedKey,
      base64ToArrayBuffer(encryptedKey)
   );

   return new TextDecoder().decode(decrypted);
}

// Utility functions
function arrayBufferToBase64(buffer) {
   return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToArrayBuffer(base64) {
   const binary = atob(base64);
   const bytes = new Uint8Array(binary.length);
   bytes.forEach((_, i) => (bytes[i] = binary.charCodeAt(i)));
   return bytes.buffer;
}

async function importPublicKey(pem) {
   const binaryDer = str2ab(pem);
   return crypto.subtle.importKey(
      "spki",
      binaryDer,
      {
         name: "RSA-OAEP",
         hash: "SHA-256",
      },
      false,
      ["encrypt"]
   );
}

// Convert a string (PEM) to an ArrayBuffer
function str2ab(str) {
   const binStr = atob(str.replace(/-----.*-----/g, "").replace(/\n/g, ""));
   const arrayBuffer = new ArrayBuffer(binStr.length);
   const uint8Array = new Uint8Array(arrayBuffer);
   for (let i = 0; i < binStr.length; i++) {
      uint8Array[i] = binStr.charCodeAt(i);
   }
   return arrayBuffer;
}

// Encrypt the data with the public key
async function encryptData(data, publicKeyPem) {
    const publicKey = await importPublicKey(publicKeyPem);
   const encodedData = new TextEncoder().encode(data); // Encode the data into bytes
   const encrypted = await crypto.subtle.encrypt(
      {
         name: "RSA-OAEP",
      },
      publicKey,
      encodedData
   );
   return new Uint8Array(encrypted); // Return the encrypted data as a byte array
}


export {encryptAndStorePrivateKey, decryptPrivateKey, encryptData};