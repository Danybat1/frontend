// component defintion

import * as React from "react";
import { Stack, useTheme, Grid, Skeleton } from "@mui/material";
import { Add } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "./Layout";
import EditFile from "../pages/file/EditFile";

import { PrimitiveAtom, useAtom } from "jotai";

import { pdfjs } from "react-pdf";

import { ReactComponent as UploadIcon } from "../assets/svg/upload.svg";
import { orientationType, uploadTypeName } from "../constants/EnumType";
import { fileAtom } from "../jotai";
import { FileNameDefault } from "../constants/FileSetting";
import FinishFile from "../pages/file/FinishFile";
import { documentsCtx } from "../context/documents";

import { fabric } from "fabric";
import { guardCtx } from "../context/Guard";
import { filesCtx } from "../context/files";
import SkeletonContainer from "./SkeletonContainer";

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

const DocumentView = ({}) => {
  const theme = useTheme();

  const fileContext = React?.useContext(filesCtx);

  const [pdfURL, setPdfURL] =
    useAtom<PrimitiveAtom<pdfFileType[] | null>>(fileAtom);
  const [pdfName, setPdfName] = React.useState<string>(FileNameDefault);
  const [totalPages, setTotalPages] = React.useState<number>(0);

  const params = useParams();

  const [documentObj, setDocumentState] = React?.useState({
    name: `Document-${params?.ref}.pdf`,
    setPdfName: () => {},
    cancelFile: () => {},
    totalPages: totalPages,
    nexMenu: "/next",
  });

  const fileSetting = {
    type: uploadTypeName.PDF,
    size: 20,
    divHight: "h-[360px]",
  };

  const [stepMenu, setStepMenu] = React?.useState(0);
  const [finishPdf, setFinishPdf] = React.useState<
    (HTMLCanvasElement | null)[]
  >([]); // get finish pdf
  const navigate = useNavigate();

  /**  true: PDF; false: img */
  const judgeFileType = fileSetting.type === uploadTypeName.PDF;
  const [dragActive, setDragActive] = React.useState(false); // 是否有拖移檔案
  const [uploadError, setUploadError] = React.useState<"type" | "size" | null>(
    null
  ); // 錯誤提醒，圖片類型和不超過檔案大小

  const progressBar = fileContext?.progressBar;
  const setProgressBar = fileContext?.setprogressBar;

  // pdf canvas
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [ctx, setCtx] = React.useState<CanvasRenderingContext2D | null>(null);
  const [canvas, setCanvas] = React.useState<HTMLCanvasElement | null>(null);

  const changeFile = (file, name, pageCount) => {
    console.log("final file to be considered here", { file });

    setLoadingMap(true, "change_file");

    if (Array.isArray(file) && file?.length > 0) {
      setPdfURL(file);
      setPdfName(name);
      setTotalPages(pageCount || 0);

      setLoadedFile(true);
    } else {
      console.log("tried to load errored data", { file });
    }

    setLoadingMap(false, "change_file");
  };

  const [loadedFile, setLoadedFile] = React?.useState(false);

  const setLoadingMap = React?.useContext(guardCtx)?.setLoadingMap;

  React?.useEffect(() => {
    if (canvas === null) return;

    const filePath = JSON.parse(sessionStorage?.getItem("document-ctx"))?.data
      ?.file?.path;

    (async () => {
      setLoadingMap(true, "document_view");

      console.log("is fetching document file data at ", filePath);

      await lookup(filePath)
        .then((data) =>
          data
            .blob()
            .then((file) => {
              setLoadingMap(true, "document_look");

              file = new File([file], pdfName);

              if (!file) {
                setLoadingMap(true, "document_look");

                return;
              }

              console.log("successfully loaded file", file);

              const name =
                JSON.parse(sessionStorage?.getItem("document-ctx"))?.data
                  ?.title || "Nouveau document";

              const { size, type } = file;

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
                  setLoadingMap(true, "document_onload");

                  const { result } = event.target as FileReader;

                  // console.log("document loading info here", { result });

                  if (
                    typeof result !== "string" &&
                    result !== null &&
                    canvas &&
                    ctx
                  ) {
                    const pdfData = new Uint8Array(result);

                    // Using DocumentInitParameters object to load binary data.
                    const loadingTask = pdfjs.getDocument({ data: pdfData });

                    loadingTask.promise.then(
                      async (pdf) => {
                        // Fetch the first page
                        const imageDate: pdfFileType[] = [];

                        // console.log("start processing file", {
                        //   pages: pdf?.numPages,
                        // });

                        setLoadingMap(true, "document_loading_task");

                        await Promise.allSettled(
                          new Array(pdf?.numPages + 1)
                            ?.fill(null)
                            ?.map((_page, index) => {
                              return pdf.getPage(index).then(async (page) => {
                                setLoadingMap(true, "document_get_page");
                                const viewport = await page.getViewport({
                                  scale: 1,
                                });
                                const canvasChild =
                                  document.createElement("canvas");
                                canvas.appendChild(canvasChild);
                                const context = canvasChild.getContext("2d");
                                // Prepare canvas using PDF page dimensions
                                canvasChild.height = viewport.height;
                                canvasChild.width = viewport.width;

                                // canvasChild.style.height = viewport.height + 'px'
                                // canvasChild.style.width = viewport.width + 'px'

                                // Render PDF page into canvas context

                                if (!context) {
                                  console.log("will stop processing file", {});

                                  setLoadingMap(false, "document_get_page");

                                  return;
                                } else {
                                  // console.log(
                                  //   "going forward in processing",
                                  //   {}
                                  // );
                                }

                                const renderContext = {
                                  canvasContext: context,
                                  viewport,
                                };

                                const renderTask = await page.render(
                                  renderContext
                                );

                                // console.log(
                                //   "pages iteration for rendering",
                                //   page
                                // );

                                await renderTask.promise.then(() => {
                                  // 輸出圖片，使用指定位置不會導致頁面順序不對

                                  // console.log(
                                  //   "filling the rendering document views",
                                  //   imageDate
                                  // );

                                  setLoadingMap(true, "document_render_task");

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

                                  setLoadingMap(false, "document_render_task");
                                });

                                setLoadingMap(false, "document_get_page");
                              });
                            })
                        )
                          .then(() => {
                            console.log("processed all of the documents views");

                            changeFile(imageDate, name, pdf.numPages);
                          })
                          .catch((error) => {
                            console.log(
                              "an error has occured when trying to process the document",
                              error
                            );
                          });

                        setLoadingMap(false, "document_loading_task");
                      },
                      (reason) => {
                        // PDF loading error
                        // if (process.env.NODE_ENV === "development") {
                        //   console.error(reason);
                        // }
                      }
                    );
                  } else {
                    console.log("is failing basicall conditions for rendering");
                  }

                  setLoadingMap(false, "document_onload");
                };

                console.log(
                  "file to be loaded and uploaded from 1st condition",
                  file
                );

                fileReader.readAsArrayBuffer(file);
              } else {
                // 處理 Img
                fileReader.onload = () => {
                  setLoadingMap(true, "document_fle_reader");

                  changeFile(fileReader.result, name);

                  setDragActive(false);

                  setLoadingMap(false, "document_fle_reader");
                };

                console.log(
                  "file to be loaded and uploaded from 2nd condition",
                  file
                );

                fileReader.readAsDataURL(file);
              }

              setLoadingMap(false, "document_look");
            })
            .catch((error) => {
              console.log(
                "an error has occured when fetching a custom file",
                error
              );
            })
        )
        .catch((error) => {
          console.log(
            "an error has occured when fetching document file",
            error
          );
        });

      setLoadingMap(false, "document_view");
    })();
  }, [canvas]);

  React.useEffect(() => {
    console.log("current canvas value", canvasRef?.current);

    const c = canvasRef.current;
    if (c == null) return;
    setCanvas(c);
    setCtx(c.getContext("2d"));
    setProgressBar?.(0);
  }, []);

  const fileElement = {
    0: (
      <Stack id={"File"} component={"main"}>
        <EditFile
          injectDate={true}
          pdfName={pdfName}
          setPdfName={setPdfName}
          cancelFile={() => {
            navigate("/mydocuments");
          }}
          totalPages={totalPages}
          nextMenu={() => {
            setStepMenu(1);
          }}
          getCanvasItem={(canvasItem) => setFinishPdf(canvasItem)}
          finishPdf={finishPdf}
        />
      </Stack>
    ),
    1: (
      <Stack id={"File"} component={"main"}>
        <FinishFile
          pdfName={pdfName}
          setPdfName={setPdfName}
          finishPdf={finishPdf}
          totalPages={totalPages}
        />
      </Stack>
    ),
  };

  return (
    <Layout>
      <canvas className="hidden" ref={canvasRef} width={100} height={100} />
      {loadedFile ? fileElement[stepMenu] : <SkeletonContainer />}
    </Layout>
  );
};

export default DocumentView;
