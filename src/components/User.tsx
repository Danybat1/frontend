// component definition

import * as React from "react";
import { Avatar, Stack, TextField, Typography, useTheme } from "@mui/material";
import {} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { LogOut, Upload } from "react-feather";

const User = ({}) => {
  const theme = useTheme();

  const navigate = useNavigate();

  const handleLogout = (event) => {
    event?.preventDefault();

    sessionStorage?.clear();

    navigate("/login", { replace: true });

    setTimeout(() => {
      window?.location?.reload();
    }, 300);
  };

  const handlePwdChange = async (event) => {
    event?.preventDefault();

    const data = new FormData(event?.currentTarget);

    await lookup(`${process.env.REACT_APP_API_HOST}/api`);
  };

  return (
    <Stack
      direction={"column"}
      sx={{
        height: "max-content",
        minHeight: "100vh",
        bgcolor: theme?.palette?.common?.white,
        px: "1rem",
        py: "2rem",
        overflowY: "auto",
        width: "20vw",
        minWidth: "200px",
        maxWidth: "300px",
        alignItems: "center",
      }}
    >
      <Avatar
        sx={{
          width: 70,
          height: 70,
          bgcolor: "#227378",
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
          color: theme?.palette?.grey?.[700],
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
          color: theme?.palette?.grey?.[700],
          fontWeight: theme?.typography?.fontWeightRegular,
          fontSize: "14px",
          //my: "1.5rem",
        }}
      >
        {sessionStorage?.getItem("email")}
      </Typography>

      <Stack
        sx={{
          height: "40px",
          mt: "20vh",
        }}
      >
        <button
          onClick={handleLogout}
          className="btn-primary flex flex-auto items-center justify-center gap-3"
          style={{
            paddingTop: ".7rem",
            paddingBottom: ".7rem",
          }}
        >
          Deconnexion <LogOut size={20} />
        </button>
      </Stack>

      {/**
       * <Typography
        sx={{
          textAlign: "center",
          color: theme?.palette?.grey?.[500],
          fontWeight: theme?.typography?.fontWeightBold,
          fontSize: "14px",
          mt: "2rem",
        }}
      >
        Changer mot de passe
      </Typography>

      <form onSubmit={handlePwdChange}>
        <Stack
          direction={"column"}
          sx={{
            alignItems: "center",
            mt: "1rem",
          }}
        >
          <TextField
            margin="normal"
            required
            fullWidth
            name="old-password"
            label="Ancien mot de passe"
            type="password"
            id="password"
            autoComplete="current-password"
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="new-password"
            label="Nouveau mot de passe"
            type="password"
            id="password"
          />

          <button
            type="submit"
            className="btn-primary flex flex-auto items-center justify-center gap-3"
          >
            Mettre à jour
          </button>
        </Stack>
      </form>
       */}
    </Stack>
  );
};

export default User;
