import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ServiceProvider from './provider/ServiceProvider';
import Style from './Style';
import MessageChannel from './provider/MessageChannel';
import { Box, IconButton } from '@mui/material';
import { CloseOutlined } from '@mui/icons-material';
import { SnackbarProvider, SnackbarKey } from 'notistack';
import Store from './provider/Store';
import ErrorHandler from './provider/ErrorHandler';
import QueueProvider from './provider/QueueProvider';

document.body.style.backgroundColor = 'rgb(0, 30, 60)';
document.body.style.display = 'flex';
document.body.style.justifyContent = 'center';

const notistackRef = React.createRef<SnackbarProvider>();
const onClickDismiss = (key: SnackbarKey | undefined) => () => {
	if (notistackRef.current) notistackRef.current.closeSnackbar(key);
};

const container = document.getElementById('root');
const root = createRoot(container as HTMLElement);
root.render(
	<ErrorHandler>
		<Store>
			<SnackbarProvider
				ref={notistackRef}
				action={(key) => (
					<IconButton onClick={onClickDismiss(key)} color="inherit">
						<CloseOutlined />
					</IconButton>
				)}
			>
				<Style>
					<MessageChannel>
						<ServiceProvider>
							<QueueProvider>
								<Box>
									<App />
								</Box>
							</QueueProvider>
						</ServiceProvider>
					</MessageChannel>
				</Style>
			</SnackbarProvider>
		</Store>
	</ErrorHandler>
);
