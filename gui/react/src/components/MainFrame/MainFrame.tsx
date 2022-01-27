import { Box, Divider } from "@mui/material";
import React from "react";
import './MainFrame.css';
import SearchBox from "./SearchBox";

const MainFrame: React.FC = () => {
  return <Box sx={{ border: '2px solid white', width: '75%' }}>
    <SearchBox />
    <Divider className="divider-width" light sx={{ color: 'text.primary'}}>Text</Divider>
  </Box>
}

export default MainFrame;