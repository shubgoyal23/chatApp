function EmptyMessageArea({ sidNav, setSideNav }) {
   return (
      <div
         className={`relative flex-1 grow flex flex-col justify-center items-center bg-gradient-to-br from-slate-50 to-indigo-50/30 h-full w-full`}
      >
         <div
            className="absolute top-3 right-3 lg:hidden cursor-pointer w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/80 transition-colors duration-200"
            onClick={() => setSideNav((prev) => !prev)}
         >
            {sidNav ? (
               <span className="material-symbols-outlined text-gray-500">close</span>
            ) : (
               <span className="material-symbols-outlined text-gray-500">menu</span>
            )}
         </div>

         <div className="flex flex-col items-center px-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20">
               <svg
                  className="w-10 h-10 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
               >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
               </svg>
            </div>

            <h1 className="text-3xl font-bold text-gray-800 mb-2">
               Chatzz
            </h1>
            <p className="text-sm text-gray-500 text-center leading-relaxed max-w-xs mb-8">
               Send and receive messages with end-to-end encryption.
               <br />
               Select a conversation to start chatting.
            </p>

            <div className="flex items-center gap-2 text-gray-400 text-xs">
               <svg
                  viewBox="0 0 10 12"
                  height={11}
                  width={9}
                  preserveAspectRatio="xMidYMid meet"
                  version="1.1"
               >
                  <path
                     d="M5.00847986,1.6 C6.38255462,1.6 7.50937014,2.67435859 7.5940156,4.02703389 L7.59911976,4.1906399 L7.599,5.462 L7.75719976,5.46214385 C8.34167974,5.46214385 8.81591972,5.94158383 8.81591972,6.53126381 L8.81591972,9.8834238 C8.81591972,10.4731038 8.34167974,10.9525438 7.75719976,10.9525438 L2.25767996,10.9525438 C1.67527998,10.9525438 1.2,10.4731038 1.2,9.8834238 L1.2,6.53126381 C1.2,5.94158383 1.67423998,5.46214385 2.25767996,5.46214385 L2.416,5.462 L2.41679995,4.1906399 C2.41679995,2.81636129 3.49135449,1.68973395 4.84478101,1.60510326 L5.00847986,1.6 Z M5.00847986,2.84799995 C4.31163824,2.84799995 3.73624912,3.38200845 3.6709675,4.06160439 L3.6647999,4.1906399 L3.663,5.462 L6.35,5.462 L6.35111981,4.1906399 C6.35111981,3.53817142 5.88169076,2.99180999 5.26310845,2.87228506 L5.13749818,2.85416626 L5.00847986,2.84799995 Z"
                     fill="currentColor"
                  />
               </svg>
               Your personal messages are end-to-end encrypted
            </div>
         </div>
      </div>
   );
}

export default EmptyMessageArea;
