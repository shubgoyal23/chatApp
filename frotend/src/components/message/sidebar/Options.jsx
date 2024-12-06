import React from "react";
import { SmileOutlined } from "@ant-design/icons";
import { Dropdown, Space } from "antd";
import CreateGrp from "../../group/CreateGrp";
const items = [
   {
      key: "1",
      label: (
        <CreateGrp />
      ),
   },
];
function Options() {
   return (
      <Dropdown
         menu={{
            items,
         }}
      >
         <Space>
            <a onClick={(e) => e.preventDefault()}>
               <span className="material-symbols-outlined ">more_vert</span>
            </a>
         </Space>
      </Dropdown>
   );
}

export default Options;
