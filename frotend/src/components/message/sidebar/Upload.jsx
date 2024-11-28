import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { login } from "../../../store/loginSlice";
function Upload() {
   const [file, setfile] = useState(null);
   const [loading, setLoading] = useState(false);
   const dispatch = useDispatch();

   function handleFileUpload() {
      setLoading(true);
      const formData = new FormData();
      formData.append("avatar", file);

      fetch("/api/v1/users/avatar-upload", {
         method: "POST",
         credentials: "include",
         body: formData,
      })
         .then((res) => res.json())
         .then((data) => {
            dispatch(login(data?.data));
         })
         .catch((error) => console.error("Error uploading file:", error))
         .finally(() => {
            setLoading(false);
            setfile(null);
         });
   }
   return (
      <>
         <div className="flex flex-col h-60 items-center justify-center w-full">
            {!file && (
               <div className="flex items-center justify-center w-full">
                  <label
                     htmlFor="dropzone-file"
                     className="flex flex-col items-center justify-center w-full h-60 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
                  >
                     <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg
                           className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
                           aria-hidden="true"
                           xmlns="http://www.w3.org/2000/svg"
                           fill="none"
                           viewBox="0 0 20 16"
                        >
                           <path
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                           />
                        </svg>
                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                           <span className="font-semibold">
                              Click to upload
                           </span>{" "}
                           or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                           SVG, PNG, JPG or GIF (MAX. 800x400px)
                        </p>
                     </div>
                     <input
                        id="dropzone-file"
                        type="file"
                        className="hidden"
                        onChange={(e) => setfile(e.target.files[0])}
                     />
                  </label>
               </div>
            )}
            {file && (
               <div className="flex justify-between items-center gap-6">
                  {" "}
                  <p className="text-center">File: {file.name}</p>{" "}
                  <span
                     className="text-red-600 font-bold cursor-pointer"
                     onClick={() => setfile(null)}
                  >
                     X
                  </span>
               </div>
            )}

            {file && (
               <button
                  className="h-10 w-52 mt-5 text-red-500 flex justify-center items-center border-2 rounded-full cursor-pointer hover:font-bold font-semibold border-lime-500 shadow-lg bg-lime-400"
                  onClick={handleFileUpload}
                  disabled={loading}
               >
                  {loading ? "Uploading..." : "Upload"}
               </button>
            )}
         </div>
      </>
   );
}

export default Upload;
