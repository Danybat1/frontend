import { Box } from "@mui/material";
import { useEffect } from "react";

import Intro from "../../components/Intro";
import Layout from "../../components/Layout";
import SignMode from "../../components/SignMode";

const Sign = () => {
  useEffect(() => {
    document.body.classList.add("sign");
    document.body.classList.remove("file");
  }, []);

  return (
    <Layout>
      <Box
        sx={{
          width: "100%",
          my: "3rem",
          px: "1.5rem",
          maxWidth: "100%",
        }}
        id="Sign"
      >
        <SignMode />
      </Box>
    </Layout>
  );
};

export default Sign;
