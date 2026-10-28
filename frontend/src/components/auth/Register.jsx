import { useState } from "react";
import { api } from "../../lib/api";
import Input from "../ui/Input";
import Button from "../ui/Button";
import PasswordChecklist from "./PasswordChecklist";
import { passwordValid } from "./passwordRules";

const USERNAME = /^[a-zA-Z0-9_.]{3,16}$/;

function Register({ onRegistered }) {
   const [form, setForm] = useState({ fullname: "", username: "", email: "", password: "", confirm: "" });
   const [error, setError] = useState("");
   const [touched, setTouched] = useState(false);
   const [loading, setLoading] = useState(false);

   const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

   const errors = {
      username: form.username && !USERNAME.test(form.username) ? "3–16 letters, numbers, '.' or '_'" : "",
      confirm: form.confirm && form.confirm !== form.password ? "Passwords don't match" : "",
   };

   const onSubmit = async (e) => {
      e.preventDefault();
      setTouched(true);
      setError("");
      if (errors.username || errors.confirm || !passwordValid(form.password)) return;
      setLoading(true);
      try {
         const data = await api("/users/register", {
            auth: false,
            body: {
               fullname: form.fullname.trim(),
               username: form.username.trim(),
               email: form.email.trim(),
               password: form.password,
            },
         });
         onRegistered(data);
      } catch (err) {
         setError(err.message);
      } finally {
         setLoading(false);
      }
   };

   return (
      <form onSubmit={onSubmit} className="space-y-4">
         <div className="mb-2">
            <h2 className="text-3xl font-bold tracking-tight text-fg">Create your account</h2>
            <p className="mt-1.5 text-muted">It only takes a minute.</p>
         </div>

         {error && (
            <div role="alert" className="px-4 py-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm">
               {error}
            </div>
         )}

         <Input label="Full name" icon="badge" autoComplete="name" value={form.fullname} onChange={set("fullname")} maxLength={50} required autoFocus />
         <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Username" icon="alternate_email" autoComplete="username" value={form.username} onChange={set("username")} error={errors.username} maxLength={16} required />
            <Input label="Email" icon="mail" type="email" autoComplete="email" value={form.email} onChange={set("email")} maxLength={100} required />
         </div>
         <div>
            <Input
               label="Password"
               icon="lock"
               type="password"
               autoComplete="new-password"
               value={form.password}
               onChange={set("password")}
               error={touched && !passwordValid(form.password) ? "Password doesn't meet the requirements" : ""}
               maxLength={128}
               required
            />
            <PasswordChecklist password={form.password} />
         </div>
         <Input label="Confirm password" icon="lock_reset" type="password" autoComplete="new-password" value={form.confirm} onChange={set("confirm")} error={errors.confirm} required />

         <Button type="submit" loading={loading} className="w-full h-12 text-[15px] !mt-6">
            Create account
         </Button>
         <p className="text-xs text-center text-subtle">
            By creating an account you agree to our terms and privacy policy.
         </p>
      </form>
   );
}

export default Register;
