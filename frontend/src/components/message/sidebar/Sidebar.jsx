import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { debounce } from "lodash";
import { Cloudinay_URL, avatar_public_ids } from "../../../constance/data";
import Edituser from "./Edituser";
import UserLabel from "./UserLabel";
import { addConnection, setConnections } from "../../../store/chatSlice";
import conf from "../../../constance/conf";
import Options from "./Options";

function Sidebar({ sidNav, setSideNav }) {
   const [search, setSearch] = useState("");
   const [findlist, setFindList] = useState([]);
   const [cache, setCache] = useState({});
   const [edit, setEdit] = useState(false);
   const dispatch = useDispatch();

   const user = useSelector((state) => state.login.userdata);
   const Connections = useSelector((state) => state.chat.connections);
   const messagesQue = useSelector((state) => state.chat.messagesQue);

   useEffect(() => {
      let newlist = Object.keys(messagesQue).filter((item) => {
         let val = findlist.find((val) => val._id === item);
         if (!val) {
            return true;
         }
      });
      if (newlist.length > 0) {
         for (let i = 0; i < newlist.length; i++) {
            if (newlist[i] === user?._id) return;
            fetch(`${conf.API_URL}/users/info?id=${newlist[i]}`, {
               method: "GET",
               credentials: "include",
               headers: {
                  "Content-Type": "application/json",
               },
            })
               .then((res) => res.json())
               .then((data) => {
                  setFindList((list) => [...list, data.data]);
                  dispatch(addConnection(data.data));
               })
               .catch((error) => console.error(error));
         }
      }
   }, [messagesQue]);

   useEffect(() => {
      fetch(`${conf.API_URL}/message/contacts`, {
         method: "POST",
         credentials: "include",
         headers: {
            "Content-Type": "application/json",
         },
      })
         .then((res) => res.json())
         .then((data) => {
            let list = data?.data?.filter((item) => item._id !== user?._id);
            setFindList(list);
            dispatch(setConnections(list));
         })
         .catch((error) => console.error(error));
   }, []);

   const findusers = (search) => {
      fetch(`${conf.API_URL}/users/list`, {
         method: "POST",
         credentials: "include",
         headers: {
            "Content-Type": "application/json",
         },
         body: JSON.stringify({ fullname: search }),
      })
         .then((res) => res.json())
         .then((data) => {
            let list = data?.data?.filter((item) => item._id !== user._id);
            setFindList(list);
            setCache((prev) => ({ ...prev, [search]: data.data }));
         })
         .catch((error) => console.error(error));
   };

   const debouncedFindUsers = useMemo(() => {
      return debounce(findusers, 300);
   }, []);

   useEffect(() => {
      if (search === "") {
         let list = [];
         Object.values(Connections).forEach((value) => {
            list.push(value);
         });
         setFindList(list);
      } else {
         if (cache[search]) {
            setFindList(cache[search]);
         } else {
            debouncedFindUsers(search);
         }
      }
      return () => {
         debouncedFindUsers.cancel();
      };
   }, [search, cache, debouncedFindUsers, Connections]);

   return (
      <div
         className={`${
            sidNav ? "left-0" : "-left-full"
         } lg:left-0 absolute h-svh lg:relative w-screen transition-all ease-out duration-300 z-10 bg-white lg:w-100 border-r border-gray-200 flex flex-col`}
      >
         {/* Header */}
         <div className="relative w-full px-4 py-3 flex justify-between items-center bg-white border-b border-gray-100">
            <div className="flex items-center gap-3">
               <div
                  className="size-10 cursor-pointer group"
                  onClick={() => {
                     setEdit((prev) => !prev);
                  }}
               >
                  <img
                     src={`${Cloudinay_URL}/${
                        user?.avatar || avatar_public_ids[0]
                     }`}
                     alt="avatar"
                     className="size-10 object-cover object-top rounded-full ring-2 ring-indigo-100 group-hover:ring-indigo-300 transition-all duration-200"
                  />
               </div>
               <h1
                  className="text-base font-semibold capitalize cursor-pointer text-gray-800 hover:text-indigo-600 transition-colors duration-200"
                  onClick={() => {
                     setEdit((prev) => !prev);
                  }}
               >
                  {user?.fullname || "Anonymous"}
               </h1>
               <Edituser edit={edit} setEdit={setEdit} />
            </div>

            <div className="relative hidden lg:flex justify-center cursor-pointer items-center">
               <Options />
            </div>

            <button
               className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-200"
               onClick={() => setSideNav((prev) => !prev)}
            >
               <span className="material-symbols-outlined text-gray-600">
                  {sidNav ? "close" : "menu"}
               </span>
            </button>
         </div>

         {/* Search */}
         <div className="relative w-full px-3 py-2 border-b border-gray-100">
            <form
               className="h-10 w-full flex justify-center items-center px-3 rounded-xl bg-gray-100/80 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-200 border border-transparent transition-all duration-200"
               onSubmit={(e) => e.preventDefault()}
            >
               <button className="flex justify-center items-center text-gray-400">
                  <span className="material-symbols-outlined text-xl">
                     {search ? "arrow_left_alt" : "search"}
                  </span>
               </button>
               <input
                  type="text"
                  placeholder="Search or start new chat"
                  className="outline-hidden bg-transparent pl-3 w-full text-sm text-gray-700 placeholder:text-gray-400"
                  value={search}
                  onChange={(e) => {
                     setSearch(e.target.value);
                  }}
               />
               {search && (
                  <button
                     type="button"
                     className="flex justify-center items-center text-gray-400 hover:text-gray-600 transition-colors"
                     onClick={() => {
                        setSearch("");
                     }}
                  >
                     <span className="material-symbols-outlined text-xl">
                        close
                     </span>
                  </button>
               )}
            </form>
         </div>

         {/* User list */}
         <div className="w-full flex-auto overflow-y-scroll scroll-smooth">
            {findlist.map((item) => (
               <UserLabel key={item._id} data={item} setSideNav={setSideNav} />
            ))}
         </div>
      </div>
   );
}

export default Sidebar;
