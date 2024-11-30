import React, { useState } from "react";

function UpdateDetails({ name, label, logo, setUserDetails }) {
   const [value, setValue] = useState();
   const [edit, setEdit] = useState(true);

   function editUserDetailsHandler() {
      setUserDetails((prev) => ({
         ...prev,
         edit: true,
         [label.toLowerCase()]: value,
      }));
      setEdit(true);
      setValue("");
   }

   return (
      <div className="flex items-center p-3 text-gray-900 font-bold mt-1 text-center">
         <div className="w-14 place-self-start text-gray-600">
            <span className="material-symbols-outlined">{logo}</span>
         </div>
         <div className="flex-1 text-start border-b-[1px] border-gray-300 pb-3">
            <h1 className="text-sm text-gray-600 font-normal leading-3	">
               {label || "label"}
            </h1>
            <div className="flex justify-between items-center">
               <div className="flex-1">
                  {edit ? (
                     <span className="text-sm">{name || label}</span>
                  ) : (
                     <div className="flex justify-center items-center h-8">
                        <input
                           className="w-4/5 h-8 text-sm outline-none border border-gray-700 font-normal bg-gray-300 z-10 rounded-lg px-1 bg-transparent"
                           value={value}
                           onChange={(e) => setValue(e.target.value)}
                           maxLength={50}
                        ></input>
                        <button
                           className="w-1/5 lex justify-center items-center text-lime-700"
                           onClick={editUserDetailsHandler}
                        >
                           <span className="material-symbols-outlined">
                              check
                           </span>
                        </button>
                     </div>
                  )}
               </div>
               <button
                  className="text-lime-800"
                  onClick={() => {
                     setEdit((prev) => !prev);
                     setValue(name?.toLowerCase());
                  }}
               >
                  <span className="material-symbols-outlined">
                     {edit ? "edit" : "close"}
                  </span>
               </button>
            </div>
         </div>
      </div>
   );
}

export default UpdateDetails;
