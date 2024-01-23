// application entry point

import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./styles/App.scss";
import App from "./App";
import Message from "./components/Message";
import ThemeContext from "./context/Theme";
import { CssBaseline } from "@mui/material";
import GuardContext from "./context/Guard";
import DocumentContext from "./context/documents";
import SignaturesContext from "./context/signatures";
import UsersContext from "./context/users";
import AppDataContext from "./context/appData";
import CurrDocumentContext from "./context/currDocument";
import FilesContext from "./context/files";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <BrowserRouter basename={"/"}>
    <ThemeContext>
      <CssBaseline />
      <GuardContext>
        <UsersContext>
          <DocumentContext>
            <SignaturesContext>
              <AppDataContext>
                <CurrDocumentContext>
                  <FilesContext>
                    <App />
                  </FilesContext>
                </CurrDocumentContext>
              </AppDataContext>
            </SignaturesContext>
          </DocumentContext>
        </UsersContext>
      </GuardContext>
      <Message />
    </ThemeContext>
  </BrowserRouter>
);
