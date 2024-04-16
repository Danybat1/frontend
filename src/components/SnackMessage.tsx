// snack message error

import * as React from "react";
import { Alert, Snackbar, useTheme } from "@mui/material";
import { notificationCtx } from "../context/notification";

const SnackMessage = ({}) => {
  const theme = useTheme();

  const messageParams = React?.useContext(notificationCtx)?.messageParams;
  const setMessageParams = React?.useContext(notificationCtx)?.setMessageParams;
  const handleClose = React?.useContext(notificationCtx)?.handleClose;

  return (
    <Snackbar
      open={messageParams?.visible}
      autoHideDuration={6000}
      onClose={handleClose}
      sx={{
        zIndex: 1000,
      }}
    >
      <Alert
        onClose={handleClose}
        severity={messageParams?.severity}
        sx={{ width: "100%" }}
      >
        {messageParams?.text}
      </Alert>
    </Snackbar>
  );
};

export default SnackMessage;
