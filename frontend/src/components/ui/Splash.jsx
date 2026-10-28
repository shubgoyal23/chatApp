import Logo from "./Logo";

function Splash({ label = "Loading" }) {
   return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-6 bg-app">
         <div className="relative">
            <div className="absolute inset-0 rounded-2xl brand-gradient animate-ring" />
            <Logo className="size-16 relative" />
         </div>
         <p className="text-sm font-medium text-muted tracking-wide">{label}…</p>
      </div>
   );
}

export default Splash;
