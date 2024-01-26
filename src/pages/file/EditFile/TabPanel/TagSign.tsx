// component definition

import * as React from "react";

import { useContext } from "react";

import { fabric } from "fabric";
import { useAtom } from "jotai";
import { Plus, Search } from "react-feather";

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

const TagSign = ({ uploadFinalFile }) => {
  // context
  const { canvas, focusCanvasIdx, getAddLocation } = useContext(SingImgContext);
  // useAtom
  const [signList] = useAtom(signAtom);
  const [, setOpenModal] = useAtom(openModalAtom);

  const theme = useTheme();

  const clickAddSing = (addImg: string | HTMLCanvasElement) => {
    console.log("current data for sign add", { addImg });

    fabric.Image.fromURL(
      addImg.toString(),
      (img) => {
        console.log("cureent index in sign", {
          addImg,
        });

        const signPage = window?.sessionStorage?.getItem("signPage");
        const signIndex = window?.sessionStorage?.getItem("signIndex");

        if (signPage?.length > 0 && signIndex?.length > 0) {
          alert(
            "Un signataire ne peut avoir qu'une seule signature. Supprimer et rajouter"
          );
        } else {
          window?.sessionStorage?.setItem(
            "signPage",
            focusCanvasIdx?.toString()
          );
          window?.sessionStorage?.setItem("signIndex", addImg);

          canvas[focusCanvasIdx].add(img).renderAll();

          // getAddLocation(true);
        }
      },
      {
        top: 50,
        left: 50,
      }
    );
  };

  const navigate = useNavigate();

  const createSignURL = (item: string | HTMLCanvasElement) => {
    clickAddSing(item);
  };

  const signatures = React?.useContext(signaturesCtx)?.signatures?.map(
    (_signatures) => {
      return _signatures["signature"];
    }
  );

  // console.log("signatures data here for edit", signatures);

  const [rejectionPurpose, setRejectionPurpose] = React?.useState("");
  const [isPromptOpen, setIsPromptOpen] = React?.useState("");

  const onPromptOpen = (event) => {
    event?.preventDefault();

    setIsPromptOpen(true);
  };

  const injectData = React?.useContext(appDataCtx).injectData;

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
        `${process.env.REACT_APP_API_HOST}/api/doc-versions/${documentCtx?.data?.versionId}`,
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
                alert("Le document a été rejeté avec success");

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

              alert("Une erreur est survenue! Réessayer");
            })
        )
        .catch((error) => {
          console.log("an error has occured when updating a document", error);

          alert("Une erreur est survenue! Réessayer");
        });
    } else {
      alert("Le motif ne peut pas avoir moins de 5 caractères");
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

  const handleValidate = async (event) => {
    event?.preventDefault();

    setIsFetching(true);

    if (window.confirm("Voulez-vous vraiment signer ?")) {
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
        ...documentCtx?.data?.levelVersions?.map((target) => target?.level)
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
        `${process.env.REACT_APP_API_HOST}/api/doc-versions/${documentCtx?.data?.versionId}`,
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
                  alert("Une erreur est survenue, Réessayer");

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
          console.log("an error has occured when updating doc version", error);

          setIsFetching(false);
        });
    } else {
      setIsFetching(false);
    }
  };

  return (
    <React.Fragment>
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
                alert("Votre motif doit avoir au moins 5 caractères");
              } else {
                await handleReject().catch((error) => {
                  console.log(
                    "an error has occured when sending rejection data",
                    error
                  );
                });
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
        {isDocumentNew ? (
          <React.Fragment>
            <p>Signature</p>
            <div className="tag-list">
              {signatures.map((item, idx: number) => (
                <div
                  key={idx}
                  className="sing-tag border-solid border-black/20 bg-[#F9F9F9]"
                  onClick={() => createSignURL(item)}
                >
                  <img src={item?.toString()} alt="sign img" />
                </div>
              ))}
            </div>
          </React.Fragment>
        ) : isSigningPart ? (
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
                  my: ".3rem",
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
                Valider
              </Stack>
            )}
          </Button>
        ) : (
          ""
        )}
        {!isDocumentNew && isSigningPart ? (
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
      </div>
    </React.Fragment>
  );
};

export default TagSign;
