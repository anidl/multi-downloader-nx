import React from 'react';
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import { CheckCircleOutlineRounded, LockOutlined } from '@mui/icons-material';
import { messageChannelContext } from '../provider/MessageChannel';
import { useSnackbar } from 'notistack';

const AuthButton: React.FC = () => {
	const msg = React.useContext(messageChannelContext);
	const { enqueueSnackbar } = useSnackbar();
	const [open, setOpen] = React.useState(false);
	const [username, setUsername] = React.useState('');
	const [password, setPassword] = React.useState('');
	const [pending, setPending] = React.useState(false);
	const [checking, setChecking] = React.useState(false);
	const [authed, setAuthed] = React.useState(false);
	const [error, setError] = React.useState<string>();
	React.useEffect(() => {
		setAuthed(false);
		if (!msg?.serviceReady) return;
		let active = true;
		setChecking(true);
		void msg
			.checkToken()
			.then((res) => {
				if (active) setAuthed(res.isOk);
			})
			.catch(() => {
				if (active) setAuthed(false);
			})
			.finally(() => {
				if (active) setChecking(false);
			});
		return () => {
			active = false;
		};
	}, [msg?.service, msg?.serviceReady]);

	const submit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!msg?.serviceReady || !username.trim() || !password) return;
		setError(undefined);
		setPending(true);
		try {
			const response = await msg.auth({ username: username.trim(), password });
			if (!response.isOk) throw new Error(response.reason?.message || 'Authentication failed');
			setAuthed(true);
			setOpen(false);
			setUsername('');
			setPassword('');
			enqueueSnackbar('Signed in. Your account and catalog are ready.', { variant: 'success' });
		} catch (cause) {
			setAuthed(false);
			setError(cause instanceof Error ? cause.message : String(cause));
		} finally {
			setPending(false);
		}
	};
	return (
		<>
			<Dialog open={open} onClose={() => !pending && setOpen(false)} fullWidth maxWidth="xs">
				<Box component="form" onSubmit={(event) => void submit(event)}>
					<DialogTitle sx={{ pt: 3, pb: 0 }}>
						<Typography variant="h5">Connect your account</Typography>
					</DialogTitle>
					<DialogContent sx={{ pt: '20px !important' }}>
						<Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
							Sign in to {msg?.service || 'this platform'} before adding protected episodes. Your credentials are not saved in browser preferences.
						</Typography>
						<Stack spacing={2}>
							<TextField
								size="small"
								label="Email or username"
								autoComplete="username"
								fullWidth
								required
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								disabled={pending}
							/>
							<TextField
								size="small"
								label="Password"
								type="password"
								autoComplete="current-password"
								fullWidth
								required
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								disabled={pending}
							/>
							{error && <Alert severity="error">{error}</Alert>}
						</Stack>
					</DialogContent>
					<DialogActions sx={{ px: 3, pb: 3 }}>
						<Button variant="text" color="inherit" disabled={pending} onClick={() => setOpen(false)}>
							Cancel
						</Button>
						<Button type="submit" variant="contained" disabled={pending} startIcon={pending ? <CircularProgress size={16} /> : <LockOutlined />}>
							Sign in
						</Button>
					</DialogActions>
				</Box>
			</Dialog>
			<Button
				variant="outlined"
				disabled={!msg?.serviceReady || checking}
				startIcon={authed ? <CheckCircleOutlineRounded /> : <LockOutlined />}
				onClick={() => {
					setError(undefined);
					setOpen(true);
				}}
			>
				{checking ? 'Checking account…' : authed ? 'Connected account' : 'Connect account'}
			</Button>
		</>
	);
};
export default AuthButton;
