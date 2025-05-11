import React from "react";
import { emoji } from "../../../constance/EmojiList";
import Input from "antd/es/input/Input";

function EmojiBox({ onchange }) {
   const [emojiList, setEmojiList] = React.useState([]);
   const [search, setSearch] = React.useState("");
   React.useEffect(() => {
      if (search === "") {
         setEmojiList(emoji);
      } else {
         let filteredEmoji = [];
         emoji.forEach((item) => {
            item?.list?.forEach((emoji) => {
               if (emoji?.name?.toLowerCase().includes(search.toLowerCase())) {
                  let idx = filteredEmoji.findIndex(
                     (item) => item?.title === item?.title
                  );
                  if (idx === -1) {
                     filteredEmoji.push({ title: item?.title, list: [emoji] });
                  } else {
                     filteredEmoji[idx].list.push(emoji);
                  }
               }
            });
         });
         setEmojiList(filteredEmoji);
      }
   }, [search]);
   return (
      <div className="col-span-9">
         <div className="col-span-9 mb-2">
            <Input
               placeholder="Search emoji"
               onChange={(e) => setSearch(e.target.value)}
            />
         </div>
         {emojiList.map((item) => (
            <div key={item.title} className="col-span-9">
               <h2 className="text-xs text-start col-span-9 pl-2.5 pt-2 pb-1">
                  {item.title}
               </h2>
               {item?.list?.map((emoji, index) => (
                  <span
                     className="px-2 py-1 rounded-lg cursor-pointer"
                     key={emoji?.emoji + index}
                     onClick={() => {
                        onchange(emoji?.emoji);
                     }}
                  >
                     {emoji?.emoji}
                  </span>
               ))}
            </div>
         ))}
      </div>
   );
}

export default EmojiBox;
