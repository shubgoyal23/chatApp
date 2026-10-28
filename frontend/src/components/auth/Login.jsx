import { useState } from "react";
import { useDispatch } from "react-redux";
import { login } from "../../store/loginSlice";
import { api } from "../../lib/api";
import Input from "../ui/Input";
import Button from "../ui/Button";
import Avatar from "../ui/Avatar";

function Login({ onForgot, onNeedVerification, testAccounts }) {
   const dispatch = useDispatch();
   const [form, setForm] = useState({ identifier: "", password: "" });
   const [error, setError] = useState("");
   const [loading, setLoading] = useState(false);

   const onSubmit = async (e) => {
      e.preventDefault();
      setError("");
      setLoading(true);
      try {
         const data = await api("/users/login", {
            auth: false,
            body: {
               username: form.identifier.trim(),
               email: form.identifier.trim(),
               password: form.password,
            },
         });
         dispatch(login(data.user));
      } catch (err) {
         const pending = err.errors?.[0];
         if (err.status === 403 && pending?.needsVerification) {
            onNeedVerification(pending);
            return;
         }
         setError(err.message);
      } finally {
         setLoading(false);
      }
   };

   return (
      <form onSubmit={onSubmit} className="space-y-5">
         <div>
            <h2 className="text-3xl font-bold tracking-tight text-fg">Welcome back</h2>
            <p className="mt-1.5 text-muted">Sign in to continue your conversations.</p>
         </div>

         {error && (
            <div role="alert" className="px-4 py-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm">
               {error}
            </div>
         )}

         <Input
            label="Username or email"
            icon="person"
            autoComplete="username"
            value={form.identifier}
            onChange={(e) => setForm({ ...form, identifier: e.target.value })}
            required
            autoFocus
         />
         <div>
            <Input
               label="Password"
               icon="lock"
               type="password"
               autoComplete="current-password"
               value={form.password}
               onChange={(e) => setForm({ ...form, password: e.target.value })}
               required
            />
            <div className="flex justify-end mt-2">
               <button type="button" onClick={onForgot} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                  Forgot password?
               </button>
            </div>
         </div>

         <Button type="submit" loading={loading} className="w-full h-12 text-[15px]">
            Sign in
         </Button>

         {testAccounts && (
            <div className="pt-2">
               <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-subtle">Test accounts</p>
               <div className="flex flex-wrap gap-2">
                  {testAccounts.users.map((u) => (
                     <button
                        key={u._id}
                        type="button"
                        onClick={() => {
                           setError("");
                           setForm({ identifier: u.username, password: testAccounts.password });
                        }}
                        title={`Fill in ${u.username}`}
                        className={`inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border text-sm font-medium transition-colors ${
                           form.identifier === u.username
                              ? "border-indigo-400 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"
                              : "border-line bg-surface text-fg hover:border-indigo-300"
                        }`}
                     >
                        <Avatar user={u} size="xs" />
                        {u.username}
                     </button>
                  ))}
               </div>
            </div>
         )}
      </form>
   );
}

export default Login;
