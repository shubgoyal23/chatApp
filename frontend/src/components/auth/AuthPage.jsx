import { useState } from "react";
import Logo from "../ui/Logo";
import Icon from "../ui/Icon";
import Login from "./Login";
import Register from "./Register";
import VerifyEmail from "./VerifyEmail";
import ForgotPassword from "./ForgotPassword";

const FEATURES = [
   { icon: "bolt", title: "Real-time", text: "Messages arrive instantly, even across devices." },
   { icon: "lock", title: "Encrypted transport", text: "Every frame is AES-GCM encrypted in transit." },
   { icon: "videocam", title: "HD calls", text: "Crystal-clear voice and video calling." },
   { icon: "groups", title: "Groups", text: "Bring everyone together in one place." },
];

function AuthPage() {
   // login | register | verify | forgot
   const [view, setView] = useState("login");
   const [pending, setPending] = useState(null);

   const needVerification = (account) => {
      setPending(account);
      setView("verify");
   };

   return (
      <div className="min-h-full w-full flex bg-app">
         {/* Showcase panel */}
         <aside className="hidden lg:flex relative w-[46%] overflow-hidden brand-gradient text-white">
            <div className="absolute -top-24 -left-24 size-96 rounded-full bg-white/15 blur-3xl animate-blob" />
            <div className="absolute bottom-0 right-0 size-[28rem] rounded-full bg-fuchsia-400/30 blur-3xl animate-blob [animation-delay:-7s]" />
            <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
               <div className="flex items-center gap-3">
                  <div className="size-11 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center ring-1 ring-white/30">
                     <Icon name="forum" fill size={24} />
                  </div>
                  <span className="text-2xl font-extrabold tracking-tight">Chatzz</span>
               </div>

               <div>
                  <h1 className="text-5xl xl:text-6xl font-extrabold leading-[1.05] tracking-tight">
                     Talk to the people
                     <br />
                     who matter.
                  </h1>
                  <p className="mt-5 text-lg text-white/80 max-w-md">
                     Fast messaging, group chats and calls — beautifully simple and private by default.
                  </p>

                  {/* floating preview bubbles */}
                  <div className="mt-10 space-y-3 max-w-sm">
                     <div className="w-fit max-w-[80%] px-4 py-2.5 rounded-2xl rounded-bl-md bg-white/20 backdrop-blur ring-1 ring-white/25 animate-pop-in">
                        Hey! Are we still on for tonight? 🎉
                     </div>
                     <div className="ml-auto w-fit max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-md bg-white text-indigo-700 font-medium shadow-xl animate-pop-in [animation-delay:150ms]">
                        Absolutely — video call at 8?
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  {FEATURES.map((f) => (
                     <div key={f.title} className="rounded-2xl bg-white/10 ring-1 ring-white/20 p-4 backdrop-blur">
                        <Icon name={f.icon} fill size={22} />
                        <p className="mt-2 font-semibold">{f.title}</p>
                        <p className="text-sm text-white/75 leading-snug">{f.text}</p>
                     </div>
                  ))}
               </div>
            </div>
         </aside>

         {/* Form panel */}
         <main className="flex-1 flex items-center justify-center px-5 py-10 sm:px-8">
            <div className="w-full max-w-[420px] animate-pop-in">
               <div className="flex items-center gap-3 mb-8 lg:hidden">
                  <Logo className="size-11" />
                  <span className="text-2xl font-extrabold tracking-tight text-fg">Chatzz</span>
               </div>

               {(view === "login" || view === "register") && (
                  <div className="grid grid-cols-2 p-1 mb-8 rounded-2xl bg-surface-2 border border-line">
                     {["login", "register"].map((v) => (
                        <button
                           key={v}
                           onClick={() => setView(v)}
                           className={`h-10 rounded-xl text-sm font-semibold transition-all ${
                              view === v ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg"
                           }`}
                        >
                           {v === "login" ? "Sign in" : "Create account"}
                        </button>
                     ))}
                  </div>
               )}

               {view === "login" && (
                  <Login onForgot={() => setView("forgot")} onNeedVerification={needVerification} />
               )}
               {view === "register" && <Register onRegistered={needVerification} />}
               {view === "verify" && <VerifyEmail account={pending} onBack={() => setView("login")} />}
               {view === "forgot" && <ForgotPassword onDone={() => setView("login")} />}
            </div>
         </main>
      </div>
   );
}

export default AuthPage;
