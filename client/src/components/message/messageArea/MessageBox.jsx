import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import IndividualMsg from "./IndividualMsg";
import { socket } from "../../../socket";

function MessageBox({ chatwith }) {
   const user = useSelector((state) => state.login.userdata);
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
      socket.on("getMessage", (data) => {
         if (data.from === chatwith._id || data.from === user._id) {
            setMessage({ ...data, createdAt: Date.now() });
         }
      });

      return () => {
         socket.off("getMessage");
      };
   }, [chatwith, socket]);

   useEffect(() => {
      setMsgList((prev) => [...prev, message]);
   }, [message, chatwith]);

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
