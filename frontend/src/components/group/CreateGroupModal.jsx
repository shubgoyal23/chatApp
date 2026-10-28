import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { api } from "../../lib/api";
import { debounce } from "../../lib/format";
import { toast } from "../../lib/toast";
import { knowUsers, openChat, upsertContact } from "../../store/chatSlice";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";
import Icon from "../ui/Icon";
import Spinner from "../ui/Spinner";
import MemberPicker from "./MemberPicker";

const EMPTY = { name: "", handle: "", description: "" };

function CreateGroupModal({ open, onClose }) {
   const dispatch = useDispatch();
   const [form, setForm] = useState(EMPTY);
   const [members, setMembers] = useState([]);
   // last server answer, tagged with the handle it was for
   const [checked, setChecked] = useState({ handle: null });
   const [error, setError] = useState("");
   const [loading, setLoading] = useState(false);

   const check = useMemo(
      () =>
         debounce(async (handle) => {
            try {
               const data = await api("/group/check-group-name", { body: { groupUniqueName: handle } });
               setChecked({ handle, available: data.available, message: data.available ? "Available" : "Not available" });
            } catch (err) {
               setChecked({ handle, available: false, message: err.message });
            }
         }, 350),
      []
   );

   const validHandle = /^[a-zA-Z0-9_.]{3,16}$/.test(form.handle);

   useEffect(() => {
      if (!validHandle) return;
      check(form.handle);
      return () => check.cancel();
   }, [form.handle, validHandle, check]);

   // null | "checking" | { available, message }
   const handleState = !form.handle
      ? null
      : !validHandle
        ? { available: false, message: "3–16 letters, numbers, '.' or '_'" }
        : checked.handle === form.handle
          ? checked
          : "checking";

   const close = () => {
      setForm(EMPTY);
      setMembers([]);
      setError("");
      onClose();
   };

   const submit = async (e) => {
      e.preventDefault();
      setError("");
      if (!members.length) return setError("Add at least one member");
      setLoading(true);
      try {
         const group = await api("/group/new", {
            body: {
               groupname: form.name.trim(),
               groupUniqueName: form.handle.trim(),
               description: form.description.trim(),
               members,
            },
         });
         dispatch(knowUsers(group.members ?? []));
         dispatch(upsertContact({ ...group, lastMessage: { message: "", epoch: Math.floor(Date.now() / 1000) } }));
         dispatch(openChat(group._id));
         toast.success(`Group "${group.fullname}" created`);
         close();
      } catch (err) {
         setError(err.message);
      } finally {
         setLoading(false);
      }
   };

   const handleRight =
      handleState === "checking" ? (
         <Spinner className="size-4 text-subtle" />
      ) : handleState?.available ? (
         <Icon name="check_circle" fill className="text-emerald-500" size={20} />
      ) : null;

   return (
      <Modal open={open} onClose={close} title="New group">
         <form onSubmit={submit} className="space-y-4">
            {error && (
               <div role="alert" className="px-4 py-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm">
                  {error}
               </div>
            )}
            <Input label="Group name" icon="groups" value={form.name} maxLength={50} required autoFocus onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input
               label="Group username"
               icon="alternate_email"
               value={form.handle}
               maxLength={16}
               required
               onChange={(e) => setForm({ ...form, handle: e.target.value })}
               right={handleRight}
               error={handleState && handleState !== "checking" && !handleState.available ? handleState.message : ""}
               hint="Unique handle for the group"
            />
            <div>
               <label className="block mb-1.5 text-[13px] font-medium text-muted">Description</label>
               <textarea
                  rows={2}
                  maxLength={300}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What's this group about?"
                  className="w-full px-3.5 py-3 rounded-xl bg-surface-2 border border-transparent focus:border-indigo-400 focus:bg-surface focus:ring-4 focus:ring-indigo-500/10 outline-none text-[15px] text-fg placeholder:text-subtle resize-none"
               />
            </div>
            <div>
               <label className="block mb-1.5 text-[13px] font-medium text-muted">Members</label>
               <MemberPicker selected={members} onChange={setMembers} />
            </div>
            <Button
               type="submit"
               loading={loading}
               disabled={handleState !== null && handleState !== "checking" && !handleState.available}
               className="w-full h-12"
               icon="group_add"
            >
               Create group
            </Button>
         </form>
      </Modal>
   );
}

export default CreateGroupModal;
