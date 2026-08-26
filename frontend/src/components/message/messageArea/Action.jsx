import React from "react";
import { useDispatch } from "react-redux";
import { setReplyto } from "../../../store/chatSlice";

function Action({ data }) {
   const dispatch = useDispatch();
   const setReplyTo = () => {
      dispatch(setReplyto(data));
   };
   return (
      <div className="absolute top-6 right-0 bg-white shadow-lg shadow-black/10 rounded-lg z-10 border border-gray-100 overflow-hidden min-w-[100px]">
         <button
            onClick={setReplyTo}
            className="w-full px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 text-left transition-colors duration-150 flex items-center gap-2"
         >
            <span className="material-symbols-outlined text-base">reply</span>
            Reply
         </button>
      </div>
   );
}

export default Action;
