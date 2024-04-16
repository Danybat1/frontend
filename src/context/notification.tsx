// context definition
import * as React from "react";
import SnackMessage from "../components/SnackMessage";

const notificationCtx = React.createContext({});

const NotificationContext = ({ children }) => {
  const [messageParams, setMessageParams] = React?.useState({
    severity: "",
    text: "",
    visible: false,
  });

  const showError = (message) => {
    setMessageParams({
      text: message,
      visible: true,
      severity: "error",
    });
  };

  const showWarning = (message) => {
    setMessageParams({
      text: message,
      visible: true,
      severity: "warning",
    });
  };

  const showInfo = (message) => {
    setMessageParams({
      text: message,
      visible: true,
      severity: "info",
    });
  };

  const showSuccess = (message) => {
    setMessageParams({
      text: message,
      visible: true,
      severity: "success",
    });
  };

  const handleClose = (event) => {
    event?.preventDefault();

    setMessageParams({
      visible: false,
      text: "",
      severity: "",
    });
  };

  return (
    <notificationCtx.Provider
      value={{
        messageParams,
        setMessageParams,
        showError,
        showInfo,
        showSuccess,
        showWarning,
        handleClose,
      }}
    >
      {messageParams?.visible && <SnackMessage />}
      {children}
    </notificationCtx.Provider>
  );
};

export { notificationCtx };
export default NotificationContext;
