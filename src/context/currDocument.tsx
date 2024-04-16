// context defintion

import * as React from "react";

const currDocumentCtx = React?.createContext({});

const CurrDocumentContext = ({ children }) => {
  const [isDocumentNew, setIsDocumentNew] = React.useState(false);

  const [representationMode, setRepresentationMode] = React?.useState({
    active: false,
    finalSignee: {},
  });

  React?.useEffect(() => {
    console.log("current pathname string", window?.location?.pathname);

    if (window?.location?.pathname?.includes("new-document")) {
      setIsDocumentNew(true);
    }
  }, []);

  return (
    <currDocumentCtx.Provider
      value={{
        isDocumentNew,
        setIsDocumentNew,
        representationMode,
        setRepresentationMode,
      }}
    >
      {children}
    </currDocumentCtx.Provider>
  );
};

export default CurrDocumentContext;

export { currDocumentCtx };
