import * as React from "react";
import {
  Box,
  useTheme,
  Stack,
  Typography,
  IconButton,
  AvatarGroup,
  Avatar,
  useMediaQuery,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { ChevronRight, Delete, Visibility } from "@mui/icons-material";
import MenuHorizontal from "./SignMode/Writing/MenuHorizontal";
import { signaturesCtx } from "../context/signatures";
import { useNavigate } from "react-router-dom";
import { guardCtx } from "../context/Guard";
import { BASE_URL } from "../constants/api";

const Signatures = ({ ActiveMenu, setActiveMenu }) => {
  const theme = useTheme();

  const screen900 = useMediaQuery(theme?.breakpoints?.down(900));

  const navigate = useNavigate();

  const rows = React?.useContext(signaturesCtx)?.signatures;
  const setSignatures = React?.useContext(signaturesCtx)?.setSignatures;

  const columns = [
    {
      field: "creationDate",
      headerName: "Date de création",
    },
    {
      field: "signature",
      headerName: "Signature",
      renderCell: ({ row }) => (
        <Avatar
          src={row?.signature}
          sx={{
            width: "40px",
            height: "40px",
          }}
        />
      ),
    },
    {
      field: "delete",
      headerName: "Supprimer",
      renderCell: ({ row }) => (
        <IconButton
          onClick={(event) => {
            event?.preventDefault();

            handleDelete(row?.id);
          }}
        >
          <Delete
            sx={{
              color: theme?.palette?.error?.main,
            }}
          />
        </IconButton>
      ),
    },
  ]?.map((col) => {
    return {
      ...col,
      flex: 1,

      headerClassName: "grid--header",
    };
  });

  const setLoadingMap = React?.useContext(guardCtx)?.setLoadingMap;

  const handleDelete = async (signId) => {
    const _headers = new Headers();

    console.log("delete click row params received", signId);

    _headers.append("Content-Type", "application/json");
    _headers?.append(
      "Authorization",
      `Bearer ${sessionStorage?.getItem("token")}`
    );

    if (window.confirm("La signature sera supprimée")) {
      setLoadingMap(true, "_signatures");

      await lookup(`${BASE_URL}/api/signatures/${signId}`, {
        method: "DELETE",
        headers: _headers,
      })
        .then((res) =>
          res
            .json()
            .then((res) => {
              console.log("recived data after deleting signature", res);

              if ([403, 401]?.includes(res?.error?.status)) {
                navigate("/login", { replace: true });
              } else {
                if (res?.data?.id) {
                  window?.location?.reload();
                }
              }
            })
            .catch((error) => {
              console.log(
                "an error has occured when deleting a signature",
                error
              );
            })
        )
        .catch((error) => {
          console.log("an error has occured when deleting a signature", error);
        });

      setLoadingMap(false, "_signatures");
    }
  };

  return (
    <Box
      className="card-box"
      sx={{
        maxWidth: "98%",
      }}
    >
      <MenuHorizontal ActiveMenu={ActiveMenu} setActiveMenu={setActiveMenu} />
      <Stack
        sx={{
          px: "2rem",
          overflowX: "hidden",
          maxWidth: "100%",
        }}
      >
        <Stack
          direction={"row"}
          sx={{
            alignItems: "center",
            justifyContent: "flex-start",
            mb: "1rem",
          }}
        >
          <Typography
            sx={{
              color: theme?.palette?.grey[700],
              fontWeight: theme?.typography?.fontWeightBold,
              fontSize: "16px",
            }}
          >
            Linzaka
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
              fontWeight: theme?.typography?.fontWeightBold,
              fontSize: "16px",
            }}
          >
            Mes signatures
          </Typography>
        </Stack>
        <Box
          sx={{
            width: "100%",
            "& .grid--header": {
              "& *": { fontWeight: theme?.typography?.fontWeightBold },
            },
            mb: "1.5rem",
            overflowX: "auto",
          }}
        >
          <DataGrid
            rows={rows}
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
              minWidth: "700px",
            }}
          />
        </Box>
      </Stack>
    </Box>
  );
};

export default Signatures;
