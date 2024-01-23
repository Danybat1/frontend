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
import Layout from "../../components/Layout";
import { ChevronRight, Visibility } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { documentsCtx } from "../../context/documents";
import DocumentsList from "../../components/DocumentsList";

const MyDocuments = ({}) => {
  const theme = useTheme();

  const navigate = useNavigate();

  const rows = React?.useContext(documentsCtx).documents?.own;

  return (
    <Layout>
      <DocumentsList rows={rows} secondTitle={"Mes documents"} />
    </Layout>
  );
};

export default MyDocuments;
