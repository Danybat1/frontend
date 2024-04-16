import { Add, CheckBox, CheckBoxOutlineBlank } from "@mui/icons-material";
import {
  Autocomplete,
  Avatar,
  Box,
  Checkbox,
  IconButton,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
  FormControlLabel,
  Switch,
  MenuItem,
  Select,
  FormControl,
} from "@mui/material";
import React from "react";

import { Check } from "react-feather";

import { ReactComponent as PdfIcon } from "../../assets/svg/pdf.svg";
import InputTextField from "../../components/InputTextField";
import InviteesModal from "../../components/InviteesModal";
import { BASE_URL } from "../../constants/api";
import { currDocumentCtx } from "../../context/currDocument";
import { documentsCtx } from "../../context/documents";
import { filesCtx } from "../../context/files";
import { guardCtx } from "../../context/Guard";
import { notificationCtx } from "../../context/notification";
import { usersCtx } from "../../context/users";

interface props {
  pdfName: string;
  setPdfName: React.Dispatch<React.SetStateAction<string>>;
  previousMenu: () => void;
  cancelUpload: () => void;
  nextMenu: () => void;
  progressBar: number;
}

const icon = <CheckBoxOutlineBlank fontSize="small" />;
const checkedIcon = <CheckBox fontSize="small" />;

const FinishUpload = ({
  previousMenu,
  cancelUpload,
  nextMenu,
  renderingKey,
}: props) => {
  const [inviteBox, setInviteBox] = React?.useState([
    ...JSON.parse(sessionStorage.getItem("collabs") || "[]"),
  ]);

  const setRepresentationMode = React?.useContext(currDocumentCtx)?.setRepresentationMode

  const fileContext = React?.useContext(filesCtx);

  const pdfName = fileContext?.pdfName;
  const setPdfName = fileContext?.setPdfName;
  const progressBar = fileContext?.progressBar;

  const theme = useTheme();

  const [isModalOpen, setISModalOpen] = React?.useState(false);

  const handleInviteesAdd = (event, newInvitees) => {
    event?.preventDefault();

    setInviteBox(newInvitees);
  };

  const screen900 = useMediaQuery(theme?.breakpoints?.down(900));

  const invitees = React?.useContext(usersCtx)?.users?.filter((user) => {
    // console.log("currparseent user to share with", user);

    return (
      user?.id?.toString() !== sessionStorage?.getItem("userId") &&
      !sessionStorage?.getItem("final-signee")?.includes(user?.fullName)
    );
  });

  const ownDocuments = React?.useContext(documentsCtx)?.documents?.own || [];

  const [isDocumentNew, setIsDocumentNew] = React.useState(false);

  React?.useEffect(() => {
    console.log("current pathname string", window?.location?.pathname);

    if (window?.location?.pathname?.includes("new-document")) {
      setIsDocumentNew(true);
    }
  }, []);

  const [isFolded, setIsFolded] = React?.useState(false);

  const [folder, setFolder] = React?.useState({});

  const folders = React?.useContext(documentsCtx)?.folders;
  const setFolders = React?.useContext(documentsCtx)?.setFolders;

  // console.log("current folders here", folders);

  const setLoadingMap = React?.useContext(guardCtx)?.setLoadingMap;

  const handleFolder = async (event, value) => {
    event?.preventDefault();

    setLoadingMap(true, "finish_upload");

    // console.log("current folder search value", folder);

    const _headers = new Headers();

    _headers.append("Content-Type", "application/json");
    _headers.append(
      "Authorization",
      `Bearer ${sessionStorage?.getItem("token")}`
    );

    if (
      value?.name?.includes("Créer") &&
      defaultCreate?.replaceAll("Créer ", "")?.length > 0
    ) {
      await lookup(`${BASE_URL}/api/doc-folders`, {
        method: "POST",
        headers: _headers,
        body: JSON.stringify({
          data: {
            name: defaultCreate?.replaceAll("Créer ", ""),
          },
        }),
      })
        .then((res) =>
          res
            .json()
            .then((res) => {
              console.log("received data after posting folder", res);

              if (res?.data?.id) {
                setFolders([
                  ...folders,
                  { id: res?.data?.id, ...res?.data?.attributes },
                ]);

                setDefaultCreate("");
              }
            })
            .catch((error) => {
              console.log(
                "an error has occured when creating new envelope",
                error
              );
            })
        )
        .catch((error) => {
          console.log("an error has occured when creating new envelope", error);
        });
    } else {
      console.log("current value for envelope", value);

      setFolder(value);
    }

    setLoadingMap(false, "finish_upload");

    setDefaultCreate("");
  };

  const [finalSignee, setFinalSignee] = React?.useState({});

  const handleFinalSignee = async (event, value) => {
    event?.preventDefault();

    sessionStorage?.setItem("final-signee", JSON.stringify(value));

    setFinalSignee(value);
  };

  const [defaultCreate, setDefaultCreate] = React?.useState("");

  const showWarning = React?.useContext(notificationCtx)?.showWarning;

  const usersList = React?.useContext(usersCtx)?.users?.filter(
    (user) =>
      user?.id?.toString() !== sessionStorage?.getItem("userId") &&
      !sessionStorage?.getItem("collabs")?.includes(user?.fullName)
  );

  React?.useEffect(() => {
    const finalSigneeRaw = sessionStorage?.getItem("final-signee");

    if (finalSigneeRaw?.length > 5) {
      setRepresentationMode({
        active: true,
        finalSignee: JSON.parse(finalSigneeRaw),
      });
    }
  }, [finalSignee]);

  return (
    <Box
      key={renderingKey}
      id={"FinishUpload"}
      sx={{
        width: "100%!important",
      }}
    >
      <Stack
        direction={"row"}
        sx={{
          width: "100%",
          alignItems: "center",
          justifyContent: "space-between",
          my: "1rem",
        }}
      >
        <Stack
          direction={"row"}
          sx={{
            width: "100%",
            alignItems: "center",
            justifyContent: "flex-start",
            my: "1rem",
          }}
        >
          <FormControlLabel
            onClick={(event) => {
              event?.preventDefault();

              setIsFolded(!isFolded);
            }}
            control={<Switch checked={isFolded} />}
            label={isFolded ? "Avec dossier" : "Sans dossier"}
          />
          <FormControl variant="standard" sx={{ minWidth: 220 }} size={"small"}>
            <Autocomplete
              disabled={!isFolded}
              size="small"
              onChange={handleFolder}
              id="checkboxes-tags-demo"
              options={[...folders, { name: `Créer ${defaultCreate}`, id: -1 }]}
              disableCloseOnSelect
              getOptionLabel={(option) => `${option?.name}`}
              renderOption={(props, option, { selected }) => (
                <li
                  {...props}
                  disabled={option?.name === "Créer"}
                >{`${option?.name}`}</li>
              )}
              style={{ width: "100%" }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Dossier"
                  placeholder="Selectionner un dossier"
                  onChange={(event) => {
                    setDefaultCreate(event?.target?.value);
                  }}
                />
              )}
            />
          </FormControl>
        </Stack>

        <FormControl variant="standard" sx={{ minWidth: 220 }} size={"small"}>
          <Autocomplete
            size="small"
            onChange={handleFinalSignee}
            id="checkboxes-tags-demo"
            options={usersList}
            disableCloseOnSelect
            getOptionLabel={(option) => `${option?.fullName}`}
            renderOption={(props, option, { selected }) => (
              <li {...props}>{`${option?.fullName}`}</li>
            )}
            style={{ width: "100%" }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Signataire final"
                placeholder="Selectionner le signataire final"
                onChange={(event) => {
                  setDefaultCreate(event?.target?.value);
                }}
              />
            )}
          />
        </FormControl>
      </Stack>
      <Box className="card-box w-full p-6">
        <div className="flex w-full gap-6 rounded-2xl bg-pale-blue py-4 px-6">
          <span>
            <PdfIcon />
          </span>
          <div className="grid flex-auto content-between">
            <span className="font-['Roboto_Slab']">{pdfName}</span>
            <span className="text-end font-medium text-blue">
              Terminé
              <Check
                className="ml-2 inline-block"
                size="16px"
                strokeWidth="4"
              />
            </span>
            <span
              className="col-span-2 row-span-2 mt-2 h-1 bg-blue transition"
              style={{ width: `${progressBar}%` }}
            />
          </div>
        </div>
        <div className="mx-6 mt-12 mb-4">
          <p className="mb-4 select-none text-black/50">Nom du fichier</p>
          <InputTextField InputValue={pdfName} setInputValue={setPdfName} />
        </div>
      </Box>
      <Box
        className="card-box w-full p-6"
        sx={{
          mt: "1rem",
          width: "100%",
          position: "relative",
        }}
      >
        <Typography className="mb-4 select-none text-black">
          Signataires
        </Typography>
        <Stack
          direction={"row"}
          sx={{
            alignItems: "center",
            justifyContent: "flex-start",
            px: ".5rem",
            py: "0.5rem",
            maxWidth: "100%",
            overflowX: "auto",
            pr: screen900 ? "85px" : "85px",
          }}
        >
          {[...inviteBox]?.map((invitee) => {
            return (
              <Stack
                direction={"column"}
                sx={{
                  alignItems: "center",
                  ml: ".5rem",
                  width: "80px",
                }}
              >
                <Avatar
                  src={invitee?.imgLink}
                  sx={{
                    width: "50px",
                    height: "50px",
                    bgcolor: theme?.palette?.primary?.main,
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
                    fontSize: "14px",
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
                width: "80px",
                cursor: "pointer",
                position: "absolute",
                right: "1rem",
                bgcolor: theme?.palette?.common?.white,
              }}
            >
              <Avatar
                sx={{
                  ml: ".5rem",
                  bgcolor: theme?.palette?.primary?.main,
                  width: "40px",
                  height: "40px",
                }}
              >
                <Add
                  sx={{
                    fontSize: "35px",
                    color: theme?.palette?.common?.white,
                  }}
                />
              </Avatar>
              <Typography
                className={`mb-4 select-none text-black/50`}
                sx={{
                  textAlign: "center",
                  fontSize: "14px",
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
      </Box>
      <div className="two-btn">
        <button
          type="button"
          className="btn-secodary flex-auto"
          onClick={previousMenu}
        >
          Réessayer
        </button>
        {progressBar !== 100 ? (
          <button
            type="button"
            className="btn-alter flex-auto"
            onClick={cancelUpload}
          >
            Annuler
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary flex-auto"
            onClick={(params) => {
              console.log("current  is folded value", { isFolded, folder });

              let canProcess = true;

              if (isFolded) {
                try {
                  if (Object.keys(folder)?.length > 0) {
                    sessionStorage?.setItem("envelope-id", folder?.id);
                  } else {
                    canProcess = false;

                    showWarning(
                      "Selection un envelope ou décochez les envelopes"
                    );
                  }
                } catch (error) {
                  canProcess = false;
                  showWarning(
                    "Selection un envelope ou décochez les envelopes"
                  );
                }
              }

              if (canProcess) {
                if (sessionStorage?.getItem("collabs")?.length > 5) {
                  nextMenu(params);
                } else {
                  showWarning("Veuillez choisir au moins un co-signataire");
                }
              }
            }}
          >
            Suivant
          </button>
        )}
      </div>
      <InviteesModal
        open={isModalOpen}
        setOpen={setISModalOpen}
        childrenClassName={`w-[${screen900 ? 95 : 70}%]`}
        setInviteBox={setInviteBox}
        inviteBox={inviteBox}
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
              options={invitees}
              disableCloseOnSelect
              defaultValue={inviteBox}
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
                  JSON.stringify(inviteBox)
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

export default FinishUpload;
