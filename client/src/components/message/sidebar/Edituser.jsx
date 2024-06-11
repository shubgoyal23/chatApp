import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout, login } from "../../../store/loginSlice";
import Avatar from "./Avatar";
import UpdateDetails from "./UpdateDetails";
import { Cloudinay_URL, avatar_public_ids } from "../../../constance/data";
import OtpBox from "./OtpBox";

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
      fetch("/api/v1/users/logout", {
         credentials: "include",
      })
         .then((res) => res.json())
         .then((data) => {
            dispatch(logout());
         })
         .catch((err) => console.log("error logging out", err));
   }

   function detailsUpdateSendOTPHandler() {
      fetch("/api/v1/users/user-edit-otp", {
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
      fetch("/api/v1/users/user-edit", {
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
         } absolute top-0 z-20 left-0 w-full border-2 border-gray-100 h-screen bg-lime-100 rounded-lg shadow-lg p-3 overflow-y-scroll`}
      >
         <div
            className="absolute top-2 right-2 cursor-pointer"
            onClick={() => {
               setEdit(false);
            }}
         >
            <span className="material-symbols-outlined">close</span>
         </div>

         <div
            className="size-28 relative mt-10 m-auto cursor-pointer "
            onClick={() => setavatar((prev) => !prev)}
         >
            <div className="rounded-full size-28 overflow-hidden border-2 border-lime-500">
               <img
                  src={`${Cloudinay_URL}/${
                     user?.avatar || avatar_public_ids[0]
                  }`}
                  alt="avatar"
                  className="size-28 object-cover object-top rounded-full"
               />
            </div>
            <div className="absolute bottom-1 right-1 text-white bg-lime-600 p-1 rounded-full size-8 cursor-pointer">
               <span className="material-symbols-outlined">photo_camera</span>
            </div>
         </div>

         <div className="relative mt-16">
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
               <div className="flex justify-center items-center font-bold">
                  {userDetails.edit ? (
                     <button
                        onClick={detailsUpdateSendOTPHandler}
                        className="px-2 py-1 border border-gray-500 rounded-lg"
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

         <div className="absolute bottom-4 left-1/2 -translate-x-[50%] text-center m-auto w-36">
            <button
               className="text-center m-auto w-36 border-2 border-gray-400 border-dashed  text-black rounded-md h-8 font-bold hover:bg-white hover:border-red-600 hover:text-red-600"
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
