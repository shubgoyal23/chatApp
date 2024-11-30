import { v4 as uuid } from "uuid";
import conf from "../constance/conf";
import { decryptData } from "./AEShelper";
import { connectWebSocket } from "../socket";
import { encryptWithPublicKey } from "./RSAhelper";

export const connectSocket = async (data) => {
   let pk;
   await fetch(`${conf.GIN_URL}/publickey`)
      .then((res) => res.json())
      .then((data) => {
         pk = data.publickey;
      })
      .catch((err) => {
         console.log(err);
         return;
      });
   const tempkey = uuid();
   const userdata = {
      _id: data._id,
      username: data.username,
      key: tempkey,
      fullName: data.fullname,
      email: data.email,
   };
   let jdata = JSON.stringify(userdata);
   let eData = encryptWithPublicKey(jdata, pk);
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
         sKey = data;
      })
      .catch((err) => console.log(err));
   let skeyNew = await decryptData(
      `${userdata._id}${userdata.email}${userdata.username}${userdata.key}`,
      sKey.sk
   );
   skeyNew = await JSON.parse(skeyNew);
   // userdata.key = skeyNew.key;
   jdata = JSON.stringify(userdata);
   let eData2 = encryptWithPublicKey(jdata, pk);
   console.log(eData2);
   let url = `${conf.WS_URL}/ws?token=${eData2}`;
   let socket = connectWebSocket(url);
   console.log(socket);
   return socket;
};
