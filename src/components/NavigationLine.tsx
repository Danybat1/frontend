// component definition
import * as React from "react";

import { Stack, Typography, Box, useTheme } from "@mui/material";
import { ChevronRight } from "@mui/icons-material";

const NavigationLine = ({ firstTitle, secondTitle }) => {
  const theme = useTheme();

  return (
    <Stack
      direction={"row"}
      sx={{
        alignItems: "center",
        justifyContent: "flex-start",
        my: "1rem",
      }}
    >
      <Typography
        sx={{
          color: theme?.palette?.grey[700],
          fontWeight: theme?.typography?.fontWeightBold,
          fontSize: "16px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {firstTitle}
      </Typography>
      <ChevronRight
        sx={{
          fontSize: "25px",
          color: theme?.palette?.grey[500],
        }}
      />
      <Typography
        sx={{
          color: theme?.palette?.grey[700],
          fontWeight: theme?.typography?.fontWeightRegular,
          fontSize: "16px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {secondTitle}
      </Typography>
    </Stack>
  );
};

export default NavigationLine;
