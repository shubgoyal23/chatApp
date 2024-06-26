import React from "react";
import { useDispatch } from "react-redux";
import { setChat } from "../../../store/chatSlice";
import { Cloudinay_URL, avatar_public_ids } from "../../../constance/data";

function UserLabel({ data, setSideNav }) {
   const dispatch = useDispatch();
   return (
      <div
         className="flex justify-between items-center w-full h-20 px-4 hover:bg-gray-100 bg-white cursor-pointer"
         onClick={() => {
            dispatch(setChat(data));
            setSideNav((prev) => !prev);
         }}
      >
         <div className="size-14 rounded-full overflow-hidden mr-2">
            <img
               src={`${Cloudinay_URL}/${data?.avatar || avatar_public_ids[0]}`}
               alt="avatar"
               className="w-full"
            />
         </div>

         <div className="flex-1 h-full flex items-center justify-between gap-4 border-b-2 border-gray-200">
            <h1 className="text-xl font-sans capitalize">
               {data?.fullname || "anonymous"}
            </h1>

            <button
               className="flex justify-center items-center text-xl"
               onClick={() => dispatch(setChat(data))}
            >
               <span className="material-symbols-outlined ">chevron_right</span>
            </button>
         </div>
      </div>
   );
}

export default UserLabel;
