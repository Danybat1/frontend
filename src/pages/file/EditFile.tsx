/* eslint-disable react/jsx-no-constructed-context-values, no-return-assign */
import React, { useEffect, useRef, useState } from "react";

import { fabric } from "fabric";
import { PrimitiveAtom, useAtom } from "jotai";
import { parseSignatures } from "../../utils/document";

import { orientationType, uploadTypeName } from "../../constants/EnumType";
import { pdfjs } from "react-pdf";

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
import { useNavigate, useParams } from "react-router-dom";
import { Send } from "react-feather";
import { currDocumentCtx } from "../../context/currDocument";
import { filesCtx } from "../../context/files";
import { format } from "prettier";
import { appDataCtx } from "../../context/appData";
import { guardCtx } from "../../context/Guard";
import { BASE_URL } from "../../constants/api";
import getHeaders from "../../utils/getHeaders";
import { paraphCtx } from "../paraph";
import { notificationCtx } from "../../context/notification";
import mergePdf from "../../utils/pdfMerger";
import textToImage from "../../utils/textToImage";
import removeDisplayObj from "../../utils/removeDisplayObj";

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

  const isParaph = React?.useContext(paraphCtx)?.isParaph;
  const fileContext = React?.useContext(filesCtx);

  const params = useParams();

  // console.log("current pdf url from edit component", pdfURL);

  const [, setOpenModal] = useAtom(openModalAtom);

  const bgRef = useRef<HTMLDivElement>(null);
  const [bgWidth, setBgWidth] = useState<number>(0);
  const canvasListRef = useRef<HTMLDivElement | null>(null);
  const canvasItemRef = useRef<(HTMLCanvasElement | null)[]>([]);
  const [phoneSize, setPhoneSize] = useState<boolean>(false); // RWD phone size

  const [onSelectSize, setOnSelectSize] = React?.useState<number>(1); // canvas size

  /** RWD 下方的 menu button ,false:頁面清單, true:簽名清單 */
  const [isActiveMenu, setActiveMenu] = useState<boolean>(true);
  const [focusCanvasIdx, setFocusCanvasIdx] = useState<number>(0); // click canvas page
  const [canvasListScroll, setCanvasListScroll] = useState<number>(0);

  const [validationPhase, setValidationPhase] = React?.useState(null);

  const changeFile = fileContext?.changeFile;

  const [canvas, setCanvas] = useState<fabric.Canvas[]>([]);

  const uploadCanvas = fileContext?.canvas;
  const setUploadCanvas = fileContext?.setCanvas;
  const uploadCtxtx = fileContext?.ctx;
  const setUploadCtx = fileContext?.setCtx;

  const closeModal = () => {
    setOpenModal(false);
  };

  /** 建立主要的 canvas */
  React?.useEffect(() => {
    for (let i = 0; i < totalPages; i++) {
      const c: fabric.Canvas = new fabric.Canvas(canvasItemRef.current[i]);

      setCanvas((prev) => [...prev, c]);
    }
    // }, [canvasItemRef, params?.id]);
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

  const setLoadingMap = React?.useContext(guardCtx)?.setLoadingMap;

  // inject signatures
  React?.useEffect(() => {
    try {
      const _documentCtx = JSON.parse(documentCtx);

      setLoadingMap(true, "edit_file_init");

      Promise.all(
        _documentCtx?.data?.levelVersions?.every((version) => version?.signed)
          ? []
          : _documentCtx?.data?.levelVersions
              ?.filter(
                (version) =>
                  (version?.level !== 1 && version?.signed === true) ||
                  version?.signed === false
              )
              ?.map((version, index, currentTab) => {
                // console.log("current version being processed", {
                //   version,
                //   currentTab,
                // });

                return (async () => {
                  setLoadingMap(true, "edit_file_levels");

                  if (injectDate && canvas?.length > 0) {
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

                    if (
                      dateOptions &&
                      Number.isInteger(parseInt(datePageIndex))
                    ) {
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

                        console.log(
                          "current date injection configurtions  here",
                          {
                            dateOptions,
                            box,
                            datePageIndex,
                          }
                        );

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

                    let displayObjects = [];

                    // old approach, main doc not having initials
                    // if (isParaph) {
                    //   displayObjects.push(...(version?.displayObjects || []));
                    // } else {
                    //   displayObjects?.push({
                    //     rawOptions: version?.signCoords,
                    //     page: version.signPage,
                    //   });
                    // }

                    displayObjects.push(...(version?.displayObjects || []), {
                      rawOptions: version?.signCoords,
                      page: version.signPage,
                    });

                    console.log(
                      "computed display objects to be injected",
                      displayObjects,
                      version
                    );

                    await Promise.all(
                      displayObjects?.map((target) => {
                        return (async () => {
                          let signOptions = JSON.parse(
                            target?.rawOptions || "{}"
                          );
                          let signPageIndex = parseInt(target?.page);

                          let currentSignatureUrl;

                          // window?.alert(`current is paraph ${isParaph} `);

                          // only display object have type properties

                          // alert(target?.type);

                          if (!isParaph && !(target?.type === "image")) {
                            currentSignatureUrl = ownSignatures[0]?.signature;
                          } else {
                            // window?.alert("Will inject name as paraph in this case");

                            const name = sessionStorage
                              ?.getItem("username")
                              ?.split(" ")
                              ?.map((elt) => elt[0]?.toUpperCase())
                              ?.join("");

                            currentSignatureUrl = textToImage({ text: name });
                          }

                          // signOptions = JSON.parse(signOptions);

                          console.log("current sign options", {
                            signOptions,
                            signPageIndex,
                          });

                          if (
                            signOptions &&
                            Number.isInteger(parseInt(signPageIndex))
                          ) {
                            signOptions._element.currentSrc =
                              currentSignatureUrl;
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
                                  canvas,
                                }
                              );

                              // only display objects (paraph objects) have type property set to image

                              let previewSignature =
                                target?.type === "image"
                                  ? "/images/paraph-cover-big.png"
                                  : "/images/signature-cover-big.png";

                              if (isVersionToBeSigned) {
                                previewSignature =
                                  currentSignatureUrl.toString();
                              } else if (version?.signed === true) {
                                const _headers = new Headers();

                                _headers?.append(
                                  "Content-Type",
                                  "application/json"
                                );
                                _headers?.append(
                                  "Authorization",
                                  `Bearer ${sessionStorage?.getItem("token")}`
                                );

                                setLoadingMap(true, "edit_file_version");

                                await lookup(
                                  `${BASE_URL}/api/signatures?filters[author][id][$eq]=${version?.author?.id}&populate=*`,
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

                                    setLoadingMap(true, "edit_file_sign");

                                    if (
                                      res?.data?.length > 0 &&
                                      !annexContext
                                    ) {
                                      const parsedSigns = await parseSignatures(
                                        res?.data?.map((target) => {
                                          return {
                                            sign: target?.attributes?.sign?.data
                                              ?.attributes,
                                            id: target?.id,
                                            createdAt:
                                              target?.attributes?.createdAt,
                                          };
                                        })
                                      ).catch((error) => {
                                        console.log(
                                          "an error has occured when creating attributes",
                                          error
                                        );

                                        return [];
                                      });

                                      previewSignature =
                                        parsedSigns[0]?.signature;
                                    } else {
                                      //get base64 image source data
                                      previewSignature = textToImage({
                                        text: version?.author?.username,
                                      });

                                      console.log("current parsed image data", {
                                        previewSignature,
                                      });
                                    }

                                    setLoadingMap(false, "edit_file_sign");
                                  })
                                );

                                setLoadingMap(false, "edit_file_version");
                              }

                              console.log(
                                "current signature to be injected url",
                                {
                                  previewSignature,
                                }
                              );

                              fabric.Image.fromURL(
                                previewSignature,
                                (img) => {
                                  try {
                                    canvas[signPageIndex].add(img).renderAll();

                                    // getAddLocation(true);
                                    console.log(
                                      "successfully added signature object",
                                      { img, canvas, signPageIndex }
                                    );
                                  } catch (error) {
                                    console.log(
                                      "Coundn't inject signature into canvas",
                                      { error, img, canvas, signPageIndex }
                                    );
                                  }
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
                        })();
                      })
                    )
                      .then((status) => {
                        console.log(
                          "successfully injected display objects into canvas"
                        );
                      })
                      .catch((error) => {
                        console.log(
                          "an error has occured when injecting display objects in canvas",
                          error
                        );
                      });
                  } else {
                    console.log("no date injection config or canvas is emmpty");
                  }

                  setLoadingMap(false, "edit_file_levels");
                })();
              })
      )
        .then((status) => {
          setLoadingMap(false, "edit_file_init");

          console.log(
            "injected all of the dynamic object into the document",
            status
          );
        })
        .catch((error) => {
          console.log(
            "an error has occured when injecting display objects",
            error
          );

          setLoadingMap(false, "edit_file_init");
        });

      setLoadingMap(false, "edit_file_init");
    } catch (error) {
      console.log("an error has occured when processing canvas", error);

      // showError("Une erreur est survenue");
    }
    // }, [canvas, params?.id]);
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
    setLoadingMap(true, "edit_file_to_finish");

    for (let i = 0; i < totalPages; i++) {
      canvas[i].discardActiveObject();
      canvas[i].requestRenderAll();
    }

    setLoadingMap(false, "edit_file_to_finish");
    nextMenu();
  };

  /** 填上背景檔案，並移動視窗變動尺寸 */
  React?.useEffect(() => {
    setLoadingMap(true, "edit_file_current");

    const handelFabricCanvas = () => {
      setLoadingMap(true, "edit_file_fabric");

      console.log("data to be injected into principal canvas list", { pdfURL });

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

          console.log("current principal side file list canvas url", { i });
        }
      }

      setLoadingMap(false, "edit_file_fabric");
    };

    handelFabricCanvas();
    window.addEventListener("resize", handelFabricCanvas);

    setLoadingMap(false, "edit_file_current");

    return () => {
      setLoadingMap(false, "edit_file_fabric");

      window.removeEventListener("resize", handelFabricCanvas);
      getCanvasItem(canvasItemRef.current);
    };

    // }, [canvas, pdfURL, onSelectSize, params?.id]);
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

    setLoadingMap(true, "edit_file_resize");
    handleResize();

    setLoadingMap(false, "edit_file_resize");
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
    // }, [params?.id]);
  }, [pdfURL]);

  const SingImgProps = { canvas, focusCanvasIdx, getAddLocation };

  const [signee, setSignee] = React?.useState(
    sessionStorage?.getItem("userId")
  );

  const handleSigneeChange = async (event) => {
    event?.preventDefault();

    let newSignee = null;

    if (!event?.isLastStep) {
      newSignee = event?.target?.value;
    }

    const collabs = JSON.parse(
      sessionStorage.getItem("collabs") || "[]"
    )?.filter((target) => target?.id != sessionStorage?.getItem("userId"));

    if (
      sessionStorage?.getItem("signPage")?.length > 0 &&
      sessionStorage?.getItem("signIndex")?.length > 0 &&
      sessionStorage?.getItem("datePage")?.length > 0 &&
      sessionStorage?.getItem("dateIndex")?.length > 0
    ) {
      const displayObjects = JSON.parse(
        sessionStorage?.getItem("display-initials") || "[]"
      );

      await processDate(displayObjects)
        .then((stat) => {
          console.log("processed signature and date successfully", stat);
        })
        .catch((error) => {
          console.log(
            "an error has occured when processing signature and image",
            error
          );
        });

      const collabs = JSON.parse(
        sessionStorage.getItem("collabs") || "[]"
      )?.filter((target) => target?.id != sessionStorage?.getItem("userId"));

      const signeeLevel =
        [meData, ...collabs]?.findIndex((collab) => {
          return collab?.id === signee;
        }) + 1;

      const currentQueue = JSON.parse(sessionStorage.getItem("versions-queue"));

      const signeeNotCompleted = [meData, ...collabs]?.filter(
        (target, index) => {
          return !currentQueue?.some((target) => {
            return target?.data?.level == index + 1;
          });
        }
      );

      console.log("current signees not completed", signeeNotCompleted);

      if (signeeNotCompleted?.length === 0) {
        setTransitState({
          ...transitState,
          processed: true,
        });
      } else {
        showInfo(
          `Signatures et dates manquantes pour ${signeeNotCompleted
            ?.map((target) => target?.fullName)
            ?.join(" et ")}`
        );
      }

      if (!event?.isLastStep) {
        sessionStorage?.setItem(
          "current-signee",
          newSignee?.toString() ===
            representationMode?.finalSignee?.id?.toString()
            ? representationMode?.finalSignee?.fullName
            : collabs?.find((target) => target?.id == newSignee)?.fullName
        );

        setSignee(newSignee);

        setValidationPhase(signeeNotCompleted?.length);
      } else {
        setValidationPhase(null);
      }
    } else {
      const displayObjects = JSON.parse(
        sessionStorage?.getItem("display-initials") || "[]"
      );

      if (displayObjects?.length > 0 && annexContext) {
        await processInitials(displayObjects);

        const collabs = JSON.parse(
          sessionStorage.getItem("collabs") || "[]"
        )?.filter((target) => target?.id != sessionStorage?.getItem("userId"));

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

        console.log("current signees not completed", signeeNotCompleted);

        if (signeeNotCompleted?.length === 0) {
          setTransitState({
            ...transitState,
            processed: true,
          });
        } else {
          showWarning(
            `Paraphes manquants pour ${signeeNotCompleted
              ?.map((target) => target?.fullName)
              ?.join(" et ")}`
          );
        }

        if (!event?.isLastStep) {
          sessionStorage?.setItem(
            "current-signee",
            newSignee?.toString() ===
              representationMode?.finalSignee?.id?.toString()
              ? representationMode?.finalSignee?.fullName
              : collabs?.find((target) => target?.id == newSignee)?.fullName
          );

          setSignee(newSignee);

          setValidationPhase(signeeNotCompleted?.length);
        } else {
          setValidationPhase(null);
        }
      } else {
        showWarning(
          `Veuillez selectionnez l'emplacement pour la signature ${
            !annexContext ? "et la date" : ""
          }`
        );

        console.log("current signature params", {
          signPage: sessionStorage?.getItem("signPage"),
          signIndex: sessionStorage?.getItem("signIndex"),
          annexContext,
          isParaph,
        });
      }
    }
  };

  const [meData, setMeData] = React?.useState({});

  const [notifications, setNotifications] = React?.useState(true);

  React?.useEffect(() => {
    sessionStorage?.setItem(
      "current-signee",
      representationMode?.active
        ? representationMode?.finalSignee?.fullName
        : sessionStorage?.getItem("username")
    );

    setMeData({
      fullName: sessionStorage?.getItem("username"),
      id: sessionStorage?.getItem("userId"),
    });
    // }, [params?.id]);
  }, []);

  const setSignatures = React?.useContext(signaturesCtx)?.setSignatures;

  const annexContext = sessionStorage?.getItem("annexes-data")?.length > 1;

  React?.useEffect(() => {
    setLoadingMap(true, "edit_file_injection");

    if (!injectDate) {
      (async () => {
        if (
          !(
            signee?.toString() === sessionStorage?.getItem("userId")?.toString()
          )
        ) {
          // alert("We are good");

          const signFrames = (
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
          )?.map((target) => {
            target.paraph = "/images/paraph-cover-big.png";

            return target;
          });

          console.log("computed frames to be introduced");

          // inject signature frame
          setSignatures(signFrames);
        } else {
          const _headers = new Headers();

          _headers?.append("Content-Type", "application/json");
          _headers?.append(
            "Authorization",
            `bearer ${sessionStorage.getItem("token")}`
          );

          await lookup(
            `${BASE_URL}/api/signatures?filters[author][id][$eq]=${
              representationMode?.finalSignee?.id || signee
            }&populate=*`,
            {
              method: "GET",
              headers: _headers,
            }
          )
            .then((res) =>
              res
                .json()
                .then(async (res) => {
                  setLoadingMap(true, "edit_file_signs");

                  console.log(
                    "received data after signature individual fetch",
                    res
                  );

                  let parsedSigns = annexContext
                    ? null
                    : await parseSignatures(
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

                  if (parsedSigns?.length > 0 && !annexContext) {
                    parsedSigns = parsedSigns?.map((target) => {
                      let name = "NONE";

                      if (representationMode?.active) {
                        name = representationMode?.finalSignee?.fullName
                          ?.split(" ")
                          ?.map((elt) => elt[0]?.toUpperCase())
                          ?.join("");
                      } else {
                        name = sessionStorage
                          ?.getItem("username")
                          ?.split(" ")
                          ?.map((elt) => elt[0]?.toUpperCase())
                          ?.join("");
                      }

                      target.paraph = textToImage({ text: name });

                      console.log("injected paraph to signatures", target);

                      return target;
                    });

                    setSignatures(parsedSigns);
                  } else {
                    setLoadingMap(false, "edit_file_signs");

                    setSignatures([
                      {
                        signature: textToImage({
                          text:
                            representationMode?.finalSignee?.fullName ||
                            sessionStorage?.getItem("username"),
                        }),
                        id: 1,
                        createdAt: new Date()?.toISOString(),
                        paraph: textToImage({
                          text: (
                            representationMode?.finalSignee?.fullName ||
                            sessionStorage?.getItem("username")
                          )
                            ?.split(" ")
                            ?.map((elt) => elt[0]?.toUpperCase())
                            ?.join(""),
                        }),
                      },
                    ]);
                  }

                  setLoadingMap(false, "edit_file_signs");
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
        sessionStorage?.setItem("display-initials", "[]");
      })();
    }

    setLoadingMap(false, "edit_file_injection");
    // }, [signee, params?.id]);
  }, [signee]);

  // console.log("current validation phase", validationPhase);

  const [, setMessage] = useAtom(messageAtom);

  const documentCtx = sessionStorage.getItem(
    isParaph ? "paraph-ctx" : "document-ctx"
  );

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

  const processInitials = async (displayObjects) => {
    setLoadingMap(true, "edit_annex_sign");

    const collabs = JSON.parse(
      sessionStorage.getItem("collabs") || "[]"
    )?.filter((target) => target?.id != sessionStorage?.getItem("userId"));

    const createMode = signee === sessionStorage?.getItem("userId");

    const signeeLevel =
      [meData, ...collabs]?.findIndex((collab) => {
        return collab?.id === signee;
      }) + 1;

    const author =
      signee?.toString() === sessionStorage?.getItem("userId")?.toString()
        ? representationMode?.finalSignee?.id?.toString()
        : signee?.toString();

    // alert(`here the version author ${author}`);

    const versionParams = {
      data: {
        level: signeeLevel,
        // file: mediaId?.toString(),
        parentDocument: sessionStorage?.getItem("currDocId"),
        author,
        signed: createMode,
        acceptNotifications: notifications,
        datePage: -1,
        dateCoords: "",
        signPage: -1,
        signCoords: "",
        displayObjects: [],
      },
    };

    const _canvas = canvas;

    await removeDisplayObj({
      objects: displayObjects,
      showError,
      canvas: _canvas,
      versionParams,
      createMode,
      signeeLevel,
      setCanvas,
    })
      .then((status) => {
        console.log("processed display objects for removing inui", status);
      })
      .catch((error) => {
        console.log(
          "an error has occured when processing displays initials for removing",
          error
        );
      });

    setLoadingMap(false, "edit_annex_sign");
  };

  const processDate = async (displayObjects) => {
    setLoadingMap(true, "edit_file_date");

    const collabs = JSON.parse(
      sessionStorage.getItem("collabs") || "[]"
    )?.filter((target) => target?.id != sessionStorage?.getItem("userId"));

    const createMode = signee === sessionStorage?.getItem("userId");

    const signeeLevel =
      [meData, ...collabs]?.findIndex((collab) => {
        return collab?.id === signee;
      }) + 1;

    let author;

    if (signee?.toString() === sessionStorage?.getItem("userId")?.toString()) {
      if (representationMode?.active) {
        author = representationMode?.finalSignee?.id?.toString();
      } else {
        author = signee?.toString();
      }
    } else {
      author = signee?.toString();
    }

    // alert(`here the version author ${author}`);

    const versionParams = {
      data: {
        level: signeeLevel,
        // file: mediaId?.toString(),
        parentDocument: sessionStorage?.getItem("currDocId"),
        author,
        signed: createMode,
        acceptNotifications: notifications,
        datePage: -1,
        dateCoords: "",
        signPage: -1,
        signCoords: "",
      },
    };

    const _canvas = canvas;

    // processing digital objects ( annexes' paraphs and main  documents ones)
    await removeDisplayObj({
      objects: displayObjects,
      showError,
      canvas: _canvas,
      versionParams,
      createMode,
      signeeLevel,
      setCanvas,
    })
      .then((status) => {
        console.log("processed display objects for removing inui", status);
      })
      .catch((error) => {
        console.log(
          "an error has occured when processing displays initials for removing",
          error
        );
      });

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

      console.log("sign object to remove", { signObjToRemove });

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

    setLoadingMap(false, "edit_file_date");
  };

  const _attachedFiles = React?.useContext(filesCtx)?.selectedFiles;
  const setAttachedFiles = React?.useContext(filesCtx)?.setSelectedFiles;

  const [isSendingData, setIsSendingData] = React?.useState(false);
  const [isDocumentNew, setIsDocumentNew] = React.useState(false);

  React?.useEffect(() => {
    console.log("current pathname string", window?.location?.pathname);

    if (window?.location?.pathname?.includes("new-document")) {
      setIsDocumentNew(true);
    }
  }, []);

  const currentDocumentCtx = React?.useContext(currDocumentCtx);

  const representationMode = currentDocumentCtx?.representationMode;

  // console.log("current representation mode", representationMode);

  const processDocument = async () => {
    let versionObjects = JSON.parse(sessionStorage.getItem("versions-queue"));

    // whether we are configuring the main document or the annex document
    const annexContext = sessionStorage?.getItem("annexes-data")?.length > 1;
    const annexDocId = annexContext ? sessionStorage?.getItem("annexId") : null;

    setLoadingMap(true, "edit_file_process_doc");

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
        documentCtx = JSON.parse(
          sessionStorage?.getItem(isParaph ? "paraph-ctx" : "document-ctx")
        );
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

      setLoadingMap(false, "edit_file_process_doc");

      return lookup(`${BASE_URL}/api/upload`, {
        method: "POST",
        headers: _headers,
        body: form,
      })
        .then((res) =>
          res.json().then(async (res) => {
            if ([403, 401]?.includes(res?.error?.status)) {
              navigate("/login", { replace: true });
            } else {
              setLoadingMap(true, "edit_file_upload");

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

              const _data = {
                annexesCompleted: _attachedFiles?.length === 0,
                title: pdfName,
                validationLevel: 1,
                author: representationMode?.active
                  ? representationMode?.finalSignee?.id?.toString()
                  : sessionStorage.getItem("userId")?.toString(),
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
              };

              console.log("computed data for document", _data);

              // alert(
              //   `${_attachedFiles?.length === 0} ${_attachedFiles?.length}`
              // );

              const docPayload = annexContext
                ? {
                    data: {
                      underlying_file: mediaId?.toString(),
                      validationLevel: 1,
                    },
                  }
                : {
                    data: _data,
                  };

              if (!annexContext) {
                docPayload.data.recipients.push(
                  sessionStorage?.getItem("userId")?.toString()
                );
              }

              if (representationMode?.active && !annexContext) {
                docPayload.data.viewers = [sessionStorage?.getItem("userId")];
              }

              const _headers = new Headers();

              _headers?.append(
                "Authorization",
                `Bearer ${sessionStorage?.getItem("token")}`
              );
              _headers?.append("Accept", "application/json");

              const form = new FormData();

              console.log("document data to be created", {
                docPayload,
              });

              setLoadingMap(false, "edit_file_upload");

              return lookup(
                `${BASE_URL}/api/documents${
                  annexContext ? `/${annexDocId}` : ""
                }`,
                {
                  headers: _postHeaders,
                  body: JSON.stringify(docPayload),
                  method: annexContext ? "PUT" : "POST",
                }
              )
                .then((res) =>
                  res.json().then(async (res) => {
                    if ([403, 401]?.includes(res?.error?.status)) {
                      navigate("/login", { replace: true });
                    } else {
                      setLoadingMap(true, "edit_file_documents");

                      const _documentId = res?.data?.id;

                      const annexesData = [];

                      if (!annexContext) {
                        sessionStorage?.setItem("documentId", _documentId);

                        // reducing annex documents into a single documents
                        // await Promise.all(
                        //   _attachedFiles?.map((_file) => {
                        //     return (async () => {})();
                        //   })
                        // );

                        if (_attachedFiles?.length > 0) {
                          const _file = (
                            await mergePdf({
                              files: _attachedFiles,
                              parentDocument: pdfName?.split(".pdf")[0],
                            })
                          )?.file;

                          setAttachedFiles([_file]);

                          console.log(
                            "received merged file from annexes docs",
                            _file
                          );

                          // posting annex data
                          const annexDocObj = {};

                          const form = new FormData();
                          form.append("files", _file);

                          await lookup(`${BASE_URL}/api/upload`, {
                            method: "POST",
                            headers: _headers,
                            body: form,
                          })
                            .then((res) =>
                              res.json().then(async (uploadRes) => {
                                console.log(
                                  "data received after annex file upload",
                                  uploadRes
                                );

                                annexDocObj["underlying_file"] =
                                  uploadRes[0]?.id;
                                annexDocObj["title"] = uploadRes[0]?.name;
                                annexDocObj["annexOf"] = _documentId;
                                annexDocObj["department"] =
                                  sessionStorage?.getItem("department");

                                console.log(
                                  "document data to be created for annex here ...",
                                  annexDocObj
                                );

                                await lookup(`${BASE_URL}/api/documents`, {
                                  method: "POST",
                                  headers: getHeaders({}),
                                  body: JSON.stringify({ data: annexDocObj }),
                                })
                                  .then((res) =>
                                    res.json().then((res) => {
                                      console.log(
                                        "received data after annex doc post",
                                        res
                                      );

                                      annexesData.push({
                                        name: annexDocObj["title"],
                                        file: uploadRes[0]?.url,
                                        id: res?.data?.id,
                                      });
                                    })
                                  )
                                  .catch((error) => {
                                    console.log(
                                      "an error has occured when posting annex doc",
                                      error
                                    );
                                  });
                              })
                            )
                            .catch((error) => {
                              console.log(
                                "an error has occured when posting annex doc",
                                error
                              );
                            });

                          if (annexesData?.length > 0) {
                            sessionStorage?.setItem(
                              "annexes-data",
                              JSON.stringify(annexesData)
                            );
                          } else {
                            console.log(
                              "no annexes could be be found :::",
                              annexesData
                            );

                            showWarning("Aucun document n'a été annexé");
                          }
                        } else {
                        }
                      }

                      console.log("document object persisted successfully");

                      let documentId = res?.data?.id?.toString();

                      const editMode = documentCtx?.mode === "edit";

                      versionObjects = versionObjects?.map((target) => {
                        if (target?.data?.level === 1) {
                          target.data.signed = true;
                          target.data.file = mediaId?.toString();
                        }

                        if (annexContext) {
                          target.data.isAnnex = true;
                        }

                        target.data.parentDocument = documentId?.toString();

                        return target;
                      });

                      console.log(
                        "document versions to be created",
                        versionObjects
                      );

                      setLoadingMap(false, "edit_file_documents");

                      let currDocId = null;

                      // check if the version contains display objects (used to paraph annexes only)
                      const willCompleteAnnexes = annexContext;

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

                            await lookup(`${BASE_URL}/api/doc-versions`, {
                              method: "POST",
                              headers: _headers,
                              body: JSON.stringify(target),
                            })
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
                        .then(async (data) => {
                          console.log(
                            ":::: successfully created document versions objects",
                            data
                          );

                          if (willCompleteAnnexes) {
                            await lookup(
                              `${BASE_URL}/api/documents/${sessionStorage?.getItem(
                                "documentId"
                              )}`,
                              {
                                headers: getHeaders({}),
                                body: JSON.stringify({
                                  data: { annexesCompleted: true },
                                }),
                                method: "PUT",
                              }
                            )
                              ?.then((res) =>
                                res.json().then((res) => {
                                  console.log(
                                    "successfully completed annexes",
                                    res
                                  );
                                })
                              )
                              ?.catch((error) => {
                                console.log(
                                  "an error has occured when completing annexes",
                                  error
                                );
                              });
                          } else {
                            console.log("no annexes to be completed");
                          }

                          sessionStorage.removeItem("versions-queue");

                          return;
                        })
                        .catch((error) => {
                          console.log(
                            "an error has occured when creating versions",
                            error
                          );

                          showError("Oups! Une erreur est survenue");

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

      showError("Aucun objet de signature existant");
    }
  };

  const uploadFinalFile = async () => {
    getCanvasItem(canvasItemRef.current);

    setIsFetching(true);

    setLoadingMap(true, "edit_file_final_upload");

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

    await lookup(`${BASE_URL}/api/upload`, {
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

    setLoadingMap(false, "edit_file_final_upload");

    return finalFileMediaId;
  };

  const injectData = React?.useContext(appDataCtx).injectData;

  const showError = React?.useContext(notificationCtx)?.showError;
  const showWarning = React?.useContext(notificationCtx)?.showWarning;
  const showInfo = React?.useContext(notificationCtx)?.showInfo;
  const showSuccess = React?.useContext(notificationCtx)?.showSuccess;

  const switchToAnnex = async (file) => {
    console.log("received merged file data here", file);

    const fileReader = new FileReader(); // FileReader為瀏覽器內建類別，用途為讀取瀏覽器選中的檔案

    // 處理 PDF
    fileReader.onload = async function (event) {
      const { result } = event.target as FileReader;

      console.log("document loading info here", { result });

      if (typeof result !== "string" && result !== null) {
        const pdfData = new Uint8Array(result);

        // Using DocumentInitParameters object to load binary data.
        const loadingTask = pdfjs.getDocument({ data: pdfData });

        await loadingTask.promise.then(
          async (pdf) => {
            // Fetch the first page
            const imageDate: pdfFileType[] = [];

            console.log("start processing the pdf file", { pdf });

            // for (let i = 1; i <= pdf.numPages; i++) {}

            setLoadingMap(true, "files_render");

            await Promise.all(
              Array.from({ length: pdf.numPages }).map((_, index) => {
                return (async () => {
                  await pdf.getPage(index + 1).then(async (page) => {
                    const scale = 1;

                    const viewport = page.getViewport({ scale });
                    const canvasChild = document.createElement("canvas");
                    uploadCanvas.appendChild(canvasChild);

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

                    await renderTask.promise.then(() => {
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

                      // setProgressBar?.((imageDate.length / pdf.numPages) * 100);
                    });
                  });
                })();
              })
            )
              .then((res) => {
                console.log(
                  "Finished rendering document pages for merged annexes",
                  { imageDate }
                );

                changeFile(imageDate, file?.name, pdf.numPages);
              })
              .catch((error) => {
                console.log(
                  "an error has occured when rendering the document",
                  error
                );

                showError("Une erreur est survenue");
              });

            setLoadingMap(false, "files_render");
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

    console.log("file to be loaded and uploaded from 1st condition", file);

    fileReader.readAsArrayBuffer(file);
  };

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
          key={totalPages}
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
            // key={params?.id}
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
          <div>
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
                onClick={async (event) => {
                  event?.preventDefault();

                  if (validationPhase === 1) {
                    handleSigneeChange({
                      isLastStep: true,
                      preventDefault: () => {},
                    });
                  } else {
                    await processDocument()
                      .then(async () => {
                        console.log(
                          "::::: processed successfully the document :::::"
                        );

                        // reload documents
                        injectData();

                        // navigate("/requests/all");

                        const currentAnnexes =
                          JSON.parse(
                            sessionStorage?.getItem("annexes-data") || "[]"
                          ) || [];

                        // window?.alert(
                        //   `current annex data ${JSON.stringify(currentAnnexes)}`
                        // );

                        const nextAnex = currentAnnexes[0];

                        if (nextAnex) {
                          let fileBlob = null;

                          await lookup(`${BASE_URL}${nextAnex?.file}`, {
                            headers: getHeaders({}),
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
                              console.log(
                                "an error has occured when getting file",
                                error
                              );
                            });

                          if (fileBlob) {
                            const file = new File([fileBlob], nextAnex?.name);

                            sessionStorage?.setItem("annexId", nextAnex?.id);

                            showInfo("Configuration des paraphes sur l'annexe");

                            await switchToAnnex(file)
                              .then((status) => {
                                console.log(
                                  "successfully processed annex data",
                                  status
                                );

                                // remove the processed annex
                                currentAnnexes?.shift();

                                if (currentAnnexes?.length < 1) {
                                  showInfo("Configuaration des annexes");

                                  sessionStorage?.setItem("annexes-data", "[]");
                                } else {
                                  sessionStorage?.setItem(
                                    "annexes-data",
                                    JSON.stringify(currentAnnexes)
                                  );
                                }
                              })
                              .catch((error) => {
                                console.log(
                                  "an error has occured when loading annex file data",
                                  error
                                );
                              });
                          } else {
                            showError(
                              "Le fichier d'annexe n'a pu être téléchargé"
                            );
                          }
                        } else {
                          sessionStorage?.removeItem("annexes-data");

                          showSuccess("Configuration effectuée");

                          navigate(`/mydocuments/`);
                        }
                      })
                      .catch((error) => {
                        console.log(
                          "an error has occured when processing the document",
                          error
                        );

                        showError("Une erreur est survenue");
                      });
                  }
                }}
                disabled={!transitState?.processed && !(validationPhase === 1)}
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
          </div>
        ) : (
          ""
        )}
      </Box>
      <Modal childrenClassName="w-[580px]" small={phoneSize}>
        <div>
          <SignMode onlySendBtn clickStartSignBtn={closeModal} />
          <p
            className="cursor-auto pt-8 text-center text-xs text-white"
            onClick={closeModal}
          >
            Cliquer dehors pour quitter
          </p>
        </div>
      </Modal>
    </Box>
  );
};

export default EditFile;
