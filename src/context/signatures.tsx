// context defitnion

import * as React from "react";
import { useNavigate } from "react-router-dom";

import { useAtom } from "jotai";
import { signAtom } from "../jotai";
import { guardCtx } from "./Guard";

const signaturesCtx = React?.createContext({});

const SignaturesContext = ({ children }) => {
  const [signatures, setSignatures] = React?.useState([]);

  const navigate = useNavigate();

  return (
    <signaturesCtx.Provider value={{ signatures, setSignatures }}>
      {children}
    </signaturesCtx.Provider>
  );
};

export { signaturesCtx };

export default SignaturesContext;
