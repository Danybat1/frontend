/* eslint-disable no-nested-ternary */
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { useAtom } from "jotai";
import { createPortal } from "react-dom";
import { X } from "react-feather";

import { openModalAtom } from "../jotai";

interface props {
  children: JSX.Element;
  childrenClassName?: string;
  small?: boolean;
  open: string;
  setOpen: Function;
}

const InviteesModal = ({
  children,
  childrenClassName = "",
  open,
  setOpen,
  small,
}: props) => {
  const modalEl = small ? null : document.getElementById("Modal");

  const theme = useTheme();

  const screen900 = useMediaQuery(theme?.breakpoints?.down(900));

  const modalContent: JSX.Element = (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        right: 0,
        left: 0,
        bottom: 0,
        zIndex: 901,
      }}
    >
      <div
        className={`h-full w-full backdrop-blur-md ${
          small ? "" : ""
        } bg-[#151515]/[.5]`}
        // onClick={() => setOpen(false)}
      />
      <span
        className={`absolute top-6 right-6 cursor-pointer text-white`}
        onClick={() => setOpen(false)}
      >
        <X size={20} />
      </span>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <Box
          sx={{
            width: screen900 ? "95%!important" : "70%",
            maxWidth: screen900 ? "95%!important" : "70%",
            overflowX: "auto",
          }}
          className={`pointer-events-auto ${childrenClassName}`}
        >
          {children}
        </Box>
      </div>
    </Box>
  );

  return open ? (
    modalEl ? (
      createPortal(modalContent, modalEl)
    ) : (
      modalContent
    )
  ) : (
    <></>
  );
};

export default InviteesModal;
