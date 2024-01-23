// context defitnion

import * as React from "react";
import { useNavigate } from "react-router-dom";
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

  _headers?.append("Content-Type", "application/json");
  _headers?.append(
    "Authorization",
    `Bearer ${sessionStorage?.getItem("token")}`
  );

  React?.useEffect(() => {
    if (isUserAuthenticanted) {
      (async () => {
        await lookup(
          `${process.env.REACT_APP_API_HOST}/api/doc-folders?populate=*`,
          {
            method: "GET",
            headers: _headers,
          }
        )
          .then((res) =>
            res
              .json()
              .then((res) => {
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
              })
              .catch((error) => {
                console.log("an error has occured when creating folder", error);
              })
          )
          .catch((error) => {
            console.log("an error has occured when creating folder", error);
          });
      })();
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
