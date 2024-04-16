// component defintion
import * as React from "react";

import { Grid, Skeleton, useTheme, Stack, Typography } from "@mui/material";

const SkeletonContainer = () => {
  return (
    <Grid
      // component={"main"}
      container
      sx={{
        width: "100%",
        height: "100px",
        px: "1rem",
        alignItems: "stretch",
      }}
    >
      <Grid
        item
        sm={12}
        md={3}
        sx={{
          p: "1rem",
          height: "100%",
        }}
      >
        <Skeleton
          component={"div"}
          animation="wave"
          sx={{
            height: "100%",
            borderRadius: "15px",
            opacity: 0.5,
          }}
        />
      </Grid>
      <Grid
        item
        sm={12}
        md={6}
        sx={{
          p: "1rem",
          height: "100%",
        }}
      >
        <Skeleton
          animation="wave"
          sx={{
            height: "100%",
            borderRadius: "15px",
            opacity: 0.5,
          }}
        />
      </Grid>
      <Grid
        item
        sm={12}
        md={3}
        sx={{
          p: "1rem",
          height: "100%",
        }}
      >
        <Skeleton
          animation="wave"
          sx={{
            height: "100%",
            borderRadius: "15px",
            opacity: 0.5,
          }}
        />
      </Grid>
    </Grid>
  );
};

export default SkeletonContainer;
