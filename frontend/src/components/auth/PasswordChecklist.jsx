import { PASSWORD_RULES } from "./passwordRules";
import Icon from "../ui/Icon";

function PasswordChecklist({ password }) {
   return (
      <ul className="flex flex-wrap gap-1.5 mt-2">
         {PASSWORD_RULES.map((r) => {
            const ok = r.test(password);
            return (
               <li
                  key={r.label}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                     ok ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-surface-2 text-subtle"
                  }`}
               >
                  <Icon name={ok ? "check" : "radio_button_unchecked"} size={13} />
                  {r.label}
               </li>
            );
         })}
      </ul>
   );
}

export default PasswordChecklist;
