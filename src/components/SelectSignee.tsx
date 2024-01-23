// component defitntion

import * as React from "react";
import {
  useTheme,
  Box,
  Stack,
  Typography,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
} from "@mui/material";

const SelectSignee = ({}) => {
  const theme = useTheme();

  const [signee, setSignee] = React?.useState(
    sessionStorage?.getItem("userId")
  );

  const handleSigneeChange = (event) => {
    event?.preventDefault();

    setSignee(event?.target?.value);
  };

  const [meData, setMeData] = React?.useState({});

  React?.useEffect(() => {
    setMeData({
      fullName: sessionStorage?.getItem("username"),
      id: sessionStorage?.getItem("userId"),
    });
  }, []);

  const _headers = new Headers();

  _headers?.append("Content-Type", "application/json");
  _headers?.append(
    "Authorization",
    `bearer ${sessionStorage.getItem("token")}`
  );

  return (
    <Stack
      direction={"column"}
      sx={{
        width: "100%",
        //px: "1rem",
      }}
    >
      {/**
      * <div className="flex flex-col gap-4 px-6">
          
          <button
            type="button"
            className="btn-primary flex-auto"
            onClick={(params) => {
              if (sessionStorage?.getItem("collabs")?.length > 5) {
                toFinishFile(params);
              } else {
                alert("Veuillez choisir au moins un co-signataire");
              }
            }}
          >
            Suivant
          </button>
          <button
            type="button"
            className="btn-secodary flex-auto"
            onClick={cancelFile}
          >
            Annuler
          </button>
        </div>
      */}
      <FormControl variant="standard" sx={{ minWidth: 120, mt: "1rem" }}>
        {/**
         * <InputLabel id="demo-simple-select-standard-label">
          Signataire
        </InputLabel>
         */}
        <Select
          labelId="demo-simple-select-standard-label"
          id="demo-simple-select-standard"
          value={signee}
          onChange={handleSigneeChange}
          label="Signataire"
        >
          <MenuItem value={meData?.id}>{meData?.fullName}</MenuItem>
          {JSON.parse(window?.sessionStorage?.getItem("collabs"))?.map(
            (target) => {
              // console.log("collabs target data here", target);

              return <MenuItem value={target?.id}>{target?.fullName}</MenuItem>;
            }
          )}
        </Select>
      </FormControl>
      {/**
       * 
      <Box
        sx={{
          width: "100%",
          "& button": {
            boxShadow: "none!important",
            px: "1rem",
            py: ".3rem",
            fontSize: "14px",
            mt: ".5rem",
          },
        }}
      >
        <button type="button" className="btn-primary flex-auto">
          Valider
        </button>
      </Box>
       */}
    </Stack>
  );
};

export default SelectSignee;
