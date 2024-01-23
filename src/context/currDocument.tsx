// context defintion

import * as React from "react";

const currDocumentCtx = React?.createContext({});

const CurrDocumentContext = ({ children }) => {
  const [isDocumentNew, setIsDocumentNew] = React.useState(false);

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
      }}
    >
      {children}
    </currDocumentCtx.Provider>
  );
};

export default CurrDocumentContext;

export { currDocumentCtx };
