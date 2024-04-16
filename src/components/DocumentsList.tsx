// component definititon

import * as React from "react";
import {
  Box,
  useTheme,
  Stack,
  Typography,
  IconButton,
  AvatarGroup,
  Avatar,
  Chip,
  useMediaQuery,
  CircularProgress,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  AttachFile,
  ChevronRight,
  Clear,
  Download,
  Recycling,
  Visibility,Archive
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import RejectionModal from "../components/RejectionModal";
import { documentsCtx } from "../context/documents";
import { Delete, Search } from "react-feather";
import { appDataCtx } from "../context/appData";
import NavigationLine from "./NavigationLine";
import { filesCtx } from "../context/files";
import { BASE_URL } from "../constants/api";
import getHeaders from "../utils/getHeaders";
import mergePdf from "../utils/pdfMerger";
import { guardCtx } from "../context/Guard";
import { notificationCtx } from "../context/notification";

const DocumentsList = ({ rows, firstTitle = "Linzaka", secondTitle }) => {
  const theme = useTheme();

  const navigate = useNavigate();

  const [rejectionModal, setRejectionModal] = React?.useState({
    data: {},
    visible: false,
    rejected: true,
  });

  const [searchedRows, setSearchedRows] = React?.useState([]);

  React?.useEffect(() => {
    setSearchedRows(rows);
  }, [rows]);

  const screen900 = useMediaQuery(theme?.breakpoints?.down(900));

  const signedDocuments =
    React?.useContext(documentsCtx)?.documents?.signed || [];

  const downloadLink = React?.useRef(null);
  const fileContext = React?.useContext(filesCtx);

  const setDocumentAnnexes = fileContext?.setDocumentAnnexes;

  const columns = [
    {
      field: "author",
      headerName: "Auteur",
      renderCell: ({ row }) => {
        return (
          <Typography
            sx={{
              fontSize: "14px",
              fontWeight: theme?.typography?.fontWeightMedium,
            }}
          >
            {row?.author?.fullName}
          </Typography>
        );
      },
    },
    {
      field: "title",
      headerName: "Titre",
    },
    {
      field: "recipients",
      headerName: "Destinataires",
      renderCell: ({ row }) => (
        <AvatarGroup max={screen900 ? 1 : 2}>
          {row?.recipients?.map((target) => {
            return (
              <Avatar
                src={target?.profile}
                sx={{
                  bgcolor: "#227378",
                  width: "40px",
                  height: "40px",
                  fontSize: "14px",
                }}
              >
                {target?.username
                  ?.split(" ")
                  ?.slice(0, 2)
                  ?.map((target) => target[0])
                  ?.join("")}
              </Avatar>
            );
          })}
        </AvatarGroup>
      ),
    },
    {
      field: "issuyingDate",
      headerName: "Date de publication",
    },
    {
      field: "archive",
      headerName: "Archiver",
      renderCell: ({ row }) => (
        <IconButton onClick={handleDocRemove}>
          <Archive color={"error"} />
        </IconButton>
      ),
    },
    {
      field: "department",
      headerName: "Département",
    },
    {
      field: "open",
      headerName: "Ouvrir",
      renderCell: ({ row }) => (
        <IconButton
          onClick={(event) => {
            event?.preventDefault();

            console.log("will view data for rejection", {
              row,
              signedDocuments,
            });

            if (row?.finalStatus === "complété") {
              setRejectionModal({
                data: {
                  ...row?.rejectedBy,
                  filePath: row?.file?.path,
                  ...row,
                },
                visible: true,
                rejected: false,
              });
            } else {
              if (row?.finalStatus === "rejeté") {
                console.log("rejection data value", row);

                setRejectionModal({
                  data: {
                    ...row?.rejectedBy,
                    filePath: row?.file?.path,
                    ...row,
                  },
                  visible: true,
                  rejected: true,
                });
              } else {
                sessionStorage?.setItem(
                  "document-ctx",
                  JSON.stringify({ ...{ data: row }, mode: "edit" })
                );

                sessionStorage?.setItem(
                  "collabs",
                  JSON.stringify(row?.recipients)
                );

                sessionStorage?.setItem(
                  "attachements",
                  JSON.stringify(row?.attachedFiles)
                );
                setDocumentAnnexes(row?.attachedFiles);

                sessionStorage?.removeItem("paraphedAnnex");
                sessionStorage?.removeItem("paraph-ctx");

                navigate(`/mydocuments/${row?.id}`);
              }
            }
          }}
        >
          {signedDocuments?.some(
            (doc) => doc?.id?.toString() === row?.id?.toString()
          ) && row?.finalStatus !== "rejeté" ? (
            <Visibility
              sx={{
                color: "#227378",
              }}
            />
          ) : (
            <Visibility
              sx={{
                color: "#227378",
              }}
            />
          )}
        </IconButton>
      ),
    },
    {
      field: "signed",
      headerName: "Statut",
      renderCell: ({ row }) => (
        <Chip
          label={row?.status}
          color="primary"
          sx={{
            color:
              row?.status === "signé"
                ? theme?.palette?.success?.main
                : row?.status === "rejeté"
                ? theme?.palette?.warning?.main
                : theme?.palette?.error?.main,
            bgcolor:
              row?.status === "signé"
                ? `${theme?.palette?.success?.main}10`
                : row?.status === "rejeté"
                ? `${theme?.palette?.warning?.main}10`
                : `${theme?.palette?.error?.main}10`,

            height: "25px!important",
            width: "80px!important",
            fontSize: "12px",
            fontWeight: theme?.typography?.fontWeightMedium,
          }}
        />
      ),
    },
    {
      field: "finalStatus",
      headerName: "Statut final",
      renderCell: ({ row }) => (
        <Chip
          label={row?.finalStatus}
          color="primary"
          sx={{
            color:
              row?.finalStatus === "complété"
                ? theme?.palette?.success?.main
                : row?.finalStatus === "rejeté"
                ? theme?.palette?.warning?.main
                : theme?.palette?.error?.main,
            bgcolor:
              row?.finalStatus === "complété"
                ? `${theme?.palette?.success?.main}10`
                : row?.finalStatus === "rejeté"
                ? `${theme?.palette?.warning?.main}10`
                : `${theme?.palette?.error?.main}10`,
            height: "25px!important",
            width: "80px!important",
            fontSize: "12px",
            fontWeight: theme?.typography?.fontWeightMedium,
          }}
        />
      ),
    },
  ]?.map((col) => {
    return {
      ...col,
      flex: 1,

      headerClassName: "grid--header",
    };
  });

  const handleDocRemove = async (event) => {
    event?.preventDefault();

    setIsAskDeleteOpen(true);
  };

  const [searchValue, setSearchValue] = React.useState("");

  const handleSearch = (event) => {
    event?.preventDefault();

    const _search = event?.target?.value;

    setSearchValue(_search);

    setSearchedRows(
      [...rows]?.filter((target) => {
        return Object.keys(target)?.some((key) => {
          if (["author"]?.includes(key)) {
            return target[key]?.fullName
              ?.toString()
              ?.toLowerCase()
              ?.includes(_search?.toString()?.toLowerCase());
          } else if (["file"]?.includes(key)) {
            return target[key]?.path
              ?.toString()
              ?.toLowerCase()
              ?.includes(_search?.toString()?.toLowerCase());
          } else if (["terminated"]?.includes(key)) {
            console.log("current search config ", {
              key,
              value: target[key],
            });

            return (
              target?.rejectedBy?.username?.toString()?.length > 0
                ? "rejeté"
                : target?.terminated === true
                ? "complété"
                : `reste ${target?.terminated}`
            )
              ?.toString()
              ?.toLowerCase()
              ?.includes(_search?.toString()?.toLowerCase());
          } else {
            return target[key]
              ?.toString()
              ?.toLowerCase()
              ?.includes(_search?.toString()?.toLowerCase());
          }
        });
      })
    );
  };

  const injectData = React?.useContext(appDataCtx).injectData;

  const handleZipDownload = async (event) => {
    event?.preventDefault();

    const files = [
      rejectionModal?.data?.filePath,
      ...(rejectionModal?.data?.attachedFiles || [])?.map(
        (target) => target?.path
      ),
    ]?.map((file) => {
      return "/uploads/" + file?.split("/")?.slice(-1)[0];
    });

    const _fileName = rejectionModal?.data?.title?.split(".")?.slice(0, 1)[0];

    await lookup(`${BASE_URL}/api/compress`, {
      headers: getHeaders({}),
      body: JSON.stringify({
        data: {
          preferredName: _fileName,
          filesToCompress: files,
        },
      }),
      method: "POST",
    })
      .then((res) =>
        res.blob().then((zipBuffer) => {
          const compressedFile = new File([zipBuffer], _fileName + ".zip", {
            type: "application/zip",
          });
          const dowloadUrl = URL.createObjectURL(compressedFile);

          // window.open(dowloadUrl);

          downloadRef?.current?.setAttribute("download", `${_fileName}.zip`);
          downloadRef?.current?.setAttribute("href", dowloadUrl);
          downloadRef?.current?.click();
        })
      )
      .catch((error) => {
        console.log("an error has occured when creating ", error);
      });
  };

  const downloadRef = React?.useRef({});

  const handleMerge = async (event) => {
    event?.preventDefault();

    let files = [
      rejectionModal?.data?.filePath,
      ...(rejectionModal?.data?.attachedFiles || [])?.map(
        (target) => target?.path
      ),
    ];

    const mergedFiles = [];

    await Promise.all(
      files?.map((filePath) => {
        return (async () => {
          let _file;

          await lookup(`${filePath}`, {
            headers: getHeaders({}),
            method: "GET",
          })
            .then((res) =>
              res.blob().then((data) => {
                console.log("received data for file merge", data);

                _file = new File(
                  [data],
                  filePath?.replaceAll("/", "_") + ".pdf"
                );
              })
            )
            .catch((error) => {
              console.log(
                "an error has occured when fetching download merge file",
                error,
                filePath
              );
            });

          return _file;
        })();
      })
    )
      .then((computedFiles) => {
        console.log("received computed files", computedFiles);

        mergedFiles?.push(...computedFiles);
      })
      .catch((error) => {
        console.log(
          "an error has occured when fetching files data for download merge",
          error
        );
      });

    console.log("processed files for download merge", mergedFiles);

    if (mergedFiles?.length > 0) {
      let mergedFile;

      await mergePdf({
        files: mergedFiles,
        parentDocument: "merged-doc.pdf",
      })
        .then((result) => {
          mergedFile = result?.file;
        })
        .catch((error) => {
          console.log(
            "an error has occured when merging files for download",
            error
          );
        });

      const dowloadUrl = URL.createObjectURL(mergedFile);

      window.open(dowloadUrl);
    } else {
      console.log("no merge download possible, files are empty");
    }
  };

  const notifsContext = React?.useContext(notificationCtx);

  const setLoadingMap = React?.useContext(guardCtx)?.setLoadingMap;
  const showError = notifsContext?.showError;
  const showSuccess = notifsContext?.showSuccess;
  const showWarning = notifsContext?.showWarning;

  const [deletionPurpose, setDeletionPurpose] = React?.useState("");
  const [isAskDeleteOpen, setIsAskDeleteOpen] = React?.useState(false);

  return (
    <div>
      <RejectionModal
        open={isAskDeleteOpen}
        setOpen={() => {
          setIsAskDeleteOpen(false);
        }}
        childrenClassName={`w-[${screen900 ? 95 : 70}%]`}
      >
        <Stack className="card-box w-full p-6" sx={{}}>
          <Typography
            sx={{
              fontSize: "14px",
              textAlign: "center",
              fontWeight: theme?.typography?.fontWeightBold,
              color: theme?.palette?.error?.main,
            }}
          >
            ARCHIVAGE DE DOSSIER
          </Typography>
          <Box
            // className="text-field"
            sx={{
              py: ".3rem",
              width: "100%",
              my: "1rem",
              backgroundColor: `${theme?.palette?.error?.main}10`,
              borderColor: theme?.palette?.error?.main,
              borderRadius: "1rem",
              overflow: "hidden",
              padding: "1rem"
            }}
          >
            <textarea
              rows={5}
              type="text"
              value={deletionPurpose}
              onChange={(event) => {
                event?.preventDefault();

                setDeletionPurpose(event?.target?.value);
              }}
              placeholder={"Veuillez renseigner ici votre d'archivage"}
              style={{
                width: "100%",
                outline: "none",
                color: theme?.palette?.error?.main,
                backgroundColor: "transparent",
              }}
            />
          </Box>
          <button
            type="button"
            className="btn-primary flex-auto"
            onClick={async (event) => {
              event?.preventDefault();

              if (deletionPurpose?.length < 5) {
                showWarning("Votre motif doit avoir au moins 5 caractères");
              } else {
                setLoadingMap(true, "remove_doc");

                // deletion here

                setLoadingMap(false, "remove_doc");
              }
            }}
            style={{
              backgroundColor: theme?.palette?.error?.main,
            }}
          >
            Archiver
          </button>
        </Stack>
      </RejectionModal>
      <RejectionModal
        open={rejectionModal?.visible}
        setOpen={() => {
          setRejectionModal({
            ...rejectionModal,
            visible: false,
          });
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
            {rejectionModal?.rejected ? "DOCUMENT REJETE" : "DOCUMENT"}
          </Typography>
          <a
            ref={downloadRef}
            href={"/"}
            style={{
              display: "none",
            }}
          ></a>

          <Stack
            direction={"column"}
            sx={{
              alignItems: "flex-start",
              width: "100%",
            }}
          >
            <div
              style={{
                width: "100%",
              }}
            >
              <Stack
                direction={"row"}
                sx={{
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  width: "100%",
                  flexWrap: "wrap",
                }}
              >
                {rejectionModal?.rejected ? (
                  <Stack
                    direction={"column"}
                    sx={{
                      width: screen900 ? "90%" : "45%",
                      alignItems: "flex-start",
                    }}
                  >
                    <Typography
                      sx={{
                        color: theme?.palette?.grey?.[500],
                        fontWeight: theme?.typography?.fontWeightBold,
                        mt: "1rem",
                      }}
                    >
                      Par
                    </Typography>
                    <Typography>{rejectionModal?.data?.username}</Typography>
                    <Typography
                      sx={{
                        color: theme?.palette?.grey?.[500],
                        fontWeight: theme?.typography?.fontWeightBold,
                        mt: "1rem",
                      }}
                    >
                      Date de rejet
                    </Typography>
                    <Typography>
                      {new Date(
                        rejectionModal?.data?.rejectionDate
                      )?.toLocaleString("fr-FR")}
                    </Typography>
                  </Stack>
                ) : (
                  ""
                )}
                <Stack
                  direction={"column"}
                  sx={{
                    width: screen900 ? "90%" : "45%",
                    alignItems: "flex-start",
                  }}
                >
                  <Typography
                    sx={{
                      color: theme?.palette?.grey?.[500],
                      fontWeight: theme?.typography?.fontWeightBold,
                      mt: "1rem",
                    }}
                  >
                    Pièces jointes
                  </Typography>
                  {rejectionModal?.data?.attachedFiles?.length > 0 ? (
                    ""
                  ) : (
                    <Typography>{"Aucune pièce jointe"}</Typography>
                  )}
                  <Stack
                    direction={"row"}
                    sx={{
                      alignItems: "flex-start",
                      justifyContent: "flex-start",
                      width: "100%",
                      maxWidth: "100%",
                      flexWrap: "wrap",
                    }}
                  >
                    {[
                      {
                        path: rejectionModal?.data?.filePath,
                        name: rejectionModal?.data?.title,
                      },
                      ...(rejectionModal?.data?.attachedFiles || []),
                    ]?.map((target, index) => {
                      return (
                        <Chip
                          icon={
                            <AttachFile
                              sx={{
                                color: theme?.palette?.primary?.main,
                                fontSize: "15px",
                                transform: "rotate(45deg)",
                              }}
                            />
                          }
                          key={index}
                          href={target?.path}
                          component={"a"}
                          size={"small"}
                          label={target?.name}
                          target={"_blank"}
                          sx={{
                            maxWidth: "90%",
                            mr: ".2rem",
                            mt: ".2rem",
                            textDecoration: "none",
                            cursor: "pointer",
                          }}
                        />
                      );
                    })}
                  </Stack>
                </Stack>
              </Stack>
              {rejectionModal?.rejected ? (
                <div>
                  <Typography
                    sx={{
                      color: theme?.palette?.grey?.[500],
                      fontWeight: theme?.typography?.fontWeightBold,
                      mt: "1rem",
                    }}
                  >
                    Motif
                  </Typography>
                  <Typography>{rejectionModal?.data?.reason}</Typography>
                </div>
              ) : (
                ""
              )}
            </div>
          </Stack>
          <Stack
            direction={"row"}
            sx={{
              alignItems: "flex-start",
              marginTop: ".5rem",
            }}
          >
            <button
              onClick={handleZipDownload}
              type="button"
              className="btn-primary flex-auto"
              style={{
                width: "max-content",
                marginTop: "1rem",
              }}
            >
              Compresser {<Download />}
            </button>
            <button
              onClick={handleMerge}
              type="button"
              className="btn-primary flex-auto"
              style={{
                width: "max-content",
                marginTop: "1rem",
                marginLeft: ".5rem",
                backgroundColor: `${theme?.palette?.primary?.main}10`,
                color: `${theme?.palette?.primary?.main}`,
              }}
            >
              Merger {<Recycling />}
            </button>
          </Stack>
        </Stack>
      </RejectionModal>
      <Stack
        sx={{
          pt: "1rem",
          px: !screen900 ? "2rem" : ".5rem",
          overflowX: "hidden",
          maxWidth: !screen900 ? "calc(100vw - 100px)" : undefined,
        }}
      >
        <Stack
          direction={"row"}
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <NavigationLine
            firstTitle={"Mes documents"}
            secondTitle={secondTitle}
          />
          <Box
            className="text-field"
            sx={{
              py: ".3rem",
            }}
          >
            <input
              type="text"
              value={searchValue}
              onChange={handleSearch}
              placeholder={"Rechercher ici"}
            />
            <span className="cursor-pointer">
              <Search className="stroke-black" />
            </span>
          </Box>
        </Stack>
        <Box
          sx={{
            "& .grid--header": {
              "& *": { fontWeight: theme?.typography?.fontWeightBold },
            },
            width: "100%",
            overflowX: "auto",
            maxHeight: "75vh",
            overflowY: "auto",
            borderRadius: "15px",
          }}
        >
          <DataGrid
            rows={searchedRows}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 10,
                },
              },
            }}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            sx={{
              bgcolor: theme?.palette?.common?.white,
              borderRadius: "15px",
              overflow: "hidden",
            }}
          />
        </Box>
      </Stack>
    </div>
  );
};

export default DocumentsList;
