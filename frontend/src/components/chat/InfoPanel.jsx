import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { api } from "../../lib/api";
import { startCall } from "../../lib/call";
import { toast } from "../../lib/toast";
import { isGroup, knowUsers, removeContact, upsertContact } from "../../store/chatSlice";
import Avatar from "../ui/Avatar";
import Icon from "../ui/Icon";
import IconButton from "../ui/IconButton";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import MemberPicker from "../group/MemberPicker";
import EditableField from "../profile/EditableField";

function InfoPanel({ chatId, onClose }) {
   const dispatch = useDispatch();
   const me = useSelector((s) => s.login.userdata._id);
   const contact = useSelector((s) => s.chat.contacts[chatId]);
   const presence = useSelector((s) => s.chat.presence[chatId]);
   const users = useSelector((s) => s.chat.users);
   const group = isGroup(contact);
   const [adding, setAdding] = useState(false);
   const [newMembers, setNewMembers] = useState([]);
   const [busy, setBusy] = useState(false);
   const [confirm, setConfirm] = useState(null); // "leave" | "delete"

   useEffect(() => {
      api(`/users/info?id=${chatId}`)
         .then((info) => {
            if (info.members) dispatch(knowUsers(info.members));
            dispatch(upsertContact(info));
         })
         .catch(() => {});
   }, [chatId, dispatch]);

   const memberList = (contact?.members ?? []).map((m) => (typeof m === "string" ? users[m] ?? { _id: m } : m));
   const admins = (contact?.admins ?? []).map(String);
   const amAdmin = admins.includes(me);
   const amCreator = String(contact?.createdBy) === me;

   const groupAction = async (path, body, success) => {
      setBusy(true);
      try {
         const updated = await api(`/group/${path}`, { body: { grpId: chatId, ...body } });
         if (updated?._id) {
            if (updated.members) dispatch(knowUsers(updated.members));
            dispatch(upsertContact(updated));
         }
         if (success) toast.success(success);
         return true;
      } catch (err) {
         toast.error(err.message);
         return false;
      } finally {
         setBusy(false);
      }
   };

   const leaveOrDelete = async () => {
      const kind = confirm;
      setConfirm(null);
      if (await groupAction(kind === "delete" ? "delete" : "leave", {}, kind === "delete" ? "Group deleted" : "You left the group")) {
         dispatch(removeContact(chatId));
      }
   };

   return (
      <aside className="absolute inset-0 z-20 xl:static xl:z-auto xl:w-[360px] shrink-0 flex flex-col bg-surface xl:border-l border-line animate-fade-in">
         <header className="flex items-center gap-2 h-[68px] px-3 border-b border-line">
            <IconButton icon="close" label="Close details" onClick={onClose} />
            <h2 className="font-semibold text-fg">{group ? "Group info" : "Contact info"}</h2>
         </header>

         <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col items-center text-center px-6 pt-8 pb-6">
               <Avatar user={contact} size="2xl" />
               {group && amAdmin ? (
                  <div className="w-full mt-4">
                     <EditableField
                        center
                        value={contact?.fullname ?? ""}
                        maxLength={50}
                        onSave={(name) => groupAction("name", { name }, "Group name updated")}
                     />
                  </div>
               ) : (
                  <h3 className="mt-4 text-xl font-bold text-fg">{contact?.fullname}</h3>
               )}
               <p className="text-sm text-subtle">
                  @{contact?.username}
                  {!group && presence === "online" && <span className="text-emerald-500 font-medium"> · online</span>}
               </p>

               {!group && (
                  <div className="mt-5 flex gap-3">
                     <QuickAction icon="call" label="Voice" onClick={() => startCall(contact, "audio")} />
                     <QuickAction icon="videocam" label="Video" onClick={() => startCall(contact, "video")} />
                  </div>
               )}
            </div>

            <Section title={group ? "Description" : "About"}>
               {group && amAdmin ? (
                  <EditableField
                     multiline
                     value={contact?.about ?? ""}
                     placeholder="Add a group description"
                     maxLength={300}
                     onSave={(description) => groupAction("description", { description }, "Description updated")}
                  />
               ) : (
                  <p className="text-[15px] text-fg leading-relaxed whitespace-pre-wrap">
                     {contact?.about || (group ? "No description" : "Hey there! I'm using Chatzz.")}
                  </p>
               )}
            </Section>

            {group && (
               <Section title={`${memberList.length} members`}>
                  {amAdmin && (
                     <button
                        onClick={() => setAdding(true)}
                        className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-surface-2 text-left"
                     >
                        <span className="size-9 rounded-full brand-gradient text-white flex items-center justify-center">
                           <Icon name="person_add" size={20} />
                        </span>
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">Add members</span>
                     </button>
                  )}
                  {memberList.map((m) => {
                     const isAdmin = admins.includes(m._id);
                     const isMe = m._id === me;
                     return (
                        <div key={m._id} className="group/member flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-surface-2">
                           <Avatar user={m} size="sm" />
                           <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-fg truncate">{isMe ? "You" : m.fullname ?? "Member"}</p>
                              {m.username && <p className="text-xs text-subtle truncate">@{m.username}</p>}
                           </div>
                           {isAdmin && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                                 Admin
                              </span>
                           )}
                           {amAdmin && !isMe && String(contact?.createdBy) !== m._id && (
                              <div className="flex opacity-0 group-hover/member:opacity-100 [@media(hover:none)]:opacity-100">
                                 {!isAdmin ? (
                                    <IconButton icon="shield_person" label="Make admin" disabled={busy} onClick={() => groupAction("add/admin", { adminid: m._id }, "Admin added")} />
                                 ) : (
                                    amCreator && <IconButton icon="remove_moderator" label="Remove admin" disabled={busy} onClick={() => groupAction("remove/admin", { adminid: m._id }, "Admin removed")} />
                                 )}
                                 <IconButton icon="person_remove" label="Remove from group" disabled={busy} onClick={() => groupAction("remove/member", { members: [m._id] }, "Member removed")} />
                              </div>
                           )}
                        </div>
                     );
                  })}
               </Section>
            )}

            {group && (
               <div className="px-4 py-4 space-y-2">
                  <Button variant="danger" icon="logout" className="w-full" onClick={() => setConfirm("leave")}>
                     Leave group
                  </Button>
                  {amCreator && (
                     <Button variant="danger" icon="delete" className="w-full" onClick={() => setConfirm("delete")}>
                        Delete group
                     </Button>
                  )}
               </div>
            )}
         </div>

         <Modal open={adding} onClose={() => setAdding(false)} title="Add members">
            <MemberPicker selected={newMembers} onChange={setNewMembers} exclude={memberList.map((m) => m._id)} />
            <Button
               className="w-full mt-4"
               loading={busy}
               disabled={!newMembers.length}
               onClick={async () => {
                  if (await groupAction("add/member", { members: newMembers }, "Members added")) {
                     setNewMembers([]);
                     setAdding(false);
                  }
               }}
            >
               Add {newMembers.length || ""} {newMembers.length === 1 ? "member" : "members"}
            </Button>
         </Modal>

         <Modal open={Boolean(confirm)} onClose={() => setConfirm(null)} title={confirm === "delete" ? "Delete group?" : "Leave group?"}>
            <p className="text-muted">
               {confirm === "delete"
                  ? "This removes the group and its messages for everyone. This can't be undone."
                  : "You will stop receiving messages from this group."}
            </p>
            <div className="mt-6 flex gap-3 justify-end">
               <Button variant="secondary" onClick={() => setConfirm(null)}>Cancel</Button>
               <Button variant="danger" loading={busy} onClick={leaveOrDelete}>
                  {confirm === "delete" ? "Delete" : "Leave"}
               </Button>
            </div>
         </Modal>
      </aside>
   );
}

function Section({ title, children }) {
   return (
      <section className="px-4 py-4 border-t-8 border-surface-2">
         <h4 className="px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-subtle">{title}</h4>
         <div className="px-2">{children}</div>
      </section>
   );
}

function QuickAction({ icon, label, onClick }) {
   return (
      <button
         onClick={onClick}
         className="w-20 py-3 rounded-2xl bg-surface-2 hover:bg-surface-3 text-indigo-600 dark:text-indigo-400 flex flex-col items-center gap-1 transition-colors"
      >
         <Icon name={icon} fill />
         <span className="text-xs font-semibold text-muted">{label}</span>
      </button>
   );
}

export default InfoPanel;
