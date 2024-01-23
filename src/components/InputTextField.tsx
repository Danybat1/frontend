import React, { useRef } from "react";

import { ReactComponent as EditIcon } from "../assets/svg/edit.svg";
import { documentsCtx } from "../context/documents";

interface props {
  InputValue: string;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
}

const InputTextField = ({ InputValue, setInputValue }: props) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const ownDocuments = React?.useContext(documentsCtx)?.documents?.own;

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

export default InputTextField;
