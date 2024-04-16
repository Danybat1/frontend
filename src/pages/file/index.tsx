import * as React from "react";

import { useEffect, useState } from "react";

import { PrimitiveAtom, useAtom } from "jotai";
import { pdfjs } from "react-pdf";

import EditFile from "./EditFile";
import FinishFile from "./FinishFile";
import FinishUpload from "./FinishUpload";
import DragUpload from "../../components/DragUpload";
import Intro from "../../components/Intro";
import { FileNameDefault } from "../../constants/FileSetting";
import { fileAtom } from "../../jotai";
import Layout from "../../components/Layout";
import { Box, Stack } from "@mui/material";
import { filesCtx } from "../../context/files";
import ConfigureParaph from "./ConfigureParaph";
import { useNavigate } from "react-router-dom";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const File = () => {
  const fileContext = React?.useContext(filesCtx);

  const [stepMenu, setStepMenu] = useState<number>(0);
  const pdfURL = fileContext?.pdfURL;
  const setPdfURL = fileContext?.setPdfURL;

  const pdfName = fileContext?.pdfName;
  const setPdfName = fileContext?.setPdfName;
  const totalPages = fileContext?.totalPages;
  const setTotalPages = fileContext?.setTotalPages;
  const progressBar = fileContext?.progressBar;
  const setProgressBar = fileContext?.setProgressBar;
  const [finishPdf, setFinishPdf] = useState<(HTMLCanvasElement | null)[]>([]); // get finish pdf

  React?.useEffect(() => {
    document.body.classList.add("file");
    document.body.classList.remove("sign");

    sessionStorage?.removeItem("document-ctx");
    sessionStorage?.removeItem("currDocId");

    return () => {
      console?.clear();

      console?.log("current pdf url o be removed", { pdfURL });
      setPdfURL(null);
    };
  }, []);

  const navigate = useNavigate();

  React?.useEffect(() => {
    sessionStorage.setItem("collabs", "[]");
    sessionStorage.setItem("versions-queue", "[]");
  }, []);

  React.useEffect(() => {
    if (
      pdfURL &&
      (!(sessionStorage?.getItem("annexes-data")?.length > 1) || true)
    ) {
      return setStepMenu(1);
    } else if (sessionStorage?.getItem("annexes-data")?.length > 1 && pdfURL) {
      // navigate("/mydocuments/new-document/annexes");
    }

    return undefined;
  }, [pdfURL]);

  const previousMenu = () => {
    switch (stepMenu) {
      case 1:
        setPdfURL(null);
        break;

      default:
        break;
    }
    setStepMenu((perv) => perv - 1);
  };

  const cancelUpload = () => {
    previousMenu();
    setProgressBar(0);
  };

  const nextMenu = () => {
    setStepMenu((perv) => perv + 1);
  };

  const cancelFile = () => {
    setStepMenu(0);
    setPdfURL(null);
    setPdfName(FileNameDefault);
  };

  const fileElement: { [index: number]: JSX.Element } = {
    0: (
      <Box
        className="card-box w-full p-5"
        sx={{
          width: "100%!important",
        }}
      >
        <DragUpload />
      </Box>
    ),
    1: (
      <FinishUpload
        pdfName={pdfName}
        setPdfName={setPdfName}
        previousMenu={previousMenu}
        cancelUpload={cancelUpload}
        nextMenu={nextMenu}
        progressBar={progressBar}
      />
    ),
    2: (
      <EditFile
        key={window?.location?.pathname}
        pdfName={pdfName}
        setPdfName={setPdfName}
        cancelFile={cancelFile}
        totalPages={totalPages}
        nextMenu={nextMenu}
        finishPdf={finishPdf}
        getCanvasItem={(canvasItem) => setFinishPdf(canvasItem)}
      />
    ),
    3: (
      <FinishFile
        pdfName={pdfName}
        setPdfName={setPdfName}
        finishPdf={finishPdf}
        totalPages={totalPages}
      />
    ),
  };

  return (
    <Layout>
      <Box
        component={"main"}
        id="File"
        className={`${stepMenu === 2 ? "w-screen justify-start" : undefined}`}
        sx={{
          width: "100%!important",
        }}
      >
        {fileElement[stepMenu]}
      </Box>
    </Layout>
  );
};

export default File;
