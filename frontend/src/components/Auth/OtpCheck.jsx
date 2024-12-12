import React, { useRef, useEffect, useState } from "react";
import conf from "../../constance/conf";

function OtpInputWithValidation({
   numberOfDigits = 6,
   details,
   setOtpSuccess,
}) {
   const [otp, setOtp] = useState(new Array(numberOfDigits).fill(""));
   const [otpError, setOtpError] = useState(null);
   const otpBoxReference = useRef([]);

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

      fetch(`${conf.API_URL}/users/check-otp`, {
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
                  setOtpSuccess(true);
               } else {
                  setOtpError(data?.message);
               }
            }
         })
         .catch((error) => {
            setOtpError(error?.message);
            console.log(error);
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
         <p className="text-2xl font-medium mt-12">
            Enter OTP Recieved on Email
         </p>

         <p className="text-base mt-6 mb-2 text-center">
            One Time Password (OTP)
         </p>

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
                  className={`border w-12 flex justify-center items-center h-auto text-white p-3 rounded-md bg-black focus:border-2 focus:outline-none appearance-none`}
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

export default OtpInputWithValidation;
