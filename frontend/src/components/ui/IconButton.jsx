import Icon from "./Icon";

function IconButton({ icon, label, active = false, className = "", fill, size = 22, ...props }) {
   return (
      <button
         type="button"
         aria-label={label}
         title={label}
         className={`inline-flex items-center justify-center size-10 rounded-full transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 ${
            active
               ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
               : "text-muted hover:text-fg hover:bg-surface-2"
         } ${className}`}
         {...props}
      >
         <Icon name={icon} fill={fill ?? active} size={size} />
      </button>
   );
}

export default IconButton;
