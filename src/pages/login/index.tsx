// component defintion

import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useNavigate, Link } from "react-router-dom";
import { guardCtx } from "../../context/Guard";
import { documentsCtx } from "../../context/documents";
import { signaturesCtx } from "../../context/signatures";
import {
  Stack,
  useMediaQuery,
  useTheme,
  Link as MuiLink,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { usersCtx } from "../../context/users";
import { BASE_URL } from "../../constants/api";
import { notificationCtx } from "../../context/notification";

import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VisibilityIcon from "@mui/icons-material/Visibility";

function Copyright(props) {
  return (
    <Typography
      variant="body2"
      color="text.secondary"
      align="center"
      {...props}
    >
      {"Copyright © Powered by "} <br />
      <MuiLink
        color="inherit"
        target="_blank"
        href="https://rhinocerosoftware.co"
      >
        Rhinoceros Software SAS
      </MuiLink>{" "}
      {new Date().getFullYear()}
      {"."}
    </Typography>
  );
}

const LoginForm = ({}) => {
  const navigate = useNavigate();

  React?.useEffect(() => {
    sessionStorage?.clear();
  }, []);

  const [showPassword, setShowPassword] = React.useState(false);

  const handleShowPassword = () => {
    setShowPassword((show) => !show);
  };

  const authCtx = React?.useContext(guardCtx);

  const setIsUserAuthenticated = authCtx?.setIsUserAuthenticated;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    const _headers = new Headers();
    _headers?.append("Content-Type", "application/json");

    await lookup(`${BASE_URL}/api/auth/local`, {
      method: "POST",
      body: JSON.stringify({
        identifier: data.get("email")?.toString(),
        password: data.get("password")?.toString(),
      }),
      headers: _headers,
    })
      .then((res) =>
        res
          .json()
          .then((res) => {
            console.log("received logging data", res);

            if (Object?.keys(res)?.includes("jwt")) {
              setIsUserAuthenticated(true);

              sessionStorage?.setItem("token", res?.jwt);
              sessionStorage.setItem("company", res?.user?.company?.name);
              sessionStorage.setItem("department", res?.user?.department?.name);
              sessionStorage.setItem("userId", res?.user?.id);
              sessionStorage.setItem("username", res?.user?.username);
              sessionStorage.setItem("email", res?.user?.email);
              sessionStorage.setItem(
                "profile",
                `${BASE_URL}${res?.user?.profile?.url}`
              );
              sessionStorage.setItem("role", res?.user?.role);

              navigate("/dashboard");
            } else {
              showError("Mauvaises entrées detectées");
            }
          })
          .catch((error) => {
            console.log("an error has occured when trying to login", error);
            showError("Mauvaises entrées detectées");
          })
      )
      .catch((error) => {
        console.log("an error has occured when trying to login", error);
        showError("Mauvaises entrées detectées");
      });
  };

  const theme = useTheme();

   const showError = React?.useContext(notificationCtx)?.showError;

  const screen900 = useMediaQuery(theme?.breakpoints?.down(900));

  return (
    <Stack
      direction={"row"}
      sx={{
        alignItems: "flex-start",
        width: "100vw",
        maxWidth: "100vw",
        flexWrap: screen900 ? "wrap" : undefined,
        minHeight: "100vh",
        justifyContent: "space-between",
      }}
    >
      <Box
        sx={{
          width: screen900 ? "100%" : "55%",
          display: screen900 ? "none" : undefined,
          minHeight: "100vh",
        }}
      >
        <img
          alt={"linzaka tool"}
          src={"/images/login.jpg"}
          style={{
            width: "100%",
            height: "100vh",
          }}
        />
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: screen900 ? "100%" : "40%",
          maxWidth: screen900 ? "100%" : "40%",
          minHeight: "100vh",
          justifyContent: "center",
          flexGrow: 1,
          mr: "2.5%",
        }}
      >
        <Stack
          direction={"column"}
          sx={{
            alignItems: "center",
            width: "100%",
            justifyContent: "center",
            boxShadow: "0px 2px 20px -4px #cddde1",
            borderRadius: "15px",
            p: screen900 ? "1.5rem" : "2rem",
            overflow: "hidden",
            pb: "3rem",
            maxWidth: "350px",
          }}
        >
          <img
            src={"/images/logo.png"}
            style={{
              msOverflowY: "2rem",
              // width: "100px",
              marginBottom: "1rem",
            }}
          />
          <Typography
            component="h1"
            sx={{
              fontWeight: theme?.typography?.fontWeightMedium,
              fontSize: screen900 ? "16px" : "18px",
              textAlign: "center",
            }}
          >
            Connexion
          </Typography>
          <Stack
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ mt: 1 }}
            direction={"column"}
            sx={{
              width: "100%",
              alignItems: "center",
              maxWidth: screen900 ? "300px" : "400px",
            }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Addresse mail"
              name="email"
              autoComplete="email"
              autoFocus
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Mot de passe"
              type={showPassword ? "text" : "password"}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleShowPassword} edge="end">
                      {showPassword ? (
                        <VisibilityOffIcon />
                      ) : (
                        <VisibilityIcon />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              id="password"
              autoComplete="current-password"
            />
            <Box
              sx={{
                "& button": {
                  width: "100%",
                },
                mt: "1rem",
                width: "100%",
              }}
            >
              <button
                type={"submit"}
                className="btn-primary flex-auto"
                style={{
                  width: "100%",
                }}
              >
                Se connecter
              </button>
            </Box>
          </Stack>
          <Link
            to={`/auth/forgot-password`}
            style={{
              marginTop: "1.5rem",
              fontSize: "14px",
              textAlign: "center",
              fontWeight: theme?.typography?.fontWeightBold,
              textDecoration: "underline",
              color: theme?.palette?.primary?.main,
            }}
          >
            Mot de passe oublié ?
          </Link>
          <Typography
            sx={{
              mt: "1.5rem",
              fontSize: "14px",
              textAlign: "center",
              color: theme?.palette.grey[500],
              fontWeight: theme?.typography?.fontWeightLight,
            }}
          >
            Linzaka E-signature solution. Powered by Rhinoceros Software SAS
          </Typography>
        </Stack>
      </Box>
    </Stack>
  );
};

export default LoginForm;
