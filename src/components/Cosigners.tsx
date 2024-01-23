// component defintion

import * as React from "react";
import {
  useTheme,
  Typography,
  Stack,
  Box,
  Avatar,
  TextField,
  Checkbox,
  Autocomplete,
  useMediaQuery,
} from "@mui/material";
import { Add, CheckBox, CheckBoxOutlineBlank } from "@mui/icons-material";

import InputTextField from "./InputTextField";
import InviteesModal from "./InviteesModal";
import { usersCtx } from "../context/users";
import { documentsCtx } from "../context/documents";
import { currDocumentCtx } from "../context/currDocument";

const icon = <CheckBoxOutlineBlank fontSize="small" />;
const checkedIcon = <CheckBox fontSize="small" />;

const Cosigners = ({}) => {
  const theme = useTheme();

  const collaborators = [];

  const [invitees, setInvitees] = React?.useState([
    ...JSON.parse(sessionStorage.getItem("collabs") || "[]"),
  ]);

  const _invitees = React?.useContext(usersCtx)?.users?.filter((user) => {
    // console.log("current user to share with", user);

    return (
      user?.id?.toString() !== sessionStorage?.getItem("userId") &&
      !invitees?.some(
        (_target) => _target?.id?.toString() === user?.id?.toString()
      )
    );
  });

  const [isModalOpen, setISModalOpen] = React?.useState(false);

  const handleInviteesAdd = (event, newInvitees) => {
    event?.preventDefault();

    setInvitees(newInvitees);
  };

  const ownDocuments = React?.useContext(documentsCtx)?.documents?.own || [];

  const screen900 = useMediaQuery(theme?.breakpoints?.down(900));
  const [isDocumentNew, setIsDocumentNew] = React.useState(false);

  React?.useEffect(() => {
    console.log("current pathname string", window?.location?.pathname);

    if (window?.location?.pathname?.includes("new-document")) {
      setIsDocumentNew(true);
    }
  }, []);

  return (
    <Box
      className="tag-element"
      sx={{
        position: "relative",
      }}
    >
      <p>Signataires</p>
      <Stack
        direction={"row"}
        sx={{
          alignItems: "center",
          flexWrap: "nowrap",
          pr: "40px",
          maxWidth: "100%",
          overflowX: "auto",
        }}
      >
        {[...invitees]?.map((invitee) => {
          return (
            <Stack
              direction={"column"}
              sx={{
                alignItems: "center",
                ml: ".3rem",
                width: "50px",
              }}
            >
              <Avatar
                src={invitee?.imgLink}
                sx={{
                  width: "30px",
                  height: "30px",
                  bgcolor: theme?.palette?.primary?.main,
                  fontSize: "14px",
                }}
              >
                {invitee?.fullName
                  ?.split(" ")
                  ?.slice(0, 2)
                  ?.map((target) => target[0])
                  ?.join("")}
              </Avatar>

              <Typography
                className={`mb-4 select-none text-black`}
                sx={{
                  textAlign: "center",
                  fontSize: "12px",
                  maxWidth: "80%",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                }}
              >
                {invitee?.fullName}
              </Typography>
            </Stack>
          );
        })}
        {isDocumentNew ? (
          <Stack
            onClick={(event) => {
              event?.preventDefault();

              setISModalOpen(true);
            }}
            direction={"column"}
            sx={{
              alignItems: "center",
              ml: ".5rem",
              cursor: "pointer",
              position: "absolute",
              right: "0px",
              bgcolor: theme?.palette?.common?.white,
            }}
          >
            <Avatar
              sx={{
                ml: ".5rem",
                bgcolor: theme?.palette?.primary?.main,
                width: "30px",
                height: "30px",
              }}
            >
              <Add
                sx={{
                  fontSize: "20px",
                  color: theme?.palette?.common?.white,
                }}
              />
            </Avatar>
            <Typography
              className={`mb-4 select-none text-black/50`}
              sx={{
                textAlign: "center",
                fontSize: "12px",
                maxWidth: "80%",
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
              }}
            >
              {"Ajouter"}
            </Typography>
          </Stack>
        ) : (
          ""
        )}
      </Stack>
      <InviteesModal
        open={isModalOpen}
        setOpen={setISModalOpen}
        childrenClassName={`w-[${screen900 ? 95 : 70}%]`}
        setInviteBox={setInvitees}
        inviteBox={invitees}
      >
        <Box
          className="card-box w-full p-6"
          sx={{
            mt: "1rem",
          }}
        >
          <Typography
            className="mb-4 select-none text-black"
            sx={{
              mb: "1rem",
            }}
          >
            Ajouter les co-signataires
          </Typography>
          <Box>
            <Autocomplete
              onChange={handleInviteesAdd}
              multiple
              id="checkboxes-tags-demo"
              options={_invitees}
              disableCloseOnSelect
              defaultValue={invitees}
              getOptionLabel={(option) =>
                `${option?.fullName}${
                  screen900 ? "" : ` - Dpt (${option?.department})`
                }`
              }
              renderOption={(props, option, { selected }) => (
                <li {...props}>
                  <Checkbox
                    icon={icon}
                    checkedIcon={checkedIcon}
                    style={{ marginRight: 8 }}
                    checked={selected}
                  />
                  {`${option?.fullName}${
                    screen900 ? "" : ` - Dpt (${option?.department})`
                  }`}
                </li>
              )}
              style={{ width: "100%" }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Signataires"
                  placeholder="Signataire"
                />
              )}
            />
          </Box>
          <Stack
            direction={"row"}
            sx={{
              alignItems: "center",
              justifyContent: "flex-end",
              mt: "1rem",
            }}
          >
            <button
              type="button"
              className="btn-primary flex-auto"
              onClick={(event) => {
                event?.preventDefault();

                window?.sessionStorage?.setItem(
                  "collabs",
                  JSON.stringify(invitees)
                );

                setISModalOpen(false);
              }}
            >
              Ajouter
            </button>
          </Stack>
        </Box>
      </InviteesModal>
    </Box>
  );
};

export default Cosigners;
