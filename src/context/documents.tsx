// context defitnion

import * as React from "react";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../constants/api";
import { guardCtx } from "./Guard";

const documentsCtx = React?.createContext({});

const DocumentContext = ({ children }) => {
  const [documents, setDocuments] = React?.useState({
    own: [],
    pending: [],
    signed: [],
    all: [],
  });

  const [folders, setFolders] = React?.useState([]);

  const isUserAuthenticanted =
    React?.useContext(guardCtx)?.isUserAuthenticanted;

  const _headers = new Headers();
  const navigate = useNavigate();

  _headers?.append("Content-Type", "application/json");
  _headers?.append(
    "Authorization",
    `Bearer ${sessionStorage?.getItem("token")}`
  );

  const setLoadingMap = React?.useContext(guardCtx)?.setLoadingMap;

  React?.useEffect(() => {
    if (isUserAuthenticanted) {
      setLoadingMap(true, "_documents");

      (async () => {
        await lookup(`${BASE_URL}/api/doc-folders?populate=*`, {
          method: "GET",
          headers: _headers,
        })
          .then((res) =>
            res
              .json()
              .then((res) => {
                setLoadingMap(true, "_documents");

                console.log("received data from folders endpoint", res);

                if (res?.data?.length > 0) {
                  setFolders(
                    res?.data?.map((target) => {
                      return {
                        id: target?.id,
                        ...target?.attributes,
                        createdAt: new Date(
                          target?.attributes?.createdAt
                        ).toLocaleDateString(),
                      };
                    })
                  );
                }

                setLoadingMap(false, "_documents");
              })
              .catch((error) => {
                console.log("an error has occured when creating folder", error);
              })
          )
          .catch((error) => {
            console.log("an error has occured when creating folder", error);
          });
      })();

      setLoadingMap(false, "_documents");
    } else {
      if (!window?.location?.pathname?.includes("-password")) {
        navigate("/login", { replace: true });
      } else {
        console.log("prevented moving to login as we are trating passwords");
      }
    }
  }, [isUserAuthenticanted]);

  return (
    <documentsCtx.Provider
      value={{ documents, setDocuments, folders, setFolders }}
    >
      {children}
    </documentsCtx.Provider>
  );
};

export { documentsCtx };

export default DocumentContext;
