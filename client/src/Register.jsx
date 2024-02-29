import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { login } from "./store/loginSlice";

function Register() {
   const [err, setErr] = useState(null);
   const dispatch = useDispatch();
   const {
      register,
      handleSubmit,
      formState: { errors },
   } = useForm();

   const onSubmit = (data) => {
      setErr(null);

      if (data.password !== data.confirm_password) {
         setErr("Password and Confirm Password Should be same");
         return;
      }

      let details = {
         username: data.username,
         email: data.email,
         password: data.password,
         fullname: data.fullname,
      };

      fetch("/api/v1/users/register", {
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
                        dispatch(login(data?.data?.user));
                     }
                  })
            }
         })
         .catch((error) => {
            setErr(error);
            console.log(error);
         });
   };
   return (
      <form
         onSubmit={handleSubmit(onSubmit)}
         className="mt-8 grid grid-cols-6 gap-6"
      >
         <div className="col-span-6">
            <p className="text-red-500 text-sm">{err ? err.message : ""}</p>
         </div>
         <div className="col-span-6">
            <label
               htmlFor="FirstName"
               className="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
               Full Name
            </label>
            <input
               type="text"
               id="FirstName"
               name="fullname"
               className="mt-1 w-full rounded-md border-gray-200 bg-white text-sm text-gray-700 shadow-sm dark:border-gray-700 border-b-2 dark:bg-gray-800 dark:text-gray-200 outline-none"
               {...register("fullname", { required: true })}
            />
         </div>
         <div className="col-span-6">
            <label
               htmlFor="LastName"
               className="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
               Create User Name
            </label>
            <input
               type="text"
               id="LastName"
               name="username"
               className="mt-1 w-full rounded-md border-gray-200 border-b-2 bg-white text-sm text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 outline-none"
               {...register("username", { required: true })}
            />
         </div>
         <div className="col-span-6">
            <label
               htmlFor="Email"
               className="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
               Email
            </label>
            <input
               type="email"
               id="Email"
               name="email"
               className="mt-1 w-full rounded-md border-b-2 border-gray-200 bg-white text-sm text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 outline-none"
               {...register("email", { required: true })}
            />
         </div>
         <div className="col-span-6 sm:col-span-3">
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
         <div className="col-span-6 sm:col-span-3">
            <label
               htmlFor="PasswordConfirmation"
               className="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
               Password Confirmation
            </label>
            <input
               type="password"
               id="PasswordConfirmation"
               name="password_confirmation"
               className="mt-1 w-full rounded-md border-b-2 border-gray-200 bg-white text-sm text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 outline-none"
               {...register("confirm_password", { required: true })}
            />
         </div>

         <div className="col-span-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
               By creating an account, you agree to our terms and conditions and
               privacy policy.
            </p>
         </div>
         <div className="col-span-6 sm:flex sm:items-center sm:gap-4">
            <button
               className="inline-block shrink-0 rounded-md border border-blue-600 bg-blue-600 px-12 py-3 text-sm font-medium text-white transition hover:bg-transparent hover:text-blue-600 focus:outline-none focus:ring active:text-blue-500 dark:hover:bg-blue-700 dark:hover:text-white"
               type="submit"
            >
               Create an account
            </button>
         </div>
      </form>
   );
}

export default Register;
