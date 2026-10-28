import conf from "../constance/conf";

let publicKeyPromise = null;

// Fetches and imports the socket server's RSA public key. A failed fetch is
// not cached, so the next call retries.
const getPublicKey = () => {
   publicKeyPromise ??= (async () => {
      const res = await fetch(`${conf.GIN_URL}/publickey`);
      if (!res.ok) throw new Error("Could not fetch server key");
      const { publickey } = await res.json();
      const b64 = publickey
         .replace(/-----(BEGIN|END) PUBLIC KEY-----/g, "")
         .replace(/\s+/g, "");
      const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      return crypto.subtle.importKey(
         "spki",
         der,
         { name: "RSA-OAEP", hash: "SHA-256" },
         false,
         ["encrypt"]
      );
   })().catch((err) => {
      publicKeyPromise = null;
      throw err;
   });
   return publicKeyPromise;
};

// RSA-OAEP(SHA-256) encrypt, base64 encoded — matches the Go server's DecryptOAEP.
export const encryptWithPublicKey = async (data) => {
   const key = await getPublicKey();
   const ct = new Uint8Array(
      await crypto.subtle.encrypt(
         { name: "RSA-OAEP" },
         key,
         new TextEncoder().encode(data)
      )
   );
   return btoa(String.fromCharCode(...ct));
};
