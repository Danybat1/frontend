// component defintion

import * as React from "react";
import { createTheme, useTheme, ThemeProvider } from "@mui/material";

const themeCtx = React.createContext({});

const customTheme = createTheme({
  palette: {
    primary: {
      main: "#227378",
    },
    secondary: {
      main: "#EEF7F9",
    },
  },
  typography: {
    fontWeightBlack: 900,
    fontWeightThin: 200,
    fontFamily: `Raleway, "Noto Sans TC", sans-serif, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif`,
  },
});

const ThemeContext = ({ children }) => {
  return (
    <themeCtx.Provider value={{}}>
      <ThemeProvider theme={customTheme}>{children}</ThemeProvider>
    </themeCtx.Provider>
  );
};

export default ThemeContext;
