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
            sidNav ? "left-0" : "-left-[1020px]"
         } lg:left-0 absolute h-svh lg:relative w-screen transition-all ease-in duration-300 z-10 bg-white lg:w-96 border-r-2 border-gray-300 flex flex-col`}
      >
         <div className="relative w-full px-4 py-2 flex justify-between bg-gray-100">
            <div className="flex items-center gap-4">
               <div
                  className="size-10 cursor-pointer"
                  onClick={() => {
                     setEdit((prev) => !prev);
                  }}
               >
                  <img
                     src={`${Cloudinay_URL}/${
                        user?.avatar || avatar_public_ids[0]
                     }`}
                     alt="avatar"
                     className="size-10 object-cover object-top	rounded-full"
                  />
               </div>
               <h1
                  className="text-xl font-sans capitalize"
                  onClick={() => {
                     setEdit((prev) => !prev);
                  }}
               >
                  {user?.fullname || "Anonymous"}
               </h1>
               <Edituser edit={edit} setEdit={setEdit} />
            </div>

            <div className="relative hidden lg:flex justify-center cursor-pointer items-center text-xl">
               <Options />
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
         <div className="relative w-full h-14 px-4 py-2 border-gray-200 border-b-2 shadow-xs">
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
                  className="outline-hidden bg-transparent pl-4 w-[90%]"
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
