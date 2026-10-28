import { useState } from "react";
import { api } from "../../lib/api";
import { toast } from "../../lib/toast";
import Input from "../ui/Input";
import Button from "../ui/Button";
import OtpInput from "../ui/OtpInput";
import Icon from "../ui/Icon";
import PasswordChecklist from "./PasswordChecklist";
import { passwordValid } from "./passwordRules";

const STEPS = {
   request: { icon: "key", title: "Reset your password", text: "Enter your username or email and we'll send you a code." },
   code: { icon: "pin", title: "Enter the code", text: "Check your email for the 6-digit reset code." },
   password: { icon: "lock_reset", title: "Choose a new password", text: "Make it strong and unique." },
};

function ForgotPassword({ onDone }) {
   const [step, setStep] = useState("request");
   const [identifier, setIdentifier] = useState("");
   const [otp, setOtp] = useState("");
   const [password, setPassword] = useState("");
   const [confirm, setConfirm] = useState("");
   const [error, setError] = useState("");
   const [loading, setLoading] = useState(false);

   const who = { username: identifier.trim(), email: identifier.trim() };

   const run = async (fn) => {
      setError("");
      setLoading(true);
      try {
         await fn();
      } catch (err) {
         setError(err.message);
      } finally {
         setLoading(false);
      }
   };

   const request = (e) => {
      e.preventDefault();
      run(async () => {
         await api("/users/forgot-password", { auth: false, body: who });
         setStep("code");
      });
   };

   const checkCode = (code) =>
      run(async () => {
         try {
            await api("/users/check-otp", { auth: false, body: { ...who, otp: code, otpFor: "forgetPassword" } });
            setStep("password");
         } catch (err) {
            setOtp("");
            throw err;
         }
      });

   const reset = (e) => {
      e.preventDefault();
      if (!passwordValid(password)) return setError("Password doesn't meet the requirements");
      if (password !== confirm) return setError("Passwords don't match");
      run(async () => {
         await api("/users/reset-password", { auth: false, body: { ...who, otp, password } });
         toast.success("Password updated. Sign in with your new password.");
         onDone();
      });
   };

   const s = STEPS[step];
   return (
      <div>
         <button onClick={onDone} className="mb-6 text-sm text-muted hover:text-fg inline-flex items-center gap-1">
            <Icon name="arrow_back" size={18} /> Back to sign in
         </button>
         <div className="size-14 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Icon name={s.icon} fill size={28} />
         </div>
         <h2 className="mt-5 text-3xl font-bold tracking-tight text-fg">{s.title}</h2>
         <p className="mt-1.5 text-muted">{s.text}</p>

         {error && (
            <div role="alert" className="mt-5 px-4 py-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm">
               {error}
            </div>
         )}

         {step === "request" && (
            <form onSubmit={request} className="mt-6 space-y-5">
               <Input label="Username or email" icon="person" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required autoFocus />
               <Button type="submit" loading={loading} className="w-full h-12">Send reset code</Button>
            </form>
         )}

         {step === "code" && (
            <div className="mt-8 space-y-6">
               <OtpInput
                  value={otp}
                  disabled={loading}
                  error={error}
                  onChange={(v) => {
                     setOtp(v);
                     if (v.length === 6) checkCode(v);
                  }}
               />
               <Button loading={loading} disabled={otp.length !== 6} onClick={() => checkCode(otp)} className="w-full h-12">
                  Continue
               </Button>
            </div>
         )}

         {step === "password" && (
            <form onSubmit={reset} className="mt-6 space-y-4">
               <div>
                  <Input label="New password" icon="lock" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
                  <PasswordChecklist password={password} />
               </div>
               <Input label="Confirm new password" icon="lock_reset" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
               <Button type="submit" loading={loading} className="w-full h-12">Update password</Button>
            </form>
         )}
      </div>
   );
}

export default ForgotPassword;
