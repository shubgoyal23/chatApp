import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { api } from "../../lib/api";
import { toast } from "../../lib/toast";
import { useTheme } from "../../lib/theme";
import { useBackHandler } from "../../lib/backStack";
import { updateUser } from "../../store/loginSlice";
import Avatar from "../ui/Avatar";
import Icon from "../ui/Icon";
import IconButton from "../ui/IconButton";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import OtpInput from "../ui/OtpInput";
import EditableField from "./EditableField";
import AvatarPicker from "./AvatarPicker";

const THEMES = [
   ["light", "light_mode", "Light"],
   ["dark", "dark_mode", "Dark"],
   ["system", "contrast", "System"],
];

function ProfilePanel({ open, onClose, onLogout }) {
   const dispatch = useDispatch();
   const user = useSelector((s) => s.login.userdata);
   const [theme, setTheme] = useTheme();
   const [avatarOpen, setAvatarOpen] = useState(false);
   const [secure, setSecure] = useState(null); // "username" | "email"
   const [loggingOut, setLoggingOut] = useState(false);
   useBackHandler(open, onClose);

   const save = async (field, value) => {
      try {
         dispatch(updateUser(await api("/users/user-edit", { body: { [field]: value } })));
         toast.success("Profile updated");
         return true;
      } catch (err) {
         toast.error(err.message);
         return false;
      }
   };

   return (
      <div
         className={`absolute inset-0 z-30 flex flex-col bg-surface transition-transform duration-300 ease-out ${
            open ? "translate-x-0" : "-translate-x-full pointer-events-none"
         }`}
         aria-hidden={!open}
         inert={!open}
      >
         <header className="flex items-center gap-2 h-[68px] px-3 border-b border-line">
            <IconButton icon="arrow_back" label="Close profile" onClick={onClose} />
            <h2 className="font-semibold text-fg">Profile</h2>
         </header>

         <div className="flex-1 overflow-y-auto">
            <div className="relative flex flex-col items-center pt-8 pb-6 px-6">
               <div className="absolute inset-x-0 top-0 h-24 brand-gradient opacity-15" />
               <button onClick={() => setAvatarOpen(true)} className="relative group rounded-full" aria-label="Change photo">
                  <Avatar user={user} size="2xl" />
                  <span className="absolute inset-0 rounded-full bg-black/45 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <Icon name="photo_camera" />
                     <span className="text-xs font-semibold mt-1">Change</span>
                  </span>
               </button>
            </div>

            <Field label="Name" icon="badge">
               <EditableField value={user?.fullname ?? ""} maxLength={50} onSave={(v) => (v ? save("fullname", v) : false)} />
            </Field>
            <Field label="About" icon="info">
               <EditableField multiline value={user?.about ?? ""} placeholder="Add a few words about yourself" maxLength={200} onSave={(v) => save("about", v)} />
            </Field>
            <Field label="Username" icon="alternate_email" action={<ChangeButton onClick={() => setSecure("username")} />}>
               <p className="py-1.5 text-[15px] text-fg">@{user?.username}</p>
            </Field>
            <Field label="Email" icon="mail" action={<ChangeButton onClick={() => setSecure("email")} />}>
               <p className="py-1.5 text-[15px] text-fg break-all">{user?.email}</p>
            </Field>

            <div className="px-6 py-5 border-t border-line">
               <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-subtle">Appearance</p>
               <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-surface-2">
                  {THEMES.map(([key, icon, label]) => (
                     <button
                        key={key}
                        onClick={() => setTheme(key)}
                        className={`h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
                           theme === key ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg"
                        }`}
                     >
                        <Icon name={icon} size={18} />
                        {label}
                     </button>
                  ))}
               </div>
            </div>

            <div className="px-6 py-5 border-t border-line">
               <Button
                  variant="danger"
                  icon="logout"
                  className="w-full"
                  loading={loggingOut}
                  onClick={async () => {
                     setLoggingOut(true);
                     await onLogout();
                  }}
               >
                  Log out
               </Button>
            </div>
         </div>

         <AvatarPicker open={avatarOpen} onClose={() => setAvatarOpen(false)} />
         {secure && <SecureChange field={secure} onClose={() => setSecure(null)} />}
      </div>
   );
}

function Field({ label, icon, children, action }) {
   return (
      <div className="flex gap-4 px-6 py-3">
         <Icon name={icon} className="mt-6 text-subtle" />
         <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
               <p className="text-xs font-semibold text-subtle">{label}</p>
               {action}
            </div>
            {children}
         </div>
      </div>
   );
}

function ChangeButton({ onClick }) {
   return (
      <button onClick={onClick} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
         Change
      </button>
   );
}

// Username and email are login identifiers, so changing them needs the code
// sent to the current email address.
function SecureChange({ field, onClose }) {
   const dispatch = useDispatch();
   const user = useSelector((s) => s.login.userdata);
   const [value, setValue] = useState(field === "email" ? user.email : user.username);
   const [step, setStep] = useState("edit");
   const [otp, setOtp] = useState("");
   const [error, setError] = useState("");
   const [busy, setBusy] = useState(false);

   const sendCode = async (e) => {
      e.preventDefault();
      setError("");
      if (field === "username" && !/^[a-zA-Z0-9_.]{3,16}$/.test(value)) {
         return setError("3–16 letters, numbers, '.' or '_'");
      }
      setBusy(true);
      try {
         await api("/users/user-edit-otp", { body: {} });
         setStep("otp");
      } catch (err) {
         setError(err.message);
      } finally {
         setBusy(false);
      }
   };

   const confirm = async (code) => {
      setError("");
      setBusy(true);
      try {
         dispatch(updateUser(await api("/users/user-edit", { body: { [field]: value.trim(), otp: code } })));
         toast.success(`${field === "email" ? "Email" : "Username"} updated`);
         onClose();
      } catch (err) {
         setError(err.message);
         setOtp("");
      } finally {
         setBusy(false);
      }
   };

   return (
      <Modal open onClose={onClose} title={`Change ${field}`}>
         {step === "edit" ? (
            <form onSubmit={sendCode} className="space-y-4">
               <Input
                  label={field === "email" ? "New email" : "New username"}
                  icon={field === "email" ? "mail" : "alternate_email"}
                  type={field === "email" ? "email" : "text"}
                  value={value}
                  maxLength={field === "email" ? 100 : 16}
                  onChange={(e) => setValue(e.target.value)}
                  error={error}
                  autoFocus
                  required
               />
               <p className="text-sm text-muted">We&apos;ll send a confirmation code to {user.email}.</p>
               <Button type="submit" loading={busy} className="w-full">Send code</Button>
            </form>
         ) : (
            <div className="space-y-5">
               <p className="text-sm text-muted text-center">
                  Enter the 6-digit code sent to
                  <span className="block font-semibold text-fg break-all">{user.email}</span>
               </p>
               <OtpInput
                  value={otp}
                  error={error}
                  disabled={busy}
                  onChange={(v) => {
                     setOtp(v);
                     if (v.length === 6) confirm(v);
                  }}
               />
               {error && <p className="text-sm text-rose-500 text-center">{error}</p>}
               <Button loading={busy} disabled={otp.length !== 6} className="w-full" onClick={() => confirm(otp)}>
                  Confirm change
               </Button>
            </div>
         )}
      </Modal>
   );
}

export default ProfilePanel;
