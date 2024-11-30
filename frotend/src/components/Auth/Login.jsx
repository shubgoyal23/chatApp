import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { login } from "../../store/loginSlice";
import ForgotPassword from "./ForgotPassword";
import { connectWebSocket } from "../../socket";
import { connectSocket } from "../../helper/ConnectSocket";

function Login() {
   const [err, setErr] = useState(null);
   const [showForgotPassword, setShowForgotPassword] = useState(false);
   const dispatch = useDispatch();
   const {
      register,
      handleSubmit,
      formState: { errors },
   } = useForm({
      defaultValues: {
         username: "testuser",
         password: "Testuser@123",
      },
   });

   const onSubmit = (data) => {
      setErr(null);
      let details = {
         username: data.username,
         email: data.username,
         password: data.password,
      };

      fetch("/api/v1/users/login", {
         method: "POST",
         credentials: "include",
         headers: {
            "Content-Type": "application/json",
         },
         body: JSON.stringify(details),
      })
         .then((res) => res.json())
         .then((data) => {
            if (data) {
               if (data.success) {
                  dispatch(login(data?.data?.user));
                  console.log(data?.data?.user)
                  connectSocket(data?.data?.user)
               } else {
                  setErr(data);
               }
            }
         })
         .catch((error) => {
            setErr(error);
            console.log(error);
         });
   };

   return (
      <>
         <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-8 grid grid-cols-6 gap-6"
         >
            <div className="col-span-6">
               <p className="text-red-500 text-sm">{err ? err.message : ""}</p>
            </div>
            <div className="col-span-6">
               <label
                  htmlFor="LastName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200"
               >
                  User Name or Email
               </label>
               <input
                  type="text"
                  id="LastName"
                  name="username"
                  className="mt-1 w-full border-b-2 rounded-md border-gray-200 bg-white text-sm text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 outline-none"
                  {...register("username", { required: true })}
               />
            </div>

            <div className="col-span-6">
               <label
                  htmlFor="Password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200"
               >
                  Password
               </label>
               <input
                  type="password"
                  id="Password"
                  name="password"
                  className="mt-1 w-full border-b-2 rounded-md border-gray-200 bg-white text-sm text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 outline-none"
                  {...register("password", { required: true })}
               />
            </div>

            <div className="col-span-6 sm:flex sm:items-center sm:gap-4">
               <button className="inline-block shrink-0 rounded-md border border-blue-600 bg-blue-600 px-12 py-3 text-sm font-medium text-white transition hover:bg-transparent hover:text-blue-600 focus:outline-none focus:ring active:text-blue-500 dark:hover:bg-blue-700 dark:hover:text-white">
                  Login
               </button>
            </div>
            <div
               className="col-span-6 text-center cursor-pointer"
               onClick={() => setShowForgotPassword(true)}
            >
               Forgot Password?
            </div>
         </form>
         {showForgotPassword && (
            <ForgotPassword closebtn={setShowForgotPassword} />
         )}
      </>
   );
}

export default Login;
