import { Box, Divider } from "@mui/material";
import React from "react";
import Bottom from "./Bottom/Bottom";
import DownloadSelector from "./DownloadSelector/DownloadSelector";
import './MainFrame.css';
import SearchBox from "./SearchBox/SearchBox";

const MainFrame: React.FC = () => {
  return <Box sx={{ border: '2px solid white', width: '75%' }}>
    <SearchBox />
    <Divider variant='middle' className="divider-width" light sx={{ color: 'text.primary', fontSize: '1.2rem' }}>Options</Divider>
    <DownloadSelector />
    <Divider variant='middle' className="divider-width" light />
    <Bottom />
  </Box>
}

export default MainFrame;