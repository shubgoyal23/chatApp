import React from "react";
import { useSelector } from "react-redux";
import { Cloudinay_URL, avatar_public_ids } from "../../../constance/data";

function SidebarRight({ sidNav, setSideNav }) {
   const user = useSelector((state) => state.chat.chattingwith);

   return (
      <div
         className={`${
            sidNav ? "right-0" : "-right-[1020px]"
         } absolute h-screen w-screen transition-all ease-in duration-300 z-10 bg-lime-50 lg:w-96 border-l-2 border-gray-300 flex flex-col`}
      >
         <div className="h-16 w-full bg-gray-100 px-5 flex justify-start items-center gap-6">
            <span
               className="material-symbols-outlined cursor-pointer"
               onClick={() => {
                  setSideNav(false);
               }}
            >
               close
            </span>
            <h1>Contact Info</h1>
         </div>

         <div className="size-52 relative mt-10 mb-0 m-auto cursor-pointer">
            <div className="rounded-full size-full w-full h-full overflow-hidden border-2 border-lime-500">
               <img
                  src={`${Cloudinay_URL}/${
                     user?.avatar || avatar_public_ids[0]
                  }`}
                  alt="avatar"
                  className="size-full w-full h-full object-cover object-top rounded-full"
               />
            </div>
         </div>

         <div className="mt-2 text-center">
            <h2 className="text-bold text-2xl">{user?.fullname}</h2>
            <h2 className="text-gray-600">@{user?.username}</h2>
         </div>
         <div className="mt-2 text-start border-y-8 py-4 px-6 border-gray-200">
            <h2 className="text-gray-600">about</h2>
            <h2 className="text-bold text-lg">
               {user?.about || "Hey there I am using Chatzz!"}
            </h2>
         </div>
      </div>
   );
}

export default SidebarRight;
