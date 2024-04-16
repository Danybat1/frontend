// component defintion

import * as React from "react";
import { useTheme, Stack, Box, FormControlLabel, Switch } from "@mui/material";

const NotifsFields = ({ setNotifications, notifications }) => {
  const theme = useTheme();

  return (
    <div>
      <div className="tag-element">
        <p>Notifications</p>
        <Box
          className="tag-list"
          sx={
            {
              //  px: ".5rem",
            }
          }
        >
          <FormControlLabel
            onClick={(event) => {
              event?.preventDefault();

              setNotifications(!notifications);
            }}
            control={<Switch checked={notifications} />}
            label={notifications ? "Activées" : "Desactivées"}
          />
        </Box>
      </div>
    </div>
  );
};

export default NotifsFields;
