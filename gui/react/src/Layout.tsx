import React from "react";
import AuthButton from "./components/AuthButton";
import { Box } from "@mui/material";

const Layout: React.FC = () => {
  return <Box>
    <Box sx={{ height: 50, mb: 4 }}>
      <AuthButton />
    </Box>
  </Box>;
}

export default Layout;