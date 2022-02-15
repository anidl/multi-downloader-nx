import React from "react";
import AuthButton from "./components/AuthButton";
import { Box } from "@mui/material";
import MainFrame from "./components/MainFrame/MainFrame";

const Layout: React.FC = () => {
  return <Box>
    <Box sx={{ height: 50, mb: 4 }}>
      <AuthButton />
    </Box>
    <MainFrame />
  </Box>;
}

export default Layout;