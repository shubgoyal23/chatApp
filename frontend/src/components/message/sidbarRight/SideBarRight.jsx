import React from "react";
import { useSelector } from "react-redux";
import { Cloudinay_URL, avatar_public_ids } from "../../../constance/data";

function SidebarRight({ sidNav, setSideNav }) {
   const user = useSelector((state) => state.chat.chattingwith);

   return (
      <div
         className={`${
            sidNav ? "right-0" : "-right-full"
         } absolute h-svh w-screen transition-all ease-out duration-300 z-10 bg-white lg:w-96 border-l border-gray-200 flex flex-col`}
      >
         {/* Header */}
         <div className="h-14 w-full bg-white border-b border-gray-100 px-5 flex justify-start items-center gap-4">
            <span
               className="material-symbols-outlined cursor-pointer text-gray-500 hover:text-gray-700 w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-all duration-200"
               onClick={() => {
                  setSideNav(false);
               }}
            >
               close
            </span>
            <h1 className="font-semibold text-gray-800">Contact Info</h1>
         </div>

         {/* Avatar */}
         <div className="flex flex-col items-center mt-8 mb-4">
            <div className="size-40 rounded-full overflow-hidden ring-4 ring-indigo-100 shadow-lg shadow-indigo-500/10">
               <img
                  src={`${Cloudinay_URL}/${
                     user?.avatar || avatar_public_ids[0]
                  }`}
                  alt="avatar"
                  className="size-full w-full h-full object-cover object-top"
               />
            </div>

            <div className="mt-4 text-center">
               <h2 className="font-bold text-xl text-gray-800">{user?.fullname}</h2>
               <h2 className="text-gray-400 text-sm mt-0.5">@{user?.username}</h2>
            </div>
         </div>

         {/* About */}
         <div className="mt-2 text-start border-t-8 border-gray-50 py-4 px-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">About</h2>
            <h2 className="text-gray-700 text-[15px] leading-relaxed">
               {user?.about || "Hey there I am using Chatzz!"}
            </h2>
         </div>
      </div>
   );
}

export default SidebarRight;
