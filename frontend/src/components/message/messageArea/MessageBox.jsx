import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import IndividualMsg from "./IndividualMsg";
import { EmptyMessages } from "../../../store/chatSlice";
import { GetMessageFromLS } from "../../../helper/MessageStorage";
import { convertDate } from "../../../helper/convertDate";
import { v4 as uuidv4 } from "uuid";
import conf from "../../../constance/conf";

function MessageBox() {
   const dispatch = useDispatch();

   const chatwith = useSelector((state) => state.chat.chattingwith);
   const messagesQue = useSelector((state) => state.chat.messagesQue);

   const [msgList, setMsgList] = useState([]);

   // Current page of already loaded messages
   const [page, setPage] = useState(1);

   // Prevent multiple requests while scrolling
   const [loading, setLoading] = useState(false);

   // Stop requesting once backend has no more messages
   const [hasMore, setHasMore] = useState(true);

   const scrollContainerRef = useRef(null);

   const setDateinData = (data) => {
      data = [...data].sort((a, b) => a.epoch - b.epoch);

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
            prevDate = date;
         }

         workingdata.push(data[i]);
      }

      return workingdata;
   };

   /*
    * Fetch older messages
    */
   const fetchOlderMessages = async () => {
      if (loading || !hasMore) return;

      const container = scrollContainerRef.current;

      if (!container) return;

      setLoading(true);

      // Save current scroll position
      const oldScrollHeight = container.scrollHeight;
      const oldScrollTop = container.scrollTop;

      try {
         const nextPage = page + 1;

         const response = await fetch(`${conf.API_URL}/message/all`, {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
               to: chatwith._id,
               page: nextPage,
               limit: 20,
            }),
         });

         if (!response.ok) {
            throw new Error("Failed to fetch messages");
         }

         const result = await response.json();

         const olderMessages = result.data || [];

         // No more messages
         if (olderMessages.length === 0) {
            setHasMore(false);
            return;
         }

         /*
          * Backend returns messages in ascending order.
          *
          * We prepend them because they are older than
          * the messages currently displayed.
          */
         setMsgList((prev) => {
            const existingMessages = prev.filter(
               (item) => item.type !== "datechange",
            );

            const newMessages = [...olderMessages, ...existingMessages];

            return setDateinData(newMessages);
         });

         setPage(nextPage);

         /*
          * Wait until React has rendered the new messages,
          * then restore the scroll position.
          */
         requestAnimationFrame(() => {
            const newScrollHeight = container.scrollHeight;

            container.scrollTop =
               oldScrollTop + (newScrollHeight - oldScrollHeight);
         });
      } catch (error) {
         console.error("Error fetching older messages:", error);
      } finally {
         setLoading(false);
      }
   };

   /*
    * Detect when user reaches the top.
    */
   const handleScroll = () => {
      const container = scrollContainerRef.current;

      if (!container || loading || !hasMore) return;

      // Small threshold so we don't require exactly 0
      if (container.scrollTop <= 80) {
         fetchOlderMessages();
      }
   };

   /*
    * Load messages from local storage when changing chat.
    */
   useEffect(() => {
      const f = async () => {
         setPage(1);
         setHasMore(true);

         let m = await GetMessageFromLS(chatwith._id);

         m = setDateinData(m);

         setMsgList(m);

         /*
          * Start at the bottom when opening a conversation.
          */
         requestAnimationFrame(() => {
            const container = scrollContainerRef.current;

            if (container) {
               container.scrollTop = container.scrollHeight;
            }
         });
      };

      f();
   }, [chatwith._id]);

   /*
    * Handle newly received messages.
    */
   useEffect(() => {
      const message = messagesQue[chatwith._id];

      if (message && message.length > 0) {
         dispatch(EmptyMessages(chatwith._id));

         setMsgList((prev) => {
            const existingMessages = prev.filter(
               (item) => item.type !== "datechange",
            );

            return setDateinData([...existingMessages, ...message]);
         });
      }
   }, [messagesQue, chatwith._id, dispatch]);

   /*
    * Scroll to bottom when a NEW message arrives.
    *
    * We don't want this when older messages are loaded.
    */
   useEffect(() => {
      const message = messagesQue[chatwith._id];

      if (message && message.length > 0) {
         requestAnimationFrame(() => {
            const container = scrollContainerRef.current;

            if (container) {
               container.scrollTop = container.scrollHeight;
            }
         });
      }
   }, [messagesQue, chatwith._id]);

   return (
      <div
         ref={scrollContainerRef}
         onScroll={handleScroll}
         className="h-full w-full overflow-y-auto p-0 m-0"
      >
         {loading && (
            <div className="text-center py-2 text-sm text-gray-500">
               Loading older messages...
            </div>
         )}

         {msgList.map((item) => (
            <IndividualMsg
               key={item._id || item.id}
               data={item}
               msglist={msgList}
            />
         ))}
      </div>
   );
}

export default MessageBox;
