import forge from "node-forge";

export function encryptAESKey(aesKey, publicKey) {
   const rsa = forge.pki.publicKeyFromPem(publicKey);
   const encryptedKey = rsa.encrypt(aesKey, "RSA-OAEP");
   return forge.util.encode64(encryptedKey);
}
export function DecryptAESData(encryptedDataBase64, publicKey) {
   const encryptedData = forge.util.decode64(encryptedDataBase64);
   const rsa = forge.pki.publicKeyFromPem(publicKey);
   const encryptedKey = rsa.encrypt(aesKey, "RSA-OAEP");
   return forge.util.encode64(encryptedKey);
}
