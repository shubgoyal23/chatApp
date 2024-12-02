import { v4 as uuid } from "uuid";
import conf from "../constance/conf";
import { decryptDataAES, GetkeyAes } from "./AEShelper";
import { connectWebSocket } from "../socket";
import { encryptWithPublicKey } from "./RSAhelper";

export const connectSocket = async (data) => {
   try {
      const userdata = {
         _id: data._id,
         username: data.username,
         fullName: data.fullname,
         email: data.email,
      };
      await getSecretKey(userdata);
      let jdata = JSON.stringify(userdata);
      let eData2 = await encryptWithPublicKey(jdata);
      connectWebSocket(eData2);
   } catch (error) {
      console.log(error)
   }
};

export const getSecretKey = async (userdata) => {
   const tempkey = uuid();
   userdata.key = tempkey;
   let jdata = JSON.stringify(userdata);
   let eData = await encryptWithPublicKey(jdata);
   let sKey;
   await fetch(`${conf.GIN_URL}/user/key`, {
      headers: {
         "Content-Type": "application/json",
         Authorization: eData,
      },
      credentials: "include",
   })
      .then((res) => res.json())
      .then((data) => {
         sKey = data.sk;
      })
      .catch((err) => console.log(err));

   let skeyNew = await decryptDataAES(sKey, userdata);
   let skeyNewjson = await JSON.parse(skeyNew);
   userdata.key = skeyNewjson.key;
   GetkeyAes(userdata);
};
