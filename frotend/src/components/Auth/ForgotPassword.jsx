import React, { useState } from "react";
import { useForm } from "react-hook-form";
import ResetPassword from "./ResetPassword";
const details = {};

function ForgotPassword({ closebtn }) {
   const [err, setErr] = useState(null);
   const [loading, setLoading] = useState(false);
   const [resetpass, setResetPass] = useState(false);
   const {
      register,
      handleSubmit,
      formState: { errors },
   } = useForm();

   const onSubmit = (data) => {
      setErr(null);
      setLoading(true);
      details.username = data.username;
      details.email = data.username;
      details.otpFor = "forgetPassword";

      fetch("/api/v1/users/forgot-password", {
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
                  setResetPass(true);
               } else {
                  setErr(data);
               }
            }
         })
         .catch((error) => {
            setErr(error);
            console.log(error);
         })
         .finally(() => {
            setLoading(false);
         });
   };

   return (
      <div className="fixed top-0 left-0 w-screen h-screen bg-gray-200 flex flex-col justify-center items-center">
         <span
            className="material-symbols-outlined cursor-pointer absolute top-2 right-2"
            onClick={() => {
               closebtn(false);
            }}
         >
            close
         </span>

         {resetpass ? (
            <ResetPassword details={details} closebtn={closebtn} />
         ) : (
            <>
               Forgot your Password?
               <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="mt-8 w-full px-2 md:w-96"
               >
                  <div className="">
                     <p className="text-red-500 text-sm">
                        {err ? err.message : ""}
                     </p>
                  </div>
                  <div className="">
                     <label
                        htmlFor="LastName"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                     >
                        UserName or Email
                     </label>
                     <input
                        type="text"
                        id="LastName"
                        name="username"
                        placeholder="Email or User Name"
                        className="mt-1 w-full border-b-2 h-10 px-2 rounded-md border-gray-200 bg-white text-sm text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 outline-none"
                        {...register("username", { required: true })}
                     />
                     {errors?.username && (
                        <span className="text-red-500 text-sm">
                           This field is required.
                        </span>
                     )}
                  </div>

                  <div className=" sm:flex sm:items-center sm:gap-4 mt-3">
                     <button
                        className="inline-block shrink-0 rounded-md border border-blue-600 bg-blue-600 px-12 py-3 text-sm font-medium text-white transition hover:bg-transparent hover:text-blue-600 focus:outline-none focus:ring w-full active:text-blue-500 dark:hover:bg-blue-700 dark:hover:text-white"
                        disabled={loading}
                     >
                        {loading
                           ? "Sending Email..."
                           : "Send Password Reset Email"}
                     </button>
                  </div>
               </form>
            </>
         )}
      </div>
   );
}

export default ForgotPassword;
