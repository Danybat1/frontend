// component definition

import * as React from "react";
import {
  useTheme,
  Typography,
  Stack,
  Box,
  Grid,
  useMediaQuery,
} from "@mui/material";
import Layout from "../../components/Layout";
import { CheckRounded, DateRange, Timelapse } from "@mui/icons-material";
import { documentsCtx } from "../../context/documents";
import { Search } from "react-feather";
import { useNavigate } from "react-router-dom";
import { appDataCtx } from "../../context/appData";

const Dashboard = ({}) => {
  const theme = useTheme();

  const documents = React?.useContext(documentsCtx)?.documents;

  const metrics = [
    {
      title: "Documents envoyés",
      count: documents?.own?.length,
      icon: (props) => <Timelapse {...props} />,
      link: "/mydocuments",
    },
    {
      title: "Document en attente",
      count: documents?.pending?.length,
      icon: (props) => <DateRange {...props} />,
      link: "/requests/pending",
    },
    {
      title: "Documents signés",
      count: documents?.signed?.length,
      icon: (props) => <CheckRounded {...props} />,
      link: "/requests/validated",
    },
  ];

  const screen900 = useMediaQuery(theme?.breakpoints?.down(900));

  const folders = React?.useContext(documentsCtx)?.folders;

  const [filteredFolders, setFilteredFolders] = React?.useState([]);

  React?.useEffect(() => {
    setFilteredFolders(folders);
  }, [folders]);

  const [searchValue, setSearchValue] = React?.useState("");

  const handleSearch = (event) => {
    event?.preventDefault();

    const _search = event?.target?.value;

    setSearchValue(_search);

    const _searchedObjects = folders?.filter((target) => {
      return Object.keys(target)?.some((key) => {
        if (key !== "documents") {
          return target[key]
            ?.toString()
            .toLowerCase()
            ?.includes(_search?.toLowerCase());
        } else {
          return false;
        }
      });
    });

    setFilteredFolders(_searchedObjects);
  };

  // console.log("current folders", { folders, filteredFolders });

  const navigate = useNavigate();

  const injectData = React?.useContext(appDataCtx).injectData;

  return (
    <Layout>
      <Stack
        direction={"column"}
        sx={{
          width: "100%",
          alignItems: "flex-end",
          justifyContent: "flex-start",
          mt: "2rem",
          px: "1rem",
        }}
      >
        <Grid
          container
          sx={{
            width: "100%",
            flexGrow: 1,
          }}
        >
          {metrics?.map((target) => {
            return (
              <Grid
                item
                xs={12}
                sm={4}
                sx={{
                  p: "1rem",
                }}
              >
                <Stack
                  className={"card-box"}
                  onClick={(event) => {
                    event?.preventDefault();

                    navigate(target?.link, { replace: true });
                  }}
                  sx={{
                    bgcolor: theme?.palette?.common?.white,
                    borderRadius: "0px",
                    p: "10px",
                  }}
                >
                  <Typography
                    sx={{
                      color: theme?.palette?.grey?.[500],
                      fontSize: "18px",
                      fontWeight: theme?.typography?.fontWeightRegular,
                    }}
                  >
                    {target?.title}
                  </Typography>
                  <Stack
                    direction={"row"}
                    sx={{
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      mt: "10%",
                    }}
                  >
                    {target?.icon({
                      sx: {
                        color: "#227378",
                        fontSize: "50px",
                      },
                    })}
                    <Typography
                      sx={{
                        color: theme?.palette?.grey?.[700],
                        fontWeight: theme?.typography?.fontWeightLight,
                        fontSize: "30px",
                      }}
                    >
                      {target?.count}
                    </Typography>
                  </Stack>
                </Stack>
              </Grid>
            );
          })}
        </Grid>
        <Stack
          direction={"column"}
          sx={{
            alignItems: "flex-start",
            justifyContent: "flex-start",
            my: "1rem",
            width: "100%",
            px: "1rem",
          }}
        >
          <Stack
            direction={"row"}
            sx={{
              alignITems: "center",
              width: "100%",
              justifyContent: "space-between",
              mb: "1rem",
            }}
          >
            <Typography
              sx={{
                color: theme?.palette?.grey[700],
                fontWeight: theme?.typography?.fontWeightBold,
                fontSize: "15px",
              }}
            >
              {"Enveloppes"}
            </Typography>
            <Box
              className="text-field"
              sx={{
                py: ".3rem",
              }}
            >
              <input
                type="text"
                value={searchValue}
                onChange={handleSearch}
                placeholder={"Rechercher ici"}
              />
              <span className="cursor-pointer">
                <Search className="stroke-black" />
              </span>
            </Box>
          </Stack>
          {!(filteredFolders?.length > 0) ? (
            <Stack
              sx={{
                width: "100%",
                bgcolor: theme?.palette?.common?.white,
                borderRadius: screen900 ? "10px" : "15px",
                maxHeight: screen900 ? undefined : "calc(100vh - 450px)",
                overflowY: "auto",
                p: "1rem",
              }}
            >
              <Typography
                sx={{
                  textAlign: "center",
                  color: theme?.palette?.grey[700],
                }}
              >
                Aucun enveloppe encore créé
              </Typography>
            </Stack>
          ) : (
            <Grid
              container
              sx={{
                width: "100%",
                flexGrow: 1,
                height: "100%",
                bgcolor: theme?.palette?.common?.white,
                borderRadius: screen900 ? "10px" : "15px",
                maxHeight: "50vh",
                overflowY: "auto",
                p: "1rem",
              }}
            >
              {filteredFolders?.map((target) => {
                return (
                  <Grid
                    item
                    xs={12}
                    sm={4}
                    sx={{
                      p: "1rem",
                    }}
                  >
                    <Stack
                      onClick={(event) => {
                        event?.preventDefault();

                        navigate(`/envelope/${target?.id}/documents`, {
                          replace: true,
                        });
                      }}
                      className={"card-box"}
                      sx={{
                        borderRadius: "10px",
                        p: "1rem",
                        cursor: "pointer",
                        "&:hover": {
                          transition: "all .2s",
                          boxShadow: "none",
                        },
                      }}
                    >
                      <Typography
                        sx={{
                          color: theme?.palette?.primary?.main,
                          fontWeight: theme?.typography?.fontWeightBold,
                          fontSize: "14px",
                        }}
                      >
                        {target?.name}
                      </Typography>
                      <Typography
                        sx={{
                          color: theme?.palette?.grey[700],
                          fontWeight: theme?.typography?.fontWeightRegular,
                          fontSize: "14px",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                        }}
                      >
                        Créé au {target?.createdAt}
                      </Typography>
                      <Typography
                        sx={{
                          color: theme?.palette?.common?.black,
                          fontWeight: theme?.typography?.fontWeightRegular,
                          fontSize: "14px",
                          fontStyle: "italic",
                        }}
                      >
                        {target?.documents?.data?.length} document (s)
                      </Typography>
                    </Stack>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Stack>
      </Stack>
    </Layout>
  );
};

export default Dashboard;
