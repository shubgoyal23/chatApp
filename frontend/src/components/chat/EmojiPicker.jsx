import { useMemo, useState } from "react";
import { emoji as EMOJI } from "../../constance/EmojiList";
import Icon from "../ui/Icon";

function EmojiPicker({ onPick }) {
   const [query, setQuery] = useState("");
   const [tab, setTab] = useState(0);

   const results = useMemo(() => {
      const q = query.trim().toLowerCase();
      if (!q) return null;
      return EMOJI.flatMap((g) => g.list).filter((e) => e.name?.toLowerCase().includes(q)).slice(0, 120);
   }, [query]);

   const list = results ?? EMOJI[tab]?.list ?? [];

   return (
      <div className="w-[min(340px,calc(100vw-2rem))] rounded-3xl bg-surface border border-line shadow-2xl overflow-hidden animate-pop-in">
         <div className="p-3 pb-2">
            <div className="flex items-center gap-2 h-10 px-3 rounded-xl bg-surface-2">
               <Icon name="search" size={18} className="text-subtle" />
               <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search emoji"
                  className="flex-1 min-w-0 bg-transparent outline-none text-sm text-fg placeholder:text-subtle"
               />
            </div>
         </div>
         {!results && (
            <div className="flex gap-1 px-3 pb-2 overflow-x-auto">
               {EMOJI.map((g, i) => (
                  <button
                     key={g.title}
                     onClick={() => setTab(i)}
                     title={g.title}
                     className={`shrink-0 size-9 rounded-xl text-lg flex items-center justify-center ${
                        tab === i ? "bg-indigo-500/15" : "hover:bg-surface-2"
                     }`}
                  >
                     {g.list[0]?.emoji}
                  </button>
               ))}
            </div>
         )}
         <div className="h-64 overflow-y-auto px-2 pb-2 grid grid-cols-8 content-start">
            {list.map((e, i) => (
               <button
                  key={e.emoji + i}
                  onClick={() => onPick(e.emoji)}
                  title={e.name}
                  className="size-10 text-2xl rounded-xl hover:bg-surface-2 hover:scale-110 transition-transform flex items-center justify-center"
               >
                  {e.emoji}
               </button>
            ))}
            {list.length === 0 && <p className="col-span-8 text-center text-sm text-subtle py-10">No emoji found</p>}
         </div>
      </div>
   );
}

export default EmojiPicker;
