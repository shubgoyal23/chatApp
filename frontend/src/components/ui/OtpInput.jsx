import { useRef } from "react";

// Six single-digit boxes with paste support and keyboard navigation.
function OtpInput({ value, onChange, length = 6, disabled, error }) {
   const refs = useRef([]);
   const digits = Array.from({ length }, (_, i) => value[i] ?? "");

   const setAt = (index, chars) => {
      const next = digits.slice();
      let i = index;
      for (const ch of chars) {
         if (i >= length) break;
         next[i++] = ch;
      }
      onChange(next.join("").slice(0, length));
      refs.current[Math.min(i, length - 1)]?.focus();
   };

   return (
      <div className="grid grid-cols-6 gap-2 sm:gap-3 w-full max-w-[22rem] mx-auto">
         {digits.map((d, i) => (
            <input
               key={i}
               ref={(el) => (refs.current[i] = el)}
               value={d}
               disabled={disabled}
               inputMode="numeric"
               autoComplete={i === 0 ? "one-time-code" : "off"}
               aria-label={`Digit ${i + 1}`}
               maxLength={length}
               autoFocus={i === 0}
               onChange={(e) => {
                  const chars = e.target.value.replace(/\D/g, "");
                  if (!chars) {
                     const next = digits.slice();
                     next[i] = "";
                     onChange(next.join(""));
                     return;
                  }
                  setAt(i, chars.slice(d ? 1 : 0) || chars);
               }}
               onKeyDown={(e) => {
                  if (e.key === "Backspace" && !d && i > 0) refs.current[i - 1]?.focus();
                  if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
                  if (e.key === "ArrowRight" && i < length - 1) refs.current[i + 1]?.focus();
               }}
               onFocus={(e) => e.target.select()}
               className={`w-full min-w-0 aspect-square max-h-14 text-center text-lg sm:text-xl font-bold rounded-xl sm:rounded-2xl bg-surface-2 border-2 outline-none transition-all text-fg focus:bg-surface focus:ring-4 ${
                  error
                     ? "border-rose-400 focus:ring-rose-500/10"
                     : "border-transparent focus:border-indigo-400 focus:ring-indigo-500/10"
               }`}
            />
         ))}
      </div>
   );
}

export default OtpInput;
