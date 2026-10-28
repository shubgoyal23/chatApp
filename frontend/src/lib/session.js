import conf from "../constance/conf";
import { decryptDataAES, GetkeyAes } from "../helper/AEShelper";
import { encryptWithPublicKey } from "../helper/RSAhelper";
import { refreshSession } from "./api";

const userPayload = (user) => ({
   _id: user._id,
   username: user.username,
   fullName: user.fullname,
   email: user.email,
});

/**
 * Returns a function that obtains a fresh socket session key from the socket
 * server and builds the websocket auth token from it. It runs before every
 * (re)connect, so an expired key never locks the client out.
 */
export const createTokenProvider = (user) => async () => {
   const userdata = userPayload(user);
   const tempKey = crypto.randomUUID();
   const authorization = await encryptWithPublicKey(
      JSON.stringify({ ...userdata, key: tempKey })
   );

   const request = () =>
      fetch(`${conf.GIN_URL}/user/key`, {
         headers: { Authorization: authorization },
         credentials: "include",
      });

   let res = await request();
   if (res.status === 401) {
      if (!(await refreshSession())) {
         const err = new Error("Session expired");
         err.status = 401;
         throw err;
      }
      res = await request();
   }
   if (!res.ok) throw new Error(`Key request failed (${res.status})`);

   const { sk } = await res.json();
   const { key } = JSON.parse(await decryptDataAES(sk, { ...userdata, key: tempKey }));
   await GetkeyAes({ ...userdata, key });
   return encryptWithPublicKey(JSON.stringify({ ...userdata, key }));
};
