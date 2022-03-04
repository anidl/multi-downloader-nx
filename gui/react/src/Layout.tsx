import React from "react";
import AuthButton from "./components/AuthButton";
import { Box } from "@mui/material";
import MainFrame from "./components/MainFrame/MainFrame";
import LogoutButton from "./components/LogoutButton";

const Layout: React.FC = () => {
  return <Box>
    <Box sx={{ height: 50, mb: 4, display: 'flex', gap: 1 }}>
      <LogoutButton />
      <AuthButton />
    </Box>
    <MainFrame />
  </Box>;
}

export default Layout;