import React, { useRef, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { login } from "../../../store/loginSlice";

function OtpBox({ numberOfDigits = 6, details, setUserDetails, setOtpBox }) {
   const [otp, setOtp] = useState(new Array(numberOfDigits).fill(""));
   const [otpError, setOtpError] = useState(null);
   const otpBoxReference = useRef([]);
   const dispatch = useDispatch();

   function handleChange(value, index) {
      let newArr = [...otp];
      newArr[index] = value;
      setOtp(newArr);

      if (value && index < numberOfDigits - 1) {
         otpBoxReference.current[index + 1].focus();
      }
   }
   function handleBackspaceAndEnter(e, index) {
      if (e.key === "Backspace" && !e.target.value && index > 0) {
         otpBoxReference.current[index - 1].focus();
      }
      if (e.key === "Enter" && e.target.value && index < numberOfDigits - 1) {
         otpBoxReference.current[index + 1].focus();
      }
   }

   const checkOtpValidation = (data) => {
      setOtpError(null);
      details.otp = data;
      details.otpFor = "updateDetails";

      fetch(`${conf.API_URL}/users/user-edit`, {
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
                  dispatch(login(data.data));
                  setOtpBox(false);
                  setUserDetails({
                     username: "",
                     email: "",
                     fullname: "",
                     edit: false,
                  });
               } else {
                  setOtpError(data?.message);
               }
            }
         })
         .catch((err) => {
            console.log(err);
            setOtpError(error?.message);
         });
   };

   useEffect(() => {
      if (otp.join("").length !== 6) {
         return;
      }
      checkOtpValidation(otp.join(""));
   }, [otp]);

   return (
      <section className="w-full text-center flex flex-col items-center justify-center">
         <div className="flex items-center justify-center w-full gap-2">
            {otp.map((digit, index) => (
               <input
                  key={index}
                  value={digit}
                  maxLength={1}
                  onChange={(e) => handleChange(e.target.value, index)}
                  onKeyUp={(e) => handleBackspaceAndEnter(e, index)}
                  ref={(reference) =>
                     (otpBoxReference.current[index] = reference)
                  }
                  className={`border w-12 flex justify-center items-center h-auto text-white p-3 rounded-md bg-black focus:border-2 focus:outline-hidden appearance-none`}
               />
            ))}
         </div>

         <p
            className={`text-lg text-red-500 mt-4 ${
               otpError ? "error-show" : ""
            }`}
         >
            {otpError}
         </p>
      </section>
   );
}

export default OtpBox;
