// context definition

import * as React from "react";
import { guardCtx } from "./Guard";
import { parseDocuments } from "../utils/document";
import { parseSignatures } from "../utils/document";
import { documentsCtx } from "./documents";
import { signaturesCtx } from "./signatures";
import { useNavigate } from "react-router-dom";
import { socketCtx } from "./io";
import { Stack, Typography } from "@mui/material";
import { Close } from "@mui/icons-material";

const appDataCtx = React?.createContext({});

class AppData {
  static async getUserData() {
    const _headers = new Headers();

    _headers?.append("Content-Type", "application/json");
    _headers?.append(
      "Authorization",
      `Bearer ${sessionStorage?.getItem("token")}`
    );

    return lookup(
      `${process.env.REACT_APP_API_HOST}/api/users/${sessionStorage?.getItem(
        "userId"
      )}`,
      {
        headers: _headers,
      }
    )
      .then((res) =>
        res
          .json()
          .then((res) => {
            console.log("received user's data  fetched", res);

            return res;
          })
          .catch((error) => {
            console.log("an error has occured on user's data fetching", error);

            return {};
          })
      )
      .catch((error) => {
        console.log("an error has occured on user's data fetching", error);

        return {};
      });
  }
}

const AppDataContext = ({ children }) => {
  const isUserAuthenticanted = React.useContext(guardCtx)?.isUserAuthenticanted;

  const setDocuments = React?.useContext(documentsCtx)?.setDocuments;
  const setSignatures = React?.useContext(signaturesCtx)?.setSignatures;

  const [notificationMsg, setNotificationMsg] = React?.useState({
    visible: false,
    message: "",
    from: "",
  });

  const navigate = useNavigate();

  const injectData = (onlyDocs = false) => {
    (async () => {
      await AppData.getUserData()
        .then(async (res) => {
          console.log("fetched all of the user data");

          const _documents = {
            own: parseDocuments(res?.ownDocs || []),
            signed: parseDocuments([...res?.signedDocs] || []),
            pending: parseDocuments(res?.pendingDocs)?.filter((doc) => {
              console.log(
                "checking some doc obj attributes",
                !(doc?.signedBy?.length - doc?.recipients?.length === 1) ||
                  doc?.signedBy?.length === 1
              );

              return (
                !(doc?.signedBy?.length - doc?.recipients?.length === 1) ||
                doc?.signedBy?.length === 1
              );
            }),
          };

          _documents.signed = [
            ..._documents?.signed,
            ..._documents?.pending?.filter((doc) => {
              return doc?.rejectedBy?.reason?.length > 0;
            }),
          ];

          _documents.pending = _documents?.pending?.filter((doc) => {
            return !(doc?.rejectedBy?.reason?.length > 0);
          });

          _documents["all"] = [
            ..._documents["signed"],
            ..._documents["pending"],
          ]?.sort((prev, next) => {
            return (
              new Date(next?.createdAt).getTime() -
              new Date(prev?.createdAt).getTime()
            );
          });

          setDocuments(_documents);

          if (!onlyDocs) {
            const _signatures = (await parseSignatures(res?.signatures)) || [];

            setSignatures(_signatures);
          }
        })
        .catch((error) => {
          console.log(
            "an error has occured when fetching app data for user",
            error
          );
        });
    })();
  };

  React?.useEffect(() => {
    if (isUserAuthenticanted) {
      injectData();
    } else {
      navigate("/login", {
        replace: true,
      });
    }
  }, []);

  React?.useEffect(() => {
    const notifAudio = new Audio("/sounds/notification.mp3");
    const _currentUser = sessionStorage?.getItem("username");

    const newDocHandler = (payload) => {
      console.log("new document has been posted", { payload });

      notifAudio.play();

      injectData(true);

      setNotificationMsg({
        visible: true,
        message: `Hello 🫡 Ms/Mr ${_currentUser}, votre collègue ${payload?.authorName} vient demande votre signatures pour les document ${payload?.documentName}`,
        from: payload?.department,
      });
    };

    const rejectionHandler = (payload) => {
      console.log("dopcument rejection event", payload);

      notifAudio.play();

      injectData(true);

      setNotificationMsg({
        visible: true,
        message: `Hello ${_currentUser} 🫡, votre collègue ${payload?.rejectorName} vient de réjeter le document ${payload?.documentName} pour raison; ${payload?.rejectionMessage}`,
        from: payload?.department,
      });
    };

    const completionHandler = (payload) => {
      console.log("document rejection event", payload);

      notifAudio.play();

      injectData(true);

      setNotificationMsg({
        visible: true,
        message: `Hello 🫡 Ms/Mr ${_currentUser}, votre document ${payload?.documentName} vient d'obtenir toutes les validations`,
        from: payload?.department,
      });
    };

    socketCtx.on("DOC_REJECTION", rejectionHandler);
    socketCtx.on("DOC_COMPLETION", completionHandler);
    socketCtx.on("DOC_SIGNATURE", newDocHandler);

    return () => {
      socketCtx.off("DOC_REJECTION");
      socketCtx.off("DOC_COMPLETION");
      socketCtx.off("DOC_SIGNATURE");
    };
  }, []);

  return (
    <appDataCtx.Provider
      value={{ getUserData: AppData.getUserData, injectData }}
    >
      {children}
      {notificationMsg?.visible && (
        <Stack
          direction={"row"}
          sx={{
            position: "fixed",
            right: 25,
            bottom: 25,
            p: "1rem",
            borderRadius: "1rem",
            bgcolor: "white",
            width: "300px",
            maxWidth: "300px",
            alignItems: "flex-start",
            overflow: "hidden",
          }}
        >
          <img
            src={"/gifs/notif.gif"}
            style={{
              width: "30px",
            }}
          />
          <Stack
            direction={"column"}
            sx={{
              ml: "1rem",
              width: "100%",
            }}
          >
            <Stack
              direction={"row"}
              sx={{
                alignItems: "flex-start",
                justifyContent: "space-between",
                width: "100%",
                maxWidth: "100%",
              }}
            >
              <Typography
                sx={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  color: "#347378",
                  mb: "1rem",
                  maxWidth: "100%",
                }}
              >
                Département {notificationMsg?.from}
              </Typography>
              <Close
                onClick={(event) => {
                  event?.preventDefault();

                  setNotificationMsg({
                    visible: false,
                    from: "",
                    message: "",
                  });
                }}
                sx={{
                  color: "#A23215",
                  fontSize: "25px",
                  cursor: "pointer",
                }}
              />
            </Stack>
            <Typography
              sx={{
                color: "grey",
                fontSize: "14px",
                textAlign: "justify",
                maxWidth: "100%",
              }}
            >
              {notificationMsg?.message}
            </Typography>
          </Stack>
        </Stack>
      )}
    </appDataCtx.Provider>
  );
};

export { appDataCtx };

export default AppDataContext;
