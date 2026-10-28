import { useState } from "react";
import { useDispatch } from "react-redux";
import { login } from "../../store/loginSlice";
import { api } from "../../lib/api";
import { toast } from "../../lib/toast";
import Avatar from "../ui/Avatar";
import Icon from "../ui/Icon";
import Spinner from "../ui/Spinner";

// One-click sign-in as one of the shared test accounts.
function TestUsers({ users }) {
   const dispatch = useDispatch();
   const [busy, setBusy] = useState(null);

   const signIn = async (username) => {
      setBusy(username);
      try {
         const data = await api("/users/test-login", { auth: false, body: { username } });
         dispatch(login(data.user));
      } catch (err) {
         toast.error(err.message);
         setBusy(null);
      }
   };

   return (
      <div>
         <h2 className="text-3xl font-bold tracking-tight text-fg">Try it out</h2>
         <p className="mt-1.5 text-muted">
            Sign in instantly as a test user. Open another browser or a private window as a different user to chat or call between them.
         </p>

         <div className="mt-6 space-y-3">
            {users.map((u) => (
               <button
                  key={u._id}
                  onClick={() => signIn(u.username)}
                  disabled={Boolean(busy)}
                  className="group w-full flex items-center gap-4 p-3.5 rounded-2xl bg-surface border border-line hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/10 text-left transition-all disabled:opacity-60"
               >
                  <Avatar user={u} size="lg" />
                  <div className="flex-1 min-w-0">
                     <p className="font-semibold text-fg truncate">{u.fullname}</p>
                     <p className="text-sm text-subtle truncate">@{u.username}</p>
                  </div>
                  <span className="shrink-0 inline-flex items-center gap-1 h-9 px-3.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 text-sm font-semibold group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                     {busy === u.username ? <Spinner className="size-4" /> : <>Sign in <Icon name="arrow_forward" size={18} /></>}
                  </span>
               </button>
            ))}
         </div>

         <p className="mt-6 flex items-start gap-2 text-xs text-subtle">
            <Icon name="info" size={16} />
            Test accounts are shared with everyone and their profiles can&apos;t be edited. Don&apos;t send anything private.
         </p>
      </div>
   );
}

export default TestUsers;
