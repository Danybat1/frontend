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
  Chip,
} from "@mui/material";
import {
  Add,
  AttachFile,
  CheckBox,
  CheckBoxOutlineBlank,
} from "@mui/icons-material";
import FilesAddModal from "./FilesAddModal";

import InputTextField from "./InputTextField";
import InviteesModal from "./InviteesModal";
import { usersCtx } from "../context/users";
import { documentsCtx } from "../context/documents";
import { currDocumentCtx } from "../context/currDocument";
import { filesCtx } from "../context/files";

const icon = <CheckBoxOutlineBlank fontSize="small" />;
const checkedIcon = <CheckBox fontSize="small" />;

const AttachedFiles = ({}) => {
  const theme = useTheme();

  const [createMode, setCreateMode] = React?.useState(false);
  const [documentCtx, setDocumentCtx] = React?.useState({});

  const selectedFiles = React?.useContext(filesCtx)?.selectedFiles;
  const setSelectedFiles = React?.useContext(filesCtx)?.setSelectedFiles;

  const [isFilesAddOpen, setIsFilesAddOpen] = React?.useState(false);

  React?.useEffect(() => {
    if (window?.location?.pathname?.includes("new-document")) {
      setCreateMode(true);
    }

    const _docString = sessionStorage?.getItem("document-ctx");

    if (_docString?.length > 5) {
      try {
        setDocumentCtx(JSON.parse(_docString));
      } catch (error) {
        console.log(
          "an error has occured when parsing document context object",
          error
        );
      }
    }
  }, []);

  const screen900 = useMediaQuery(theme?.breakpoints?.down(900));

  const handleFileDelete = (fileObj) => {
    setSelectedFiles(
      selectedFiles?.filter((target) => {
        return target?.name !== fileObj?.name;
      })
    );
  };

  const handleFilesChange = (event) => {
    event?.preventDefault();

    const _files = [];

    Array.from(event?.target?.files)?.forEach((file) => {
      console.log("current processed file here", file);

      _files?.push(file);
    });

    setSelectedFiles([...selectedFiles, ..._files]);
  };

  return (
    <React.Fragment>
      <FilesAddModal
        open={isFilesAddOpen}
        setOpen={setIsFilesAddOpen}
        childrenClassName={`w-[${screen900 ? 95 : 70}%]`}
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
            Choisir les fichiers à ajouter
          </Typography>
          <Box></Box>
          <Stack
            component={"form"}
            direction={"row"}
            sx={{
              alignItems: "center",
              justifyContent: "flex-end",
              mt: "1rem",
            }}
          >
            <button
              type="submit"
              className="btn-primary flex-auto"
              onClick={(event) => {
                event?.preventDefault();
                setIsFilesAddOpen(false);
              }}
            >
              Valider
            </button>
          </Stack>
        </Box>
      </FilesAddModal>
      <Box
        className="tag-element"
        sx={{
          position: "relative",
        }}
      >
        <p>Pièces jointes</p>

        <Stack
          direction={"row"}
          sx={{
            alignItems: "flex-start",
            justifyContent: "flex-start",
            width: "100%",
            maxWidth: "100%",
            flexWrap: "wrap",
          }}
        >
          <input
            type="file"
            id="files"
            name="files"
            multiple
            accept=".pdf, .docx"
            style={{
              display: "none",
            }}
            onChange={handleFilesChange}
          />
          {createMode ? (
            <React.Fragment>
              <Chip
                component={"label"}
                for={"files"}
                variant={"outlined"}
                size={"small"}
                label={
                  <Stack
                    direction={"row"}
                    sx={{
                      alignItems: "center",
                    }}
                  >
                    <Add
                      sx={{
                        color: theme?.palette?.primary?.main,
                        fontSize: "15px",
                        mr: ".3rem",
                      }}
                    />
                    Ajouter
                  </Stack>
                }
                sx={{
                  cursor: "pointer",
                  mb: "1rem",
                }}
                onClick={(event) => {
                  // event?.preventDefault();
                  // setIsFilesAddOpen(true);
                }}
              />
              {selectedFiles?.map((target) => {
                return (
                  <Chip
                    label={target?.name}
                    onDelete={(event) => {
                      event?.preventDefault();

                      handleFileDelete(target);
                    }}
                    size={"small"}
                    sx={{
                      mr: ".2rem",
                      mt: ".2rem",
                    }}
                  />
                );
              })}
            </React.Fragment>
          ) : (
            ""
          )}

          {documentCtx?.data?.attachedFiles?.map((target, index) => {
            return (
              <Chip
                icon={
                  <AttachFile
                    sx={{
                      color: theme?.palette?.primary?.main,
                      fontSize: "15px",
                      transform: "rotate(45deg)",
                    }}
                  />
                }
                key={index}
                href={target?.path}
                component={"a"}
                size={"small"}
                label={target?.name}
                target={"_blank"}
                sx={{
                  maxWidth: "90%",
                  mr: ".2rem",
                  mt: ".2rem",
                  textDecoration: "none",
                  cursor: "pointer",
                }}
              />
            );
          })}
        </Stack>
      </Box>
    </React.Fragment>
  );
};

export default AttachedFiles;
