// application routing logic definition

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
import AccessManagement from "../pages/access-management";
import InvitedUser from "../components/InvitedUser";
import ParaphView from "../pages/paraph";
import ForgotPassword from "../components/ForgotPassword";
import ResetPassword from "../components/ResetPassword";

const routes: PageListType[] = [
  {
    path: "/auth/reset-password",
    element: <ResetPassword />,
    classTag: "svg-fill",
  },
  {
    path: "/auth/forgot-password",
    element: <ForgotPassword />,
    classTag: "svg-fill",
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
    classTag: "svg-fill",
  },
  {
    path: "/",
    element: <Dashboard />,
    classTag: "svg-fill",
  },
  {
    path: "/mydocuments/:ref",
    element: <DocumentView />,
    classTag: "svg-fill",
  },

  {
    path: "/envelope/:ref/documents",
    element: <EnvelopeDocs />,
    classTag: "svg-fill",
  },
  {
    path: "/mydocuments/new-document",
    element: <File />,
    classTag: "svg-fill",
  },
  {
    path: "/mydocuments/sign",
    element: <Sign />,
    classTag: "svg-stroke",
  },
  {
    path: "/requests/all",
    element: <AllDocuments />,
    classTag: "svg-fill",
  },
  {
    path: "/mydocuments",
    element: <MyDocuments />,
    classTag: "svg-fill",
  },
  {
    path: "/mydocuments/all",
    element: <MyDocuments />,
    classTag: "svg-fill",
  },
  {
    path: "/mydocuments/history",
    element: <ActivityHistory />,
    classTag: "svg-fill",
  },
  {
    path: "/requests/pending",
    element: <PendingDocuments />,
    classTag: "svg-fill",
  },
  {
    path: "/requests/validated",
    element: <ValidatedDocs />,
    classTag: "svg-fill",
  },
  {
    path: "/login",
    element: <LoginForm />,
    classTag: "svg-fill",
  },
  {
    path: "/access-management",
    element: <AccessManagement />,
    classTag: "svg-fill",
  },
  {
    path: "/paraphs/:id",
    element: <ParaphView />,
    classTag: "svg-fill",
  },
  // {
  //   path: "/mydocuments/new-document/annexes",
  //   element: (
  //     <div>
  //       <File />
  //     </div>
  //   ),
  //   classTag: "svg-fill",
  // },
];

export default routes;
