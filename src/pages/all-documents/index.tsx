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

const AllDocuments = ({}) => {
  const theme = useTheme();

  const navigate = useNavigate();

  /**{
    id: 1,
    recipients: ["Marie Molla", "Sasha Toniel", "Ygor Damm"],
    author: "Dorra Tania",
    department: "Pharmacie",
    title: "Certificat de conformité",
    issuyingDate: "22/10/2022",
    expiryDate: "22/12/2022",
    open: "Voir",
  }, */

  const rows = React?.useContext(documentsCtx).documents?.all;

  return (
    <Layout>
      <DocumentsList rows={rows} secondTitle={"Tous les documents"} />
    </Layout>
  );
};

export default AllDocuments;
