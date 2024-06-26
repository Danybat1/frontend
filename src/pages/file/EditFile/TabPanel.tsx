// component defintion

import * as React from "react";

import { Box } from "@mui/material";
import Cosigners from "../../../components/Cosigners";
import TagField from "./TabPanel/TagField";
import TagSign from "./TabPanel/TagSign";
import SelectSignee from "../../../components/SelectSignee";
import { currDocumentCtx } from "../../../context/currDocument";
import NotifsFields from "../NotifsFields";
import AttachedFiles from "../../../components/AttachedFiles";
import { paraphCtx } from "../../paraph";

const TabPanel = ({ uploadFinalFile, setNotifications, notifications }) => {
  const [isDocumentNew, setIsDocumentNew] = React.useState(false);

  const isParaph = React?.useContext(paraphCtx)?.isParaph;

  React?.useEffect(() => {
    console.log("current pathname string", window?.location?.pathname);

    if (window?.location?.pathname?.includes("new-document")) {
      setIsDocumentNew(true);
    }
  }, []);

  // console.log("received document status", { isDocumentNew });

  const annexContext = sessionStorage?.getItem("annexes-data")?.length > 1;

  return (
    <Box
      className="flat-list flex flex-col gap-8 flat:flex-row flat:px-6"
      sx={{
        maxHeight: "calc(100vh - 180px)",
        overflowY: "auto",
        overflowX: "hidden",
        pb: "2rem",
      }}
    >
      {isDocumentNew && !annexContext ? (
        <NotifsFields
          setNotifications={setNotifications}
          notifications={notifications}
        />
      ) : (
        ""
      )}
      <TagSign uploadFinalFile={uploadFinalFile} />
      {isDocumentNew && !annexContext ? <TagField /> : ""}
      <Cosigners />
      <AttachedFiles />
    </Box>
  );
};

export default TabPanel;
