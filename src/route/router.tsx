import { ReactComponent as FileIcon } from "../assets/svg/file.svg";
import { ReactComponent as SettingIcon } from "../assets/svg/setting.svg";
import { ReactComponent as WritingIcon } from "../assets/svg/writing.svg";
import Dashboard from "../pages/dashboard";
import File from "../pages/file";
import Setting from "../pages/setting";
import Sign from "../pages/sign";
import MyDocuments from "../pages/workspace";
import AllDocuments from "../pages/all-documents";
import PendingDocuments from "../pages/pending-requests";
import ValidatedDocs from "../pages/validate-documents";
import LoginForm from "../pages/login";
import DocumentView from "../components/DocumentView";
import ActivityHistory from "../components/ActivityHistory";
import EnvelopeDocs from "../components/EncelopeDocs";

const routes: PageListType[] = [
  {
    name: (
      <>
        <span className="i-icon">
          <FileIcon />
        </span>
        Dashboard
      </>
    ),
    path: "/dashboard",
    element: <Dashboard />,
    classTag: "svg-fill",
  },
  {
    name: (
      <>
        <span className="i-icon">
          <FileIcon />
        </span>
        Dashboard
      </>
    ),
    path: "/",
    element: <Dashboard />,
    classTag: "svg-fill",
  },
  {
    name: (
      <>
        <span className="i-icon">
          <FileIcon />
        </span>
        Dashboard
      </>
    ),
    path: "/mydocuments/:ref",
    element: <DocumentView />,
    classTag: "svg-fill",
  },

  {
    name: (
      <>
        <span className="i-icon">
          <FileIcon />
        </span>
        Dashboard
      </>
    ),
    path: "/envelope/:ref/documents",
    element: <EnvelopeDocs />,
    classTag: "svg-fill",
  },
  {
    name: (
      <>
        <span className="i-icon">
          <FileIcon />
        </span>
        Document
      </>
    ),
    path: "/mydocuments/new-document",
    element: <File />,
    classTag: "svg-fill",
  },
  {
    name: (
      <>
        <span className="i-icon">
          <WritingIcon />
        </span>
        Signature
      </>
    ),
    path: "/mydocuments/sign",
    element: <Sign />,
    classTag: "svg-stroke",
  },
  {
    name: (
      <>
        <span className="i-icon">
          <SettingIcon />
        </span>
        Paramètres
      </>
    ),
    path: "/requests/all",
    element: <AllDocuments />,
    classTag: "svg-fill",
  },
  {
    name: (
      <>
        <span className="i-icon">
          <SettingIcon />
        </span>
        Paramètres
      </>
    ),
    path: "/mydocuments",
    element: <MyDocuments />,
    classTag: "svg-fill",
  },
  {
    name: (
      <>
        <span className="i-icon">
          <SettingIcon />
        </span>
        Paramètres
      </>
    ),
    path: "/mydocuments/all",
    element: <MyDocuments />,
    classTag: "svg-fill",
  },
  {
    name: (
      <>
        <span className="i-icon">
          <SettingIcon />
        </span>
        Paramètres
      </>
    ),
    path: "/mydocuments/history",
    element: <ActivityHistory />,
    classTag: "svg-fill",
  },
  {
    name: (
      <>
        <span className="i-icon">
          <SettingIcon />
        </span>
        Paramètres
      </>
    ),
    path: "/requests/pending",
    element: <PendingDocuments />,
    classTag: "svg-fill",
  },
  {
    name: (
      <>
        <span className="i-icon">
          <SettingIcon />
        </span>
        Paramètres
      </>
    ),
    path: "/requests/validated",
    element: <ValidatedDocs />,
    classTag: "svg-fill",
  },
  {
    name: (
      <>
        <span className="i-icon">
          <SettingIcon />
        </span>
        Login
      </>
    ),
    path: "/login",
    element: <LoginForm />,
    classTag: "svg-fill",
  },
];

export default routes;
