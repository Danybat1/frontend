import React, { useState } from "react";

import { useAtom } from "jotai";

import MenuHorizontal from "./Writing/MenuHorizontal";
import { uploadTypeName } from "../../constants/EnumType";
import { signAtom } from "../../jotai";
import DragUpload from "../DragUpload";
import { useNavigate } from "react-router-dom";
import { CircularProgress, useTheme } from "@mui/material";
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
const UploadMode = ({
  ActiveMenu,
  setActiveMenu,
  clickStartSignBtn,
  handleOnlyBtnElement,
  handleSaveBtnMessage,
}: props) => {
  const [imageURL, setImageURL] = useState<string | ArrayBuffer | null>(null);
  const [, setSignList] = useAtom(signAtom);
  const [saveButton, setSaveButton] = useState<boolean>(false);

  const resetUpload = () => {
    setImageURL(null);

    setIsFetching(false);

    setSaveButton(false);
  };

  const theme = useTheme();
  const navigate = useNavigate();

  const [isFetching, setIsFetching] = React?.useState(false);
  const setLoadingMap = React?.useContext(guardCtx)?.setLoadingMap;

  const showError = React?.useContext(notificationCtx)?.showError;
  const showWarning = React?.useContext(notificationCtx)?.showWarning;

  const saveUpload = async () => {
    if (!imageURL) {
      showWarning("Veuillez selection le fichier de signature");
      return;
    }

    setLoadingMap(true, "upload_mode");

    setIsFetching(true);

    let file = await lookup(imageURL);
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
                          setIsFetching(false);

                          setSignList((prev) => [...prev, imageURL.toString()]);
                          setSaveButton(true);

                          handleSaveBtnMessage();

                          navigate("/mydocuments/sign");

                          setTimeout(() => {
                            window?.location?.reload();
                          }, 200);
                        }
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

    setLoadingMap(false, "upload_mode");
  };

  return (
    <div id="UploadMode">
      <div className="card-box">
        <MenuHorizontal ActiveMenu={ActiveMenu} setActiveMenu={setActiveMenu} />
        <div className="px-6">
          {imageURL ? (
            <div className="bg-checkerboard h-signHight">
              <img
                className="h-full"
                src={imageURL?.toString()}
                alt="Upload img"
              />
            </div>
          ) : (
            <DragUpload
              fileSetting={{
                type: uploadTypeName.IMG,
                size: 5,
                divHight: "h-signHight",
              }}
              changeFile={(file) => {
                if (Array.isArray(file)) return;
                setImageURL(file);
              }}
            />
          )}
        </div>
      </div>
      <div className="mt-4 flex gap-4 flat:flex-col-reverse">
        {!saveButton ? (
          <button
            type="button"
            className="btn-secodary flex-auto"
            disabled={imageURL === null}
            onClick={resetUpload}
          >
            Réessayer
          </button>
        ) : (
          handleOnlyBtnElement
        )}
        {!saveButton ? (
          <button
            type="button"
            className="btn-primary flex-auto"
            onClick={saveUpload}
          >
            {!isFetching ? (
              <div>Envoyer</div>
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
    </div>
  );
};

export default UploadMode;
