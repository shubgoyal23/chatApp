function Logo({ className = "size-10" }) {
   return (
      <div className={`${className} brand-gradient rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30`}>
         <svg viewBox="0 0 24 24" className="w-3/5 h-3/5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 20.5l1.6-4.6A8.4 8.4 0 1 1 21 11.5z" />
            <path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" strokeWidth="2.6" />
         </svg>
      </div>
   );
}

export default Logo;
