// component definitions

import * as React from "react";
import {
  Box,
  useTheme,
  Stack,
  Typography,
  IconButton,
  AvatarGroup,
  Avatar,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import Layout from "./Layout";
import { ChevronRight, Visibility } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { documentsCtx } from "../context/documents";
import DocumentsList from "./DocumentsList";

const EnvelopeDocs = ({}): React.ReactNode => {
  const theme = useTheme();

  const navigate = useNavigate();

  const rows = React?.useContext(documentsCtx).documents?.all;

  const [envelopeDocs, setEnvelopeDocs] = React?.useState([]);

  React?.useEffect(() => {
    const _docs = rows?.filter((target) => {
      console.log(
        "curren enveloppe config",
        target,
        window?.location?.pathname?.split("/")[2]
      );

      return (
        target?.doc_folder?.id?.toString() ==
        window?.location?.pathname?.split("/")[2]
      );
    });

    setEnvelopeDocs(_docs);
  }, []);

  return (
    <Layout>
      <DocumentsList rows={envelopeDocs} secondTitle={"Enveloppe"} />
    </Layout>
  );
};

export default EnvelopeDocs;
