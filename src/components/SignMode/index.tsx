import React, { useState } from "react";

import { useAtom } from "jotai";
import { useNavigate } from "react-router-dom";

import UploadMode from "./UploadMode";
import WritingMode from "./WritingMode";
import { MessageTexts } from "../../constants/MessageSetting";
import { messageAtom } from "../../jotai";
import Signatures from "../Signatures";

interface props {
  onlySendBtn?: boolean;
  clickStartSignBtn?: (event: React.MouseEvent<HTMLElement>) => void;
}

const SignMode = ({ onlySendBtn = false, clickStartSignBtn }: props) => {
  // router
  const navigate = useNavigate();
  const [ActiveMenu, setActiveMenu] = useState<number>(0);
  const [, setMessage] = useAtom(messageAtom);

  const handleClickStartBtn = (e: React.MouseEvent<HTMLElement>) => {
    if (clickStartSignBtn) {
      clickStartSignBtn(e);
    } else {
      navigate("/");
    }
  };

  const handleOnlyBtnElement: JSX.Element = onlySendBtn ? (
    ""
  ) : (
    <button
      type="button"
      className="btn-secodary flex-auto"
      onClick={() =>
        setMessage({
          open: true,
          icon: "warn",
          content: MessageTexts.unopened,
        })
      }
    >
      Signatures
    </button>
  );

  const handleSaveBtnMessage = () => {
    setMessage({
      open: true,
      icon: "check",
      content: MessageTexts.create,
    });
  };

  return (
    <div>
      {ActiveMenu === 0 ? (
        <Signatures ActiveMenu={ActiveMenu} setActiveMenu={setActiveMenu} />
      ) : ActiveMenu === 1 ? (
        <WritingMode
          ActiveMenu={ActiveMenu}
          setActiveMenu={setActiveMenu}
          clickStartSignBtn={handleClickStartBtn}
          handleOnlyBtnElement={handleOnlyBtnElement}
          handleSaveBtnMessage={handleSaveBtnMessage}
        />
      ) : (
        <UploadMode
          ActiveMenu={ActiveMenu}
          setActiveMenu={setActiveMenu}
          clickStartSignBtn={handleClickStartBtn}
          handleOnlyBtnElement={handleOnlyBtnElement}
          handleSaveBtnMessage={handleSaveBtnMessage}
        />
      )}
    </div>
  );
};

export default SignMode;
