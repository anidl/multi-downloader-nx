import React from "react";
import AuthButton from "./components/AuthButton";
import { Box, Button } from "@mui/material";
import MainFrame from "./components/MainFrame/MainFrame";
import LogoutButton from "./components/LogoutButton";
import AddToQueue from "./components/AddToQueue/AddToQueue";
import { messageChannelContext } from './provider/MessageChannel';
import { ClearAll, Folder } from "@mui/icons-material";
import useStore from "./hooks/useStore";

const Layout: React.FC = () => {

  const messageHandler = React.useContext(messageChannelContext);
  const [, dispatch] = useStore();

  return <Box>
    <Box sx={{ height: 50, mb: 4, display: 'flex', gap: 1 }}>
      <LogoutButton />
      <AuthButton />
      <Box sx={{ display: 'flex', gap: 1, height: 36 }}>
        <Button variant="contained" startIcon={<Folder />} onClick={() => messageHandler?.openFolder('content')}>Open Output Directory</Button>
        <Button variant="contained" startIcon={<ClearAll />} onClick={() => dispatch({ type: 'queue', payload: [], extraInfo: { force: true } })}>Clear Queue</Button>
      </Box>
      <AddToQueue />
    </Box>
    <MainFrame />
  </Box>;
}

export default Layout;