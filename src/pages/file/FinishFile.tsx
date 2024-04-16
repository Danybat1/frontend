/* eslint-disable import/no-extraneous-dependencies */
import React, { useEffect } from "react";

import {
  Document,
  Page,
  Image,
  PDFDownloadLink,
  pdf,
} from "@react-pdf/renderer";
import { PrimitiveAtom, useAtom } from "jotai";
import { Download, Upload } from "react-feather";

import InputTextField from "../../components/InputTextField";
import { MessageTexts } from "../../constants/MessageSetting";
import { fileAtom, messageAtom } from "../../jotai";
import { Box, CircularProgress, useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { documentsCtx } from "../../context/documents";
import { guardCtx } from "../../context/Guard";
import { BASE_URL } from "../../constants/api";
import { notificationCtx } from "../../context/notification";

interface props {
  pdfName: string;
  setPdfName: React.Dispatch<React.SetStateAction<string>>;
  finishPdf: (HTMLCanvasElement | null)[];
  totalPages: number;
}

const FinishFile = ({ pdfName, setPdfName, finishPdf, totalPages }: props) => {
  const [, setMessage] = useAtom(messageAtom);
  const [pdfURL] = useAtom<PrimitiveAtom<pdfFileType[] | null>>(fileAtom);
  const firstPage = finishPdf[0]?.toDataURL("image/png");

  const documentCtx = sessionStorage.getItem("document-ctx");

  const [isFetching, setIsFetching] = React?.useState(false);

  const theme = useTheme();

  const ownDocuments = React?.useContext(documentsCtx)?.documents?.own;

  const navigate = useNavigate();

  const setLoadingMap = React?.useContext(guardCtx)?.setLoadingMap;

  const createCanvasItem = async (): void => {
    console.log("pdf url for upload data here", { pdfURL });

    setIsFetching(true);

    setLoadingMap(true, "finish_file");

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

    const _fileToUpload = new File(
      [docBlobData],
      `${documentCtx?.data?.title}.pdf`,
      {}
    );

    const _headers = new Headers();

    _headers?.append(
      "Authorization",
      `Bearer ${sessionStorage?.getItem("token")}`
    );
    _headers?.append("Accept", "application/json");

    const form = new FormData();

    form?.append("files", _fileToUpload);

    console.log(
      "data received from convetying a pdf to a uploadable format",
      docBlobData
    );

    await lookup(`${BASE_URL}/api/upload`, {
      method: "POST",
      headers: _headers,
      body: form,
    })
      .then((res) =>
        res.json().then(async (res) => {
          if ([403, 401]?.includes(res?.error?.status)) {
            navigate("/login", { replace: true });
          } else {
            console.log("received data after file upload", res);

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

            const docPayload = {
              data: {
                title: pdfName,
                file: mediaId?.toString(),
                signedBy: signers?.filter(
                  (item) => ![NaN, undefined, null, ""]?.includes(item)
                ),
              },
            };

            if (
              ownDocuments?.some(
                (doc) => doc?.id?.toString() === documentCtx?.data?.id
              ) ||
              !documentCtx
            ) {
              docPayload.data.author = sessionStorage.getItem("userId");

              docPayload.data.recipients = collabs
                ?.map((target) => target?.id?.toString())
                ?.filter((item) => ![NaN, undefined, null, ""]?.includes(item));
            } else {
              docPayload.data.recipients = documentCtx?.data?.recipients?.map(
                (target) => target?.id?.toString()
              );
            }

            let nextSignerId = 0;

            if (documentCtx?.mode !== "edit") {
              docPayload.data["department"] =
                sessionStorage?.getItem("department");

              docPayload.data["expiryDate"] = new Date(
                new Date()?.setDate(new Date()?.getDate() + 3)
              ).toISOString();
            }

            const isUSerTheSigner = docPayload?.data?.recipients?.some(
              (recipId, index) => {
                if (recipId?.toString() === sessionStorage?.getItem("userId")) {
                  nextSignerId = index + 1;

                  if (docPayload?.data?.recipients[nextSignerId]) {
                    docPayload.data.nextSigner =
                      docPayload?.data?.recipients[nextSignerId].toString();
                  } else {
                    docPayload.data.nextSigner = null;
                  }

                  return true;
                }
              }
            );

            if (!isUSerTheSigner) {
              docPayload.data.nextSigner =
                docPayload.data?.recipients[0]?.toString();

              console.log("user is unique receiver", { isUSerTheSigner });
            }

            console.log(
              "current data send to the server for document",
              docPayload
            );

            if (!docPayload?.data["nextSigner"]) {
              delete docPayload?.data["nextSigner"];

              docPayload.data["completed"] = true;
            }

            console.log(
              "current data send to the server for document",
              docPayload
            );

            await lookup(
              `${BASE_URL}/api/documents${
                documentCtx?.mode === "edit" ? `/${documentCtx?.data?.id}` : ""
              }`,
              {
                headers: _postHeaders,
                body: JSON.stringify(docPayload),
                method: documentCtx?.mode === "edit" ? "PUT" : "POST",
              }
            )
              .then((res) =>
                res
                  .json()
                  .then((res) => {
                    if ([403, 401]?.includes(res?.error?.status)) {
                      navigate("/login", { replace: true });
                    } else {
                      console.log("received data for post document", res);

                      if (res?.data?.id) {
                        setIsFetching(false);

                        showSuccess(`Document signé avec succès`);

                        navigate("/mydocuments");

                        setTimeout(() => {
                          window?.location?.reload();
                        }, 500);

                        sessionStorage?.removeItem("document-ctx");
                        sessionStorage?.removeItem("collabs");
                      } else {
                        setIsFetching(false);
                        showError("Oups! Veuillez réessayer");
                      }
                    }
                  })
                  .catch((error) => {
                    console.log(
                      "an error has occured on document edit publish",
                      error
                    );

                    setIsFetching(false);

                    showError("Oups! Veuillez réessayer");
                  })
              )
              .catch((error) => {
                console.log(
                  "an error has occured on document edit publish",
                  error
                );

                setIsFetching(false);

                showError("Oups! Veuillez réessayer");
              });
          }
        })
      )
      .catch((error) => {
        console.log("an error has occured when uploading final file", error);

        setIsFetching(false);

        showError("Oups! Veuillez réessayer");
      });

    setLoadingMap(false, "finish_file");
  };

  React.useEffect(() => {
    setMessage({
      open: true,
      icon: "check",
      content: MessageTexts.sign_success,
    });
  }, []);

  const showError = React?.useContext(notificationCtx)?.showError;
  const showSuccess = React?.useContext(notificationCtx)?.showSuccess;

  return (
    <Box
      id="WritingMode"
      sx={{
        width: "100%!important",
      }}
    >
      <div className="card-box w-full">
        <div className="mx-8 my-2 flex items-center justify-center rounded-3xl border border-solid border-blue/50 p-6">
          {firstPage ? (
            <img src={firstPage} className="h-44 shadow-pdf" alt="page" />
          ) : (
            <p className="text-alert-red">
              Erreur de chargement. L'avez-vous chargée
            </p>
          )}
        </div>
        <div className="px-12">
          <p className="mt-8 mb-4 select-none text-black/50">Nom du fichier</p>
          <InputTextField InputValue={pdfName} setInputValue={setPdfName} />
        </div>
      </div>
      <div className="two-btn ">
        <button
          type="button"
          className="btn-secodary flex-auto"
          onClick={() =>
            setMessage({
              open: true,
              icon: "warn",
              content: MessageTexts.unopened,
            })
          }
        >
          Fichiers
        </button>
        <button
          onClick={createCanvasItem}
          className="btn-primary flex flex-auto items-center justify-center gap-3"
        >
          {!isFetching ? (
            <div>
              Envoyer <Upload size={20} />
            </div>
          ) : (
            <CircularProgress
              size="1rem"
              sx={{
                width: "10px",
                fontSize: "10px",
                color: theme?.palette?.common?.white,
              }}
            />
          )}
        </button>
      </div>
    </Box>
  );
};

export default FinishFile;
