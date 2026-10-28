import { useState } from "react";
import Icon from "../ui/Icon";
import Spinner from "../ui/Spinner";

// Inline text that turns into an input on edit; onSave may return false to stay open.
function EditableField({ value, onSave, placeholder, maxLength = 50, multiline = false, center = false }) {
   const [editing, setEditing] = useState(false);
   const [draft, setDraft] = useState(value);
   const [saving, setSaving] = useState(false);

   const save = async () => {
      const v = draft.trim();
      if (v === value) return setEditing(false);
      setSaving(true);
      const ok = await onSave(v);
      setSaving(false);
      if (ok !== false) setEditing(false);
   };

   if (!editing) {
      return (
         <button
            onClick={() => {
               setDraft(value);
               setEditing(true);
            }}
            className={`group w-full flex items-start gap-2 rounded-xl px-2 py-1.5 -mx-2 hover:bg-surface-2 transition-colors ${center ? "justify-center text-center" : "text-left"}`}
         >
            <span className={`${center ? "text-xl font-bold" : "text-[15px]"} ${value ? "text-fg" : "text-subtle"} whitespace-pre-wrap break-words`}>
               {value || placeholder}
            </span>
            <Icon name="edit" size={18} className="mt-0.5 text-subtle opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100" />
         </button>
      );
   }

   const Field = multiline ? "textarea" : "input";
   return (
      <div className="flex items-start gap-2">
         <Field
            autoFocus
            value={draft}
            maxLength={maxLength}
            rows={multiline ? 3 : undefined}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
               if (e.key === "Enter" && !(multiline && e.shiftKey)) {
                  e.preventDefault();
                  save();
               }
               if (e.key === "Escape") setEditing(false);
            }}
            className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-surface-2 border border-indigo-400 ring-4 ring-indigo-500/10 outline-none text-[15px] text-fg resize-none"
         />
         <button onClick={save} disabled={saving} className="size-10 shrink-0 rounded-xl brand-gradient text-white flex items-center justify-center" aria-label="Save">
            {saving ? <Spinner className="size-4" /> : <Icon name="check" />}
         </button>
      </div>
   );
}

export default EditableField;
