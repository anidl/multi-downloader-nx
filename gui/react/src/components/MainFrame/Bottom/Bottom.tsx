import { Box } from "@mui/material";
import React from "react";
import EpisodeListing from "./Listing/EpisodeListing";

const Bottom: React.FC = () => {
  return <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
    <EpisodeListing />
  </Box>
}

export default Bottom;