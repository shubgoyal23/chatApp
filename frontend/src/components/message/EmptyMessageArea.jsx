function EmptyMessageArea({ sidNav, setSideNav }) {
   return (
      <div
         className={`relative flex-1 grow border-r-2 border-gray-300 flex flex-col justify-center items-center bg-gray-100 h-full w-full`}
      >
         <div
            className="absolute top-2 right-2 lg:hidden cursor-pointer"
            onClick={() => setSideNav((prev) => !prev)}
         >
            {sidNav ? (
               <span className="material-symbols-outlined">close</span>
            ) : (
               <span className="material-symbols-outlined">menu</span>
            )}
         </div>

         <div className="">
            <div className="">
               <div
                  className="flex justify-center items-center"
                  style={{ opacity: 1 }}
               ></div>
               <div className="" style={{ opacity: 1 }}>
                  <div className="text-4xl text-gray-700 text-center mt-10">
                     <h1>Chatzz</h1>
                  </div>
                  <div className="text-sm text-gray-700 text-center mt-6">
                     Send and receive messages without worrying about security
                     <br />
                     Use Chatzz on up to 4 linked devices and 1 phone at the
                     same time.
                  </div>
               </div>
               <div className="flex justify-center items-center gap-2 text-gray-600 mt-10">
                  <span data-icon="lock-small" className="">
                     <svg
                        viewBox="0 0 10 12"
                        height={12}
                        width={10}
                        preserveAspectRatio="xMidYMid meet"
                        className=""
                        version="1.1"
                     >
                        <title>lock-small</title>
                        <path
                           d="M5.00847986,1.6 C6.38255462,1.6 7.50937014,2.67435859 7.5940156,4.02703389 L7.59911976,4.1906399 L7.599,5.462 L7.75719976,5.46214385 C8.34167974,5.46214385 8.81591972,5.94158383 8.81591972,6.53126381 L8.81591972,9.8834238 C8.81591972,10.4731038 8.34167974,10.9525438 7.75719976,10.9525438 L2.25767996,10.9525438 C1.67527998,10.9525438 1.2,10.4731038 1.2,9.8834238 L1.2,6.53126381 C1.2,5.94158383 1.67423998,5.46214385 2.25767996,5.46214385 L2.416,5.462 L2.41679995,4.1906399 C2.41679995,2.81636129 3.49135449,1.68973395 4.84478101,1.60510326 L5.00847986,1.6 Z M5.00847986,2.84799995 C4.31163824,2.84799995 3.73624912,3.38200845 3.6709675,4.06160439 L3.6647999,4.1906399 L3.663,5.462 L6.35,5.462 L6.35111981,4.1906399 C6.35111981,3.53817142 5.88169076,2.99180999 5.26310845,2.87228506 L5.13749818,2.85416626 L5.00847986,2.84799995 Z"
                           fill="currentColor"
                        />
                     </svg>
                  </span>{" "}
                  Your personal messages are end-to-end encrypted
               </div>
            </div>
         </div>
      </div>
   );
}

export default EmptyMessageArea;
