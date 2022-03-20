import React from "react";
import AuthButton from "./components/AuthButton";
import { Box, Button } from "@mui/material";
import MainFrame from "./components/MainFrame/MainFrame";
import LogoutButton from "./components/LogoutButton";
import AddToQueue from "./components/AddToQueue/AddToQueue";
import { messageChannelContext } from './provider/MessageChannel';
import { Folder } from "@mui/icons-material";

const Layout: React.FC = () => {

  const messageHandler = React.useContext(messageChannelContext);

  return <Box>
    <Box sx={{ height: 50, mb: 4, display: 'flex', gap: 1 }}>
      <LogoutButton />
      <AuthButton />
      <Box>
        <Button variant="contained" startIcon={<Folder />} onClick={() => messageHandler?.openFolder('content')}>Open Output Directory</Button>
      </Box>
      <AddToQueue />
    </Box>
    <MainFrame />
  </Box>;
}

export default Layout;