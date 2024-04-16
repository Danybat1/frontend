// component definition

import * as React from "react";

import { useContext } from "react";

import { fabric } from "fabric";
import { useAtom } from "jotai";
import { ChevronLeft, Plus, Search } from "react-feather";

import SingImgContext from "../../../../context/SingImgContext";
import { openModalAtom, signAtom } from "../../../../jotai";
import { signaturesCtx } from "../../../../context/signatures";
import {
  Stack,
  useTheme,
  Button,
  useMediaQuery,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import { Check, Close, Delete } from "@mui/icons-material";

import { useNavigate } from "react-router-dom";
import RejectionModal from "../../../../components/RejectionModal";
import { currDocumentCtx } from "../../../../context/currDocument";
import { appDataCtx } from "../../../../context/appData";
import { guardCtx } from "../../../../context/Guard";
import { BASE_URL } from "../../../../constants/api";

import { paraphCtx } from "../../../paraph";
import getHeaders from "../../../../utils/getHeaders";
import { notificationCtx } from "../../../../context/notification";
import { parseSignatures } from "../../../../utils/document";
import textToImage from "../../../../utils/textToImage";

const TagSign = ({ uploadFinalFile }) => {
  // context
  const { canvas, focusCanvasIdx, getAddLocation } = useContext(SingImgContext);

  // useAtom
  const [signList] = useAtom(signAtom);
  const [, setOpenModal] = useAtom(openModalAtom);

  const isParaph = React?.useContext(paraphCtx)?.isParaph;

  const theme = useTheme();

  const annexContext = sessionStorage?.getItem("annexes-data")?.length > 1;

  const clickAddSing = (
    addImg: string | HTMLCanvasElement,
    isSignature = true
  ) => {
    console.log("current data for sign add", { addImg });

    fabric.Image.fromURL(
      addImg.toString(),
      (img) => {
        console.log("current index in sign", {
          addImg,
        });

        const signPage = window?.sessionStorage?.getItem("signPage");
        const signIndex = window?.sessionStorage?.getItem("signIndex");

        // alert(`current annex context ${annexContext}`);

        if (annexContext || !isSignature) {
          // alert("Will store display objects");

          const displayObjects = JSON.parse(
            sessionStorage?.getItem("display-initials") || "[]"
          );

          if (
            displayObjects?.some(
              (target) =>
                target?.signPage?.toString() ===
                focusCanvasIdx?.toString()?.toString()
            )
          ) {
            showWarning("Un seul paraphe par page");
          } else {
            displayObjects?.push({
              signPage: focusCanvasIdx?.toString(),
              signIndex: addImg,
            });

            sessionStorage?.setItem(
              "display-initials",
              JSON.stringify(displayObjects)
            );

            canvas[focusCanvasIdx].add(img).renderAll();
          }
        } else {
          if (signPage?.length > 0 && signIndex?.length > 0) {
            showWarning("Une seule signature par signataire");
          } else {
            window?.sessionStorage?.setItem(
              "signPage",
              focusCanvasIdx?.toString()
            );

            window?.sessionStorage?.setItem("signIndex", addImg);

            canvas[focusCanvasIdx].add(img).renderAll();

            // getAddLocation(true);
          }
        }
      },
      {
        top: 50,
        left: 50,
      }
    );
  };

  const navigate = useNavigate();

  const createSignURL = (
    item: string | HTMLCanvasElement,
    isSignature = true
  ) => {
    clickAddSing(item, isSignature);
  };

  const signatureContext = React?.useContext(signaturesCtx);

  const signatures = signatureContext?.signatures;

  const setSignatures = signatureContext?.setSignatures;

  const representationMode =
    React?.useContext(currDocumentCtx)?.representationMode;

  React?.useEffect(() => {
    // maybe it's not useful

    const configImages = async () => {
      const finalSignee = representationMode?.finalSignee;

      await lookup(
        `${BASE_URL}/api/signatures?filters[author][id][$eq]=${finalSignee?.id}&populate=*`,
        {
          method: "GET",
          headers: getHeaders({}),
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
                // alert("should load paraph");
                parsedSigns = parsedSigns?.map((target) => {
                  let name = "NONE";

                  if (representationMode?.active) {
                    name = finalSignee?.fullName
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
                let name = "NONE";

                if (annexContext) {
                  if (representationMode?.active) {
                    name = finalSignee?.fullName
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
                } else {
                  if (representationMode?.active) {
                    name = finalSignee?.fullName;
                  } else {
                    name = sessionStorage?.getItem("username");
                  }
                }

                setLoadingMap(false, "edit_file_signs");

                setSignatures([
                  {
                    signature: textToImage({ text: name }),
                    id: 1,
                    createdAt: new Date()?.toISOString(),
                    paraph: textToImage({
                      text: name
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
    };
  }, []);

  // console.log("signatures data here for edit", signatures);

  const [rejectionPurpose, setRejectionPurpose] = React?.useState("");
  const [isPromptOpen, setIsPromptOpen] = React?.useState("");

  const onPromptOpen = (event) => {
    event?.preventDefault();

    setIsPromptOpen(true);
  };

  const injectData = React?.useContext(appDataCtx).injectData;

  const setLoadingMap = React?.useContext(guardCtx)?.setLoadingMap;

  const handleReject = async () => {
    const _headers = new Headers();

    const documentCtx = JSON.parse(
      sessionStorage?.getItem("document-ctx") || "{}"
    );

    setIsFetching(true);

    const reason = rejectionPurpose;

    if (reason?.length > 5) {
      _headers.append("Content-Type", "application/json");
      _headers.append(
        "Authorization",
        `Bearer ${sessionStorage.getItem("token")}`
      );

      const rejectionBody = JSON.stringify({
        data: {
          rejectionMessage: reason,
          rejectionDate: new Date().toISOString(),
        },
      });

      console.log("rejection body to be sent", rejectionBody);

      await lookup(
        `${BASE_URL}/api/doc-versions/${documentCtx?.data?.versionId}`,
        {
          headers: _headers,
          method: "PUT",
          body: rejectionBody,
        }
      )
        .then((res) =>
          res
            .json()
            .then((res) => {
              console.log("received data after put document", res);

              if (res?.error?.status === 403) {
                navigate("/login", { replace: true });
              } else {
                showSuccess("Le document a été rejeté avec success");

                sessionStorage?.removeItem("documents-ctx");
                sessionStorage?.removeItem("collabs");

                setIsFetching(false);
                setIsPromptOpen(false);

                injectData();

                navigate("/requests/all");

                setTimeout(() => {
                  window?.location?.reload();
                }, 300);
              }
            })
            .catch((error) => {
              console.log(
                "an error has occured when updating a document",
                error
              );

              setIsPromptOpen(false);

              showError("Une erreur est survenue! Réessayer");
            })
        )
        .catch((error) => {
          console.log("an error has occured when updating a document", error);

          showError("Une erreur est survenue! Réessayer");
        });
    } else {
      showWarning("Le motif ne peut pas avoir moins de 5 caractères");
    }
  };

  const screen900 = useMediaQuery(theme?.breakpoints?.down(900));

  const [isFetching, setIsFetching] = React?.useState(false);
  const [isDocumentNew, setIsDocumentNew] = React.useState(false);
  const [isSigningPart, setIsSigningPart] = React?.useState(false);

  React?.useEffect(() => {
    console.log("current pathname string", window?.location?.pathname);

    let documentCtx = {};

    try {
      documentCtx = JSON.parse(sessionStorage?.getItem("document-ctx"));
    } catch (error) {
      console.log(
        "an error has occured when parsing the document context in effect for tab sign",
        error
      );
    }

    const versions = documentCtx?.data?.levelVersions;

    if (
      versions?.find((target) => {
        return (
          target?.author?.id?.toString() ===
          sessionStorage?.getItem("userId")?.toString()
        );
      })?.signed === false
    ) {
      setIsSigningPart(true);
    }

    if (window?.location?.pathname?.includes("new-document")) {
      setIsDocumentNew(true);
    }
  }, []);
  const [previewMode, setPreviewMode] = React?.useState(false);

  const handleValidate = async (event) => {
    event?.preventDefault();

    // setIsFetching(true);

    if (
      (sessionStorage?.getItem("paraphedAnnex")?.toString() &&
        sessionStorage?.getItem("paraphedAnnex")?.toString() ===
          JSON.parse(
            sessionStorage.getItem("paraph-ctx") || "{}"
          )?.data?.id?.toString()) ||
      !(sessionStorage.getItem("attachements")?.length > 2)
    ) {
      if (previewMode) {
        if (true) {
          if (true) {
            setLoadingMap(true, "tag_sign");

            const documentCtx = JSON.parse(
              sessionStorage?.getItem("document-ctx") || "{}"
            );

            const _headers = new Headers();

            _headers?.append("Content-Type", "application/json");
            _headers?.append(
              "Authorization",
              `Bearer ${sessionStorage?.getItem("token")}`
            );

            const maxLevel = Math.max(
              ...documentCtx?.data?.levelVersions?.map(
                (target) => target?.level
              )
            );

            const willProcessFile =
              maxLevel - documentCtx?.data?.validationLevel === 1;

            const versionData = {
              data: {
                signed: true,
                validationDate: new Date()?.toISOString(),
              },
            };

            if (willProcessFile) {
              versionData.data.file = (await uploadFinalFile())?.toString();
            }

            console.log("current document computung params", {
              willProcessFile,
              maxLevel,
              documentCtx,
              versionData,
            });

            await lookup(
              `${BASE_URL}/api/doc-versions/${documentCtx?.data?.versionId}`,
              {
                headers: _headers,
                method: "PUT",
                body: JSON.stringify(versionData),
              }
            )
              .then((res) =>
                res
                  .json()
                  .then((res) => {
                    if ([403, 401]?.includes(res?.error?.status)) {
                      navigate("/login", { replace: true });
                    } else {
                      if (res?.data?.id) {
                        console.log("received data after version update", res);

                        setIsFetching(false);

                        injectData();

                        navigate("/requests/all");
                      } else {
                        showError("Une erreur est survenue, Réessayer");

                        setIsFetching(false);
                      }
                    }
                  })
                  .catch((error) => {
                    console.log(
                      "an error has occured when updating doc version",
                      error
                    );

                    setIsFetching(false);
                  })
              )
              .catch((error) => {
                console.log(
                  "an error has occured when updating doc version",
                  error
                );

                setIsFetching(false);
              });

            setLoadingMap(false, "tag_sign");
          } else {
            setIsFetching(false);
          }
        } else {
          showWarning("Veuillez d'abord parapher les annexes");
        }
      } else {
        if (window.confirm("Voulez-vous vraiment signer ?")) {
          setPreviewMode(true);
        }
      }
    } else {
      showWarning("Veuillez d'abord parapher les annexes");
    }
  };

  const handleParaph = async (event) => {
    event?.preventDefault();

    if (previewMode) {
      const documentCtx = JSON.parse(
        sessionStorage?.getItem("paraph-ctx") || "{}"
      );

      if (
        sessionStorage?.getItem("paraphedAnnex")?.toString() ===
        documentCtx?.data?.id?.toString()
      ) {
        showWarning("L'annexe a déjà été paraphé");
      } else {
        if (true) {
          setLoadingMap(true, "paraph_sign");

          // setIsFetching(true);

          const _headers = new Headers();

          _headers?.append("Content-Type", "application/json");
          _headers?.append(
            "Authorization",
            `Bearer ${sessionStorage?.getItem("token")}`
          );

          const maxLevel = Math.max(
            ...documentCtx?.data?.levelVersions?.map((target) => target?.level)
          );

          // if the version is the last one of the document (after thois update, validationLevel will be the set to maxLevel as it will be processed already)
          const willProcessFile =
            maxLevel - documentCtx?.data?.validationLevel === 1;

          const versionData = {
            data: {
              signed: true,
              validationDate: new Date()?.toISOString(),
            },
          };

          if (willProcessFile) {
            versionData.data.file = (await uploadFinalFile())?.toString();
          }

          if (isParaph) {
            documentCtx.data.versionId = documentCtx?.data?.levelVersions
              ?.find((target) => {
                return (
                  target?.author?.id?.toString() ===
                  sessionStorage?.getItem("userId")?.toString()
                );
              })
              ?.id?.toString();
          }

          if (isParaph && willProcessFile) {
            await lookup(`${BASE_URL}/api/documents/${documentCtx?.data?.id}`, {
              body: JSON.stringify({
                data: { underlying_file: versionData.data?.file },
              }),
              method: "PUT",
              headers: getHeaders({}),
            })
              .then((res) => {
                console.log("updated underlying file od the annex document");
              })
              .catch((error) => {
                console.log(
                  "an error has occured when updating underlying file ",
                  error
                );
              });
          }

          console.log("current document computung params", {
            willProcessFile,
            maxLevel,
            validationLevel: documentCtx?.data?.validationLevel,
          });

          await lookup(
            `${BASE_URL}/api/doc-versions/${documentCtx?.data?.versionId}`,
            {
              headers: _headers,
              method: "PUT",
              body: JSON.stringify(versionData),
            }
          )
            .then((res) =>
              res
                .json()
                .then((res) => {
                  if ([403, 401]?.includes(res?.error?.status)) {
                    navigate("/login", { replace: true });
                  } else {
                    if (res?.data?.id) {
                      console.log("received data after annex update", res);

                      showSuccess("Paraphe(s) enregistré(s)");

                      // setIsFetching(false);

                      // injectData();

                      // window?.alert("finished processing version");

                      sessionStorage?.setItem(
                        "paraphedAnnex",
                        documentCtx?.data?.id
                      );

                      navigate(
                        `/mydocuments/${sessionStorage?.getItem(
                          "documentToBeParaphedId"
                        )}`
                      );
                    } else {
                      showError("Une erreur est survenue, Réessayer");

                      console.log(
                        "received status after doc-version update",
                        res
                      );
                      setIsFetching(false);
                    }
                  }
                })
                .catch((error) => {
                  console.log(
                    "an error has occured when updating annex version",
                    error
                  );

                  setIsFetching(false);
                })
            )
            .catch((error) => {
              console.log(
                "an error has occured when updating paraph version",
                error
              );

              setIsFetching(false);
            });

          setLoadingMap(false, "paraph_sign");
        }
      }

      setIsFetching(false);
    } else {
      if (window.confirm("Voulez-vous vraiment parapher ?")) {
        setPreviewMode(true);
      }
    }
  };

  const notifsContext = React?.useContext(notificationCtx);

  const showError = notifsContext?.showError;
  const showSuccess = notifsContext?.showSuccess;
  const showWarning = notifsContext?.showWarning;

  return (
    <div>
      <RejectionModal
        open={isPromptOpen}
        setOpen={() => {
          setIsPromptOpen(false);
        }}
        childrenClassName={`w-[${screen900 ? 95 : 70}%]`}
      >
        <Stack className="card-box w-full p-6" sx={{}}>
          <Typography
            sx={{
              fontSize: "14px",
              textAlign: "center",
              fontWeight: theme?.typography?.fontWeightBold,
              color: theme?.palette?.primary?.main,
            }}
          >
            VOTRE MOTIF
          </Typography>
          <Box
            className="text-field"
            sx={{
              py: ".3rem",
              width: "100%",
              my: "1rem",
            }}
          >
            <textarea
              rows={5}
              type="text"
              value={rejectionPurpose}
              onChange={(event) => {
                event?.preventDefault();

                setRejectionPurpose(event?.target?.value);
              }}
              placeholder={"Veuillez renseigner ici votre motif de rejet"}
              style={{
                width: "100%",
                outline: "none",
                backgroundColor: "transparent",
              }}
            />
          </Box>
          <button
            type="button"
            className="btn-primary flex-auto"
            onClick={async (event) => {
              event?.preventDefault();

              if (rejectionPurpose?.length < 5) {
                showWarning("Votre motif doit avoir au moins 5 caractères");
              } else {
                setLoadingMap(true, "tag_sign");

                await handleReject().catch((error) => {
                  console.log(
                    "an error has occured when sending rejection data",
                    error
                  );
                });

                setLoadingMap(false, "tag_sign");
              }
            }}
          >
            {!isFetching ? (
              <Stack
                direction={"row"}
                sx={{
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                Envoyer
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
        </Stack>
      </RejectionModal>
      <div className="tag-element">
        {(isSigningPart || isParaph) && <p>Actions</p>}
        {isDocumentNew ? (
          <div style={{}}>
            <p>{annexContext ? "Paraphe" : "Signature"}</p>
            <div className="tag-list">
              {signatures.map((item, idx: number) => (
                <div
                  key={idx}
                  className="sing-tag border-solid border-black/20 bg-[#F9F9F9]"
                  onClick={() =>
                    createSignURL(
                      annexContext ? item?.paraph : item?.signature,
                      !annexContext
                    )
                  }
                >
                  <img
                    src={item[
                      annexContext ? "paraph" : "signature"
                    ]?.toString()}
                    alt="sign img"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : !isDocumentNew && isSigningPart && !isParaph ? (
          <Button
            onClick={handleValidate}
            sx={{
              bgcolor: `${theme?.palette?.primary?.main}10`,
              fontSize: "14px",
              textTransform: "capitalize",
              "&:hover": {
                bgcolor: `${theme?.palette?.primary?.main}10`,
              },
              width: "100%",
              py: ".3rem",
              borderRadius: "1rem",
              mt: "1rem",
            }}
          >
            {isFetching ? (
              <CircularProgress
                size={"1rem"}
                sx={{
                  width: "10px",
                  fontSize: "10px",
                  color: theme?.palette?.primary?.main,
                  mb: ".3rem",
                }}
              />
            ) : (
              <Stack
                direction={"row"}
                sx={{
                  alignItems: "center",
                  color: theme?.palette?.primary?.main,
                }}
              >
                <Check
                  sx={{
                    fontSize: "20px",
                    color: theme?.palette?.primary?.main,
                    mr: ".2rem",
                  }}
                />
                {previewMode ? "Valider" : "Signer"}
              </Stack>
            )}
          </Button>
        ) : (
          ""
        )}
        {isDocumentNew && !annexContext && (
          <div
            id="main page paraph"
            style={{
              marginTop: "1rem",
            }}
          >
            <p>{"Paraphe"}</p>
            <div className="tag-list">
              {signatures?.map((item, idx: number) => (
                <div
                  key={idx}
                  className="sing-tag border-solid border-black/20 bg-[#F9F9F9]"
                  onClick={() => createSignURL(item?.paraph, false)}
                >
                  <img src={item?.paraph?.toString()} alt="sign img" />
                </div>
              ))}
            </div>
          </div>
        )}
        {!isDocumentNew && !isParaph && isSigningPart ? (
          <Button
            onClick={onPromptOpen}
            sx={{
              bgcolor: `${theme?.palette?.error?.main}10`,
              fontSize: "14px",
              textTransform: "capitalize",
              "&:hover": {
                bgcolor: `${theme?.palette?.error?.main}10`,
              },
              width: "100%",
              py: ".3rem",
              borderRadius: "1rem",
              mt: "1rem",
            }}
          >
            <Stack
              direction={"row"}
              sx={{
                alignItems: "center",
                color: theme?.palette?.error?.main,
              }}
            >
              <Close
                sx={{
                  fontSize: "20px",
                  color: theme?.palette?.error?.main,
                  mr: ".2rem",
                }}
              />
              Rejeter
            </Stack>
          </Button>
        ) : (
          ""
        )}
        {isParaph && (
          <div>
            <Button
              disabled={!isSigningPart}
              onClick={handleParaph}
              sx={{
                bgcolor: `${theme?.palette?.primary?.main}10`,
                fontSize: "14px",
                textTransform: "capitalize",
                "&:hover": {
                  bgcolor: `${theme?.palette?.primary?.main}10`,
                },
                width: "100%",
                py: ".3rem",
                borderRadius: "1rem",
                // mt: "1rem",
              }}
            >
              {isFetching ? (
                <CircularProgress
                  size={"1rem"}
                  sx={{
                    width: "10px",
                    fontSize: "10px",
                    color: theme?.palette?.primary?.main,
                    my: ".3rem",
                  }}
                />
              ) : (
                <Stack
                  direction={"row"}
                  sx={{
                    alignItems: "center",
                    color: !isSigningPart
                      ? `${theme?.palette?.primary?.main}50`
                      : theme?.palette?.primary?.main,
                  }}
                >
                  <Check
                    sx={{
                      fontSize: "20px",
                      color: !isSigningPart
                        ? `${theme?.palette?.primary?.main}50`
                        : theme?.palette?.primary?.main,
                      mr: ".2rem",
                    }}
                  />
                  {previewMode ? "Valider" : "Parapher"}
                </Stack>
              )}
            </Button>
            <Button
              onClick={(event) => {
                event?.preventDefault();

                navigate(
                  `/mydocuments/${sessionStorage?.getItem(
                    "documentToBeParaphedId"
                  )}`
                );

                window?.location?.reload();
              }}
              sx={{
                bgcolor: `${theme?.palette?.error?.main}10`,
                fontSize: "14px",
                textTransform: "capitalize",
                "&:hover": {
                  bgcolor: `${theme?.palette?.error?.main}10`,
                },
                width: "100%",
                py: ".3rem",
                borderRadius: "1rem",
                mt: "1rem",
              }}
            >
              <Stack
                direction={"row"}
                sx={{
                  alignItems: "center",
                  color: theme?.palette?.error?.main,
                }}
              >
                <ChevronLeft
                  sx={{
                    fontSize: "20px",
                    color: !isSigningPart
                      ? `${theme?.palette?.primary?.main}50`
                      : theme?.palette?.primary?.main,
                    mr: ".2rem",
                  }}
                />
                Retour
              </Stack>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TagSign;
