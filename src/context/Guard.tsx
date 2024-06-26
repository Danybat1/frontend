// constext defintion

import { CircularProgress, LinearProgress, Stack } from "@mui/material";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import App from "../App";
import LoginForm from "../pages/login";
import { socketCtx } from "./io";

import { NODE_ENV } from "../constants/env";

const guardCtx = React?.createContext({});

const GuardContext = ({ children }) => {
  const [isUserAuthenticanted, setIsUserAuthenticated] = React?.useState(
    window?.sessionStorage?.getItem("token")?.length > 15
  );

  const [loadingMap, _setLoadingMap] = React?.useState(false);

  const setLoadingMap = (loadingValue, key) => {
    if (![loadingValue, key]?.includes(undefined)) {
      const newVal = {
        ...(JSON.parse(sessionStorage.getItem("loadingMap")) || {}),
        [key]: loadingValue,
      };

      if (Object.keys(newVal)?.some((key) => newVal[key] === true)) {
        _setLoadingMap(true);
      } else {
        _setLoadingMap(false);
      }

      sessionStorage?.setItem("loadingMap", JSON.stringify(newVal));
    }
  };

  const navigate = useNavigate();

  const [isFetchCustomized, setIsFetchCustomized] = React?.useState(false);

  React.useEffect(() => {
    sessionStorage?.setItem("loadingMap", JSON.stringify({}));

    window.lookup = async (url, options) => {
      setLoadingMap(true, "_guards");

      return fetch(url, options)
        .then((res) => {
          setTimeout(() => {
            setLoadingMap(false, "_guards");
          }, 100);

          console.log("gotten res from lookup", res);

          return new Promise((resolve, reject) => {
            resolve(res);
          });
        })
        .catch((error) => {
          setLoadingMap(false, "_guards");

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
      if (!window?.location?.pathname?.includes("-password")) {
        navigate("/login", { replace: true });
      } else {
        console.log("prevented moving to login as we are trating passwords");
      }

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
    <div>
      {loadingMap ? (
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
          value={{
            isUserAuthenticanted,
            setIsUserAuthenticated,
            setLoadingMap,
          }}
        >
          {children}
        </guardCtx.Provider>
      )}
    </div>
  );
};

export { guardCtx };

export default GuardContext;
