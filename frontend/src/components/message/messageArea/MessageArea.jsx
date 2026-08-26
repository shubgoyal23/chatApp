import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { emoji } from "../../../constance/EmojiList";
import MessageBox from "./MessageBox";
import { Cloudinay_URL, avatar_public_ids } from "../../../constance/data";
import { sendMessage } from "../../../socket";
import { clearReplyto } from "../../../store/chatSlice";
import ConnectCall from "../../videocall/callSetting";
import { Dropdown, Space } from "antd";
import EmojiBox from "./EmojiBox";

const items = [
   {
      key: "1",
      label: <ConnectCall />,
   },
];

function MessageArea({ sidNav, setSideNav, setShowChattingWithDetails }) {
   const chatwith = useSelector((state) => state.chat.chattingwith);
   const user = useSelector((state) => state.login.userdata);
   const replyTo = useSelector((state) => state.chat.replyto);
   const [message, setMessage] = useState("");
   const [showEmoji, setShowEmoji] = useState(false);
   const [showAttachment, setShowAttachment] = useState(false);
   const [showReplyBox, setShowReplyBox] = useState(false);
   const [userOnlne, setUserOnlne] = useState(false);
   const dispatch = useDispatch();
   const boxRef = useRef(null);

   const fileInputRef = useRef(null);

   const handleButtonClick = () => {
      fileInputRef.current.click(); // Programmatically click the hidden input
   };

   const handleFileChange = (event) => {
      const files = event.target.files;
      console.log("Selected files:", files);
      // You can now process the files
   };

   useEffect(() => {
      dispatch(clearReplyto());
      sendMessage({
         from: user._id,
         to: chatwith._id,
         type: "useronline",
         message: "useronline",
      });
   }, [chatwith._id]);

   useEffect(() => {
      if (chatwith.status === "online") {
         setUserOnlne(true);
      } else {
         setUserOnlne(false);
      }
   }, [chatwith.status]);

   useEffect(() => {
      const set = replyTo ? true : false;
      setShowReplyBox(set);
   }, [replyTo]);

   const messageHandler = async (e) => {
      e.preventDefault();
      if (!message.trim()) return;
      const details = {
         from: user._id,
         to: chatwith._id,
         message: message,
         type: chatwith.accountType ?? "user",
         replyTo: replyTo?._id,
         media: "",
      };
      await sendMessage(details);
      dispatch(clearReplyto());
      setMessage("");
   };

   useEffect(() => {
      const handleClickOutside = (event) => {
         if (boxRef.current && !boxRef.current.contains(event.target)) {
            setShowEmoji(false);
         }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
         document.removeEventListener("mousedown", handleClickOutside);
      };
   }, []);

   return (
      <div className={`w-full h-full flex flex-col bg-white`}>
         {/* Header */}
         <div className="lg:w-full w-full px-4 py-3 flex justify-between items-center bg-white border-b border-gray-200 shadow-sm">
            <div
               className="flex items-center gap-3 cursor-pointer group"
               onClick={() => setShowChattingWithDetails(true)}
            >
               <div className="size-10 relative">
                  <img
                     src={`${Cloudinay_URL}/${
                        chatwith?.avatar || avatar_public_ids[0]
                     }`}
                     alt="avatar"
                     className="size-10 object-cover object-top rounded-full ring-2 ring-indigo-100 group-hover:ring-indigo-300 transition-all duration-200"
                  />
                  {userOnlne && chatwith.accountType !== "group" && (
                     <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full"></span>
                  )}
               </div>
               <div>
                  <h1 className="text-base font-semibold capitalize text-gray-900 group-hover:text-indigo-600 transition-colors duration-200">
                     {chatwith?.fullname || "anonymous"}
                  </h1>
                  {chatwith.accountType !== "group" ? (
                     <span className={`text-xs font-medium ${userOnlne ? 'text-emerald-500' : 'text-gray-400'}`}>
                        {userOnlne ? "online" : "offline"}
                     </span>
                  ) : null}
               </div>
            </div>

            <div className="flex items-center gap-2">
               <Dropdown
                  menu={{
                     items,
                  }}
               >
                  <Space>
                     <span className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer transition-colors duration-200">
                        <span className="material-symbols-outlined text-gray-600">
                           more_vert
                        </span>
                     </span>
                  </Space>
               </Dropdown>
               <button
                  className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => setSideNav((prev) => !prev)}
               >
                  <span className="material-symbols-outlined text-gray-600">
                     {sidNav ? "close" : "menu"}
                  </span>
               </button>
            </div>
         </div>

         {/* Messages */}
         <div className="w-full flex-auto p-0 m-0 overflow-y-scroll scroll-smooth bg-slate-50">
            <MessageBox />
         </div>

         {/* Input area */}
         <div className="lg:w-full w-full border-t border-gray-100 flex flex-col bg-white">
            {showReplyBox ? (
               <div className="w-full px-3 lg:px-4 pt-2">
                  <div className="flex h-14 justify-between items-center px-3 lg:px-4 py-2 rounded-xl bg-indigo-50 border-l-4 border-indigo-400">
                     <span className="text-xs font-semibold text-indigo-600 mr-2 shrink-0">Reply</span>
                     <span className="line-clamp-1 grow text-sm text-gray-700 px-2">
                        {replyTo?.message}
                     </span>
                     <span
                        className="material-symbols-outlined text-gray-400 hover:text-gray-600 cursor-pointer transition-colors text-xl"
                        onClick={() => {
                           setShowReplyBox(false);
                           dispatch(clearReplyto());
                        }}
                     >
                        close
                     </span>
                  </div>
               </div>
            ) : (
               ""
            )}
            <div className="w-full px-3 lg:px-4 pt-2 pb-3">
               <form
                  className="flex justify-between items-center px-3 lg:px-4 py-1 rounded-2xl bg-gray-50 border border-gray-200 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all duration-200"
                  onSubmit={messageHandler}
               >
                  {/* EmojiList */}
                  <div className="relative">
                     <button
                        type="button"
                        className="flex relative justify-center items-center rounded-full w-9 h-9 hover:bg-gray-200/60 transition-colors duration-200"
                        onClick={() => setShowEmoji((prev) => !prev)}
                     >
                        <span className="material-symbols-outlined text-gray-500 text-xl transition-all ease-in duration-300">
                           {showEmoji ? "close" : "sentiment_satisfied"}
                        </span>
                     </button>
                     <div
                        ref={boxRef}
                        className={`${
                           showEmoji ? "block" : "hidden"
                        } w-72 h-80 grid grid-cols-9 gap-1 overflow-x-hidden overflow-y-scroll border rounded-2xl border-gray-200 absolute -top-80 bg-white p-4 shadow-xl left-0 transition-all ease-in-out duration-500 pr-2`}
                     >
                        <EmojiBox
                           onchange={(emoji) =>
                              setMessage((prev) => prev + emoji)
                           }
                        />
                     </div>
                  </div>
                  {/* attachment */}
                  <button
                     type="button"
                     className="flex relative justify-center items-center rounded-full w-9 h-9 hover:bg-gray-200/60 transition-colors duration-200"
                     onClick={() => setShowAttachment((prev) => !prev)}
                  >
                     <span className="material-symbols-outlined text-gray-500 text-xl transition-all ease-in-out duration-500">
                        {showAttachment ? "close" : "add"}
                     </span>
                     <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: "none" }} // Hide the input element
                        onChange={handleFileChange}
                     />
                     <div
                        className={`${
                           showAttachment ? "block" : "hidden"
                        } w-56 border rounded-xl border-gray-200 absolute -top-24 bg-white p-3 shadow-xl left-0 transition-all ease-in-out duration-500`}
                     >
                        <div
                           className="flex gap-2 items-center w-full p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                           onClick={handleButtonClick}
                        >
                           <svg
                              height="18"
                              viewBox="0 0 16 20"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                           >
                              <path
                                 fillRule="evenodd"
                                 clipRule="evenodd"
                                 d="M2 0C0.9 0 0.01 0.9 0.01 2L0 18C0 19.1 0.89 20 1.99 20H14C15.1 20 16 19.1 16 18V6.83C16 6.3 15.79 5.79 15.41 5.42L10.58 0.59C10.21 0.21 9.7 0 9.17 0H2ZM9 6V1.5L14.5 7H10C9.45 7 9 6.55 9 6ZM4 10C3.44772 10 3 10.4477 3 11C3 11.5523 3.44772 12 4 12H12C12.5523 12 13 11.5523 13 11C13 10.4477 12.5523 10 12 10H4ZM10 15C10 14.4477 9.55228 14 9 14H4C3.44772 14 3 14.4477 3 15C3 15.5523 3.44772 16 4 16H9C9.55228 16 10 15.5523 10 15Z"
                                 fill="#6366f1"
                              ></path>
                           </svg>
                           <span className="text-sm text-gray-700">Document</span>
                        </div>
                        <div
                           className="flex gap-2 items-center w-full p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                           onClick={handleButtonClick}
                        >
                           <svg
                              width="18"
                              height="18"
                              viewBox="0 0 20 20"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                           >
                              <path
                                 fillRule="evenodd"
                                 clipRule="evenodd"
                                 d="M20 14V2C20 0.9 19.1 0 18 0H6C4.9 0 4 0.9 4 2V14C4 15.1 4.9 16 6 16H18C19.1 16 20 15.1 20 14ZM9.4 10.53L11.03 12.71L13.61 9.49C13.81 9.24 14.19 9.24 14.39 9.49L17.35 13.19C17.61 13.52 17.38 14 16.96 14H7C6.59 14 6.35 13.53 6.6 13.2L8.6 10.53C8.8 10.27 9.2 10.27 9.4 10.53ZM0 18V5C0 4.45 0.45 4 1 4C1.55 4 2 4.45 2 5V17C2 17.55 2.45 18 3 18H15C15.55 18 16 18.45 16 19C16 19.55 15.55 20 15 20H2C0.9 20 0 19.1 0 18Z"
                                 fill="#8b5cf6"
                              ></path>
                           </svg>
                           <span className="text-sm text-gray-700">Images & Videos</span>
                        </div>
                     </div>
                  </button>
                  <input
                     type="text"
                     placeholder="Type a message"
                     className="w-full outline-hidden bg-transparent pl-3 h-11 text-sm text-gray-800 placeholder:text-gray-400"
                     value={message}
                     onChange={(e) => {
                        setMessage(e.target.value);
                     }}
                  />
                  {message && (
                     <button className="flex justify-center items-center w-9 h-9 rounded-full bg-indigo-500 hover:bg-indigo-600 transition-colors duration-200 shrink-0 ml-2">
                        <span className="material-symbols-outlined text-white text-lg">
                           send
                        </span>
                     </button>
                  )}
               </form>
            </div>
         </div>
      </div>
   );
}

export default MessageArea;
