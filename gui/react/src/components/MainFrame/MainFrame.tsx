import { Box, Divider } from "@mui/material";
import React from "react";
import Bottom from "./Bottom/Bottom";
import DownloadSelector from "./DownloadSelector/DownloadSelector";
import './MainFrame.css';
import Progress from "./Progress/Progress";
import SearchBox from "./SearchBox/SearchBox";

const MainFrame: React.FC = () => {
  return <Box sx={{ display: 'grid', gridTemplateColumns: '3fr 1fr', borderCollapse: 'collapse' }}>
    <Box sx={{ border: '2px solid white' }}>
      <SearchBox />
      <Divider variant='middle' className="divider-width" light sx={{ color: 'text.primary', fontSize: '1.2rem' }}>Options</Divider>
      <DownloadSelector />
      <Divider variant='middle' className="divider-width" light />
      <Bottom />
    </Box>
    <Box sx={{ marginLeft: 1 }}>
     <Progress />
    </Box>
  </Box>
}

export default MainFrame;