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
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  AttachFile,
  ChevronRight,
  Download,
  Visibility,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import RejectionModal from "../components/RejectionModal";
import { documentsCtx } from "../context/documents";
import { Search } from "react-feather";
import { appDataCtx } from "../context/appData";

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
      field: "expiryDate",
      headerName: "Date d'expiration",
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
              downloadLink.current.href = row?.file?.path;

              console?.log("download link target ref", downloadLink);

              // downloadLink?.current?.click();

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

                navigate(`/mydocuments/${row?.id}`, { replace: true });
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

  return (
    <React.Fragment>
      <a
        target={"_blank"}
        ref={downloadLink}
        onClick={() => {
          // console.log("me download link, I have been clicked here");
        }}
        style={{
          display: "none",
        }}
      >
        Download pdf file
      </a>
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

          <Stack
            direction={"column"}
            sx={{
              alignItems: "flex-start",
            }}
          >
            <React.Fragment>
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
                    <Typography>{"Aucun fichier"}</Typography>
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
                    {rejectionModal?.data?.attachedFiles?.map(
                      (target, index) => {
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
                      }
                    )}
                  </Stack>
                </Stack>
              </Stack>
              {rejectionModal?.rejected ? (
                <React.Fragment>
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
                </React.Fragment>
              ) : (
                ""
              )}
            </React.Fragment>
          </Stack>
          <Stack
            component={"a"}
            href={rejectionModal?.data?.filePath || "///"}
            target={"_blank"}
            direction={"row"}
            sx={{
              alignItems: "center",
            }}
          >
            <button
              type="button"
              className="btn-primary flex-auto"
              style={{
                width: "max-content",
                marginTop: "1rem",
              }}
            >
              Telecharger {<Download />}
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
          <Stack
            direction={"row"}
            sx={{
              alignItems: "center",
              justifyContent: "flex-start",
              my: "1rem",
            }}
          >
            <Typography
              sx={{
                color: theme?.palette?.grey[700],
                fontWeight: theme?.typography?.fontWeightBold,
                fontSize: "16px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {firstTitle}
            </Typography>
            <ChevronRight
              sx={{
                fontSize: "25px",
                color: theme?.palette?.grey[500],
              }}
            />
            <Typography
              sx={{
                color: theme?.palette?.grey[700],
                fontWeight: theme?.typography?.fontWeightRegular,
                fontSize: "16px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {secondTitle}
            </Typography>
          </Stack>
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
            wisth: "100%",
            overflowX: "auto",
          }}
        >
          <DataGrid
            rows={searchedRows}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 5,
                },
              },
            }}
            pageSizeOptions={[5]}
            disableRowSelectionOnClick
            sx={{
              bgcolor: theme?.palette?.common?.white,
              borderRadius: "10px",
            }}
          />
        </Box>
      </Stack>
    </React.Fragment>
  );
};

export default DocumentsList;
