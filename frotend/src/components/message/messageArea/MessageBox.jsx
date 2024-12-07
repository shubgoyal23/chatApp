import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import IndividualMsg from "./IndividualMsg";
import { EmptyMessages } from "../../../store/chatSlice";
import { GetMessageFromLS } from "../../../helper/MessageStorage";
import { convertDate } from "../../../helper/convertDate";
import { v4 as uuidv4 } from 'uuid';
function MessageBox() {
   const dispatch = useDispatch();
   const chatwith = useSelector((state) => state.chat.chattingwith);
   const messagesQue = useSelector((state) => state.chat.messagesQue);
   const [msgList, setMsgList] = useState([]);
   const scrollref = useRef();

   const setDateinData = (data) => {
      data = data.sort((a, b) => a.epoch - b.epoch);
      let workingdata = [];
      let prevDate = "";
      for (let i = 0; i < data.length; i++) {
         const date = convertDate(data[i].epoch);
         if (prevDate !== date) {
            const datedata = {
               type: "datechange",
               date: date,
               id: uuidv4(),
            };
            workingdata.push(datedata);
            prevDate = date
         }
         workingdata.push(data[i]);
      }
      return workingdata;
   };

   useEffect(() => {
      if (scrollref.current) {
         scrollref.current.scrollIntoView({ behavior: "smooth" });
      }
   }, [msgList]);

   useEffect(() => {
      const f = async () => {
         let m = await GetMessageFromLS(chatwith._id);
         m = setDateinData(m);
         setMsgList(m);
      };
      f();
   }, [chatwith._id]);

   useEffect(() => {
      const message = messagesQue[chatwith._id];
      if (message && message.length > 0) {
         dispatch(EmptyMessages(chatwith._id)); // Clear the queue
         setMsgList((prev) => [...prev, ...message]); // Append new messages
      }
   }, [messagesQue, chatwith._id]);

   return (
      <div className="h-full w-full p-0 m-0">
         {msgList.map((item) => (
            <IndividualMsg key={item.id} data={item} />
         ))}
         <span ref={scrollref}></span>
      </div>
   );
}

export default MessageBox;
