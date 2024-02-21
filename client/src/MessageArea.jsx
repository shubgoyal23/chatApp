import React, { useState } from "react";

function MessageArea() {
   const [search, setSearch] = useState("");

   return (
      <div className="flex-auto border-r-2 border-gray-300 flex flex-col">
         <div className="w-full px-4 py-2 flex justify-between bg-gray-100">
            <div className="rounded-full bg-yellow-200 h-10 w-10"></div>
            <div></div>
            <div className="flex justify-center items-center text-xl">
               <span className="material-symbols-outlined ">more_vert</span>
            </div>
         </div>
         <div className="w-full flex-auto border-gray-200 bg-yellow-50 border-b-2 overflow-y-scroll scroll-smooth">
            <div className="h-full w-full overflow-y-scroll"></div>
         </div>
         <div className="w-full px-4 py-2 border-gray-200 border-b-2">
            <form
               className="h-10 w-full flex justify-center items-center px-4 rounded-lg bg-gray-100"
               onSubmit={(e) => {
                  e.preventDefault();
                  setSearch("");
               }}
            >
               <input
                  type="text"
                  placeholder="Search"
                  className="outline-none bg-transparent pl-4 w-[90%]"
                  value={search}
                  onChange={(e) => {
                     setSearch(e.target.value);
                  }}
               />
               <button className="flex justify-center items-center">
                  <span className="material-symbols-outlined">
                     {search ? "arrow_right_alt" : "search"}
                  </span>
               </button>
            </form>
         </div>
      </div>
   );
}

export default MessageArea;