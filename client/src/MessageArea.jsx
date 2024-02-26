import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import MessageBox from "./MessageBox";
import { emoji } from "./EmojiList";

function MessageArea({ sidNav, setSideNav }) {
   const chatwith = useSelector((state) => state.chat.chattingwith);
   const [message, setMessage] = useState("");
   const [showEmoji, setShowEmoji] = useState(false);
   const messageHandler = (e) => {
      e.preventDefault();
      const details = { to: chatwith._id, message: message };
      fetch("api/v1/message/new", {
         method: "POST",
         credentials: "include",
         headers: {
            "Content-Type": "application/json",
         },
         body: JSON.stringify(details),
      }).catch((error) => {
         setErr(error);
         console.log(error);
      });

      setMessage("");
   };

   return (
      <div className={`flex-1 grow border-r-2 border-gray-300 flex flex-col`}>
         <div className="lg:w-full w-screen px-4 py-2 flex justify-between bg-gray-100">
            <div className="flex items-center gap-4">
               <div className="size-10">
                  <img src="./avatar2.svg" alt="avatar" className="w-full" />
               </div>
               <h1 className="text-xl font-sans capitalize">
                  {chatwith?.fullname || "anonymous"}
               </h1>
            </div>

            <div className=" hidden lg:flex justify-center items-center text-xl">
               <span className="material-symbols-outlined ">more_vert</span>
            </div>
            <button
               className=" lg:hidden"
               onClick={() => setSideNav((prev) => !prev)}
            >
               <span className="material-symbols-outlined">
                  {sidNav ? "close" : "menu"}
               </span>
            </button>
         </div>

         <div className="w-full flex-auto border-gray-200 bg-yellow-50 border-b-2 overflow-y-scroll scroll-smooth">
            <MessageBox chatwith={chatwith} />
         </div>

         <div className="lg:w-full w-screen px-1 lg:px-4 py-2 border-gray-200 border-b-2">
            <form
               className="h-10 flex justify-between items-center px-2 lg:px-4 rounded-lg bg-gray-100"
               onSubmit={messageHandler}
            >
               <button
                  type="button"
                  className="flex relative justify-center items-center"
                  onClick={() => setShowEmoji((prev) => !prev)}
               >
                  <span className="material-symbols-outlined transition-all ease-in duration-500">
                     {showEmoji ? "close" : "sentiment_satisfied"}
                  </span>
                  <div
                     className={`${
                        showEmoji ? "block" : "hidden"
                     } w-72 h-80 grid grid-cols-9 gap-1 overflow-x-hidden overflow-y-scroll border-2 rounded-sm border-slate-100 absolute -top-80 bg-white p-3 shadow-2xl left-0`}
                  >
                     {emoji.map((item) => (
                        <span
                           className=""
                           key={item}
                           onClick={() => setMessage((prev) => prev + item)}
                        >
                           {item}
                        </span>
                     ))}
                  </div>
               </button>
               <input
                  type="text"
                  placeholder="Search"
                  className="w-[90%] outline-none bg-transparent pl-4"
                  value={message}
                  onChange={(e) => {
                     setMessage(e.target.value);
                  }}
               />
               <button className="flex justify-center items-center">
                  <span className="material-symbols-outlined">
                     {message ? "arrow_right_alt" : ""}
                  </span>
               </button>
            </form>
         </div>
      </div>
   );
}

export default MessageArea;
