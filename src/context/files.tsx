// constext definition

import * as React from "react";

const filesCtx = React?.createContext({});

const FilesContext = ({ children }) => {
  const [selectedFiles, setSelectedFiles] = React?.useState([]);

  return (
    <filesCtx.Provider
      value={{
        selectedFiles,
        setSelectedFiles,
      }}
    >
      {children}
    </filesCtx.Provider>
  );
};

export { filesCtx };
export default FilesContext;
