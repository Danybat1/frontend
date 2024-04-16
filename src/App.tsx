import { Route, Routes } from "react-router-dom";

import Footer from "./components/Footer";
import Head from "./components/Head";
import routes from "./route/router";
import "./utils/fabricCustomize";
import { useNavigate } from "react-router-dom";

import * as React from "react";
import InvitedUser from "./components/InvitedUser";
import { guardCtx } from "./context/Guard";
import { NODE_ENV } from "./constants/env";

const App = () => {
  const navigate = useNavigate();

  const isUserAuthenticanted = React.useContext(guardCtx)?.isUserAuthenticanted;
  const [_routes, setRoutes] = React?.useState([...routes]);

  React?.useEffect(() => {
    if (isUserAuthenticanted) {
      const __routes = [...routes];

      if (sessionStorage?.getItem("role") === "Admin") {
        __routes?.push(
          {
            path: "/access-management/user/edit",
            element: <InvitedUser />,
            classTag: "svg-fill",
          },
          {
            path: "/access-management/user/new",
            element: <InvitedUser />,
            classTag: "svg-fill",
          }
        );
      }

      setRoutes(__routes);
    }
  }, [isUserAuthenticanted]);

  React?.useEffect(() => {
    if (window?.location?.pathname?.length < 3) {
      navigate("/login", { replace: true });
    }
  }, []);

  React?.useEffect(() => {
    if (NODE_ENV === "production") {
      console.log = () => {};
      console.info = () => {};
      console.error = () => {};
    }
  }, []);

  return (
    <div className="App">
      <Routes>
        {_routes.map((router, i) => (
          <Route key={i} path={router.path} element={router.element} />
        ))}
      </Routes>
    </div>
  );
};

export default App;
