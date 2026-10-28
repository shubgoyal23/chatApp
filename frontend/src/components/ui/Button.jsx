import Spinner from "./Spinner";
import Icon from "./Icon";

const VARIANTS = {
   primary:
      "brand-gradient text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:brightness-110",
   secondary: "bg-surface-2 text-fg hover:bg-surface-3 border border-line",
   ghost: "text-muted hover:text-fg hover:bg-surface-2",
   danger: "bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/15",
};

function Button({
   children,
   variant = "primary",
   loading = false,
   icon,
   className = "",
   disabled,
   type = "button",
   ...props
}) {
   return (
      <button
         type={type}
         disabled={disabled || loading}
         className={`inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 ${VARIANTS[variant]} ${className}`}
         {...props}
      >
         {loading ? <Spinner className="size-4" /> : icon && <Icon name={icon} size={20} />}
         {children}
      </button>
   );
}

export default Button;
