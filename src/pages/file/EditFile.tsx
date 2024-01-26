/* eslint-disable react/jsx-no-constructed-context-values, no-return-assign */
import React, { useEffect, useRef, useState } from "react";

import { fabric } from "fabric";
import { PrimitiveAtom, useAtom } from "jotai";
import { parseSignatures } from "../../utils/document";

import ControlSizeCanvas from "./EditFile/ControlSizeCanvas";
import FileList from "./EditFile/FileList";
import TabPanel from "./EditFile/TabPanel";
import ZoomKit from "./EditFile/ZoomKit";
import InputTextField from "../../components/InputTextField";
import Modal from "../../components/Modal";
import SignMode from "../../components/SignMode";
import { RWDSize } from "../../constants/EnumType";
import SingImgContext from "../../context/SingImgContext";
import { fileAtom, messageAtom, openModalAtom } from "../../jotai";
import {
  Box,
  CircularProgress,
  FormControl,
  MenuItem,
  Select,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import SelectSignee from "../../components/SelectSignee";
import { signaturesCtx } from "../../context/signatures";
import { documentsCtx } from "../../context/documents";

import {
  Document,
  Page,
  Image,
  PDFDownloadLink,
  pdf,
} from "@react-pdf/renderer";
import { useNavigate } from "react-router-dom";
import { Send } from "react-feather";
import { currDocumentCtx } from "../../context/currDocument";
import { filesCtx } from "../../context/files";
import { format } from "prettier";
import { appDataCtx } from "../../context/appData";

interface props {
  pdfName: string;
  setPdfName: React.Dispatch<React.SetStateAction<string>>;
  cancelFile: () => void;
  totalPages: number;
  nextMenu: () => void;
  getCanvasItem: (canvasItem: (HTMLCanvasElement | null)[]) => void;
}

const EditFile = ({
  pdfName,
  setPdfName,
  cancelFile,
  totalPages,
  nextMenu,
  getCanvasItem,
  finishPdf,
  injectDate,
}: props) => {
  // useAtom
  const [pdfURL] = useAtom<PrimitiveAtom<pdfFileType[] | null>>(fileAtom);

  // console.log("current pdf url from edit component", pdfURL);

  const [, setOpenModal] = useAtom(openModalAtom);

  const bgRef = useRef<HTMLDivElement>(null);
  const [bgWidth, setBgWidth] = useState<number>(0);
  const canvasListRef = useRef<HTMLDivElement | null>(null);
  const canvasItemRef = useRef<(HTMLCanvasElement | null)[]>([]);
  const [canvas, setCanvas] = useState<fabric.Canvas[]>([]);
  const [phoneSize, setPhoneSize] = useState<boolean>(false); // RWD phone size
  const [onSelectSize, setOnSelectSize] = useState<number>(1); // canvas size
  /** RWD 下方的 menu button ,false:頁面清單, true:簽名清單 */
  const [isActiveMenu, setActiveMenu] = useState<boolean>(true);
  const [focusCanvasIdx, setFocusCanvasIdx] = useState<number>(0); // click canvas page
  const [canvasListScroll, setCanvasListScroll] = useState<number>(0);

  const closeModal = () => {
    setOpenModal(false);
  };

  /** 建立主要的 canvas */
  useEffect(() => {
    for (let i = 0; i < totalPages; i++) {
      const c: fabric.Canvas = new fabric.Canvas(canvasItemRef.current[i]);
      setCanvas((prev) => [...prev, c]);
    }
  }, [canvasItemRef]);

  const getAddLocation = (showWidth?: boolean): AddLocationType => {
    if (!canvasListRef.current) return {};

    // 取得所有 canvas
    const canvasList = Array.from(
      canvasListRef.current.children
    ) as HTMLCanvasElement[];

    const bgHight = bgRef.current?.clientHeight ?? 0; // 取得 div 尺寸
    const cTop = canvasList[focusCanvasIdx].offsetTop; // Canvas Item 頂部距離

    const locationObject = {
      top: canvasListScroll - cTop + bgHight / 2,
      left: canvasList[focusCanvasIdx].clientWidth / 2,
    };

    if (showWidth) {
      return {
        width: (canvas[focusCanvasIdx].width ?? 0) / 3,
        ...locationObject,
      };
    }
    return locationObject;
  };

  let ownSignatures = React?.useContext(signaturesCtx)?.signatures;

  React?.useEffect(() => {
    try {
      const _documentCtx = JSON.parse(documentCtx);

      Promise.allSettled(
        _documentCtx?.data?.levelVersions
          ?.filter(
            (version) =>
              (version?.level !== 1 && version?.signed === true) ||
              version?.signed === false
          )
          ?.map((version, index, currentTab) => {
            console.log("current version being processed", {
              version,
              currentTab,
            });

            return (async () => {
              if (injectDate) {
                // processing date

                let box = null;
                let dateOptions = null;
                let datePageIndex = null;

                try {
                  dateOptions = JSON.parse(version?.dateCoords);
                } catch (error) {
                  console.log(
                    "an error has occured on getting date options for textbox",
                    error
                  );
                }

                const isVersionToBeSigned =
                  version?.level ===
                    Math.max(
                      ..._documentCtx?.data?.levelVersions
                        ?.filter((target) => target?.signed === true)
                        ?.map((target) => target?.level)
                    ) +
                      1 &&
                  version?.author?.id?.toString() ===
                    sessionStorage?.getItem("userId")?.toString();

                datePageIndex = parseInt(version?.datePage);

                if (dateOptions && Number.isInteger(parseInt(datePageIndex))) {
                  delete dateOptions["ownMatrixCache"];
                  delete dateOptions["oCoords"];
                  delete dateOptions["cacheHeight"];
                  delete dateOptions["cacheWidth"];
                  delete dateOptions["isMoving"];
                  delete dateOptions["stroke"];
                  delete dateOptions["ownMatrixCache"];

                  console.log("canva object data for date injection", {
                    canvas,
                    dateOptions,
                  });

                  let validationDate = new Date().toLocaleString("fr-FR");

                  if (!isVersionToBeSigned) {
                    validationDate =
                      version?.signed === true
                        ? new Date(version?.validationDate).toLocaleString(
                            "fr-FR"
                          )
                        : "Date à la signature";
                  }

                  try {
                    box = new fabric.Textbox(validationDate, dateOptions);

                    console.log("current date injection configurtions  here", {
                      dateOptions,
                      box,
                      datePageIndex,
                    });

                    canvas[datePageIndex].add(box);
                  } catch (error) {
                    console.log(
                      "an error has occured on filling date in canvas",
                      error
                    );
                  }
                } else {
                  console.log(
                    "couldn't inject date for a potential non existence of options"
                  );
                }

                // processing signature

                let currentSignatureUrl = ownSignatures[0]?.signature;

                let signOptions = null;
                let signPageIndex = null;

                try {
                  signOptions = JSON.parse(version?.signCoords);
                } catch (error) {
                  console.log(
                    "an error has occured on getting sign options",
                    error
                  );
                }

                signPageIndex = parseInt(version.signPage);

                // signOptions = JSON.parse(signOptions);

                console.log("current sign options", {
                  signOptions,
                  signPageIndex,
                });

                if (signOptions && Number.isInteger(parseInt(signPageIndex))) {
                  signOptions._element.currentSrc = currentSignatureUrl;
                  signOptions._element.baseURI = window.location.href;

                  // signOptions.width = 590;
                  // signOptions.height = 190;

                  // signOptions.scaleX = 0.28;
                  // signOptions.scaleY = 0.28;

                  try {
                    console.log(
                      "current signature injection configurtions  here",
                      {
                        dateOptions,
                        currentSignatureUrl,
                        ownSignatures,
                        signOptions,
                        signPageIndex,
                        datePageIndex,
                        canvasImage: canvas[signPageIndex],
                      }
                    );

                    let previewSignature = "/images/signature-cover-big.png";

                    if (isVersionToBeSigned) {
                      previewSignature = currentSignatureUrl.toString();
                    } else if (version?.signed === true) {
                      const _headers = new Headers();

                      _headers?.append("Content-Type", "application/json");
                      _headers?.append(
                        "Authorization",
                        `Bearer ${sessionStorage?.getItem("token")}`
                      );

                      await lookup(
                        `${process.env.REACT_APP_API_HOST}/api/signatures?filters[author][id][$eq]=${version?.author?.id}&populate=*`,
                        {
                          method: "GET",
                          headers: _headers,
                        }
                      ).then((res) =>
                        res.json().then(async (res) => {
                          console.log(
                            "received data after signature individual fetch",
                            res
                          );

                          if (res?.data?.length > 0) {
                            const parsedSigns = await parseSignatures(
                              res?.data?.map((target) => {
                                return {
                                  sign: target?.attributes?.sign?.data
                                    ?.attributes,
                                  id: target?.id,
                                  createdAt: target?.attributes?.createdAt,
                                };
                              })
                            ).catch((error) => {
                              console.log(
                                "an error has occured when creating attributes",
                                error
                              );

                              return [];
                            });

                            previewSignature = parsedSigns[0]?.signature;
                          } else {
                            const canvas = document.createElement("canvas");
                            canvas.width = 593;
                            canvas.height = 192;

                            const ctx = canvas.getContext("2d");

                            ctx.font = "60px Mr Dafoe";

                            ctx.fillText(
                              version?.author?.username,
                              30,
                              100,
                              593
                            );

                            const dataUrl = canvas.toDataURL();

                            console.log(
                              "current parsed image data injection other",
                              {
                                dataUrl,
                              }
                            );

                            //get base64 image source data
                            previewSignature = dataUrl;

                            console.log("current parsed image data", {
                              previewSignature,
                            });
                          }
                        })
                      );
                    }

                    console.log("current signature to be injected url", {
                      previewSignature,
                    });

                    fabric.Image.fromURL(
                      previewSignature,
                      (img) => {
                        canvas[signPageIndex].add(img).renderAll();

                        // getAddLocation(true);
                        console.log("successfully added signature object");
                      },
                      //  signOptions

                      {
                        aCoords: signOptions?.aCoords,
                        width: signOptions?.width,
                        height: signOptions?.height,
                        top: signOptions?.top,
                        scaleX: signOptions?.scaleX,
                        scaleY: signOptions?.scaleY,
                        left: signOptions?.left,
                      }
                    );
                  } catch (error) {
                    console.log(
                      "an error has occured on filling signature in canvas",
                      error
                    );
                  }
                } else {
                  console.log(
                    "couldn't inject signature as no options are specified"
                  );
                }
              } else {
                console.log("no date injection config");
              }
            })();
          })
      ).then((status) => {
        console.log(
          "injected all of the dynamic object into the document",
          status
        );
      });
    } catch (error) {
      console.log("an error has occured when processing canvas", error);
    }
  }, [canvas]);

  const handleCanvasListScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollTop = e.currentTarget.scrollTop; // list 滾動距離
    setCanvasListScroll(currentScrollTop);

    if (!canvasListRef.current) return;
    // 取得所有 canvas
    const canvasList = Array.from(
      canvasListRef.current.children
    ) as HTMLCanvasElement[];

    canvasList.forEach((item: HTMLCanvasElement, index: number) => {
      const canvasTop = item.offsetTop; // Canvas Item 頂部距離
      const canvasBottom = canvasTop + (item.clientHeight / 3) * 2; // Canvas Item 底部距離

      if (index === 0 && currentScrollTop <= canvasBottom) {
        return setFocusCanvasIdx(index);
      }

      if (
        index !== 0 &&
        currentScrollTop >=
          canvasList[index - 1].offsetTop +
            (canvasList[index - 1].clientHeight / 3) * 2 &&
        currentScrollTop <= canvasBottom
      ) {
        return setFocusCanvasIdx(index);
      }

      return null;
    });
  };

  const toFinishFile = () => {
    for (let i = 0; i < totalPages; i++) {
      canvas[i].discardActiveObject();
      canvas[i].requestRenderAll();
    }
    nextMenu();
  };

  /** 填上背景檔案，並移動視窗變動尺寸 */
  useEffect(() => {
    const handelFabricCanvas = () => {
      if (pdfURL && bgRef.current) {
        for (let i = 0; i < totalPages; i++) {
          // 計算 className canvas-container 長寬度

          if (pdfURL[i]) {
            const screenHeight = bgRef.current.scrollHeight * onSelectSize;
            const screenWidth = bgRef.current.scrollWidth * onSelectSize;

            const bgImage = pdfURL[i].dataURL;
            if (!canvas[i]) return;

            fabric.Image.fromURL(bgImage, (img) => {
              canvas[i].setBackgroundImage(bgImage, () =>
                canvas[i].renderAll()
              );

              // 計算頁面尺寸
              const imgSize = pdfURL[i].width / pdfURL[i].height;
              canvas[i].setHeight(img.height ?? 0);
              canvas[i].setWidth(img.width ?? 0);
              // 如果頁面是直(>=1)的使用乘法，如果是橫(<1)的使用除法
              const getSmallSize = Math.min(screenHeight, screenWidth);
              canvas[i]
                .setDimensions(
                  {
                    width: `${
                      imgSize >= 1 ? getSmallSize : getSmallSize * imgSize
                    }px`,
                    height: `${
                      imgSize >= 1 ? getSmallSize / imgSize : getSmallSize
                    }px`,
                  },
                  { cssOnly: true }
                )
                .requestRenderAll();
            });
          }
        }
      }
    };

    handelFabricCanvas();
    window.addEventListener("resize", handelFabricCanvas);

    return () => {
      window.removeEventListener("resize", handelFabricCanvas);
      getCanvasItem(canvasItemRef.current);
    };
  }, [canvas, pdfURL, onSelectSize]);

  useEffect(() => {
    const handleResize = () => {
      const RWD = window.innerWidth >= RWDSize;
      setPhoneSize(RWD);
      if (RWD && !isActiveMenu) setActiveMenu(RWD);

      setBgWidth(
        (window.innerWidth || 0) - ((bgRef.current?.offsetLeft || 0) + 32) * 2
      );
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const SingImgProps = { canvas, focusCanvasIdx, getAddLocation };

  const [signee, setSignee] = React?.useState(
    sessionStorage?.getItem("userId")
  );

  const handleSigneeChange = (event) => {
    event?.preventDefault();

    const newSignee = event?.target?.value;

    const collabs = JSON.parse(
      sessionStorage.getItem("collabs") || "[]"
    )?.filter((target) => target?.id != sessionStorage?.getItem("userId"));

    sessionStorage?.setItem(
      "current-signee",
      collabs?.find((target) => target?.id == newSignee)?.fullName
    );

    setSignee(newSignee);
  };

  const [meData, setMeData] = React?.useState({});

  const [notifications, setNotifications] = React?.useState(true);

  React?.useEffect(() => {
    sessionStorage?.setItem(
      "current-signee",
      sessionStorage?.getItem("username")
    );

    setMeData({
      fullName: sessionStorage?.getItem("username"),
      id: sessionStorage?.getItem("userId"),
    });
  }, []);

  const setSignatures = React?.useContext(signaturesCtx)?.setSignatures;

  React?.useEffect(() => {
    if (!injectDate) {
      (async () => {
        if (
          !(
            signee?.toString() === sessionStorage?.getItem("userId")?.toString()
          )
        ) {
          setSignatures(
            await parseSignatures(
              [
                {
                  sign: {
                    url: "/images/signature-cover-big.png",
                  },
                  id: 0,
                  createdAt: new Date()?.toISOString(),
                },
              ],
              true
            )
          );
        } else {
          const _headers = new Headers();

          _headers?.append("Content-Type", "application/json");
          _headers?.append(
            "Authorization",
            `bearer ${sessionStorage.getItem("token")}`
          );

          await lookup(
            `${process.env.REACT_APP_API_HOST}/api/signatures?filters[author][id][$eq]=${signee}&populate=*`,
            {
              method: "GET",
              headers: _headers,
            }
          )
            .then((res) =>
              res
                .json()
                .then(async (res) => {
                  console.log(
                    "received data after signature individual fetch",
                    res
                  );

                  const parsedSigns = await parseSignatures(
                    res?.data?.map((target) => {
                      return {
                        sign: target?.attributes?.sign?.data?.attributes,
                        id: target?.id,
                        createdAt: target?.attributes?.createdAt,
                      };
                    })
                  ).catch((error) => {
                    console.log(
                      "an error has occured when creating attributes",
                      error
                    );

                    return [];
                  });

                  console.log("parsed signatures data for single", parsedSigns);

                  setSignatures(parsedSigns);
                })
                .catch((error) => {
                  console.log(
                    "an error has occured when trying to fetch individual signature data",
                    error
                  );
                })
            )
            .catch((error) => {
              console.log(
                "an error has occured when trying to fetch individual signature data",
                error
              );
            });
        }

        sessionStorage?.removeItem("signPage");
        sessionStorage?.removeItem("signIndex");
        sessionStorage?.removeItem("datePage");
        sessionStorage?.removeItem("dateIndex");
      })();
    }
  }, [signee]);

  const [, setMessage] = useAtom(messageAtom);

  const documentCtx = sessionStorage.getItem("document-ctx");

  const [isFetching, setIsFetching] = React?.useState(false);

  const theme = useTheme();

  const ownDocuments = React?.useContext(documentsCtx)?.documents?.own;

  const navigate = useNavigate();

  const [processedSigns, setProcessedSigns] = React?.useState([]);

  const [transitState, setTransitState] = React?.useState({
    processed: false,
    processing: false,
  });

  const [dateOptions, setDateOptions] = React?.useState("");
  const [signOptions, setSignOptions] = React?.useState("");

  const processDate = () => {
    const collabs = JSON.parse(
      sessionStorage.getItem("collabs") || "[]"
    )?.filter((target) => target?.id != sessionStorage?.getItem("userId"));

    const createMode = signee === sessionStorage?.getItem("userId");

    const signeeLevel =
      [meData, ...collabs]?.findIndex((collab) => {
        return collab?.id === signee;
      }) + 1;

    const versionParams = {
      data: {
        level: signeeLevel,
        // file: mediaId?.toString(),
        parentDocument: sessionStorage?.getItem("currDocId"),
        author: signee?.toString(),
        signed: createMode,
        acceptNotifications: notifications,
        datePage: -1,
        dateCoords: "",
        signPage: -1,
        signCoords: "",
      },
    };

    const _canvas = canvas;

    try {
      // processing dates

      const pageIndex = parseInt(sessionStorage.getItem("datePage"));
      const dateText = sessionStorage.getItem("dateIndex");

      let dateObjToRemove = null;
      let _dateOptions = null;

      dateObjToRemove = _canvas[focusCanvasIdx].getObjects()?.find((target) => {
        return target?.text === dateText;
      });

      if (dateObjToRemove) {
        console.log("date object to be removed from the canvas", {
          dateObjToRemove,
          objects: _canvas[pageIndex].getObjects(),
        });

        if (!createMode) {
          _canvas[pageIndex].remove(dateObjToRemove);
        }

        _dateOptions = Object.keys(dateObjToRemove)
          ?.filter((key) => {
            return (
              !key?.startsWith("_") &&
              !key?.startsWith("__") &&
              !["canvas", "mouseMoveHandler"]?.includes(key)
            );
          })
          ?.reduce((prev, next) => {
            prev[next] = dateObjToRemove[next];
            return prev;
          }, {});

        delete _dateOptions["text"];
        delete _dateOptions["delete"];
        delete _dateOptions["textLines"];
        delete _dateOptions["_text"];
        delete _dateOptions["_textLines"];
        delete _dateOptions["_unwrappedTextLines"];
        delete _dateOptions["ownMatrixCache"];
        delete _dateOptions["oCoords"];
        delete _dateOptions["cacheHeight"];
        delete _dateOptions["cacheWidth"];
        delete _dateOptions["isMoving"];
        delete _dateOptions["stroke"];
        delete _dateOptions["ownMatrixCache"];

        _dateOptions = JSON.stringify(_dateOptions);

        console.log("prepared option for next", _dateOptions?.length);

        versionParams.data.dateCoords = _dateOptions;
        versionParams.data.datePage = pageIndex;
      }

      // processing signatures

      const signPage = parseInt(sessionStorage.getItem("signPage"));
      const signUrl = sessionStorage.getItem("signIndex");

      let signObjToRemove = null;
      let _signOptions = null;

      signObjToRemove = _canvas[signPage].getObjects()?.find((target) => {
        console.log(
          "current source canvas sign url",
          target?._element?.currentSrc
        );
        return (
          target?._element?.currentSrc ===
          (signUrl?.startsWith("/")
            ? `${window.location.origin}${signUrl}`
            : signUrl)
        );
      });

      if (signObjToRemove) {
        console.log("sign object to be removed from the canvas", {
          signObjToRemove,
          objects: _canvas[signPage].getObjects(),
        });

        _signOptions = Object.keys(signObjToRemove)
          ?.filter((key) => {
            return (
              !key?.startsWith("_") &&
              !key?.startsWith("__") &&
              !["canvas", "mouseMoveHandler"]?.includes(key)
            );
          })
          ?.reduce((prev, next) => {
            prev[next] = signObjToRemove[next];
            return prev;
          }, {});

        delete _signOptions["text"];
        delete _signOptions["delete"];
        delete _signOptions["textLines"];
        delete _signOptions["_text"];
        delete _signOptions["_textLines"];
        delete _signOptions["_unwrappedTextLines"];
        delete _signOptions["ownMatrixCache"];
        delete _signOptions["oCoords"];
        delete _signOptions["cacheHeight"];
        delete _signOptions["cacheWidth"];
        delete _signOptions["isMoving"];
        delete _signOptions["stroke"];
        delete _signOptions["ownMatrixCache"];

        _signOptions._element = {
          nodeName: "IMG",
          localName: "img",
          loading: "auto",
        };

        _signOptions = JSON.stringify(_signOptions);

        console.log("prepared signature option for next", _signOptions);

        versionParams.data.signCoords = _signOptions;
        versionParams.data.signPage = signPage;

        if (!createMode) {
          _canvas[signPage].remove(signObjToRemove);
        }

        setCanvas(_canvas);
      } else {
        console.log("couldn't get signature options");
      }

      // store the object

      let currentQueue = [];

      try {
        currentQueue = JSON.parse(sessionStorage.getItem("versions-queue"));

        if (!Array.isArray(currentQueue)) {
          currentQueue = [];
        }
      } catch (error) {
        console.log(
          "an error has occured when trying to initial versions queue",
          error
        );
      }

      const versionIndex = currentQueue?.findIndex((target) => {
        return target?.data?.level === signeeLevel;
      });

      console.log("current version queue params", {
        versionIndex,
        signeeLevel,
      });

      if (versionIndex > -1) {
        currentQueue[versionIndex] = versionParams;

        sessionStorage.setItem("versions-queue", JSON.stringify(currentQueue));
      } else {
        sessionStorage.setItem(
          "versions-queue",
          JSON.stringify([...currentQueue, versionParams])
        );
      }

      // const box = new fabric.Textbox("Lobababababa Loba", dateOptions);
    } catch (error) {
      console.log(
        "an error has occured when trying to get objects to remove from canvas",
        error
      );

      // alert("Une erreur est survenue");
    }
  };

  const _attachedFiles = React?.useContext(filesCtx)?.selectedFiles;

  const [isSendingData, setIsSendingData] = React?.useState(false);
  const [isDocumentNew, setIsDocumentNew] = React.useState(false);

  React?.useEffect(() => {
    console.log("current pathname string", window?.location?.pathname);

    if (window?.location?.pathname?.includes("new-document")) {
      setIsDocumentNew(true);
    }
  }, []);

  const processDocument = async () => {
    let versionObjects = JSON.parse(sessionStorage.getItem("versions-queue"));

    if (Array.isArray(versionObjects)) {
      getCanvasItem(canvasItemRef.current);

      setIsFetching(true);

      const doc = (
        <Document>
          {Array.from({ length: totalPages }).map((_, idx: number) => {
            if (!pdfURL || !pdfURL[idx]) return null;
            return (
              <Page
                key={idx}
                size={{ width: pdfURL[idx].width, height: pdfURL[idx].height }}
              >
                <Image src={finishPdf[idx]?.toDataURL("image/png")} />
              </Page>
            );
          })}
        </Document>
      );

      let documentCtx = {};

      try {
        documentCtx = JSON.parse(sessionStorage?.getItem("document-ctx"));
      } catch (error) {
        console.log(
          "an error has occured while accessing the document ctx",
          error
        );
      }

      const asPdf = pdf([]);
      asPdf.updateContainer(doc);

      const docBlobData = await asPdf.toBlob();
      const _fileToUpload = new File([docBlobData], `${pdfName}`, {});
      const _headers = new Headers();

      _headers?.append(
        "Authorization",
        `Bearer ${sessionStorage?.getItem("token")}`
      );
      _headers?.append("Accept", "application/json");

      const form = new FormData();
      form?.append("files", _fileToUpload);

      let attachmentsIds = [];

      return lookup(`${process.env.REACT_APP_API_HOST}/api/upload`, {
        method: "POST",
        headers: _headers,
        body: form,
      })
        .then((res) =>
          res.json().then(async (res) => {
            if ([403, 401]?.includes(res?.error?.status)) {
              navigate("/login", { replace: true });
            } else {
              console.log("successfully uploaded document file data");

              // create the document here

              const mediaId = res[0]?.id;

              const _postHeaders = new Headers();

              _postHeaders?.append("Content-Type", "application/json");
              _postHeaders?.append(
                "Authorization",
                `Bearer ${sessionStorage?.getItem("token")}`
              );

              const collabs = JSON.parse(
                sessionStorage.getItem("collabs") || "[]"
              )?.filter(
                (target) => target?.id != sessionStorage?.getItem("userId")
              );

              const signers = Array.isArray(documentCtx?.data?.signedBy)
                ? documentCtx?.data?.signedBy?.map((target) =>
                    target?.id?.toString()
                  )
                : [];

              if (!signers?.includes(sessionStorage.getItem("userId"))) {
                signers?.push(sessionStorage?.getItem("userId"));
              }

              const envelopeId = sessionStorage?.getItem("envelope-id");

              const docPayload = {
                data: {
                  title: pdfName,
                  validationLevel: 1,
                  author: sessionStorage.getItem("userId")?.toString(),
                  doc_folder: envelopeId,
                  department: sessionStorage?.getItem("department"),
                  expiryDate: new Date(
                    new Date()?.setDate(new Date()?.getDate() + 3)
                  ).toISOString(),
                  recipients: collabs
                    ?.map((target) => target?.id?.toString())
                    ?.filter(
                      (item) =>
                        ![NaN, undefined, null, ""]?.includes(item) &&
                        item?.toString() !==
                          sessionStorage?.getItem("userId")?.toString()
                    ),
                },
              };

              docPayload.data.recipients.push(
                sessionStorage?.getItem("userId")?.toString()
              );

              const _headers = new Headers();

              _headers?.append(
                "Authorization",
                `Bearer ${sessionStorage?.getItem("token")}`
              );
              _headers?.append("Accept", "application/json");

              const form = new FormData();

              _attachedFiles?.forEach((file) => {
                form?.append("files", file);
              });

              console.log(
                "data received from convetying a pdf to a uploadable format",
                docBlobData
              );

              await lookup(`${process.env.REACT_APP_API_HOST}/api/upload`, {
                method: "POST",
                headers: _headers,
                body: form,
              })
                .then((res) =>
                  res
                    .json()
                    .then((res) => {
                      console.log(
                        "::: attached files uploaded successfully :::",
                        res
                      );

                      try {
                        attachmentsIds = res?.map((target) => {
                          return target?.id?.toString();
                        });
                      } catch (error) {
                        console.log(
                          "an error has occured when getting attachements id",
                          error
                        );

                        throw new Error(error);
                      }
                    })
                    .catch((error) => {
                      console.log(
                        "an error has occured when uploading attached files",
                        error
                      );
                    })
                )
                .catch((error) => {
                  console.log(
                    "an error has occured when uploading attached files",
                    error
                  );

                  throw new Error(error);
                });

              docPayload.data.attachedFiles = attachmentsIds;

              console.log("document data to be created", {
                docPayload,
              });

              return lookup(`${process.env.REACT_APP_API_HOST}/api/documents`, {
                headers: _postHeaders,
                body: JSON.stringify(docPayload),
                method: "POST",
              })
                .then((res) =>
                  res.json().then(async (res) => {
                    if ([403, 401]?.includes(res?.error?.status)) {
                      navigate("/login", { replace: true });
                    } else {
                      console.log("document object persisted successfully");

                      let documentId = res?.data?.id?.toString();

                      const editMode = documentCtx?.mode === "edit";

                      versionObjects = versionObjects?.map((target) => {
                        if (target?.data?.level === 1) {
                          target.data.signed = true;
                          target.data.file = mediaId?.toString();
                        }

                        target.data.parentDocument = documentId?.toString();

                        return target;
                      });

                      console.log(
                        "document versions to be created",
                        versionObjects
                      );

                      return Promise.all(
                        versionObjects?.map((target) => {
                          return (async () => {
                            const _headers = new Headers();

                            _headers?.append(
                              "Authorization",
                              `Bearer ${sessionStorage?.getItem("token")}`
                            );
                            _headers?.append(
                              "Content-Type",
                              "application/json"
                            );

                            await lookup(
                              `${process.env.REACT_APP_API_HOST}/api/doc-versions`,
                              {
                                method: "POST",
                                headers: _headers,
                                body: JSON.stringify(target),
                              }
                            )
                              .then((res) =>
                                res
                                  .json()
                                  .then((res) => {
                                    console.log(
                                      "version object created successfully",
                                      res
                                    );
                                  })
                                  .catch((error) => {
                                    console.log(
                                      "an error has occured on json() on version create",
                                      error
                                    );
                                  })
                              )
                              .catch((error) => {
                                console.log(
                                  "an error occured when creating a version object",
                                  error
                                );

                                throw new Error(error);
                              });
                          })();
                        })
                      )
                        .then((data) => {
                          console.log(
                            ":::: successfully created document versions objects",
                            data
                          );

                          return;
                        })
                        .catch((error) => {
                          console.log(
                            "an error has occured when creating versions",
                            error
                          );

                          throw new Error(error);
                        });
                    }
                  })
                )
                .catch((error) => {
                  console.log(
                    "an error has occured when creating document object",
                    error
                  );

                  throw new Error(error);
                });
            }
          })
        )
        .catch((error) => {
          console.log(
            "an error occured when uploading the document file",
            error
          );

          throw new Error(error);
        });
    } else {
      console.log(
        "couldn't process document since verison objects are not in an array"
      );
    }
  };

  const uploadFinalFile = async () => {
    getCanvasItem(canvasItemRef.current);

    setIsFetching(true);

    let finalFileMediaId = "";

    const doc = (
      <Document>
        {Array.from({ length: totalPages }).map((_, idx: number) => {
          if (!pdfURL || !pdfURL[idx]) return null;
          return (
            <Page
              key={idx}
              size={{
                width: pdfURL[idx].width,
                height: pdfURL[idx].height,
              }}
            >
              <Image src={finishPdf[idx]?.toDataURL("image/png")} />
            </Page>
          );
        })}
      </Document>
    );

    const asPdf = pdf([]);
    asPdf.updateContainer(doc);

    const docBlobData = await asPdf.toBlob();
    const _fileToUpload = new File([docBlobData], `${pdfName}`, {});
    const _headers = new Headers();

    _headers?.append(
      "Authorization",
      `Bearer ${sessionStorage?.getItem("token")}`
    );
    _headers?.append("Accept", "application/json");

    const form = new FormData();
    form?.append("files", _fileToUpload);

    let attachmentsIds = [];

    await lookup(`${process.env.REACT_APP_API_HOST}/api/upload`, {
      method: "POST",
      headers: _headers,
      body: form,
    })
      .then((res) =>
        res
          .json()
          .then(async (res) => {
            if ([403, 401]?.includes(res?.error?.status)) {
              navigate("/login", { replace: true });
            } else {
              console.log("successfully uploaded document file data");

              // create the document here
              finalFileMediaId = res[0]?.id?.toString();
            }
          })
          .catch((error) => {
            console.log(
              "an error has occured when uploading document final version",
              error
            );
          })
      )
      .catch((error) => {
        console.log(
          "an error has occured when uploading document final version",
          error
        );
      });

    return finalFileMediaId;
  };

  const injectData = React?.useContext(appDataCtx).injectData;

  return (
    <Box
      className="gap not-w relative grid h-[85vh] w-full grid-cols-[220px_40vw_220px]
    flat:grid-cols-1 flat:grid-rows-[auto_400px_auto]"
      sx={{
        maxWidth: "100%!important",
      }}
    >
      <Box
        className="edit-file-field grid grid-rows-[repeat(3,_min-content)]
      gap-8 rounded-l-md px-6 flat:grid-rows-1 flat:rounded-t-md flat:rounded-b-none"
        sx={{
          py: "0px!important",
        }}
      >
        <InputTextField InputValue={pdfName} setInputValue={setPdfName} />
        <SingImgContext.Provider value={SingImgProps}>
          {phoneSize && (
            <TabPanel
              uploadFinalFile={uploadFinalFile}
              setNotifications={setNotifications}
              notifications={notifications}
            />
          )}
        </SingImgContext.Provider>
      </Box>
      <Box
        className="relative flex h-inherit items-start justify-center bg-green-blue flat:h-initial"
        ref={bgRef}
      >
        <div
          className="grid h-inherit w-full gap-4 overflow-auto py-4 flat:h-full"
          ref={canvasListRef}
          style={{}}
          onScroll={handleCanvasListScroll}
        >
          {Array.from({ length: totalPages }).map((_, idx: number) => (
            <canvas
              ref={(el) =>
                (canvasItemRef.current = [...canvasItemRef.current, el])
              }
              className="canvas-style"
              height={bgRef.current?.clientHeight}
              key={idx}
            />
          ))}
        </div>
        <ControlSizeCanvas
          onSelectSize={onSelectSize}
          setOnSelectSize={setOnSelectSize}
        />
        <ZoomKit isActiveMenu={isActiveMenu} setActiveMenu={setActiveMenu} />
      </Box>
      <Box
        className="edit-file-field flex flex-col justify-between gap-8 rounded-r-md "
        sx={{
          py: "0px!important",
        }}
      >
        {isActiveMenu ? (
          <FileList
            totalPages={totalPages}
            canvasListRef={canvasListRef}
            canvasItemRef={canvasItemRef}
            setFocusCanvasIdx={setFocusCanvasIdx}
          />
        ) : (
          <TabPanel
            uploadFinalFile={uploadFinalFile}
            setNotifications={setNotifications}
            notifications={notifications}
          />
        )}
        {isDocumentNew ? (
          <React.Fragment>
            <div className="flex flex-col gap-4 px-6">
              <FormControl
                variant="standard"
                sx={{ minWidth: 120, mt: "1rem" }}
              >
                <Select
                  labelId="demo-simple-select-standard-label"
                  id="demo-simple-select-standard"
                  value={signee}
                  onChange={handleSigneeChange}
                  label="Signataire"
                  placeholder="Selectioner un signataire"
                >
                  <MenuItem
                    disabled={processedSigns?.includes(meData?.id)}
                    value={meData?.id}
                  >
                    {meData?.fullName}
                  </MenuItem>
                  {JSON.parse(window?.sessionStorage?.getItem("collabs"))?.map(
                    (target) => {
                      // console.log("collabs target data here", target);

                      return (
                        <MenuItem
                          disabled={processedSigns?.includes(target?.id)}
                          value={target?.id}
                        >
                          {target?.fullName}
                        </MenuItem>
                      );
                    }
                  )}
                </Select>
              </FormControl>
              <button
                type="button"
                className="btn-primary flex-auto"
                onClick={async (params) => {
                  if (transitState?.processed) {
                    await processDocument()
                      .then(() => {
                        console.log(
                          "::::: processed successfully the document :::::"
                        );

                        injectData();

                        navigate("/requests/all");
                      })
                      .catch((error) => {
                        console.log(
                          "an error has occured when processing the document",
                          error
                        );
                      });
                  } else {
                    if (
                      sessionStorage?.getItem("signPage")?.length > 0 &&
                      sessionStorage?.getItem("signIndex")?.length > 0 &&
                      sessionStorage?.getItem("datePage")?.length > 0 &&
                      sessionStorage?.getItem("dateIndex")?.length > 0
                    ) {
                      processDate();

                      const collabs = JSON.parse(
                        sessionStorage.getItem("collabs") || "[]"
                      )?.filter(
                        (target) =>
                          target?.id != sessionStorage?.getItem("userId")
                      );

                      const signeeLevel =
                        [meData, ...collabs]?.findIndex((collab) => {
                          return collab?.id === signee;
                        }) + 1;

                      const currentQueue = JSON.parse(
                        sessionStorage.getItem("versions-queue")
                      );

                      const signeeNotCompleted = [meData, ...collabs]?.filter(
                        (target, index) => {
                          return !currentQueue?.some((target) => {
                            return target?.data?.level == index + 1;
                          });
                        }
                      );

                      console.log(
                        "current signees not completed",
                        signeeNotCompleted
                      );

                      if (signeeNotCompleted?.length === 0) {
                        setTransitState({
                          ...transitState,
                          processed: true,
                        });
                      } else {
                        alert(
                          `Signatures et dates manquantes pour ${signeeNotCompleted
                            ?.map((target) => target?.fullName)
                            ?.join(" et ")}`
                        );
                      }
                    } else {
                      alert(
                        "Veuillez selectionnez l'emplacement pour la date et la signature"
                      );
                    }
                  }
                }}
              >
                {isSendingData ? (
                  <CircularProgress
                    size={"1rem"}
                    sx={{
                      width: "10px",
                      fontSize: "10px",
                      color: theme?.palette?.common?.white,
                    }}
                  />
                ) : transitState?.processed ? (
                  <Stack
                    direction={"row"}
                    sx={{
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Send />
                    <Typography
                      sx={{
                        color: theme?.palette?.common?.white,
                        fontSize: "14px",
                        ml: ".5rem",
                      }}
                    >
                      {"Valider"}
                    </Typography>
                  </Stack>
                ) : (
                  "Enregistrer"
                )}
              </button>
              <button
                type="button"
                className="btn-secodary flex-auto"
                onClick={cancelFile}
              >
                Annuler
              </button>
            </div>
          </React.Fragment>
        ) : (
          ""
        )}
      </Box>
      <Modal childrenClassName="w-[580px]" small={phoneSize}>
        <>
          <SignMode onlySendBtn clickStartSignBtn={closeModal} />
          <p
            className="cursor-auto pt-8 text-center text-xs text-white"
            onClick={closeModal}
          >
            Cliquer dehors pour quitter
          </p>
        </>
      </Modal>
    </Box>
  );
};

export default EditFile;
