import { Route, Routes } from "react-router-dom";

import Footer from "./components/Footer";
import Head from "./components/Head";
import routes from "./route/router";
import "./utils/fabricCustomize";
import { useNavigate } from "react-router-dom";

import * as React from "react";

const App = () => {
  const navigate = useNavigate();

  React?.useEffect(() => {
    if (window?.location?.pathname?.length < 3) {
      navigate("/login", { replace: true });
    }
  }, []);

  return (
    <div className="App">
      <Routes>
        {routes.map((router, i) => (
          <Route key={i} path={router.path} element={router.element} />
        ))}
      </Routes>
    </div>
  );
};

export default App;
