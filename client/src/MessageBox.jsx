import React, { useEffect, useState } from "react";
import IndividualMsg from "./IndividualMsg";

function MessageBox({ chatwith }) {
   const [msgList, setMsgList] = useState([]);

   useEffect(() => {
      fetch("api/v1/message/all", {
         method: "POST",
         credentials: "include",
         headers: {
            "Content-Type": "application/json",
         },
         body: JSON.stringify({ to: chatwith._id }),
      })
         .then((res) => res.json())
         .then((data) => {
            setMsgList(data.data);
         })
         .catch((error) => {
            console.log(error);
         });
   }, [chatwith]);

   return (
      <div>
         <div className="h-full w-full overflow-y-scroll">
            {msgList.map((item) => (
               <IndividualMsg key={item._id} data={item} />
            ))}
         </div>
      </div>
   );
}

export default MessageBox;
