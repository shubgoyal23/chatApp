import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { api } from "../../lib/api";
import { debounce } from "../../lib/format";
import { openChat, upsertContact } from "../../store/chatSlice";
import { useTheme } from "../../lib/theme";
import Avatar from "../ui/Avatar";
import Icon from "../ui/Icon";
import IconButton from "../ui/IconButton";
import Spinner from "../ui/Spinner";
import ConversationItem from "./ConversationItem";
import ProfilePanel from "../profile/ProfilePanel";
import CreateGroupModal from "../group/CreateGroupModal";

const FILTERS = [
   ["all", "All"],
   ["unread", "Unread"],
   ["groups", "Groups"],
];

const THEME_ICON = { light: "light_mode", dark: "dark_mode", system: "contrast" };
const NEXT_THEME = { light: "dark", dark: "system", system: "light" };

function Sidebar({ onLogout, hidden }) {
   const dispatch = useDispatch();
   const user = useSelector((s) => s.login.userdata);
   const contacts = useSelector((s) => s.chat.contacts);
   const unread = useSelector((s) => s.chat.unread);
   const loaded = useSelector((s) => s.chat.contactsLoaded);
   const activeId = useSelector((s) => s.chat.activeId);
   const [theme, setTheme] = useTheme();

   const [query, setQuery] = useState("");
   const [filter, setFilter] = useState("all");
   const [people, setPeople] = useState([]);
   const [searching, setSearching] = useState(false);
   const [profileOpen, setProfileOpen] = useState(false);
   const [groupOpen, setGroupOpen] = useState(false);

   const search = useMemo(
      () =>
         debounce(async (q) => {
            try {
               setPeople((await api("/users/list", { body: { fullname: q } })) ?? []);
            } catch {
               setPeople([]);
            } finally {
               setSearching(false);
            }
         }, 300),
      []
   );

   useEffect(() => () => search.cancel(), [search]);

   const onQuery = (value) => {
      setQuery(value);
      const q = value.trim();
      if (q) {
         setSearching(true);
         search(q);
      } else {
         search.cancel();
         setSearching(false);
         setPeople([]);
      }
   };

   const conversations = useMemo(() => {
      const q = query.trim().toLowerCase();
      return Object.values(contacts)
         .filter((c) => {
            if (filter === "unread" && !unread[c._id]) return false;
            if (filter === "groups" && c.accountType !== "group") return false;
            if (q && !`${c.fullname} ${c.username}`.toLowerCase().includes(q)) return false;
            return true;
         })
         .sort((a, b) => (b.lastMessage?.epoch ?? 0) - (a.lastMessage?.epoch ?? 0));
   }, [contacts, unread, filter, query]);

   const newPeople = people.filter((p) => !contacts[p._id]);

   const startChat = (person) => {
      dispatch(upsertContact({ ...person, accountType: "user" }));
      dispatch(openChat(person._id));
      onQuery("");
   };

   return (
      <aside
         className={`relative w-full md:w-[360px] lg:w-[380px] shrink-0 flex-col border-r border-line bg-surface ${
            hidden ? "hidden md:flex" : "flex"
         }`}
      >
         {/* Header */}
         <div className="flex items-center gap-3 px-4 pt-4 pb-3">
            <button
               onClick={() => setProfileOpen(true)}
               className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
               aria-label="Open profile"
            >
               <Avatar user={user} size="md" />
            </button>
            <div className="flex-1 min-w-0">
               <h1 className="text-xl font-extrabold tracking-tight text-fg">Chats</h1>
            </div>
            <IconButton
               icon={THEME_ICON[theme]}
               label={`Theme: ${theme}`}
               onClick={() => setTheme(NEXT_THEME[theme])}
            />
            <IconButton icon="group_add" label="New group" onClick={() => setGroupOpen(true)} />
         </div>

         {/* Search */}
         <div className="px-4 pb-3">
            <div className="flex items-center gap-2 h-11 px-3.5 rounded-2xl bg-surface-2 border border-transparent focus-within:border-indigo-400 focus-within:bg-surface focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
               <Icon name="search" className="text-subtle" size={20} />
               <input
                  value={query}
                  onChange={(e) => onQuery(e.target.value)}
                  placeholder="Search or start a new chat"
                  maxLength={50}
                  className="flex-1 min-w-0 bg-transparent outline-none text-sm text-fg placeholder:text-subtle"
               />
               {searching ? (
                  <Spinner className="size-4 text-subtle" />
               ) : (
                  query && (
                     <button onClick={() => onQuery("")} className="text-subtle hover:text-fg" aria-label="Clear search">
                        <Icon name="close" size={18} />
                     </button>
                  )
               )}
            </div>
         </div>

         {/* Filters */}
         {!query && (
            <div className="flex gap-2 px-4 pb-2">
               {FILTERS.map(([key, label]) => (
                  <button
                     key={key}
                     onClick={() => setFilter(key)}
                     className={`h-8 px-3.5 rounded-full text-[13px] font-semibold transition-colors ${
                        filter === key
                           ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/25"
                           : "bg-surface-2 text-muted hover:text-fg"
                     }`}
                  >
                     {label}
                     {key === "unread" && Object.keys(unread).length > 0 && (
                        <span className="ml-1.5 opacity-80">{Object.keys(unread).length}</span>
                     )}
                  </button>
               ))}
            </div>
         )}

         {/* List */}
         <div className="flex-1 overflow-y-auto px-2 pb-3">
            {!loaded ? (
               <ListSkeleton />
            ) : (
               <>
                  {conversations.map((c) => (
                     <ConversationItem key={c._id} contact={c} active={c._id === activeId} />
                  ))}

                  {query && newPeople.length > 0 && (
                     <>
                        <p className="px-3 pt-4 pb-2 text-xs font-semibold uppercase tracking-wider text-subtle">
                           People
                        </p>
                        {newPeople.map((p) => (
                           <button
                              key={p._id}
                              onClick={() => startChat(p)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-surface-2 text-left transition-colors"
                           >
                              <Avatar user={p} />
                              <div className="min-w-0 flex-1">
                                 <p className="font-semibold text-fg truncate">{p.fullname}</p>
                                 <p className="text-sm text-subtle truncate">@{p.username}</p>
                              </div>
                              <Icon name="chat_add_on" className="text-indigo-500" />
                           </button>
                        ))}
                     </>
                  )}

                  {conversations.length === 0 && !(query && (newPeople.length || searching)) && (
                     <div className="flex flex-col items-center text-center px-6 py-14">
                        <div className="size-14 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                           <Icon name={query ? "person_search" : "forum"} size={28} />
                        </div>
                        <p className="mt-4 font-semibold text-fg">
                           {query ? "No matches" : filter === "all" ? "No conversations yet" : "Nothing here"}
                        </p>
                        <p className="mt-1 text-sm text-muted">
                           {query ? "Try a different name or username." : "Search for people above to start chatting."}
                        </p>
                     </div>
                  )}
               </>
            )}
         </div>

         <ProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} onLogout={onLogout} />
         <CreateGroupModal open={groupOpen} onClose={() => setGroupOpen(false)} />
      </aside>
   );
}

function ListSkeleton() {
   return (
      <div className="px-2 pt-2 space-y-1">
         {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 px-2 py-3 animate-pulse">
               <div className="size-12 rounded-full bg-surface-2" />
               <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/2 rounded bg-surface-2" />
                  <div className="h-3 w-3/4 rounded bg-surface-2" />
               </div>
            </div>
         ))}
      </div>
   );
}

export default Sidebar;
