import { Box } from "@mui/material";
import React from "react";

import { SignMenuName } from "../../../constants/EnumType";

interface props {
  ActiveMenu: number;
  setActiveMenu: React.Dispatch<React.SetStateAction<number>>;
}

const MenuHorizontal = ({ ActiveMenu, setActiveMenu }: props) => (
  <Box
    component={"ul"}
    className="mb-6 flex gap-4 border-b border-solid border-b-black/20 px-8"
    sx={{
      "& li": {
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOVerflow: "ellipsis",
      },
    }}
  >
    {SignMenuName.map((item: string, idx: number) => (
      <li
        key={item}
        className={`cursor-pointer p-2 text-black/50 hover:text-blue ${
          ActiveMenu === idx && "border-b border-solid border-b-blue text-blue"
        }`}
        onClick={() => {
          console.log("current tab idx", { idx });

          setActiveMenu(idx);
        }}
      >
        {item}
      </li>
    ))}
  </Box>
);

export default MenuHorizontal;
