import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { login } from "./store/loginSlice";

function UpdateDetails({ name, label, logo }) {
   const [value, setValue] = useState();
   const [edit, setEdit] = useState(true);
   const dispatch = useDispatch();
   
   function editUserDetailsHandler() {
      let details = { [label.toLowerCase()]: value };

      fetch("/api/v1/users/user-edit", {
         method: "POST",
         credentials: "include",
         headers: {
            "Content-Type": "application/json",
         },
         body: JSON.stringify(details),
      })
         .then((res) => res.json())
         .then((data) => {
            dispatch(login(data.data));
            setEdit(true);
            setValue("");
         })
         .catch((err) => console.log(err));
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
                     <span className="text-xl">{name || label}</span>
                  ) : (
                     <div className="flex justify-center items-center h-8">
                        <input
                           className="w-4/5 h-8 outline-none bg-transparent"
                           value={value}
                           onChange={(e) => setValue(e.target.value)}
                           maxLength={25}
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
                     setValue(name?.toLowerCase())                   
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
