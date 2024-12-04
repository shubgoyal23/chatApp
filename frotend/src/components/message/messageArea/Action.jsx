import React from "react";
import { useDispatch } from "react-redux";
import { setReplyto } from "../../../store/chatSlice";

function Action({ data }) {
   const dispatch = useDispatch();
   const setReplyTo = () => {
      dispatch(setReplyto(data));
   };
   return (
      <div className="absolute top-6 right-0 bg-white shadow-md shadow-slate-400 p-2 rounded-lg z-10">
         <h1 onClick={setReplyTo}>Reply</h1>
      </div>
   );
}

export default Action;
