import { Box, Button, Menu, MenuItem, Typography } from '@mui/material';
import React from 'react';
import { messageChannelContext } from '../../provider/MessageChannel';
import useStore from '../../hooks/useStore';
import { StoreState } from '../../provider/Store'

const MenuBar: React.FC = () => {
  const [ openMenu, setMenuOpen ] = React.useState<'settings'|'help'|undefined>(); 
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [store, dispatch] = useStore();

  const messageChannel = React.useContext(messageChannelContext);
  const getVersion = async() => {
    dispatch({
      type: 'version',
      payload: await messageChannel?.version()
    });  
  }

  getVersion();
  
  const transformService = (service: StoreState['service']) => {
    switch(service) {
      case 'crunchy': 
        return "Crunchyroll"
      case 'funi':
        return "Funimation"
      case "hidive":
        return "Hidive"
    }
  }

  const msg = React.useContext(messageChannelContext);

  const handleClick = (event: React.MouseEvent<HTMLElement>, n: 'settings'|'help') => {
    setAnchorEl(event.currentTarget);
    setMenuOpen(n);
  };
  const handleClose = () => {
    setAnchorEl(null);
    setMenuOpen(undefined);
  };

  if (!msg)
    return <></>;

  return <Box sx={{ width: '100%', display: 'flex' }}>
    <Button onClick={(e) => handleClick(e, 'settings')}>
      Settings
    </Button>
    <Button onClick={(e) => handleClick(e, 'help')}>
      Help
    </Button>
    <Menu open={openMenu === 'settings'} anchorEl={anchorEl} onClose={handleClose}>
      <MenuItem onClick={() => {
        msg.openFolder('config');
        handleClose();
      }}>
        Open settings folder
      </MenuItem>
      <MenuItem onClick={() => {
        msg.openFile(['config', 'bin-path.yml']);
        handleClose();
      }}>
        Open FFmpeg/Mkvmerge file
      </MenuItem>
      <MenuItem onClick={() => {
        msg.openFile(['config', 'cli-defaults.yml']);
        handleClose();
      }}>
        Open advanced options
      </MenuItem>
      <MenuItem onClick={() => {
        msg.openFolder('content');
        handleClose();
      }}>
        Open output path
      </MenuItem>
    </Menu>
    <Menu open={openMenu === 'help'} anchorEl={anchorEl} onClose={handleClose}>
      <MenuItem onClick={() => {
        msg.openURL('https://github.com/anidl/multi-downloader-nx');
        handleClose();
      }}>
        GitHub 
      </MenuItem>
      <MenuItem onClick={() => {
        msg.openURL('https://github.com/anidl/multi-downloader-nx/issues/new?assignees=AnimeDL,AnidlSupport&labels=bug&template=bug.yml&title=BUG');
        handleClose();
      }}>
        Report a bug
      </MenuItem>
      <MenuItem onClick={() => {
        msg.openURL('https://github.com/anidl/multi-downloader-nx/graphs/contributors');
        handleClose();
      }}>
        Contributors
      </MenuItem>
      <MenuItem onClick={() => {
        msg.openURL('https://discord.gg/qEpbWen5vq');
        handleClose();
      }}>
        Discord
      </MenuItem>
      <MenuItem onClick={() => {
        handleClose();
      }}>
        Version: {store.version}
      </MenuItem>
    </Menu>
    <Typography variant="h5" color="text.primary" component="div" align="center" sx={{flexGrow: 1}}>
      {transformService(store.service)}
    </Typography>
  </Box>;
};

export default MenuBar;