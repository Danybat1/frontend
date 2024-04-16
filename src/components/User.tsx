// component definition

import * as React from "react";
import {
  Avatar,
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { LogOut, Upload } from "react-feather";
import getHeaders from "../utils/getHeaders";
import { guardCtx } from "../context/Guard";
import { BASE_URL } from "../constants/api";
import { notificationCtx } from "../context/notification";
import { GridVisibilityOffIcon } from "@mui/x-data-grid";
import VisibilityIcon from "@mui/icons-material/Visibility";

const User = ({}) => {
  const theme = useTheme();

  const navigate = useNavigate();
  const showError = React?.useContext(notificationCtx)?.showError;

  const setLoadingMap = React?.useContext(guardCtx)?.setLoadingMap;

  const screen900 = useMediaQuery(theme?.breakpoints?.down(900));

  const handleLogout = (event) => {
    event?.preventDefault();

    sessionStorage?.clear();

    navigate("/login", { replace: true });

    setTimeout(() => {
      window?.location?.reload();
    }, 300);
  };

  const [isLoading, setIsloading] = React?.useState(false);

  const handlePwdChange = async (event) => {
    event?.preventDefault();

    if (window.confirm("Voulez-vous procéder au changement ?")) {
      setIsloading(true);

      setLoadingMap(true, "_user");

      const submitObj = {};

      const formData = new FormData(event?.currentTarget);

      for (let [key, value] of formData.entries()) {
        submitObj[key] = value;
      }

      const errorMaper = (errorText) => {
        const _mapping = {
          [errorText?.includes("password is invalid")]:
            "Mot de passe incorrect",
          [errorText?.includes("not match")]:
            "Les mots de passe ne correspondent",
          [errorText?.includes("least 6 characters")]:
            "Veuillez entrer au moins 6 caractères pour le mot de passe",
        };

        return _mapping[true];
      };

      await lookup(`${BASE_URL}/api/auth/change-password`, {
        method: "POST",
        headers: getHeaders({}),
        body: JSON.stringify(submitObj),
      })
        .then((res) =>
          res
            .json()
            .then((data) => {
              console.log("response data after pwd update", data);

              if (data?.jwt) {
                navigate("/login", {
                  replace: true,
                });
              } else {
                showError(errorMaper(data?.error?.message));
              }

              setIsloading(false);
            })
            .catch((error) => {
              console.error("an error has occured when updating pwd", error);

              setIsloading(false);
            })
        )
        .catch((error) => {
          console.error("an error has occured when updating pwd", error);

          setIsloading(false);
        });

      setLoadingMap(false, "_user");
    }
  };

  const [showPassword, setShowPassword] = React.useState(false);

  const handleShowPassword = () => {
    setShowPassword((show) => !show);
  };

  const [showConfirm, setShowConfirm] = React.useState(false);

  const handleShowConfirm = () => {
    setShowConfirm((show) => !show);
  };

  const [showOld, setShowOld] = React.useState(false);

  const handleShowOld = () => {
    setShowOld((show) => !show);
  };

  return (
    <Stack
      direction={"column"}
      sx={{
        height: "max-content",
        minHeight: "100vh",
        bgcolor: theme?.palette?.common?.white,
        overflowY: "auto",
        width: screen900 ? "75vw" : "25vw",
        minWidth: "200px",
        maxWidth: "320px",
      }}
    >
      <Stack
        sx={{
          px: "1rem",
          py: "2rem",
          alignItems: "center",
          bgcolor: theme?.palette?.primary?.main,
        }}
      >
        <Avatar
          src={sessionStorage?.getItem("profile")}
          sx={{
            width: 70,
            height: 70,
            mb: "1rem",
          }}
        >
          {sessionStorage
            ?.getItem("username")
            ?.split(" ")
            ?.map((chars) => chars[0])
            ?.splice(0, 2)}
        </Avatar>
        <Typography
          sx={{
            textAlign: "center",
            color: theme?.palette?.grey?.[200],
            fontWeight: theme?.typography?.fontWeightRegular,
            fontSize: "16px",
            //my: "1.5rem",
          }}
        >
          {sessionStorage?.getItem("username")}
        </Typography>

        <Typography
          sx={{
            textAlign: "center",
            color: theme?.palette?.grey?.[200],
            fontWeight: theme?.typography?.fontWeightRegular,
            fontSize: "14px",
            //my: "1.5rem",
          }}
        >
          {sessionStorage?.getItem("email")}
        </Typography>

        <Typography
          onClick={handleLogout}
          sx={{
            textAlign: "center",
            color: theme?.palette?.common?.white,
            fontWeight: theme?.typography?.fontWeightRegular,
            fontSize: "14px",
            textDecoration: "underline",
            cursor: "pointer",
            mt: "1rem",
          }}
        >
          Déconnection
        </Typography>
      </Stack>

      <Stack
        direction={"column"}
        sx={{
          alignItems: "flex-start",
          px: "1rem",
        }}
      >
        <Typography
          sx={{
            color: theme?.palette?.primary?.main,
            fontWeight: theme?.typography?.fontWeightBold,
            fontSize: "14.5px",
            mt: "2rem",
            mb: "1rem",
            textAlign: "center",
            width: "100%",
          }}
        >
          Changer le mot de passe
        </Typography>

        <form
          onSubmit={handlePwdChange}
          style={{
            width: "100%",
          }}
        >
          <Stack
            direction={"column"}
            spacing={".5rem"}
            sx={{
              alignItems: "center",
              width: "100%",
            }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              name="currentPassword"
              label="Ancien mot de passe"
              type={showOld ? "text" : "password"}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleShowOld} edge="end">
                      {showOld ? (
                        <GridVisibilityOffIcon />
                      ) : (
                        <VisibilityIcon />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              id="password"
              autoComplete="current-password"
              size={"small"}
              sx={{
                fontSize: "14px",
                width: "100%",
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Nouveau mot de passe"
              type={showPassword ? "text" : "password"}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleShowPassword} edge="end">
                      {showPassword ? (
                        <GridVisibilityOffIcon />
                      ) : (
                        <VisibilityIcon />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              id="password"
              size={"small"}
              sx={{
                fontSize: "14px",
                width: "100%",
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="passwordConfirmation"
              label="Confirmer le mot de passe"
              type={showConfirm ? "text" : "password"}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleShowConfirm} edge="end">
                      {showConfirm ? (
                        <GridVisibilityOffIcon />
                      ) : (
                        <VisibilityIcon />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              id="password"
              size={"small"}
              sx={{
                fontSize: "14px",
                width: "100%",
              }}
            />

            <button
              type="submit"
              className="btn-primary flex flex-auto items-center justify-center gap-3"
              style={{
                // padding: ".5rem 1rem",
                // fontSize: "12px",
                // alignSelf: "flex-end",
                marginTop: "1rem",
                width: "100%",
                fontSize: "14px",
              }}
            >
              {isLoading ? (
                <CircularProgress
                  size={"1rem"}
                  sx={{
                    width: "10px",
                    fontSize: "10px",
                    color: theme?.palette?.common?.white,
                  }}
                />
              ) : (
                "Mettre à jour"
              )}
            </button>
          </Stack>
        </form>
      </Stack>
    </Stack>
  );
};

export default User;
