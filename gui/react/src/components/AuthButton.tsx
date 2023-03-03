import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from '@mui/material';
import { Check, Close } from '@mui/icons-material';
import React from 'react';
import { messageChannelContext } from '../provider/MessageChannel';
import Require from './Require';
import { useSnackbar } from 'notistack';

const AuthButton: React.FC = () => {
  const snackbar = useSnackbar();

  const [open, setOpen] = React.useState(false);

  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

  const [usernameError, setUsernameError] = React.useState(false);
  const [passwordError, setPasswordError] = React.useState(false);

  const messageChannel = React.useContext(messageChannelContext);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error|undefined>(undefined);
  const [authed, setAuthed] = React.useState(false);

  const checkAuth = async () => {
    setAuthed((await messageChannel?.checkToken())?.isOk ?? false);
  };

  React.useEffect(() => { checkAuth(); }, []);

  const handleSubmit = async () => {
    if (!messageChannel)
      throw new Error('Invalid state'); //The components to confirm only render if the messageChannel is not undefinded
    if (username.trim().length === 0)
      return setUsernameError(true);
    if (password.trim().length === 0)
      return setPasswordError(true);
    setUsernameError(false);
    setPasswordError(false);
    setLoading(true);

    const res = await messageChannel.auth({ username, password });
    if (res.isOk) {
      setOpen(false);
      snackbar.enqueueSnackbar('Logged in', {
        variant: 'success'
      });
      setUsername('');
      setPassword('');
    } else {
      setError(res.reason);
    }
    await checkAuth();
    setLoading(false);
  };

  return <Require value={messageChannel}>
    <Dialog open={open}>
      <Dialog open={!!error}>
        <DialogTitle>Error during Authentication</DialogTitle>
        <DialogContentText>
          {error?.name}
          {error?.message}
        </DialogContentText>
        <DialogActions>
          <Button onClick={() => setError(undefined)}>Close</Button>
        </DialogActions>
      </Dialog>
      <DialogTitle sx={{ flexGrow: 1 }}>Authentication</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Here, you need to enter your username (most likely your Email) and your password.<br />
          These information are not stored anywhere and are only used to authenticate with the service once.
        </DialogContentText>
        <TextField
          error={usernameError}
          helperText={usernameError ? 'Please enter something before submiting' : undefined}
          margin="dense"
          id="username"
          label="Username"
          type="text"
          fullWidth
          variant="standard"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
        />
        <TextField
          error={passwordError}
          helperText={passwordError ? 'Please enter something before submiting' : undefined}
          margin="dense"
          id="password"
          label="Password"
          type="password"
          fullWidth
          variant="standard"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
      </DialogContent>
      <DialogActions>
        {loading && <CircularProgress size={30}/>}
        <Button disabled={loading} onClick={() => setOpen(false)}>Close</Button>
        <Button disabled={loading} onClick={() => handleSubmit()}>Authenticate</Button>
      </DialogActions>
    </Dialog>
    <Button startIcon={authed ? <Check />: <Close />} variant="contained" onClick={() => setOpen(true)}>Authenticate</Button>
  </Require>;
};

export default AuthButton;