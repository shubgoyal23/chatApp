import { useState } from "react";
import { Cloudinay_URL } from "../../constance/data";
import { colorFor, initials } from "../../lib/format";
import Icon from "./Icon";

const SIZES = {
   xs: "size-7 text-[11px]",
   sm: "size-9 text-xs",
   md: "size-11 text-sm",
   lg: "size-14 text-base",
   xl: "size-24 text-2xl",
   "2xl": "size-32 text-3xl",
};

const DOT = {
   xs: "size-2.5",
   sm: "size-3",
   md: "size-3.5",
   lg: "size-4",
   xl: "size-5",
   "2xl": "size-6",
};

function Avatar({ user, size = "md", online = false, className = "" }) {
   const [broken, setBroken] = useState(null);
   const [from, to] = colorFor(user?._id);
   const isGroup = user?.accountType === "group";
   const showImage = user?.avatar && broken !== user.avatar;

   return (
      <div className={`relative shrink-0 rounded-full ${SIZES[size]} ${className}`}>
         {showImage ? (
            <img
               src={`${Cloudinay_URL}/${user.avatar}`}
               alt=""
               loading="lazy"
               onError={() => setBroken(user.avatar)}
               className="size-full rounded-full object-cover object-top bg-surface-3"
            />
         ) : (
            <div
               className="size-full rounded-full flex items-center justify-center font-semibold text-white select-none"
               style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
            >
               {isGroup ? <Icon name="group" fill size="1.35em" /> : initials(user?.fullname)}
            </div>
         )}
         {online && (
            <span
               className={`absolute bottom-0 right-0 ${DOT[size]} rounded-full bg-emerald-500 ring-2 ring-surface`}
            />
         )}
      </div>
   );
}

export default Avatar;
