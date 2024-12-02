import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import IndividualMsg from "./IndividualMsg";
import { socket } from "../../../socket";
import { EmptyMessages, messageHandler } from "../../../store/chatSlice";
import { decryptDataAES } from "../../../helper/AEShelper";

function MessageBox() {
   const dispatch = useDispatch();
   const user = useSelector((state) => state.login.userdata);
   const chatwith = useSelector((state) => state.chat.chattingwith);
   const messagesQue = useSelector((state) => state.chat.messagesQue);
   const [msgList, setMsgList] = useState([]);
   const [message, setMessage] = useState([]);
   const scrollref = useRef();

   useEffect(() => {
      fetch("api/v1/message/all", {
         method: "POST",
         credentials: "include",
         headers: {
            "Content-Type": "application/json",
         },
         body: JSON.stringify({ to: chatwith._id }),
      })
         .then((res) => res.json())
         .then((data) => {
            setMsgList(data.data);
         })
         .catch((error) => {
            console.log(error);
         });
   }, [chatwith]);

   useEffect(() => {
      if (scrollref.current) {
         scrollref.current.scrollIntoView({ behavior: "smooth" });
      }
   }, [msgList]);

   useEffect(() => {
      setMsgList((prev) => [...prev, message]);
   }, [message, chatwith]);

   useEffect(() => {
      let list = []
      for (let i = 0; i < messagesQue[chatwith._id]?.length; i++) {
         let message = messagesQue[chatwith._id];
         if (message){
            dispatch(EmptyMessages(chatwith._id))
            list.push(...message)
         }
      }
      setMsgList((prev) => [...prev, ...list]);
   }, [messagesQue, chatwith]);

   return (
      <div className="h-full w-full p-0 m-0">
         {msgList.map((item) => (
            <IndividualMsg key={item._id} data={item} />
         ))}
         <span ref={scrollref}></span>
      </div>
   );
}

export default MessageBox;
