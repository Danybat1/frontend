/* eslint-disable no-underscore-dangle, func-names */
import { Box } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";

import { useNavigate } from "react-router-dom";

import { ReactComponent as UploadIcon } from "../assets/svg/upload.svg";
import { BASE_URL } from "../constants/api";
import { orientationType, uploadTypeName } from "../constants/EnumType";
import { filesCtx } from "../context/files";
import { guardCtx } from "../context/Guard";

interface props {
  fileSetting: {
    type: uploadTypeName.PDF | uploadTypeName.IMG;
    size: number;
    divHight: string;
  };
  changeFile: (
    file: string | pdfFileType[] | ArrayBuffer | null,
    name: string,
    totalPages?: number
  ) => void;
  setProgressBar?: React.Dispatch<React.SetStateAction<number>>;
}

const DragUpload = ({}) => {
  const fileContext = React?.useContext(filesCtx);

  const fileSetting = fileContext?.fileSetting;
  const setProgressBar = fileContext?.setProgressBar;
  const changeFile = fileContext?.changeFile;

  const judgeFileType = fileContext?.judgeFileType;

  const dragActive = fileContext?.dragActive;
  const setDragActive = fileContext?.setDragActive;

  const uploadError = fileContext?.uploadError;
  const setUploadError = fileContext?.setUploadError;

  // pdf canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctx = fileContext?.ctx;
  const setCtx = fileContext?.setCtx;
  const canvas = fileContext?.canvas;
  const setCanvas = fileContext?.setCanvas;

  useEffect(() => {
    const c = canvasRef.current;
    if (c == null) return;
    setCanvas(c);
    setCtx(c.getContext("2d"));
    setProgressBar?.(0);
  }, [canvasRef]);

  const uploadFile = fileContext?.uploadFile;

  const fileHandleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      // 拖移
      setDragActive(true);
    } else if (e.type === "dragleave") {
      // 拖移離開
      setDragActive(false);
    } else if (e.type === "drop") {
      // 拖移放開
      const {
        dataTransfer: { files },
      } = e;
      uploadFile(files);
    }
  };

  const navigate = useNavigate();

  const setLoadingMap = React?.useContext(guardCtx)?.setLoadingMap;

  const fileChangedHandler = fileContext?.fileChangedHandler;

  return (
    <Box
      className={`relative flex ${
        fileSetting.divHight
      } w-full flex-col items-center justify-center gap-4 
          rounded-md border-2 border-dashed border-black/20 bg-pale-blue 
        text-[#728F9B] ${dragActive ? "bg-green-blue" : undefined}`}
      onDragEnter={fileHandleDrag}
      onDragLeave={fileHandleDrag}
      onDragOver={fileHandleDrag}
      onDrop={fileHandleDrag}
      sx={{
        width: "100%!important",
      }}
    >
      <canvas className="hidden" ref={canvasRef} width={100} height={100} />
      <UploadIcon />
      <p className="text-sm tracking-wider">
        <span className=" flat:hidden">Choisir un fichier</span>
        <input
          id="upload_file"
          type="file"
          name="file"
          accept={judgeFileType ? "application/pdf,.docx,.doc" : "image/*"}
          onChange={(event => {
            sessionStorage?.removeItem("documentId");

            return fileChangedHandler(event)
          })}
        />
        <label
          className="cursor-pointer text-blue underline"
          htmlFor="upload_file"
          style={{
            marginLeft: "1rem",
          }}
        >
          Charger
        </label>
      </p>
      <p className="text-xs tracking-wider">
        <span
          className={`${uploadError === "type" ? "text-alert-red" : undefined}`}
        >
          Formats：
          {judgeFileType ? "PDF" : "PNG, JPEG"}
        </span>
        <span
          className={`${uploadError === "size" ? "text-alert-red" : undefined}`}
        >
          <span className="text-[#B0C3CA]">･</span>≦{fileSetting.size}
          mb{" "}
        </span>
      </p>
    </Box>
  );
};

export default DragUpload;
