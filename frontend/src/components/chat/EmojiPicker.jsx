import { useMemo, useState } from "react";
import { emoji } from "../../constance/EmojiList";
import Icon from "../ui/Icon";

// the source list contains some empty categories; they'd render as blank tabs
const EMOJI = emoji.filter((g) => g.list?.length);

function EmojiPicker({ onPick }) {
   const [query, setQuery] = useState("");
   const [tab, setTab] = useState(0);
   // search stays hidden until asked for, so mobile keyboards don't pop up
   const [searching, setSearching] = useState(false);

   const results = useMemo(() => {
      const q = query.trim().toLowerCase();
      if (!q) return null;
      return EMOJI.flatMap((g) => g.list).filter((e) => e.name?.toLowerCase().includes(q)).slice(0, 120);
   }, [query]);

   const list = results ?? EMOJI[tab]?.list ?? [];

   return (
      <div className="w-[min(340px,calc(100vw-2rem))] rounded-3xl bg-surface border border-line shadow-2xl overflow-hidden animate-pop-in">
         <div className="flex items-center gap-1 h-12 px-2 border-b border-line">
            {searching ? (
               <>
                  <Icon name="search" size={18} className="ml-1.5 text-subtle" />
                  <input
                     autoFocus
                     value={query}
                     onChange={(e) => setQuery(e.target.value)}
                     placeholder="Search emoji"
                     aria-label="Search emoji"
                     className="flex-1 min-w-0 h-9 px-1 bg-transparent outline-none text-sm text-fg placeholder:text-subtle"
                  />
                  <button
                     type="button"
                     onClick={() => {
                        setSearching(false);
                        setQuery("");
                     }}
                     aria-label="Close search"
                     className="shrink-0 size-9 rounded-xl flex items-center justify-center text-subtle hover:text-fg hover:bg-surface-2"
                  >
                     <Icon name="close" size={18} />
                  </button>
               </>
            ) : (
               <>
                  <div className="flex-1 min-w-0 flex gap-1 overflow-x-auto">
                     {EMOJI.map((g, i) => (
                        <button
                           type="button"
                           key={g.title}
                           onClick={() => setTab(i)}
                           title={g.title}
                           aria-label={g.title}
                           className={`shrink-0 size-9 rounded-xl text-lg flex items-center justify-center ${
                              tab === i ? "bg-indigo-500/15" : "hover:bg-surface-2"
                           }`}
                        >
                           {g.list[0]?.emoji}
                        </button>
                     ))}
                  </div>
                  <button
                     type="button"
                     onClick={() => setSearching(true)}
                     aria-label="Search emoji"
                     title="Search"
                     className="shrink-0 size-9 rounded-xl flex items-center justify-center text-subtle hover:text-fg hover:bg-surface-2"
                  >
                     <Icon name="search" size={20} />
                  </button>
               </>
            )}
         </div>
         <div className="h-64 max-h-[40dvh] overflow-y-auto p-2 grid grid-cols-8 content-start">
            {list.map((e, i) => (
               <button
                  type="button"
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
