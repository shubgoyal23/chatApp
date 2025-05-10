import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Modal, Select } from "antd";
import conf from "../../constance/conf";
import { useForm } from "react-hook-form";
import { debounce, set } from "lodash";
import { addConnection } from "../../store/chatSlice";

function CreateGrp() {
   const connections = useSelector((state) => state.chat.connections);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [grpUserName, setGrpUserName] = useState("");
   const [MembersOptions, setMembersOptions] = useState([]);
   const [MembersAdded, setMembersAdded] = useState([]);
   const [err, setErr] = useState(null);
   const dispatch = useDispatch();
   const {
      register,
      handleSubmit,
      formState: { errors },
   } = useForm();

   useEffect(() => {
      let m = Object.values(connections).map((user) => {
         return { value: user._id, label: user.fullname };
      });

      setMembersOptions(m);
   }, [connections]);

   const handleMembers = (value) => {
      if (!value) {
         return;
      }
      setMembersAdded((prevMembers) => [...prevMembers, value[0]]);
   };

   const checkGroupName = async (value) => {
      setErr(null);
      if (!value) {
         return;
      }
      try {
         const response = await fetch(
            `${conf.API_URL}/group/check-group-name`,
            {
               method: "POST",
               credentials: "include",
               headers: {
                  "Content-Type": "application/json",
               },
               body: JSON.stringify({ groupUniqueName: value }),
            }
         );
         const data = await response.json();
         if (data.statusCode == 218) {
            setErr(data.message);
         }
      } catch (error) {
         setErr(error);
         console.error(error);
      }
   };
   const debouncedgrpname = useMemo(() => {
      return debounce(checkGroupName, 300);
   }, []);

   useEffect(() => {
      debouncedgrpname(grpUserName);
      return () => {
         debouncedgrpname.cancel();
      };
   }, [grpUserName]);

   const onSubmit = async (data) => {
      setErr(null);
      let details = {
         groupname: data.groupname,
         groupUniqueName: data.groupUniqueName,
         description: data.description,
         members: MembersAdded,
      };
      try {
         const response = await fetch(`${conf.API_URL}/group/new`, {
            method: "POST",
            credentials: "include",
            headers: {
               "Content-Type": "application/json",
            },
            body: JSON.stringify(details),
         });
         const data = await response.json();
         if (data.statusCode) {
            dispatch(addConnection(data.data));
            setMembersAdded([]);
            setErr(null);
            setIsModalOpen(false);
         }
      } catch (error) {
         setErr(error);
         setMembersAdded([]);
         console.error(error);
      }
   };
   return (
      <div>
         <button
            onClick={() => setIsModalOpen(true)}
            className="text-sm text-gray-600 p-2 gap-1 hover:bg-gray-100 flex justify-start items-center"
         >
            <span className="material-symbols-outlined">group</span>
            Create Group
         </button>
         <div className="z-30">
            <Modal
               title="Create Group"
               open={isModalOpen}
               onCancel={() => setIsModalOpen(false)}
               footer={null}
            >
               <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="mt-8 grid grid-cols-6 gap-6"
               >
                  <div className="col-span-6">
                     {err && <p className="text-red-500 text-sm">{err}</p>}
                  </div>
                  <div className="col-span-6">
                     <p className="text-red-500 text-sm">
                        {err ? err.message : ""}
                     </p>
                  </div>
                  <div className="col-span-6">
                     <label
                        htmlFor="groupname"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                     >
                        Group Name
                     </label>
                     <input
                        type="text"
                        id="groupname"
                        name="groupname"
                        className="mt-1 w-full border-b-2 rounded-md border-gray-200 bg-white text-sm text-gray-700 shadow-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 outline-hidden"
                        {...register("groupname", { required: true })}
                     />
                  </div>
                  <div className="col-span-6">
                     <label
                        htmlFor="groupUniqueName"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                     >
                        Group Username
                     </label>
                     <input
                        type="text"
                        id="groupUniqueName"
                        name="groupUniqueName"
                        placeholder="this will be used to find the group"
                        className="mt-1 w-full border-b-2 rounded-md border-gray-200 bg-white text-sm text-gray-700 shadow-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 outline-hidden"
                        {...register("groupUniqueName", { required: true })}
                        value={grpUserName}
                        onChange={(e) => {
                           setGrpUserName(e.target.value);
                        }}
                     />
                  </div>
                  <div className="col-span-6">
                     <label
                        htmlFor="description"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                     >
                        Description
                     </label>
                     <textarea
                        rows={3}
                        type="text"
                        id="description"
                        name="description"
                        placeholder="Enter group description, Members will be able to see this"
                        className="mt-1 w-full border-b-2 rounded-md border-gray-200 bg-white text-sm text-gray-700 shadow-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 outline-hidden"
                        {...register("description", { required: true })}
                     />
                  </div>
                  <div className="col-span-6">
                     <Select
                        mode="multiple"
                        size={"large"}
                        placeholder="Please select members"
                        value={MembersAdded}
                        onChange={handleMembers}
                        style={{
                           width: "100%",
                        }}
                        options={MembersOptions}
                     />
                  </div>
                  <div className="col-span-6 mb-6">
                     <button
                        type="submit"
                        className="w-full text-white bg-lime-500 hover:bg-lime-600 focus:ring-4 focus:outline-hidden focus:ring-lime-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                     >
                        Create Group
                     </button>
                  </div>
               </form>
            </Modal>
         </div>
      </div>
   );
}

export default CreateGrp;
