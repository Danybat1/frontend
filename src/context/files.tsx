// constext definition

import * as React from "react";
import { orientationType, uploadTypeName } from "../constants/EnumType";
import { pdfjs } from "react-pdf";
import { BASE_URL } from "../constants/api";

import { useNavigate } from "react-router-dom";
import { guardCtx } from "./Guard";
import { fileAtom } from "../jotai";
import { useAtom } from "jotai";
import { FileNameDefault } from "../constants/FileSetting";
import { notificationCtx } from "./notification";
import { currDocumentCtx } from "./currDocument";

const filesCtx = React?.createContext({});

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;
// pdfjs.GlobalWorkerOptions.workerSrc = `${window.location.host}/libs/pdfjs/worker.txt`;

const FilesContext = ({ children }) => {
  const fileSetting = {
    type: uploadTypeName.PDF,
    size: 20,
    divHight: "h-[360px]",
  };

  const setLoadingMap = React?.useContext(guardCtx)?.setLoadingMap;
  const [pdfURL, setPdfURL] =
    useAtom<PrimitiveAtom<pdfFileType[] | null>>(fileAtom);

  const [selectedFiles, setSelectedFiles] = React?.useState([]);
  const judgeFileType = fileSetting.type === uploadTypeName.PDF;
  const [dragActive, setDragActive] = React.useState(false); // 是否有拖移檔案
  const [uploadError, setUploadError] = React?.useState<"type" | "size" | null>(
    null
  ); // 錯誤提醒，圖片類型和不超過檔案大小
  const [pdfName, setPdfName] = React.useState<string>(FileNameDefault);

  const [canvas, setCanvas] = React?.useState<HTMLCanvasElement | null>(null);
  const [totalPages, setTotalPages] = React.useState<number>(0);
  const [ctx, setCtx] = React?.useState<CanvasRenderingContext2D | null>(null);

  const setRepresentationMode =
    React?.useContext(currDocumentCtx)?.setRepresentationMode;

  const changeFile = (file, name, pageCount) => {
    console.log("final file to be considered here", { file });

    if (Array.isArray(file)) {
      setPdfURL(file);
      setPdfName(name);
      setTotalPages(pageCount || 0);
    }

    console.log("finish changing the file");
  };

  const showError = React?.useContext(notificationCtx)?.showError;

  const [progressBar, setProgressBar] = React.useState<number>(0);
  const [documentAnnexes, setDocumentAnnexes] = React?.useState(
    JSON.parse(sessionStorage?.getItem("attachements") || "[]")
  );

  const navigate = useNavigate();

  const fileChangedHandler = async (
    event,
    onlyProcessFile = false,
    customFile
  ) => {
    // make sure annex context is reinitialized before new document upload
    sessionStorage?.removeItem("annexes-data");
    sessionStorage?.removeItem("annexId");
    sessionStorage?.removeItem("attachements");
    sessionStorage?.removeItem("final-signee");

    setSelectedFiles([]);
    setDocumentAnnexes([]);

    setRepresentationMode({
      active: false,
      finalSignee: {},
    });

    let files;

    if (onlyProcessFile) {
      files = [customFile];
    } else {
      files = event?.target?.files;
    }

    setLoadingMap(true, "drag_upload");

    console.log("current uploaded file", files[0], {
      event,
      onlyProcessFile,
      customFile,
    });

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

      await lookup(`${BASE_URL}/api/upload`, {
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
                console.log("received data for conversion", res);

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

        await lookup(`${BASE_URL}/api/convert`, {
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

              await lookup(`${BASE_URL}${res?.pdfFilePath}`, {
                headers: _headers,
                method: "GET",
              })
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

    setLoadingMap(false, "drag_upload");
  };

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
            async (pdf) => {
              // Fetch the first page
              const imageDate: pdfFileType[] = [];

              console.log("start processing the pdf file", { pdf });

              // for (let i = 1; i <= pdf.numPages; i++) {}

              setLoadingMap(true, "files_rendering");

              await Promise.all(
                new Array(pdf.numPages)?.fill({}).map((target, index) => {
                  return (async () => {
                    await pdf.getPage(index + 1).then((page) => {
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
                          imageDate?.length
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

                        setProgressBar?.(
                          (imageDate.length / pdf.numPages) * 100
                        );
                      });
                    });
                  })();
                })
              )
                .then((res) => {
                  console.log("Finished rendering document pages");
                })
                .catch((error) => {
                  console.log(
                    "an error has occured when rendering the document",
                    error
                  );

                  showError("Une erreur est survenue");
                });

              setLoadingMap(false, "files_rendering");

              console?.log("pass the for loop of page rendering");

              changeFile(imageDate, name, pdf.numPages);
            },
            (reason) => {
              // PDF loading error
              // if (process.env.NODE_ENV === "development") {
              //   console.error(reason);
              // }
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

  return (
    <filesCtx.Provider
      value={{
        selectedFiles,
        setSelectedFiles,
        uploadFile,
        uploadError,
        setUploadError,
        fileChangedHandler,
        dragActive,
        judgeFileType,
        setDragActive,
        totalPages,
        setTotalPages,
        pdfURL,
        setPdfURL,
        pdfName,
        setPdfName,
        fileSetting,
        canvas,
        setCanvas,
        ctx,
        setCtx,
        progressBar,
        setProgressBar,
        documentAnnexes,
        setDocumentAnnexes,
        changeFile,
      }}
    >
      {children}
    </filesCtx.Provider>
  );
};

export { filesCtx };
export default FilesContext;
