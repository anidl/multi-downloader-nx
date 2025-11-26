import React from 'react';
import { Box, Button, Typography, Avatar } from '@mui/material';
import useStore from '../hooks/useStore';
import { StoreState } from './Store';

type Services = 'crunchy' | 'hidive' | 'adn';

export const serviceContext = React.createContext<Services | undefined>(undefined);

const ServiceProvider: FCWithChildren = ({ children }) => {
	const [{ service }, dispatch] = useStore();

	const setService = (s: StoreState['service']) => {
		dispatch({
			type: 'service',
			payload: s
		});
	};

	return service === undefined ? (
		<Box sx={{ justifyContent: 'center', alignItems: 'center', display: 'flex', flexDirection: 'column', position: 'relative', top: '40vh' }}>
			<Typography color="text.primary" variant="h3" sx={{ textAlign: 'center', mb: 5 }}>
				Please select your service
			</Typography>
			<Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
				<Button
					size="large"
					variant="contained"
					onClick={() => setService('crunchy')}
					startIcon={<Avatar src={'https://static.crunchyroll.com/cxweb/assets/img/favicons/favicon-32x32.png'} />}
				>
					Crunchyroll
				</Button>
				<Button
					size="large"
					variant="contained"
					onClick={() => setService('hidive')}
					startIcon={<Avatar src={'https://static.diceplatform.com/prod/original/dce.hidive/settings/HIDIVE_AppLogo_1024x1024.0G0vK.jpg'} />}
				>
					Hidive
				</Button>
				<Button size="large" variant="contained" onClick={() => setService('adn')} startIcon={<Avatar src={'https://animationdigitalnetwork.com/favicon.ico'} />}>
					AnimationDigitalNetwork
				</Button>
			</Box>
		</Box>
	) : (
		<serviceContext.Provider value={service}>{children}</serviceContext.Provider>
	);
};

export default ServiceProvider;
