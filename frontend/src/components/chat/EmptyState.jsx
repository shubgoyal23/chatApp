import Logo from "../ui/Logo";
import Icon from "../ui/Icon";

function EmptyState() {
   return (
      <div className="flex-1 flex flex-col items-center justify-center chat-pattern px-8 text-center">
         <div className="relative">
            <div className="absolute -inset-8 rounded-full bg-indigo-500/10 blur-2xl" />
            <Logo className="relative size-20 rounded-3xl" />
         </div>
         <h1 className="mt-8 text-3xl font-bold tracking-tight text-fg">Chatzz for web</h1>
         <p className="mt-3 max-w-sm text-muted leading-relaxed">
            Pick a conversation from the list, or search for someone to start a new chat.
         </p>
         <div className="mt-8 grid grid-cols-3 gap-3 max-w-md w-full">
            {[
               ["chat", "Message"],
               ["call", "Voice call"],
               ["videocam", "Video call"],
            ].map(([icon, label]) => (
               <div key={icon} className="rounded-2xl bg-surface border border-line p-4">
                  <Icon name={icon} className="text-indigo-500" />
                  <p className="mt-1 text-xs font-medium text-muted">{label}</p>
               </div>
            ))}
         </div>
         <p className="mt-10 inline-flex items-center gap-1.5 text-xs text-subtle">
            <Icon name="lock" size={14} /> Messages are encrypted in transit
         </p>
      </div>
   );
}

export default EmptyState;
