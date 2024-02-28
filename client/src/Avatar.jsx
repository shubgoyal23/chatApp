import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { login } from "./store/loginSlice";
import Upload from "./Upload";
function Avatar({ avatar, setavatar }) {
   const user = useSelector((state) => state.login.userdata);
   const dispatch = useDispatch();
   let avatarArray = [];
   for (let i = 1; i <= 15; i++) {
      avatarArray.push(`./avatar${i}.svg`);
   }

   function changeAvatar(imgUrl) {
      fetch("/api/v1/users/avatar", {
         method: "POST",
         credentials: "include",
         headers: {
            "Content-Type": "application/json",
         },
         body: JSON.stringify({ avatar: imgUrl }),
      })
         .then((data) => data.json())
         .then((res) => dispatch(login(res?.data)))
         .catch((err) => console.log(err));
   }
   return (
      <div
         className={`${
            avatar ? "block" : "hidden"
         } absolute top-0 z-30 left-0 w-full border-2 border-gray-100 h-screen bg-white rounded-lg shadow-lg p-3 overflow-y-scroll`}
      >
         <div className="absolute top-2 right-2 cursor-pointer" onClick={() => {
                        setavatar(false);
                     }}>
         <span className="material-symbols-outlined">close</span>
         </div>
         <h1 className="text-center text-xl font-semibold capitalize mt-6">chose Avatar from list</h1>
         <div className="flex flex-wrap h-auto py-6 w-full mt-2 justify-evenly items-between border-2 border-gray-300 border-dashed rounded-md flex-shrink-0">
            {avatarArray.map((item) => {
               return (
                  <div
                     key={item}
                     className={`${
                        user?.avatar === item ? "ring-4 ring-lime-600" : ""
                     } flex-none size-14 mx-1 border-2 border-gray-50 shadow-lg rounded-full overflow-hidden`}
                     onClick={() => {
                        setavatar((prev) => !prev);
                        changeAvatar(item);
                     }}
                  >
                     <img src={item} alt="avatar" className="w-full" />
                  </div>
               );
            })}
         </div>
         <h1 className="text-center text-xl font-semibold capitalize mt-6 mb-2">Or Upload your Photo</h1>
         <div>
            <Upload />
         </div>
      </div>
   );
}

export default Avatar;
