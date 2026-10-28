import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { api } from "../../lib/api";
import { debounce } from "../../lib/format";
import Avatar from "../ui/Avatar";
import Icon from "../ui/Icon";

// Searchable multi-select over your contacts plus anyone found by name.
function MemberPicker({ selected, onChange, exclude = [] }) {
   const contacts = useSelector((s) => s.chat.contacts);
   const [query, setQuery] = useState("");
   const [found, setFound] = useState([]);
   const [known, setKnown] = useState({});

   const search = useMemo(
      () =>
         debounce(async (q) => {
            try {
               setFound((await api("/users/list", { body: { fullname: q } })) ?? []);
            } catch {
               setFound([]);
            }
         }, 300),
      []
   );

   useEffect(() => () => search.cancel(), [search]);

   const onQuery = (value) => {
      setQuery(value);
      if (value.trim()) {
         search(value.trim());
      } else {
         search.cancel();
         setFound([]);
      }
   };

   const people = useMemo(() => {
      const q = query.trim().toLowerCase();
      const base = Object.values(contacts).filter((c) => c.accountType !== "group");
      const map = new Map();
      for (const p of [...base, ...found]) {
         if (exclude.includes(p._id)) continue;
         if (q && !`${p.fullname} ${p.username}`.toLowerCase().includes(q)) continue;
         map.set(p._id, p);
      }
      return [...map.values()];
   }, [contacts, found, query, exclude]);

   const toggle = (p) => {
      setKnown((k) => ({ ...k, [p._id]: p }));
      onChange(selected.includes(p._id) ? selected.filter((id) => id !== p._id) : [...selected, p._id]);
   };

   const chip = (id) => known[id] ?? contacts[id] ?? { _id: id, fullname: "User" };

   return (
      <div>
         {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
               {selected.map((id) => (
                  <button
                     key={id}
                     type="button"
                     onClick={() => toggle(chip(id))}
                     className="inline-flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 text-sm font-medium"
                  >
                     <Avatar user={chip(id)} size="xs" className="size-6 text-[9px]" />
                     {chip(id).fullname?.split(" ")[0]}
                     <Icon name="close" size={14} />
                  </button>
               ))}
            </div>
         )}
         <div className="flex items-center gap-2 h-11 px-3 rounded-xl bg-surface-2 mb-2">
            <Icon name="search" size={18} className="text-subtle" />
            <input
               value={query}
               onChange={(e) => onQuery(e.target.value)}
               placeholder="Search people"
               className="flex-1 min-w-0 bg-transparent outline-none text-sm text-fg placeholder:text-subtle"
            />
         </div>
         <div className="max-h-56 overflow-y-auto -mx-1">
            {people.map((p) => {
               const on = selected.includes(p._id);
               return (
                  <button
                     key={p._id}
                     type="button"
                     onClick={() => toggle(p)}
                     className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-surface-2 text-left"
                  >
                     <Avatar user={p} size="sm" />
                     <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-fg truncate">{p.fullname}</p>
                        <p className="text-xs text-subtle truncate">@{p.username}</p>
                     </div>
                     <span
                        className={`size-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                           on ? "bg-indigo-500 border-indigo-500 text-white" : "border-line"
                        }`}
                     >
                        {on && <Icon name="check" size={14} />}
                     </span>
                  </button>
               );
            })}
            {people.length === 0 && (
               <p className="text-center text-sm text-subtle py-6">
                  {query ? "No one found" : "Search for people to add"}
               </p>
            )}
         </div>
      </div>
   );
}

export default MemberPicker;
