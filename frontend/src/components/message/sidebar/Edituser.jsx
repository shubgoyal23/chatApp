import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout, login } from "../../../store/loginSlice";
import Avatar from "./Avatar";
import UpdateDetails from "./UpdateDetails";
import { Cloudinay_URL, avatar_public_ids } from "../../../constance/data";
import OtpBox from "./OtpBox";
import conf from "../../../constance/conf";

function Edituser({ edit, setEdit }) {
   const dispatch = useDispatch();
   const [avatar, setavatar] = useState(false);
   const [otpBox, setOtpBox] = useState(false);
   const [userDetails, setUserDetails] = useState({
      username: "",
      email: "",
      fullname: "",
      edit: false,
   });
   const user = useSelector((state) => state.login.userdata);

   function logoutHandler() {
      fetch(`${conf.API_URL}/users/logout`, {
         credentials: "include",
      })
         .then((res) => res.json())
         .then((data) => {
            dispatch(logout());
         })
         .catch((err) => console.log("error logging out", err));
   }

   function detailsUpdateSendOTPHandler() {
      fetch(`${conf.API_URL}/users/user-edit-otp`, {
         method: "POST",
         credentials: "include",
         headers: {
            "Content-Type": "application/json",
         },
         body: JSON.stringify({}),
      })
         .then((res) => res.json())
         .then((data) => {
            setOtpBox(true);
            setUserDetails((prev) => ({
               ...prev,
               edit: false,
            }));
         })
         .catch((err) => console.log(err));
   }

   function detailsUpdateHandler() {
      fetch(`${conf.API_URL}/users/user-edit`, {
         method: "POST",
         credentials: "include",
         headers: {
            "Content-Type": "application/json",
         },
         body: JSON.stringify(userDetails),
      })
         .then((res) => res.json())
         .then((data) => {
            dispatch(login(data.data));
            setUserDetails({
               username: "",
               email: "",
               fullname: "",
               edit: false,
            });
         })
         .catch((err) => console.log(err));
   }

   return (
      <div
         className={`${
            edit ? "block" : "hidden"
         } absolute top-0 z-20 left-0 w-full h-svh bg-white rounded-lg shadow-xl p-4 overflow-y-scroll`}
      >
         <div
            className="absolute top-3 right-3 cursor-pointer w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-200"
            onClick={() => {
               setEdit(false);
            }}
         >
            <span className="material-symbols-outlined text-gray-500">close</span>
         </div>

         <div
            className="size-28 relative mt-10 m-auto cursor-pointer"
            onClick={() => setavatar((prev) => !prev)}
         >
            <div className="rounded-full size-28 overflow-hidden ring-4 ring-indigo-100">
               <img
                  src={`${Cloudinay_URL}/${
                     user?.avatar || avatar_public_ids[0]
                  }`}
                  alt="avatar"
                  className="size-28 object-cover object-top rounded-full"
               />
            </div>
            <div className="absolute bottom-1 right-1 text-white bg-indigo-500 p-1.5 rounded-full size-8 cursor-pointer flex items-center justify-center shadow-md">
               <span className="material-symbols-outlined text-lg">photo_camera</span>
            </div>
         </div>

         <div className="relative mt-12">
            <div>
               <UpdateDetails
                  name={user?.fullname}
                  logo={"person"}
                  label={"FullName"}
                  setUserDetails={setUserDetails}
               />
               <UpdateDetails
                  name={user?.username}
                  logo={"admin_panel_settings"}
                  label={"UserName"}
                  setUserDetails={setUserDetails}
               />
               <UpdateDetails
                  name={user?.email}
                  logo={"alternate_email"}
                  label={"Email"}
                  setUserDetails={setUserDetails}
               />
               <div className="flex justify-center items-center mt-4">
                  {userDetails.edit ? (
                     <button
                        onClick={detailsUpdateSendOTPHandler}
                        className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm"
                     >
                        Send OTP to Save Details
                     </button>
                  ) : (
                     ""
                  )}
               </div>
               <div className="flex justify-center items-center font-bold">
                  {otpBox ? (
                     <OtpBox
                        details={userDetails}
                        setUserDetails={setUserDetails}
                        setOtpBox={setOtpBox}
                     />
                  ) : (
                     ""
                  )}
               </div>
            </div>
         </div>

         <div className="absolute bottom-6 left-1/2 -translate-x-[50%] text-center">
            <button
               className="px-6 py-2 border-2 border-red-200 text-red-500 rounded-lg text-sm font-semibold hover:bg-red-50 hover:border-red-400 transition-all duration-200"
               onClick={logoutHandler}
            >
               Logout
            </button>
         </div>

         <Avatar avatar={avatar} setavatar={setavatar} />
      </div>
   );
}

export default Edituser;
