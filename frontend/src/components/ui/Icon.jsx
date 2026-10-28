function Icon({ name, fill = false, className = "", size }) {
   return (
      <span
         aria-hidden="true"
         className={`icon ${fill ? "icon-fill" : ""} ${className}`}
         style={size ? { fontSize: size } : undefined}
      >
         {name}
      </span>
   );
}

export default Icon;
