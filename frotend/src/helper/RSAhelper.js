import forge from "node-forge";

export const encryptWithPublicKey = (data, publicKey) => {
   // Convert the public key from PEM format
   const rsaPublicKey = forge.pki.publicKeyFromPem(publicKey);

   // Encrypt the data
   const encryptedData = rsaPublicKey.encrypt(data, "RSA-OAEP", {
      md: forge.md.sha256.create(),
   });

   // Convert the encrypted data to Base64 for safe transport
   return forge.util.encode64(encryptedData);
};
