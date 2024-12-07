import React, { useEffect, useRef, useState } from "react";
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
   const [showAttachment, setShowAttachment] = useState(false);
   const [showReplyBox, setShowReplyBox] = useState(false);
   const dispatch = useDispatch();

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
         type: chatwith.accountType ?? "user",
         replyTo: replyTo?.id,
         media: "",
      };
      await sendMessage(details);
      dispatch(clearReplyto());
      setMessage("");
   };

   return (
      <div
         className={`flex-1 grow bg-purple-50 bg-contained border-gray-300 flex flex-col`}
      >
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
         <div className="lg:w-full w-screen border-gray-500 rounded-md flex flex-col">
            {showReplyBox ? (
               <div className="w-full px-1 lg:px-4 pt-0">
                  <div className="flex h-16 justify-between items-center px-2 lg:px-4 py-[6px] rounded-lg bg-gray-100">
                     <span className="text-sm text-red-500">replying to :</span>
                     <span className="line-clamp-1 grow bg-black/10 h-full px-2 py-2 mx-2 rounded-md flex justify-start items-center">
                        {replyTo?.message}
                     </span>
                     <span
                        className="material-symbols-outlined transition-all ease-in-out duration-700 cursor-pointer"
                        onClick={() => setShowReplyBox(false)}
                     >
                        close
                     </span>
                  </div>
               </div>
            ) : (
               ""
            )}
            <div className="w-full px-1 lg:px-4 pt-0 pb-4">
               <form
                  className="flex justify-between items-center px-2 lg:px-4 py-[6px] rounded-lg bg-gray-100"
                  onSubmit={messageHandler}
               >
                  {/* EmojiList */}
                  <button
                     type="button"
                     className="flex relative justify-center items-center rounded-xl mx-2"
                     onClick={() => setShowEmoji((prev) => !prev)}
                  >
                     <span className="material-symbols-outlined transition-all ease-in duration-500">
                        {showEmoji ? "close" : "sentiment_satisfied"}
                     </span>
                     <div
                        className={`${
                           showEmoji ? "block" : "hidden"
                        } w-72 h-80 grid grid-cols-9 gap-1 overflow-x-hidden overflow-y-scroll border-2 rounded-xl border-slate-100 absolute -top-80 bg-white p-4 shadow-2xl shadow-gray-600 left-0 transition-all ease-in-out duration-500 pr-2`}
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
                  {/* attachment */}
                  <button
                     type="button"
                     className="flex relative justify-center items-center rounded-xl mx-2"
                     onClick={() => setShowAttachment((prev) => !prev)}
                  >
                     <span className="material-symbols-outlined transition-all ease-in-out duration-700">
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
                        } w-60 h-24 border-2 rounded-xl border-slate-100 absolute -top-24 bg-white p-4 shadow-2xl shadow-gray-600 left-0 transition-all ease-in-out duration-500`}
                     >
                        <div
                           className="flex gap-2 w-full mb-2 ml-2"
                           onClick={handleButtonClick}
                        >
                           <svg
                              height="20"
                              viewBox="0 0 16 20"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                           >
                              <path
                                 fill-rule="evenodd"
                                 clip-rule="evenodd"
                                 d="M2 0C0.9 0 0.01 0.9 0.01 2L0 18C0 19.1 0.89 20 1.99 20H14C15.1 20 16 19.1 16 18V6.83C16 6.3 15.79 5.79 15.41 5.42L10.58 0.59C10.21 0.21 9.7 0 9.17 0H2ZM9 6V1.5L14.5 7H10C9.45 7 9 6.55 9 6ZM4 10C3.44772 10 3 10.4477 3 11C3 11.5523 3.44772 12 4 12H12C12.5523 12 13 11.5523 13 11C13 10.4477 12.5523 10 12 10H4ZM10 15C10 14.4477 9.55228 14 9 14H4C3.44772 14 3 14.4477 3 15C3 15.5523 3.44772 16 4 16H9C9.55228 16 10 15.5523 10 15Z"
                                 fill="#7f66ff"
                              ></path>
                           </svg>
                           Document
                        </div>
                        <div
                           className="flex gap-2 w-full ml-2"
                           onClick={handleButtonClick}
                        >
                           <svg
                              width="20"
                              height="20"
                              viewBox="0 0 20 20"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                           >
                              <path
                                 fill-rule="evenodd"
                                 clip-rule="evenodd"
                                 d="M20 14V2C20 0.9 19.1 0 18 0H6C4.9 0 4 0.9 4 2V14C4 15.1 4.9 16 6 16H18C19.1 16 20 15.1 20 14ZM9.4 10.53L11.03 12.71L13.61 9.49C13.81 9.24 14.19 9.24 14.39 9.49L17.35 13.19C17.61 13.52 17.38 14 16.96 14H7C6.59 14 6.35 13.53 6.6 13.2L8.6 10.53C8.8 10.27 9.2 10.27 9.4 10.53ZM0 18V5C0 4.45 0.45 4 1 4C1.55 4 2 4.45 2 5V17C2 17.55 2.45 18 3 18H15C15.55 18 16 18.45 16 19C16 19.55 15.55 20 15 20H2C0.9 20 0 19.1 0 18Z"
                                 fill="#007bfc"
                              ></path>
                           </svg>
                           Images & Videos
                        </div>
                     </div>
                  </button>
                  <input
                     type="text"
                     placeholder="Type a message"
                     className="w-full outline-none bg-white pl-4 h-12 rounded-md"
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
      </div>
   );
}

export default MessageArea;
