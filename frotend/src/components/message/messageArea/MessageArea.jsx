import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { emoji } from "../../../constance/EmojiList";
import MessageBox from "./MessageBox";
import { Cloudinay_URL, avatar_public_ids } from "../../../constance/data";
import { sendMessage } from "../../../socket";
import { clearReplyto, setReplyto } from "../../../store/chatSlice";

function MessageArea({ sidNav, setSideNav, setShowChattingWithDetails }) {
   const chatwith = useSelector((state) => state.chat.chattingwith);
   const user = useSelector((state) => state.login.userdata);
   const replyTo = useSelector((state) => state.chat.replyto);
   const [message, setMessage] = useState("");
   const [showEmoji, setShowEmoji] = useState(false);
   const [showReplyBox, setShowReplyBox] = useState(false);
   const dispatch = useDispatch();

   useEffect(() => {
      dispatch(clearReplyto());
   }, [chatwith._id]);

   useEffect(() => {
      const set = replyTo ? true : false;
      setShowReplyBox(set);
   }, [replyTo]);

   const messageHandler = async (e) => {
      e.preventDefault();
      const details = {
         from: user._id,
         to: chatwith._id,
         message: message,
         type: "person",
         replyTo: replyTo?.id,
         media: "",
      };
      await sendMessage(details);
      dispatch(clearReplyto());
      setMessage("");
   };

   return (
      <div className={`flex-1 grow bg-yellow-50 border-gray-300 flex flex-col`}>
         <div className="lg:w-full w-screen px-4 py-2 flex justify-between bg-gray-100">
            <div
               className="flex items-center gap-4"
               onClick={() => setShowChattingWithDetails(true)}
            >
               <div className="size-10">
                  <img
                     src={`${Cloudinay_URL}/${
                        chatwith?.avatar || avatar_public_ids[0]
                     }`}
                     alt="avatar"
                     className="size-10 object-cover object-top rounded-full"
                  />
               </div>
               <div>
                  <h1 className="text-xl font-sans capitalize text-end cursor-pointer">
                     {chatwith?.fullname || "anonymous"}
                  </h1>
                  <span className="text-gray-900 text-xs">
                     {/* {userOnline.some((item) => item._id === chatwith._id)
                        ? "online"
                        : "offline"} */}
                  </span>
               </div>
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

         <div className="w-full flex-auto  p-0 m-0 overflow-y-scroll scroll-smooth">
            <MessageBox />
         </div>
         {showReplyBox ? (
            <div className="lg:w-full border-[10px] w-screen bg-gray-50 px-6 lg:px-16 py-2 border-gray-100 ">
               replying to
               <div>{replyTo?.message}</div>
            </div>
         ) : (
            ""
         )}

         <div className="lg:w-full w-screen px-1 lg:px-4 py-2 border-gray-500 ">
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
