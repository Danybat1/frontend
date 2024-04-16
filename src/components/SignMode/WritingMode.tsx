import React, { useRef, useState } from "react";

import { useAtom } from "jotai";
import { HexColorPicker } from "react-colorful";
import SignatureCanvas from "react-signature-canvas";

import MenuHorizontal from "./Writing/MenuHorizontal";
import WritingTools from "./Writing/WritingTools";
import { CanvasToolsName } from "../../constants/EnumType";
import signCanvasPropsDefault from "../../constants/SignSetting";
import { signAtom } from "../../jotai";
import useClickOutside from "../../utils/useClickOutside";
import InputTextField from "../InputTextField";
import { Box, CircularProgress, Stack, useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Upload } from "react-feather";
import { guardCtx } from "../../context/Guard";
import { BASE_URL } from "../../constants/api";
import { notificationCtx } from "../../context/notification";

interface props {
  ActiveMenu: number;
  setActiveMenu: React.Dispatch<React.SetStateAction<number>>;
  clickStartSignBtn?: (event: React.MouseEvent<HTMLElement>) => void;
  handleOnlyBtnElement: JSX.Element;
  handleSaveBtnMessage: () => void;
}

const WritingMode = ({
  ActiveMenu,
  setActiveMenu,
  clickStartSignBtn,
  handleOnlyBtnElement,
  handleSaveBtnMessage,
}: props) => {
  const sigCanvas = useRef<any>({});
  let canvasHistory: string[] = []; // canvas 歷史紀錄，用來復原使用
  const [isDrawn, setIsDrawn] = useState<boolean>(false); // 確認是否有繪圖
  const [imageURL, setImageURL] = useState<HTMLCanvasElement | null>(null);
  const [fileName, setFileName] = useState<string>("signature.png");
  const [signCanvasProps, setSignCanvasProps] = useState<SignCanvasPropsType>(
    signCanvasPropsDefault
  );
  const [, setSignList] = useAtom(signAtom);
  const [saveButton, setSaveButton] = useState<boolean>(false);

  const navigate = useNavigate();
  const theme = useTheme();
  const showError = React?.useContext(notificationCtx)?.showError;

  const [isFetching, setIsFetching] = React?.useState(false);

  // color picker
  const colorRef = useRef<HTMLHeadingElement>(null);
  const [isOpenColor, setIsOpenColor] = useState<boolean>(false);

  const openColor = () => setIsOpenColor((prev) => !prev);

  const changeColor = (newColor: string) =>
    setSignCanvasProps((prev) => ({ ...prev, color: newColor }));

  const selectCanvasTool = (changeTool: string) => {
    setSignCanvasProps((prev) => ({
      ...prev,
      tool: changeTool,
      width: changeTool === CanvasToolsName.HIGHLIGHTER ? 3 : 0.5,
    }));
    const ctx = sigCanvas.current.getCanvas().getContext("2d");
    ctx.globalCompositeOperation = "source-over";
  };
  const eraseCanvas = () => {
    setSignCanvasProps((prev) => ({
      ...prev,
      tool: CanvasToolsName.ERASER,
      width: 6,
    }));
    const ctx = sigCanvas.current.getCanvas().getContext("2d");
    ctx.globalCompositeOperation = "destination-out";
  };

  const undoCanvas = () => {
    const data = sigCanvas.current.toData();
    if (data.length > 0) {
      data.pop(); // 移除陣列最後一個
      sigCanvas.current.fromData(data);
    }
  };
  const redoCanvas = () => {
    const data = sigCanvas.current.toData();

    if (data.length < canvasHistory.length) {
      data.push(canvasHistory[data.length]);
      sigCanvas.current.fromData(data);
    }
  };

  const clearCanvas = () => {
    sigCanvas.current.clear();
    setIsDrawn(false);
    setImageURL(null);
    setSaveButton(false);
    sigCanvas.current.on();
  };

  const resetCanvas = () => {
    setSignCanvasProps(signCanvasPropsDefault);
    selectCanvasTool(CanvasToolsName.PEN);
    clearCanvas();
  };

  const fetchCanvas = () => {
    canvasHistory = sigCanvas.current.toData().concat();
  };

  const setLoadingMap = React?.useContext(guardCtx)?.setLoadingMap;

  const saveCanvas = async () => {
    setIsFetching(true);

    setLoadingMap(true, "writing_mode");

    const DataURL: HTMLCanvasElement = sigCanvas.current
      .getTrimmedCanvas()
      .toDataURL("image/png");

    let file = await lookup(DataURL);
    let signData = await file.blob();
    let metadata = {
      type: "image/jpeg",
    };
    let sign = new File(
      [signData],
      `${sessionStorage?.getItem("email")}-signature-${Date.now()}`,
      metadata
    );

    console.log("computed file here", sign);

    const form = new FormData();

    form?.append("files", sign);

    const _headers = new Headers();

    // _headers?.append("Content-Type", "multipart/form-data");
    _headers?.append("Accept", "application/json");
    _headers?.append(
      "Authorization",
      `Bearer ${sessionStorage?.getItem("token")}`
    );

    let mediaId = null;

    await lookup(`${BASE_URL}/api/upload`, {
      method: "POST",
      headers: _headers,
      body: form,
    })
      .then((res) => {
        res
          .json()
          .then(async (res) => {
            if ([403, 401]?.includes(res?.error?.status)) {
              navigate("/login", { replace: true });
            } else {
              console.log("received data after file upload", res);

              mediaId = res[0]?.id;

              const _postHeaders = new Headers();

              _postHeaders?.append("Content-Type", "application/json");
              _postHeaders?.append(
                "Authorization",
                `Bearer ${sessionStorage?.getItem("token")}`
              );

              console.log("will post new signature");

              await lookup(`${BASE_URL}/api/signatures`, {
                headers: _postHeaders,
                body: JSON.stringify({
                  data: {
                    sign: mediaId,
                    author: sessionStorage?.getItem("userId"),
                  },
                }),
                method: "POST",
              })
                .then((res) =>
                  res
                    .json()
                    .then((res) => {
                      console.log("received data after signature post", res);

                      if ([403, 401]?.includes(res?.error?.status)) {
                        navigate("/login", { replace: true });
                      } else {
                        if (res?.data?.id) {
                          setImageURL(DataURL);
                          sigCanvas.current.off();
                          setSignList((prev) => [...prev, DataURL]);
                          setSaveButton(true);

                          handleSaveBtnMessage();
                        }

                        setIsFetching(false);

                        setTimeout(() => {
                          window?.location?.reload();
                        }, 500);
                      }
                    })
                    .catch((error) => {
                      console.log(
                        "an error has occured when posting a signature",
                        error
                      );

                      setIsFetching(false);

                      showError("Une errerur essurvenue, réessayer");
                    })
                )
                .catch((error) => {
                  console.log(
                    "an error has occured when posting a signature",
                    error
                  );

                  setIsFetching(false);

                  showError("Une errerur essurvenue, réessayer");
                });
            }
          })
          .catch((error) => {
            console.log(
              "an error has occured when uploading signature file",
              error
            );

            setIsFetching(false);

            showError("Oups! Réessayer");
          });
      })
      .catch((error) => {
        console.log(
          "an error has occured when uploading signature file",
          error
        );

        setIsFetching(false);

        showError("Oups! Réessayer");
      });

    setLoadingMap(false, "writing_mode");
  };

  useClickOutside(colorRef, () => setIsOpenColor(false));

  return (
    <Box
      id="WritingMode"
      sx={{
        width: "100%",
      }}
    >
      <div className="card-box">
        <MenuHorizontal ActiveMenu={ActiveMenu} setActiveMenu={setActiveMenu} />
        <div className={`relative px-8 ${!isDrawn && "sing-canvas-caption"}`}>
          {!imageURL && (
            <WritingTools
              handleSignTools={{
                openColor,
                selectCanvasTool,
                eraseCanvas,
                undoCanvas,
                redoCanvas,
                resetCanvas,
              }}
              signCanvasProps={signCanvasProps}
            />
          )}
          <SignatureCanvas
            canvasProps={{
              className:
                "signatureCanvas w-full bg-pale-blue rounded-md cursor-canvas h-signHight",
            }}
            minWidth={signCanvasProps.width}
            penColor={signCanvasProps.color}
            onEnd={fetchCanvas}
            onBegin={() => {
              // 判斷是否已有點擊繪圖
              setIsDrawn(true);
            }}
            ref={sigCanvas}
          />

          {isOpenColor && (
            <div ref={colorRef}>
              <HexColorPicker
                color={signCanvasProps.color}
                onChange={changeColor}
              />
            </div>
          )}
        </div>
        <div className="px-12">
          <p className="mt-8 mb-4 select-none text-black/50">Nom du fichier</p>
          <InputTextField InputValue={fileName} setInputValue={setFileName} />
        </div>
      </div>
      <div className="two-btn ">
        {!saveButton ? (
          <button
            type="button"
            className="btn-secodary flex-auto"
            disabled={!isDrawn}
            onClick={clearCanvas}
          >
            Effacer
          </button>
        ) : (
          handleOnlyBtnElement
        )}
        {!saveButton ? (
          <button
            type="button"
            className="btn-primary flex-auto"
            onClick={saveCanvas}
          >
            {!isFetching ? (
              <Stack
                direction={"row"}
                sx={{
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                Envoyer <Upload size={20} />
              </Stack>
            ) : (
              <CircularProgress
                size={"1rem"}
                sx={{
                  width: "10px",
                  fontSize: "10px",
                  color: theme?.palette?.common?.white,
                }}
              />
            )}
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary flex-auto"
            onClick={clickStartSignBtn}
          >
            Valider
          </button>
        )}
      </div>
    </Box>
  );
};

export default WritingMode;
