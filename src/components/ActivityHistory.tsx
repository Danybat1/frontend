// component defintion

import * as React from "react";
import {
  useTheme,
  Box,
  Typography,
  Stack,
  Badge,
  useMediaQuery,
} from "@mui/material";
import { documentsCtx } from "../context/documents";
import Layout from "./Layout";

const ActivityHistory = ({}) => {
  const theme = useTheme();

  const allDocs = React.useContext(documentsCtx)?.documents?.all;

  const screen900 = useMediaQuery(theme?.breakpoints?.down(900));

  return (
    <Layout>
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
            justifyContent: "flex-start",
            my: "1rem",
          }}
        >
          <Typography
            sx={{
              color: theme?.palette?.grey[700],
              fontWeight: theme?.typography?.fontWeightBold,
              fontSize: "16px",
            }}
          >
            {"Historique"}
          </Typography>
        </Stack>
        <Stack
          direction={"column"}
          sx={{
            alignItems: "center",
            justifyContent: "flex-start",
            width: "100%",
            maxHeight: screen900 ? undefined : "calc(100vh - 160px)",
            overflowY: "auto",
          }}
        >
          {!(allDocs?.length > 0) ? (
            <Stack
              sx={{
                width: "100%",
                bgcolor: theme?.palette?.common?.white,
                borderRadius: screen900 ? "10px" : "15px",
                maxHeight: screen900 ? "max-content" : "50vh",
                overflowY: "auto",
                p: "1rem",
              }}
            >
              <Typography
                sx={{
                  textAlign: "center",
                  color: theme?.palette?.grey[700],
                }}
              >
                Aucune activité
              </Typography>
            </Stack>
          ) : (
            ""
          )}
          {allDocs?.map((target) => {
            return (
              <Stack
                direction={"row"}
                sx={{
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  my: ".3rem",
                  bgcolor: theme?.palette?.common?.white,
                  p: "1.2rem",
                  borderRadius: "10px",
                  width: "100%",
                }}
              >
                <Stack
                  direction={"row"}
                  sx={{
                    alignItems: "center",
                    width: "20%",
                  }}
                >
                  <Badge
                    color={
                      target?.status === "signé"
                        ? "primary"
                        : target?.status === "en attente"
                        ? "error"
                        : "warning"
                    }
                    variant="dot"
                  />
                  <Typography
                    sx={{
                      color: theme?.palette.common.black,
                      fontSize: "14px",
                      fontWeight: theme?.typography?.fontWeightRegular,
                      ml: "1rem",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {target?.issuyingDate}
                  </Typography>
                </Stack>

                <Typography
                  sx={{
                    color: theme?.palette.grey[700],
                    fontSize: "14px",
                    fontWeight: theme?.typography?.fontWeightRegular,
                    width: "60%",
                    px: "1rem",
                  }}
                >
                  {`Vous avez ${
                    parseInt(sessionStorage.getItem("userId")) ===
                    target?.author?.id
                      ? "créé"
                      : target?.status === "rejeté"
                      ? "rejeté"
                      : target?.status === "en attente"
                      ? `été assigné`
                      : "signé"
                  } le document ${target?.title}`}
                </Typography>

                <Typography
                  sx={{
                    color: theme?.palette.common.black,
                    fontSize: "14px",
                    fontWeight: theme?.typography?.fontWeightRegular,
                    width: "20%",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                  }}
                >
                  {target?.department}
                </Typography>
              </Stack>
            );
          })}
        </Stack>
      </Stack>
    </Layout>
  );
};

export default ActivityHistory;
