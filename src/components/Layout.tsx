// layout definition

import * as React from "react";
import {
  useTheme,
  Typography,
  Stack,
  Box,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  MenuItem,
  IconButton,
  useMediaQuery,
  Drawer,
  SpeedDial,
  Checkbox,
} from "@mui/material";
import {
  Dashboard,
  DesktopMac,
  Folder,
  Menu,
  RequestQuote,
  Add,
  Close,
  AddAlarm,
  NotificationAdd,
} from "@mui/icons-material";
import { ChevronUp } from "react-feather";
import { useNavigate } from "react-router-dom";
import User from "../components/User";
import RejectionModal from "./RejectionModal";
import { documentsCtx } from "../context/documents";

interface Props {
  children?: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  const theme = useTheme();

  const navigate = useNavigate();

  const [isMenuCollapsed, setIsMenuCollaped] = React?.useState(true);

  const handleCollapse = (event) => {
    event?.preventDefault();

    setIsMenuCollaped(!isMenuCollapsed);
  };

  const [expanded, setExpanded] = React.useState(false);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const menuMaterials = [
    {
      title: "Reporting",
      link: "/dashboard",
      key: "/dashboard",
      icon: (props) => <Dashboard {...props} />,
      children: [{ title: "Statistiques", link: "/dashboard" }],
    },
    {
      title: "Espace personnel",
      link: "/mydocuments",
      key: "/mydocuments",
      icon: (props) => <DesktopMac {...props} />,
      children: [
        { title: "Nouveau document", link: "/mydocuments/new-document" },
        { title: "Mes documents", link: "/mydocuments/all" },
        { title: "Signatures", link: "/mydocuments/sign" },
        { title: "Historique", link: "/mydocuments/history" },
      ],
    },
    {
      title: "Documents",
      key: "/requests",
      link: "/requests/all",
      icon: (props) => <Folder {...props} />,
      children: [
        { title: "Tous", link: "/requests/all" },
        { title: "En attentes", link: "/requests/pending" },
        { title: "Signés", link: "/requests/validated" },
      ],
    },
  ];

  const screen900 = useMediaQuery(theme?.breakpoints?.down(900));

  const [drawerOpened, setDrawerOpened] = React?.useState(false);

  const [userDrawerOpened, setUserDrawerOpened] = React?.useState(false);

  const [isRingtoneOpen, setIsRingtoneOpen] = React?.useState(false);

  const lateDocuments = React?.useContext(
    documentsCtx
  )?.documents?.pending?.filter((target) => {
    return target?.author?.id === sessionStorage.getItem("userId");
  });

  const handleRingtone = async (event) => {
    event?.preventDefault();
  };

  return (
    <React.Fragment>
      {!window?.location?.pathname?.includes("new-document") && (
        <SpeedDial
          ariaLabel="create document"
          onClick={(event) => {
            event?.preventDefault();
            navigate("/mydocuments/new-document", { replace: true });
          }}
          sx={{
            position: "fixed",
            bottom: 16,
            right: 16,
            // width: "35px",
            // height: "35px",
          }}
          icon={<Add sx={{}} />}
        />
      )}
      <RejectionModal
        open={isRingtoneOpen}
        setOpen={() => {
          setIsRingtoneOpen(false);
        }}
        childrenClassName={`w-[${screen900 ? 95 : 70}%]`}
      >
        <Stack className="card-box w-full p-6" sx={{}}>
          <Typography
            sx={{
              color: theme?.palette?.grey?.[500],
              fontWeight: theme?.typography?.fontWeightBold,
              //mt: "1rem",
            }}
          >
            Choisissez les documents pour lesquels vous voulez lancer des
            rappels
          </Typography>

          <form onSubmit={handleRingtone}>
            <Stack
              direction={"row"}
              sx={{
                width: "100%",
                flexWrap: "wrap",
              }}
            >
              {lateDocuments?.map((target) => {
                return <Checkbox />;
              })}
            </Stack>
          </form>
        </Stack>
      </RejectionModal>
      <Stack
        direction={"row"}
        sx={{
          width: "100%",
          alignItems: "flex-start",
          bgcolor: theme?.palette?.secondary?.main,
          minHeight: "100vh",
        }}
      >
        {/**<SpeedDial
          ariaLabel="SpeedDial basic example"
          sx={{
            position: "absolute",
            bottom: 16,
            right: 16,
          }}
          icon={
            <NotificationAdd
              sx={{
                color: theme?.palette?.common?.white,
              }}
            />
          }
          onClick={(event) => {
            event?.preventDefault();

            setIsRingtoneOpen(!isRingtoneOpen);
          }}
        /> */}

        <Drawer
          anchor={"right"}
          open={userDrawerOpened}
          onClose={() => {
            setUserDrawerOpened(false);
          }}
        >
          <User />
        </Drawer>
        <Drawer
          anchor={"top"}
          open={drawerOpened}
          onClose={() => {
            setDrawerOpened(false);
          }}
        >
          {" "}
          <Stack
            direction={"row"}
            sx={{
              alignItems: "center",
              height: "100%",
              pt: "2rem",
              pl: "2rem",
              pb: "1rem",
              justifyContent: "flex-end",
            }}
          >
            <IconButton
              onClick={(event) => {
                event?.preventDefault();

                setDrawerOpened(!drawerOpened);
              }}
            >
              <Close
                sx={{
                  color: theme?.palette?.primary?.main,
                  fontSize: "30px",
                  cursor: "pointer",
                }}
              />
            </IconButton>
          </Stack>
          <Stack
            direction={"column"}
            sx={{
              pb: "2rem",
              alignItems: !isMenuCollapsed ? "center" : undefined,
              px: "1rem",
            }}
          >
            {menuMaterials?.map((target, index) => {
              return (
                <Accordion
                  key={index}
                  expanded={
                    expanded === index ||
                    window?.location?.pathname?.includes(target?.key)
                  }
                  onChange={handleChange(index)}
                  sx={{
                    boxShadow: "none",
                    borderRadius: 0,
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ChevronUp />}
                    aria-controls="panel1a-content"
                    id="panel1a-header"
                  >
                    <Typography
                      sx={{
                        color: theme?.palette?.grey[700],
                        fontSize: "14px",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        fontWeight: theme?.typography?.fontWeightBold,
                      }}
                    >
                      {target?.title}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {target?.children?.map((_child) => {
                      return (
                        <MenuItem
                          onClick={() => {
                            navigate(_child?.link, { replace: true });
                          }}
                          sx={{
                            bgcolor: window?.location?.pathname?.includes(
                              _child?.link
                            )
                              ? "#227378"
                              : "transparent",
                            color: window?.location?.pathname?.includes(
                              _child?.link
                            )
                              ? theme?.palette?.common?.white
                              : undefined,
                            borderRadius: "10px",
                            "&:hover": {
                              bgcolor: window?.location?.pathname?.includes(
                                _child?.link
                              )
                                ? "#227378"
                                : undefined,
                            },
                            fontSize: "14px",
                          }}
                        >
                          {_child?.title}
                        </MenuItem>
                      );
                    })}
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Stack>
        </Drawer>
        <Stack
          direction={"column"}
          sx={{
            flexGrow: 1,
            position: "relative",
            width: "100%",
          }}
        >
          <Stack
            direction={"row"}
            sx={{
              borderBottom: `1px solid ${theme?.palette?.grey[300]}`,
              height: "65px",
              bgcolor: theme?.palette?.common?.white,
              position: "fixed",
              right: 0,
              left: 0,
              top: 0,
              alignItems: "center",
              justifyContent: "space-between",
              px: "1rem",
              zIndex: 900,
            }}
          >
            {screen900 ? (
              <Stack
                direction={"row"}
                sx={{
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <IconButton
                  onClick={(event) => {
                    event?.preventDefault();

                    setDrawerOpened(!drawerOpened);
                  }}
                >
                  <Menu
                    sx={{
                      color: theme?.palette?.primary?.main,
                      fontSize: "20px",
                      cursor: "pointer",
                    }}
                  />
                </IconButton>
                <Typography
                  sx={{
                    fontSize: "15px",
                    fontWeight: theme?.typography?.fontWeightBold,
                    color: theme?.palette?.primary?.main,
                  }}
                >
                  {menuMaterials?.find((menu) =>
                    window?.location?.pathname?.includes(menu?.link)
                  )?.title || "Linzaka"}
                </Typography>
              </Stack>
            ) : (
              <Box
                sx={{
                  width: "70px",
                }}
              >
                <img
                  alt={"linzaka logo"}
                  src={"/images/favicon.png"}
                  sx={{
                    width: "100%",
                  }}
                />
              </Box>
            )}
            {!screen900 ? (
              <Stack
                direction={"row"}
                sx={{
                  height: "100%",
                  alignItems: "flex-end",
                  mx: "3rem",
                }}
              >
                {menuMaterials?.map((target) => {
                  return (
                    <Stack
                      onClick={() => {
                        navigate(target?.link, { replace: true });
                      }}
                      direction={"row"}
                      sx={{
                        alignItems: "center",
                        width: "100%",
                        justifyContent: "flex-start",
                        px: "1rem",
                        pb: "1rem",
                        cursor: "pointer",
                        borderBottom: window?.location?.pathname?.includes(
                          target?.link
                        )
                          ? `2px solid #227378`
                          : undefined,
                      }}
                    >
                      {target?.icon({
                        sx: {
                          color: "#227378",
                          fontSize: "25px",
                        },
                      })}
                      <Typography
                        sx={{
                          ml: ".5rem",
                          color: "#227378",
                          fontSize: "14px",
                          fontWeight: window?.location?.pathname?.includes(
                            target?.link
                          )
                            ? "bold"
                            : "normal",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {target?.title}
                      </Typography>
                    </Stack>
                  );
                })}
              </Stack>
            ) : (
              ""
            )}
            <Avatar
              onClick={(event) => {
                event?.preventDefault();

                setUserDrawerOpened(!userDrawerOpened);
              }}
              sx={{
                width: 40,
                height: 40,
                bgcolor: "#227378",
                cursor: "pointer",
              }}
            >
              {sessionStorage
                ?.getItem("username")
                ?.split(" ")
                ?.map((chars) => chars[0])
                ?.splice(0, 2)}
            </Avatar>
          </Stack>
          <Stack
            direction={"row"}
            sx={{
              justifyContent: "space-between",
              alignItems: "flex-start",
              width: "100%",
            }}
          >
            {!screen900 ? (
              <Stack
                // className={"card-box"}
                sx={{
                  width: isMenuCollapsed ? "20%" : "65px",
                  minWidth: !isMenuCollapsed ? "65px" : undefined,
                  borderRadius: "40px",
                  bgcolor: theme?.palette?.common?.white,
                  height: "max-content",
                  minHeight: "calc(100vh - 100px)",
                  mt: "80px",
                  overflow: "hidden",
                  ml: "2rem",
                  py: "0!important",
                  transition: "all .2s",
                  transitionDelay: theme?.transitions?.easing?.easeInOut,
                }}
              >
                <Stack
                  direction={"row"}
                  sx={{
                    px: isMenuCollapsed ? "1rem" : undefined,
                    pt: "2rem",
                    alignItems: "center",
                    justifyContent: isMenuCollapsed ? "flex-start" : "center",
                    width: !isMenuCollapsed ? "100%" : undefined,
                  }}
                >
                  <IconButton
                    onClick={handleCollapse}
                    sx={{
                      mr: isMenuCollapsed ? ".5rem" : undefined,
                    }}
                  >
                    <Menu
                      sx={{
                        color: theme?.palette?.primary?.main,
                        fontSize: "25px",
                        cursor: "pointer",
                      }}
                    />
                  </IconButton>
                  {isMenuCollapsed ? (
                    <Typography
                      sx={{
                        color: theme?.palette?.primary?.main,
                        fontSize: "14px",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        fontWeight: theme?.typography?.fontWeightBold,
                      }}
                    >
                      MENU
                    </Typography>
                  ) : (
                    ""
                  )}
                </Stack>
                <Stack
                  direction={"column"}
                  sx={{
                    py: "1.5rem",
                    alignItems: !isMenuCollapsed ? "center" : undefined,
                  }}
                >
                  {menuMaterials?.map((target, index) => {
                    return isMenuCollapsed ? (
                      <Accordion
                        key={index}
                        expanded={
                          expanded === index ||
                          window?.location?.pathname?.includes(target?.key)
                        }
                        onChange={handleChange(index)}
                        sx={{
                          boxShadow: "none",
                          borderRadius: 0,
                        }}
                      >
                        <AccordionSummary
                          expandIcon={<ChevronUp />}
                          aria-controls="panel1a-content"
                          id="panel1a-header"
                        >
                          <Stack
                            direction={"row"}
                            sx={{
                              alignItems: "center",
                            }}
                          >
                            {target?.icon({
                              sx: {
                                color: "#227378",
                                fontSize: "25px",
                                mr: "1rem",
                              },
                            })}
                            <Typography
                              sx={{
                                color: theme?.palette?.grey[700],
                                fontSize: "14px",
                                overflow: "hidden",
                                whiteSpace: "nowrap",
                                textOverflow: "ellipsis",
                                fontWeight: theme?.typography?.fontWeightBold,
                              }}
                            >
                              {target?.title}
                            </Typography>
                          </Stack>
                        </AccordionSummary>
                        <AccordionDetails>
                          {target?.children?.map((_child) => {
                            return (
                              <MenuItem
                                onClick={() => {
                                  navigate(_child?.link, { replace: true });
                                }}
                                sx={{
                                  bgcolor: window?.location?.pathname?.includes(
                                    _child?.link
                                  )
                                    ? "#227378"
                                    : "transparent",
                                  color: window?.location?.pathname?.includes(
                                    _child?.link
                                  )
                                    ? theme?.palette?.common?.white
                                    : undefined,
                                  borderRadius: "10px",
                                  "&:hover": {
                                    bgcolor:
                                      window?.location?.pathname?.includes(
                                        _child?.link
                                      )
                                        ? "#227378"
                                        : undefined,
                                  },
                                  fontSize: "14px",
                                }}
                              >
                                {_child?.title}
                              </MenuItem>
                            );
                          })}
                        </AccordionDetails>
                      </Accordion>
                    ) : (
                      <IconButton
                        onClick={(event) => {
                          event?.preventDefault();

                          navigate(target?.link, { replace: true });
                        }}
                        sx={{
                          width: "50px",
                          height: "50px",
                        }}
                      >
                        {target?.icon({
                          sx: {
                            fontSize: "25px",
                            color: theme?.palette?.primary?.main,
                          },
                        })}
                      </IconButton>
                    );
                  })}
                </Stack>
              </Stack>
            ) : (
              ""
            )}
            <Box
              sx={{
                mt: "65px",
                width: isMenuCollapsed && !screen900 ? "80%" : "100%",
              }}
            >
              {children}
            </Box>
          </Stack>
        </Stack>
      </Stack>
    </React.Fragment>
  );
};

export default Layout;
