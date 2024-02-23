import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import UserLabel from "./UserLabel";
import { debounce } from "lodash";

function Sidebar({sidNav, setSideNav}) {
   const [search, setSearch] = useState("");
   const [findlist, setFindList] = useState([]);
   const [cache, setCache] = useState({});
   const user = useSelector((state) => state.login.userdata);
   useEffect(() => {
      
      const userContacted = () => {
         fetch("/api/v1/message/contacts", {
            method: "POST",
            credentials: "include",
            headers: {
               "Content-Type": "application/json",
            },
         })
         .then((res) => res.json())
         .then((data) => {
            setFindList(data.data);         
         })
         .catch((error) => console.error(error));
      };

      const findusers = () => {
         fetch("/api/v1/users/list", {
            method: "POST",
            credentials: "include",
            headers: {
               "Content-Type": "application/json",
            },
            body: JSON.stringify({ fullname: search }),
         })
         .then((res) => res.json())
         .then((data) => {
            setFindList(data.data);
            setCache((prev) => ({ ...prev, [search]: data.data }));
         })
         .catch((error) => console.error(error));
      };
      
      const debouncedFindUsers = debounce(findusers, 300);
      
      if (search == "") {
         userContacted()
         //setFindList([]);
      } else {
         if (cache[search]) {
            setFindList(cache[search]);
         } else {
            debouncedFindUsers();
         }
      }
      return () => {
         debouncedFindUsers.cancel();
      };
   }, [search]);

   return (
      <div className={`${sidNav? "left-0" : "-left-[1020px]"} lg:left-0 absolute h-screen lg:relative w-screen transition-all ease-in duration-300 z-10 bg-white lg:w-96 border-r-2 border-gray-300 flex flex-col`}>
         <div className="w-full px-4 py-2 flex justify-between bg-gray-100">
            <div className="flex items-center gap-4">
               <div className="size-10">
                  <img src="./avatar2.svg" alt="avatar" className="w-full" />
               </div>
               <h1 className="text-xl font-sans capitalize">
                  {user?.fullname || "anonymous"}
               </h1>
            </div>

            <div className="hidden lg:flex justify-center items-center text-xl">
               <span className="material-symbols-outlined ">more_vert</span>
            </div>

            <button
               className=" lg:hidden"
               onClick={() => setSideNav((prev) => !prev)}
            >
               <span className="material-symbols-outlined">
                  {sidNav ? "close" : "menu"}
               </span>
            </button>
         </div>
         <div className="relative w-full h-14 px-4 py-2 border-gray-200 border-b-2 shadow-sm">
            <form
               className="h-10 w-full flex justify-center items-center px-4 rounded-lg bg-gray-100"
               onSubmit={(e) => e.preventDefault()}
            >
               <button className="flex justify-center items-center">
                  <span className="material-symbols-outlined">
                     {search ? "arrow_left_alt" : "search"}
                  </span>
               </button>
               <input
                  type="text"
                  placeholder="Search"
                  className="outline-none bg-transparent pl-4 w-[90%]"
                  value={search}
                  onChange={(e) => {
                     setSearch(e.target.value);
                  }}
               />
               <button
                  type="button"
                  className="flex justify-center items-center"
                  onClick={() => {
                     setSearch("");
                  }}
               >
                  <span className="material-symbols-outlined">
                     {search ? "close" : ""}
                  </span>
               </button>
            </form>
         </div>
         <div className="w-full flex-auto border-gray-200 border-b-2 overflow-y-scroll scroll-smooth pt-2">
            {findlist.map((item) => (
               <UserLabel key={item._id} data={item} setSideNav={setSideNav} />
            ))}
         </div>
      </div>
   );
}

export default Sidebar;
