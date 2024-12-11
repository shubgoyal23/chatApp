import forge from "node-forge";
import conf from "../constance/conf";

export let rsaPublicKey;
export const encryptWithPublicKey = async (data) => {
   // Convert the public key from PEM format
   if (!rsaPublicKey) {
      await getPublicKey();
   }
   // Encrypt the data
   const encryptedData = rsaPublicKey.encrypt(data, "RSA-OAEP", {
      md: forge.md.sha256.create(),
   });

   // Convert the encrypted data to Base64 for safe transport
   return forge.util.encode64(encryptedData);
};

const getPublicKey = async () => {
   await fetch(`${conf.GIN_URL}/publickey`)
      .then((res) => res.json())
      .then((data) => {
         const publicKey = data.publickey;
         rsaPublicKey = forge.pki.publicKeyFromPem(publicKey);
      })
      .catch((err) => {
         console.log(err);
      });
};

getPublicKey();
