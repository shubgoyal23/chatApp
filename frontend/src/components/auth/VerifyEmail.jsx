import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { login } from "../../store/loginSlice";
import { api } from "../../lib/api";
import { toast } from "../../lib/toast";
import OtpInput from "../ui/OtpInput";
import Button from "../ui/Button";
import Icon from "../ui/Icon";

function VerifyEmail({ account, onBack }) {
   const dispatch = useDispatch();
   const [otp, setOtp] = useState("");
   const [error, setError] = useState("");
   const [loading, setLoading] = useState(false);
   const [cooldown, setCooldown] = useState(30);

   useEffect(() => {
      if (cooldown <= 0) return;
      const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(t);
   }, [cooldown]);

   const verify = async (code) => {
      setError("");
      setLoading(true);
      try {
         const data = await api("/users/verify-email", {
            auth: false,
            body: { username: account?.username, email: account?.email, otp: code },
         });
         toast.success("Email verified — welcome to Chatzz!");
         dispatch(login(data.user));
      } catch (err) {
         setError(err.message);
         setOtp("");
      } finally {
         setLoading(false);
      }
   };

   const resend = async () => {
      try {
         await api("/users/resend-verification", {
            auth: false,
            body: { username: account?.username, email: account?.email },
         });
         toast.success("A new code is on its way.");
         setCooldown(30);
      } catch (err) {
         toast.error(err.message);
      }
   };

   return (
      <div className="text-center">
         <div className="mx-auto size-16 rounded-3xl brand-gradient flex items-center justify-center text-white shadow-xl shadow-indigo-500/30">
            <Icon name="mark_email_unread" fill size={30} />
         </div>
         <h2 className="mt-6 text-3xl font-bold tracking-tight text-fg">Check your inbox</h2>
         <p className="mt-2 text-muted">
            We sent a 6-digit code to <span className="font-semibold text-fg">{account?.email}</span>
         </p>

         <form
            className="mt-8"
            onSubmit={(e) => {
               e.preventDefault();
               if (otp.length === 6) verify(otp);
            }}
         >
            <OtpInput
               value={otp}
               error={error}
               disabled={loading}
               onChange={(v) => {
                  setOtp(v);
                  if (v.length === 6) verify(v);
               }}
            />
            {error && <p className="mt-3 text-sm text-rose-500">{error}</p>}
            <Button type="submit" loading={loading} disabled={otp.length !== 6} className="w-full h-12 mt-8">
               Verify email
            </Button>
         </form>

         <div className="mt-6 flex items-center justify-between text-sm">
            <button onClick={onBack} className="text-muted hover:text-fg inline-flex items-center gap-1">
               <Icon name="arrow_back" size={18} /> Back to sign in
            </button>
            <button
               onClick={resend}
               disabled={cooldown > 0}
               className="font-medium text-indigo-600 dark:text-indigo-400 disabled:text-subtle"
            >
               {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </button>
         </div>
      </div>
   );
}

export default VerifyEmail;
