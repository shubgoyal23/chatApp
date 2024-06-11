import React, { useState } from "react";
import { useForm } from "react-hook-form";
import OtpInputWithValidation from "./OtpCheck";

function ResetPassword({ details, closebtn }) {
   const [err, setErr] = useState(null);
   const [loading, setLoading] = useState(false);
   const [otpSuccess, setOtpSuccess] = useState(false);

   const {
      register,
      handleSubmit,
      formState: { errors },
   } = useForm();

   const onSubmit = (data) => {
      if (data.newPassword !== data.confirmPassword) {
         setErr("Password and confirm password does not match");
      }
      setErr(null);
      setLoading(true);
      details.password = data.newPassword;

      fetch("/api/v1/users/reset-password", {
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
                  closebtn(false);
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
      <div>
         {!otpSuccess ? (
            <OtpInputWithValidation
               details={details}
               setOtpSuccess={setOtpSuccess}
            />
         ) : (
            <>
               <h1 className="text-center text-2xl">Reset Password</h1>
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
                        htmlFor="newPassword"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                     >
                        New Password
                     </label>
                     <input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        className="mt-1 w-full border-b-2 h-10 px-2 rounded-md border-gray-200 bg-white text-sm text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 outline-none"
                        {...register("newPassword", {
                           required: "This field is required.",
                           pattern: {
                              value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                              message:
                                 "Password must contain uperCase LowerCase Number adn special Char",
                           },
                        })}
                     />
                     {errors?.newPassword && (
                        <span className="text-red-500 text-sm">
                           {errors?.newPassword?.message}
                        </span>
                     )}
                  </div>
                  <div className="">
                     <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                     >
                        Confirm New Password
                     </label>
                     <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        className="mt-1 w-full border-b-2 h-10 px-2 rounded-md border-gray-200 bg-white text-sm text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 outline-none"
                        {...register("confirmPassword", {
                           required: "This field is required.",
                           pattern: {
                              value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                              message:
                                 "Password must contain uperCase LowerCase Number adn special Char",
                           },
                        })}
                     />
                     {errors?.confirmPassword && (
                        <span className="text-red-500 text-sm">
                           {errors?.confirmPassword?.message}
                        </span>
                     )}
                  </div>

                  <div className=" sm:flex sm:items-center sm:gap-4 mt-3">
                     <button
                        className="inline-block shrink-0 rounded-md border border-blue-600 bg-blue-600 px-12 py-3 text-sm font-medium text-white transition hover:bg-transparent hover:text-blue-600 focus:outline-none focus:ring w-full active:text-blue-500 dark:hover:bg-blue-700 dark:hover:text-white"
                        disabled={loading}
                     >
                        {loading ? "Sending..." : "Submit"}
                     </button>
                  </div>
               </form>
            </>
         )}
      </div>
   );
}

export default ResetPassword;
