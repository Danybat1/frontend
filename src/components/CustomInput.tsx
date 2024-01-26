// custom input component definition

import * as React from "react";
import { Stack, Box, useTheme } from "@mui/material";

const CustomInput = ({}) => {
  return (
    <div className="text-field">
      <input
        type="text"
        className="w-full"
        value={InputValue}
        onChange={(e) => setInputValue(e.target.value)}
        ref={inputRef}
        disabled={
          !ownDocuments?.some(
            (doc) =>
              doc?.id?.toString() ===
              JSON.parse(sessionStorage?.getItem("document-ctx"))?.data?.id
          ) && sessionStorage?.getItem("document-ctx")?.length > 0
        }
      />
      <span className="cursor-pointer" onClick={handleClick}>
        <EditIcon className="stroke-black" />
      </span>
    </div>
  );
};

export default CustomInput;
