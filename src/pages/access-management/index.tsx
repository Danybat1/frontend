// page component definition
import * as React from "react";

import Layout from "../../components/Layout";
import { useNavigate } from "react-router-dom";

import {
  useTheme,
  Stack,
  Typography,
  Box,
  Grid,
  useMediaQuery,
} from "@mui/material";

import NavigationLine from "../../components/NavigationLine";
import { usersCtx } from "../../context/users";
import { rolesCtx } from "../../context/rolesCtx";

const AccessManagement = ({}) => {
  const theme = useTheme();

  const navigate = useNavigate();
  const usersContext = React?.useContext(usersCtx);

  const users = usersContext?.users?.filter(
    (user) =>
      user?.id?.toString() !== sessionStorage?.getItem("userId")?.toString()
  );

  const screen900 = useMediaQuery(theme?.breakpoints?.down(900));

  const roles = React?.useContext(rolesCtx)?.roles;

  return (
    <Layout>
      <Box
        sx={{
          p: "1rem",
        }}
      >
        <NavigationLine firstTitle={"Utilisateurs"} secondTitle={"Liste"} />

        <Grid
          container
          sx={{
            width: "100%",
            maxHeight: !screen900 ? "calc(100vh - 160px)" : undefined,
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          {users?.map((target) => {
            return (
              <Grid item xs={12} sm={6} md={3}>
                <Box
                  sx={{
                    p: ".5rem",
                    width: "100%",
                  }}
                >
                  <Stack
                    direction={"row"}
                    onClick={(event) => {
                      event?.preventDefault();

                      navigate(`/access-management/user/edit?id=${target?.id}`);
                    }}
                    sx={{
                      bgcolor: theme?.palette?.common?.white,
                      borderRadius: "1rem",
                      width: "100%",
                      p: "1rem",
                      cursor: "pointer",
                      justifyContent: "space-between",
                      "&:hover": {
                        boxShadow: "0px 2px 20px -4px #cddde1",
                      },
                    }}
                  >
                    <Stack>
                      {[
                        { name: "Noms", field: "fullName" },
                        { name: "Email", field: "email" },
                        { name: "Rôle", field: "role" },
                      ]?.map((_target) => {
                        return (
                          <Typography
                            sx={{
                              fontSize: "14px",
                            }}
                          >
                            <Typography
                              component={"span"}
                              sx={{
                                color: theme?.palette?.primary?.main,
                                fontSize: "14px",
                                fontWeight: theme?.typography?.fontWeightBold,
                              }}
                            >
                              {_target?.name}
                            </Typography>{" "}
                            :{" "}
                            {_target?.field !== "role"
                              ? target[_target?.field]
                              : roles?.find(
                                  (role) =>
                                    role?.id?.toString() ===
                                    target?.role?.toString()
                                )?.name || "..."}
                          </Typography>
                        );
                      })}
                    </Stack>
                  </Stack>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Layout>
  );
};

export default AccessManagement;
