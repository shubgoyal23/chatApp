import { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { api } from "../../lib/api";
import { toast } from "../../lib/toast";
import { updateUser } from "../../store/loginSlice";
import { avatar_public_ids } from "../../constance/data";
import Modal from "../ui/Modal";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import Icon from "../ui/Icon";

const MAX_SIZE = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function AvatarPicker({ open, onClose }) {
   const dispatch = useDispatch();
   const user = useSelector((s) => s.login.userdata);
   const [file, setFile] = useState(null);
   const [preview, setPreview] = useState(null);
   const [busy, setBusy] = useState(false);
   const fileInput = useRef(null);

   const pick = (f) => {
      if (!f) return;
      if (!TYPES.includes(f.type)) return toast.error("Choose a JPG, PNG, WEBP or GIF image.");
      if (f.size > MAX_SIZE) return toast.error("Image must be smaller than 5 MB.");
      setFile(f);
      setPreview((old) => {
         if (old) URL.revokeObjectURL(old);
         return URL.createObjectURL(f);
      });
   };

   const reset = () => {
      if (preview) URL.revokeObjectURL(preview);
      setFile(null);
      setPreview(null);
   };

   const close = () => {
      reset();
      onClose();
   };

   const choosePreset = async (avatar) => {
      setBusy(true);
      try {
         dispatch(updateUser(await api("/users/avatar", { body: { avatar } })));
         toast.success("Avatar updated");
         close();
      } catch (err) {
         toast.error(err.message);
      } finally {
         setBusy(false);
      }
   };

   const upload = async () => {
      const form = new FormData();
      form.append("avatar", file);
      setBusy(true);
      try {
         dispatch(updateUser(await api("/users/avatar-upload", { form })));
         toast.success("Photo uploaded");
         close();
      } catch (err) {
         toast.error(err.message);
      } finally {
         setBusy(false);
      }
   };

   return (
      <Modal open={open} onClose={close} title="Profile photo" width="max-w-lg">
         <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
               e.preventDefault();
               pick(e.dataTransfer.files?.[0]);
            }}
            className="rounded-2xl border-2 border-dashed border-line bg-surface-2/50 p-5 flex flex-col items-center text-center"
         >
            {preview ? (
               <>
                  <img src={preview} alt="Preview" className="size-28 rounded-full object-cover ring-4 ring-indigo-500/20" />
                  <div className="mt-4 flex gap-2">
                     <Button variant="secondary" onClick={reset} disabled={busy}>Cancel</Button>
                     <Button onClick={upload} loading={busy} icon="upload">Use this photo</Button>
                  </div>
               </>
            ) : (
               <>
                  <div className="size-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                     <Icon name="add_photo_alternate" size={26} />
                  </div>
                  <p className="mt-3 font-semibold text-fg">Upload a photo</p>
                  <p className="text-sm text-subtle">Drag & drop or browse · JPG, PNG, WEBP, GIF · up to 5 MB</p>
                  <Button variant="secondary" className="mt-4" icon="folder_open" onClick={() => fileInput.current?.click()}>
                     Browse
                  </Button>
                  <input ref={fileInput} type="file" accept={TYPES.join(",")} className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
               </>
            )}
         </div>

         <p className="mt-6 mb-3 text-xs font-semibold uppercase tracking-wider text-subtle">Or pick an avatar</p>
         <div className="grid grid-cols-5 gap-3">
            {avatar_public_ids.map((id) => (
               <button
                  key={id}
                  disabled={busy}
                  onClick={() => choosePreset(id)}
                  className={`rounded-full transition-transform hover:scale-105 ${user?.avatar === id ? "ring-4 ring-indigo-500 ring-offset-2 ring-offset-surface" : ""}`}
                  aria-label="Choose avatar"
               >
                  <Avatar user={{ _id: id, avatar: id }} size="lg" className="!size-full aspect-square" />
               </button>
            ))}
         </div>
      </Modal>
   );
}

export default AvatarPicker;
