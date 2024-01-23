// constext defintion

import { CircularProgress, LinearProgress, Stack } from "@mui/material";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import App from "../App";
import LoginForm from "../pages/login";
import { socketCtx } from "./io";

const guardCtx = React?.createContext({});

const GuardContext = ({ children }) => {
  const [isUserAuthenticanted, setIsUserAuthenticated] = React?.useState(
    window?.sessionStorage?.getItem("token")?.length > 15
  );
  const [documents, setDocuments] = React?.useState([]);
  const [logging, setLogging] = React?.useState(false);

  const navigate = useNavigate();

  const [isFetchCustomized, setIsFetchCustomized] = React?.useState(false);

  const [globalLoading, setGlobalLoading] = React?.useState(false);

  React.useEffect(() => {
    window.lookup = async (url, options) => {
      setGlobalLoading(true);

      return fetch(url, options)
        .then((res) => {
          setTimeout(() => {
            setGlobalLoading(false);
          }, 100);

          console.log("gotten res from lookup", res);

          return new Promise((resolve, reject) => {
            resolve(res);
          });
        })
        .catch((error) => {
          setTimeout(() => {
            setGlobalLoading(false);
          }, 100);

          console.log("gotten error from lookup", error);

          return new Promise((resolve, reject) => {
            reject(error);
          });
        });
    };

    setIsFetchCustomized(true);

    if (window?.sessionStorage?.getItem("token")?.length > 15) {
      setIsUserAuthenticated(true);

      socketCtx.auth = {
        user: {
          fullName: sessionStorage?.getItem("username"),
          userId: sessionStorage.getItem("userId"),
          department: sessionStorage.getItem("department"),
        },
      };

      socketCtx.connect();

      console.log("should have been connected");
    } else {
      navigate("/login", { replace: true });

      try {
        console.log(
          "no token registered, should authenticate",
          window?.sessionStorage?.getItem("token").length
        );
      } catch (error) {
        console.log("no registered token", error);
      }
    }

    console.log("authentication value here", { isUserAuthenticanted });
  }, []);

  return (
    <React.Fragment>
      {globalLoading ? (
        <Stack
          sx={{
            width: "100vw",
            height: "100vh",
            p: 0,
            m: 0,
            position: "fixed",
            top: 0,
            bottom: 0,
            right: 0,
            left: 0,
            backgroundColor: "transparent",
            // filter: "blur(.05rem)",
            zIndex: 999,
          }}
        >
          <LinearProgress
            sx={{
              width: "100%",
            }}
          />
        </Stack>
      ) : (
        ""
      )}
      {isFetchCustomized && (
        <guardCtx.Provider
          value={{ isUserAuthenticanted, setIsUserAuthenticated }}
        >
          {children}
        </guardCtx.Provider>
      )}
    </React.Fragment>
  );
};

export { guardCtx };

export default GuardContext;
