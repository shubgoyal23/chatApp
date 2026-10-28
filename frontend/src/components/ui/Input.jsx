import { useId, useState } from "react";
import Icon from "./Icon";

function Input({ label, icon, error, hint, type = "text", className = "", right, ...props }) {
   const id = useId();
   const [show, setShow] = useState(false);
   const isPassword = type === "password";

   return (
      <div className={className}>
         {label && (
            <label htmlFor={id} className="block mb-1.5 text-[13px] font-medium text-muted">
               {label}
            </label>
         )}
         <div
            className={`flex items-center gap-2 h-12 px-3.5 rounded-xl bg-surface-2 border transition-all duration-150 focus-within:bg-surface focus-within:ring-4 ${
               error
                  ? "border-rose-400 focus-within:ring-rose-500/10"
                  : "border-transparent focus-within:border-indigo-400 focus-within:ring-indigo-500/10"
            }`}
         >
            {icon && <Icon name={icon} className="text-subtle" size={20} />}
            <input
               id={id}
               type={isPassword && show ? "text" : type}
               aria-invalid={Boolean(error)}
               className="flex-1 min-w-0 h-full bg-transparent outline-none text-[15px] text-fg placeholder:text-subtle"
               {...props}
            />
            {isPassword && (
               <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="text-subtle hover:text-fg"
                  aria-label={show ? "Hide password" : "Show password"}
               >
                  <Icon name={show ? "visibility_off" : "visibility"} size={20} />
               </button>
            )}
            {right}
         </div>
         {error ? (
            <p className="mt-1.5 text-xs text-rose-500">{error}</p>
         ) : (
            hint && <p className="mt-1.5 text-xs text-subtle">{hint}</p>
         )}
      </div>
   );
}

export default Input;
