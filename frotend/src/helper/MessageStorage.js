import conf from "../constance/conf";
import { decryptDataAESLocal, encryptDataAESLocal } from "./AEShelper";

export const SetMessageToLS = async (message, self) => {
   let jdata = JSON.stringify(message);
   const d = await encryptDataAESLocal(jdata);
   let key = self ? message.to : message.from;
   if (!self && message.type === "group") {
      key = message.to;
      let list = localStorage.getItem(key)
         ? JSON.parse(localStorage.getItem(key))
         : [];
      list.push(d);
      while (list.length > 50) {
         list.shift();
      }
      localStorage.setItem(key, JSON.stringify(list));
      return;
   }
   let list = localStorage.getItem(key)
      ? JSON.parse(localStorage.getItem(key))
      : [];
   list.push(d);
   while (list.length > 50) {
      list.shift();
   }
   localStorage.setItem(key, JSON.stringify(list));
};

export const GetMessageFromLS = async (key) => {
   let list = localStorage.getItem(key)
      ? await JSON.parse(localStorage.getItem(key))
      : [];

   let messageslist = [];
   if (list.length <= 0) {
      await fetch(`${conf.API_URL}/message/all`, {
         method: "POST",
         credentials: "include",
         headers: {
            "Content-Type": "application/json",
         },
         body: JSON.stringify({ to: key }),
      })
         .then((res) => res.json())
         .then((data) => {
            messageslist.push(...data.data);
            SetMessageToLSBulk(data.data, key);
         })
         .catch((error) => {
            console.log(error);
         });
   } else {
      for (let k of list) {
         let d = await decryptDataAESLocal(k);
         let jd = await JSON.parse(d);
         messageslist.push(jd);
      }
   }
   return messageslist;
};

export const SetMessageToLSBulk = async (messages, key) => {
   let list = [];
   for (let message of messages) {
      let jdata = JSON.stringify(message);
      const d = await encryptDataAESLocal(jdata);
      list.push(d);
   }
   localStorage.setItem(key, JSON.stringify(list));
};
