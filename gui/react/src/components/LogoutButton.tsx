import { ExitToApp } from '@mui/icons-material';
import { Button } from '@mui/material';
import { useSnackbar } from 'notistack';
import React from 'react';
import useStore from '../hooks/useStore';
import { messageChannelContext } from '../provider/MessageChannel';
import Require from './Require';

const LogoutButton: React.FC = () => {
	const messageChannel = React.useContext(messageChannelContext);
	const [, dispatch] = useStore();
	const { enqueueSnackbar } = useSnackbar();

	const logout = async () => {
		try {
			if (await messageChannel?.isDownloading()) {
				enqueueSnackbar('Finish the current download before switching services.', { variant: 'warning' });
				return;
			}
			if (await messageChannel?.logout()) dispatch({ type: 'service', payload: undefined });
			else enqueueSnackbar('Unable to switch services.', { variant: 'error' });
		} catch (error) {
			enqueueSnackbar(error instanceof Error ? error.message : String(error), { variant: 'error' });
		}
	};

	return (
		<Require value={messageChannel}>
			<Button startIcon={<ExitToApp />} variant="outlined" onClick={() => void logout()}>
				Service select
			</Button>
		</Require>
	);
};

export default LogoutButton;
