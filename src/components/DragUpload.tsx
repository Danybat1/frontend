/* eslint-disable no-underscore-dangle, func-names */
import { Box } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";

import { pdfjs } from "react-pdf";
import { useNavigate } from "react-router-dom";

import { ReactComponent as UploadIcon } from "../assets/svg/upload.svg";
import { orientationType, uploadTypeName } from "../constants/EnumType";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

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

const DragUpload = ({ fileSetting, changeFile, setProgressBar }: props) => {
  /**  true: PDF; false: img */
  const judgeFileType = fileSetting.type === uploadTypeName.PDF;
  const [dragActive, setDragActive] = React.useState(false); // 是否有拖移檔案
  const [uploadError, setUploadError] = useState<"type" | "size" | null>(null); // 錯誤提醒，圖片類型和不超過檔案大小

  // pdf canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (c == null) return;
    setCanvas(c);
    setCtx(c.getContext("2d"));
    setProgressBar?.(0);
  }, [canvasRef]);

  const uploadFile = (file: FileList | null) => {
    if (!file) return;
    const { name, size, type } = file[0];

    // 確認檔案類型
    const imgTypes = ["image/jpeg", "image/jpg", "image/png"];
    const pdfType = ["application/pdf"];

    const fileType = () => {
      if (judgeFileType) return pdfType.includes(type);
      return imgTypes.includes(type);
    };

    if (!fileType()) {
      setUploadError("type");
      setDragActive(false);
    }

    // 確認檔案大小不超過 MB
    if (size / 1024 / 1024 > fileSetting.size) {
      setUploadError("size");
      setDragActive(false);
    }
    setUploadError(null);

    const fileReader = new FileReader(); // FileReader為瀏覽器內建類別，用途為讀取瀏覽器選中的檔案

    if (judgeFileType) {
      // 處理 PDF
      fileReader.onload = function (event) {
        const { result } = event.target as FileReader;

        console.log("document loading info here", { result });

        if (typeof result !== "string" && result !== null && canvas && ctx) {
          const pdfData = new Uint8Array(result);

          // Using DocumentInitParameters object to load binary data.
          const loadingTask = pdfjs.getDocument({ data: pdfData });

          loadingTask.promise.then(
            (pdf) => {
              // Fetch the first page
              const imageDate: pdfFileType[] = [];

              console.log("start processing the pdf file", { pdf });

              for (let i = 1; i <= pdf.numPages; i++) {
                pdf.getPage(i).then((page) => {
                  const scale = 1;

                  const viewport = page.getViewport({ scale });
                  const canvasChild = document.createElement("canvas");
                  canvas.appendChild(canvasChild);
                  const context = canvasChild.getContext("2d");
                  // Prepare canvas using PDF page dimensions
                  canvasChild.height = viewport.height;
                  canvasChild.width = viewport.width;

                  // canvasChild.style.height = viewport.height + "px";
                  // canvasChild.style.width = viewport.width + "px";

                  // Render PDF page into canvas context
                  if (!context) return;
                  const renderContext = {
                    canvasContext: context,
                    viewport,
                  };

                  const renderTask = page.render(renderContext);

                  renderTask.promise.then(() => {
                    // 輸出圖片，使用指定位置不會導致頁面順序不對

                    console.log(
                      "filling the rendering document views",
                      imageDate
                    );

                    imageDate[page._pageIndex] = {
                      orientation:
                        canvasChild.height < canvasChild.width
                          ? orientationType.landscape
                          : orientationType.portrait,
                      dataURL: canvasChild.toDataURL("image/png"),
                      width: viewport.width,
                      height: viewport.height,
                    };

                    setProgressBar?.((imageDate.length / pdf.numPages) * 100);
                  });
                });
              }

              changeFile(imageDate, name, pdf.numPages);
            },
            (reason) => {
              // PDF loading error
              if (process.env.NODE_ENV === "development") {
                console.error(reason);
              }
            }
          );
        }
      };

      console.log("file to be loaded and uploaded from 1st condition", file[0]);

      fileReader.readAsArrayBuffer(file[0]);
    } else {
      // 處理 Img
      fileReader.onload = () => {
        changeFile(fileReader.result, name);
        setDragActive(false);
      };

      console.log("file to be loaded and uploaded from 2nd condition", file[0]);

      fileReader.readAsDataURL(file[0]);
    }
  };

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

  const fileChangedHandler = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;

    console.log("current uploaded file", files[0], {});

    if (["doc", "docx"]?.includes(files[0]?.name?.split(".")?.slice(-1)[0])) {
      const _headers = new Headers();

      _headers?.append("Accept", "application/json");
      _headers?.append(
        "Authorization",
        `Bearer ${sessionStorage?.getItem("token")}`
      );

      const _form = new FormData();

      _form?.append("files", files[0]);

      let filePath = "";
      let fileName = "";

      await lookup(`${process.env?.REACT_APP_API_HOST}/api/upload`, {
        method: "POST",
        headers: _headers,
        body: _form,
      })
        .then((res) =>
          res
            .json()
            .then(async (res) => {
              if ([403, 401]?.includes(res?.error?.status)) {
                navigate("/login", { replace: true });
              } else {
                console.log("received data for conversion", res[0]);

                filePath = res[0]?.url;
                fileName = res[0]?.name;
              }
            })
            .catch((error) => {
              console.log(
                "an error has occured when uploading file for conversion",
                error
              );
            })
        )
        .catch((error) => {
          console.log(
            "an error has occured when uploading file for conversion",
            error
          );
        });

      if (filePath) {
        const _headers = new Headers();

        _headers?.append("Content-Type", "application/json");
        _headers?.append(
          "Authorization",
          `Bearer ${sessionStorage?.getItem("token")}`
        );

        await lookup(`${process.env.REACT_APP_API_HOST}/api/convert`, {
          headers: _headers,
          body: JSON.stringify({
            data: {
              filePath,
            },
          }),
          method: "POST",
        }).then((res) =>
          res.json().then(async (res) => {
            if ([403, 401]?.includes(res?.error?.status)) {
              navigate("/login", { replace: true });
            } else {
              console.log("received data after conversion file upload", res);

              let fileBlob = "";

              const _headers = new Headers();

              _headers?.append("Content-Type", "application/json");
              _headers?.append(
                "Authorization",
                `Bearer ${sessionStorage?.getItem("token")}`
              );

              await lookup(
                `${process.env?.REACT_APP_API_HOST}${res?.pdfFilePath}`,
                {
                  headers: _headers,
                  method: "GET",
                }
              )
                .then((res) =>
                  res
                    ?.blob()
                    .then((data) => {
                      fileBlob = data;
                    })
                    .catch((error) => {
                      console.log(
                        "an error has occured when getting file",
                        error
                      );
                    })
                )
                .catch((error) => {
                  console.log("an error has occured when getting file", error);
                });

              const file = new File(
                [fileBlob],
                fileName?.replace(".docx", ".pdf")?.replace(".doc", ".pdf"),
                {
                  type: "application/pdf",
                }
              );

              console.log("will consider aupload after conversion", {
                fileName,
                filePath,
                file,
              });

              uploadFile([file]);
            }
          })
        );
      } else {
        console.log("no file path could be found");
      }
    } else {
      uploadFile(files);
    }
  };

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
          onChange={fileChangedHandler}
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
