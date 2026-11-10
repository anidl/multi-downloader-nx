import React from 'react';
import { Box, Button, Chip, Divider, Drawer, IconButton, Paper, Stack, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material';
import {
	ArrowForwardRounded,
	DashboardRounded,
	DarkModeOutlined,
	LightModeOutlined,
	MenuRounded,
	SettingsOutlined,
	FolderOutlined,
	DeleteOutlineRounded,
	DownloadRounded,
	LayersOutlined,
	CheckCircleOutlineRounded
} from '@mui/icons-material';
import AuthButton from './components/AuthButton';
import AddToQueue from './components/AddToQueue/AddToQueue';
import StartQueueButton from './components/StartQueue';
import MainFrame from './components/MainFrame/MainFrame';
import useStore from './hooks/useStore';
import { ServiceName } from './provider/Store';
import { colorModeContext } from './Style';
import { messageChannelContext } from './provider/MessageChannel';
import { queueContext } from './provider/QueueProvider';
import { ServiceOverview } from '../../../@types/ws';
import { useSnackbar } from 'notistack';

const services: { id: ServiceName; title: string; subtitle: string; mark: string }[] = [
	{ id: 'crunchy', title: 'Crunchyroll', subtitle: 'Anime & simulcasts', mark: 'CR' },
	{ id: 'hidive', title: 'HIDIVE', subtitle: 'Series & episodes', mark: 'HD' },
	{ id: 'adn', title: 'Animation Digital Network', subtitle: 'ADN catalog', mark: 'AD' }
];
const empty = (): Record<ServiceName, ServiceOverview> => ({
	crunchy: { queue: [], downloading: false, autoStart: false },
	hidive: { queue: [], downloading: false, autoStart: false },
	adn: { queue: [], downloading: false, autoStart: false }
});

const Layout: React.FC = () => {
	const [store, dispatch] = useStore();
	const msg = React.useContext(messageChannelContext);
	const queue = React.useContext(queueContext);
	const { mode, toggle } = React.useContext(colorModeContext);
	const { enqueueSnackbar } = useSnackbar();
	const theme = useTheme();
	const narrow = useMediaQuery(theme.breakpoints.down('md'));
	const [mobileOpen, setMobileOpen] = React.useState(false);
	const [version, setVersion] = React.useState('5.8.8');
	React.useEffect(() => {
		void msg
			?.version()
			.then(setVersion)
			.catch(() => undefined);
	}, [msg]);
	const [page, setPage] = React.useState<'overview' | 'provider'>(() => (store.service ? 'provider' : 'overview'));
	const [overview, setOverview] = React.useState<Record<ServiceName, ServiceOverview>>(empty);

	const refresh = React.useCallback(() => {
		if (!msg) return;
		void msg
			.getOverview()
			.then(setOverview)
			.catch(() => undefined);
	}, [msg]);
	React.useEffect(() => {
		refresh();
		const refreshOnEvent = (event: { service?: ServiceName; data?: unknown }) => {
			if (event.service) refresh();
		};
		const onError = (event: { service?: ServiceName; data: string }) => {
			enqueueSnackbar(`${services.find((s) => s.id === event.service)?.title || 'Download'}: ${event.data}`, { variant: 'error' });
		};
		msg?.randomEvents.on('queueChange', refreshOnEvent);
		msg?.randomEvents.on('current', refreshOnEvent);
		msg?.randomEvents.on('finish', refreshOnEvent);
		msg?.randomEvents.on('queueError', onError);
		const timer = window.setInterval(refresh, 6000);
		return () => {
			window.clearInterval(timer);
			msg?.randomEvents.removeListener('queueChange', refreshOnEvent);
			msg?.randomEvents.removeListener('current', refreshOnEvent);
			msg?.randomEvents.removeListener('finish', refreshOnEvent);
			msg?.randomEvents.removeListener('queueError', onError);
		};
	}, [msg, refresh, enqueueSnackbar]);

	const navigate = (service?: ServiceName) => {
		if (service) {
			dispatch({ type: 'service', payload: service });
			setPage('provider');
		} else setPage('overview');
		setMobileOpen(false);
	};
	const active = services.find((s) => s.id === store.service);
	const totalPending = services.reduce((sum, s) => sum + overview[s.id].queue.length, 0);
	const activeCount = services.filter((s) => overview[s.id].downloading).length;
	const clear = async () => {
		if (!queue.length || !window.confirm(`Remove ${queue.length} queued item(s) from ${active?.title}?`)) return;
		try {
			await msg?.clearQueue();
			enqueueSnackbar('Pending queue cleared', { variant: 'success' });
			refresh();
		} catch (error) {
			enqueueSnackbar(error instanceof Error ? error.message : String(error), { variant: 'error' });
		}
	};

	const menu = (
		<Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2.25, bgcolor: 'background.paper', borderRight: '1px solid', borderColor: 'divider' }}>
			<Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 1, py: 2.5, mb: 3 }}>
				<Box sx={{ height: 38, width: 38, borderRadius: 2.5, bgcolor: 'primary.main', color: 'primary.contrastText', display: 'grid', placeItems: 'center' }}>
					<DownloadRounded />
				</Box>
				<Box>
					<Typography variant="subtitle1" fontWeight={850} lineHeight={1.15}>
						Multi Downloader
					</Typography>
					<Typography variant="caption" color="text.secondary">
						NX · v{version}
					</Typography>
				</Box>
			</Stack>
			<Typography variant="overline" color="text.secondary" sx={{ px: 1.5, letterSpacing: '.13em', mb: 1 }}>
				Workspace
			</Typography>
			<Button
				startIcon={<DashboardRounded />}
				onClick={() => navigate()}
				fullWidth
				sx={{ justifyContent: 'flex-start', mb: 2, py: 1.4, bgcolor: page === 'overview' ? 'action.selected' : undefined, color: 'text.primary' }}
			>
				Overview
			</Button>
			<Typography variant="overline" color="text.secondary" sx={{ px: 1.5, letterSpacing: '.13em', mb: 1 }}>
				Platforms
			</Typography>
			<Stack spacing={0.75}>
				{services.map((s) => (
					<Button
						key={s.id}
						fullWidth
						onClick={() => navigate(s.id)}
						sx={{
							justifyContent: 'flex-start',
							textAlign: 'left',
							px: 1.25,
							py: 1.25,
							bgcolor: page === 'provider' && store.service === s.id ? 'action.selected' : undefined,
							color: 'text.primary',
							border: '1px solid',
							borderColor: page === 'provider' && store.service === s.id ? 'divider' : 'transparent'
						}}
					>
						<Box
							sx={{
								width: 33,
								height: 33,
								border: '1px solid',
								borderColor: 'divider',
								borderRadius: 2,
								display: 'grid',
								placeItems: 'center',
								fontWeight: 800,
								fontSize: 11,
								mr: 1.25,
								flexShrink: 0
							}}
						>
							{s.mark}
						</Box>
						<Box sx={{ flex: 1, minWidth: 0 }}>
							<Typography variant="body2" sx={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
								{s.title}
							</Typography>
							<Typography variant="caption" color="text.secondary">
								{overview[s.id].downloading ? 'Downloading' : `${overview[s.id].queue.length} queued`}
							</Typography>
						</Box>
						{overview[s.id].downloading && <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'success.main' }} />}
					</Button>
				))}
			</Stack>
			<Box sx={{ mt: 'auto', pt: 4 }}>
				<Divider sx={{ mb: 2 }} />
				<Button
					fullWidth
					color="inherit"
					startIcon={mode === 'dark' ? <LightModeOutlined /> : <DarkModeOutlined />}
					onClick={toggle}
					sx={{ justifyContent: 'flex-start', mb: 0.5 }}
				>
					{mode === 'dark' ? 'Light appearance' : 'Dark appearance'}
				</Button>
				<Button
					fullWidth
					color="inherit"
					startIcon={<SettingsOutlined />}
					disabled={!msg?.serviceReady}
					onClick={() => void msg?.openFolder('config')}
					sx={{ justifyContent: 'flex-start' }}
				>
					Settings folder
				</Button>
			</Box>
		</Box>
	);

	return (
		<Box sx={{ minHeight: '100vh', display: 'flex' }}>
			{narrow ? (
				<Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} PaperProps={{ sx: { width: 278 } }}>
					{menu}
				</Drawer>
			) : (
				<Box component="nav" sx={{ width: 272, flexShrink: 0 }}>
					{<Box sx={{ position: 'sticky', top: 0, height: '100vh' }}>{menu}</Box>}
				</Box>
			)}
			<Box component="main" sx={{ flex: 1, minWidth: 0, p: { xs: 2, md: 4, lg: 5 }, maxWidth: 1680, mx: 'auto' }}>
				<Stack direction="row" alignItems="center" spacing={2} sx={{ mb: { xs: 3, md: 4 } }}>
					{narrow && (
						<IconButton aria-label="Open navigation" onClick={() => setMobileOpen(true)}>
							<MenuRounded />
						</IconButton>
					)}
					<Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
						Workspace / {page === 'overview' ? 'Overview' : active?.title || 'Platform'}
					</Typography>
					<Chip size="small" variant="outlined" label={`${activeCount} active · ${totalPending} pending`} />
					<Tooltip title="Switch appearance">
						<IconButton aria-label="Toggle light or dark appearance" onClick={toggle}>
							{mode === 'dark' ? <LightModeOutlined /> : <DarkModeOutlined />}
						</IconButton>
					</Tooltip>
				</Stack>
				{page === 'overview' ? (
					<Box>
						<Typography variant="h4">{store.service ? 'Overview' : 'Welcome to Multi Downloader'}</Typography>
						<Typography sx={{ mt: 1, mb: 4, maxWidth: 690 }} color="text.secondary">
							{store.service
								? 'Monitor all your providers in one place. Each platform has its own queue and can download independently.'
								: 'Choose a platform to get started. You can connect more platforms and run their download queues at the same time.'}
						</Typography>
						<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
							{[
								{ label: 'In progress', value: activeCount, icon: <DownloadRounded /> },
								{ label: 'Pending episodes', value: totalPending, icon: <LayersOutlined /> },
								{ label: 'Supported platforms', value: services.length, icon: <CheckCircleOutlineRounded /> }
							].map((kpi) => (
								<Paper key={kpi.label} variant="outlined" sx={{ flex: 1, p: 2.5 }}>
									<Stack direction="row" justifyContent="space-between" alignItems="center">
										<Typography color="text.secondary" variant="body2">
											{kpi.label}
										</Typography>
										{kpi.icon}
									</Stack>
									<Typography variant="h4" sx={{ mt: 1.5 }}>
										{kpi.value}
									</Typography>
								</Paper>
							))}
						</Stack>
						<Typography variant="h6" sx={{ mb: 2 }}>
							Your platforms
						</Typography>
						<Stack spacing={1.5}>
							{services.map((s) => (
								<Paper key={s.id} variant="outlined" sx={{ p: 2.5 }}>
									<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
										<Box
											sx={{
												height: 44,
												width: 44,
												borderRadius: 2,
												border: '1px solid',
												borderColor: 'divider',
												display: 'grid',
												placeItems: 'center',
												fontWeight: 800
											}}
										>
											{s.mark}
										</Box>
										<Box sx={{ flex: 1 }}>
											<Typography fontWeight={800}>{s.title}</Typography>
											<Typography color="text.secondary" variant="body2">
												{overview[s.id].downloading
													? `Downloading: ${overview[s.id].current?.title ?? 'Preparing episode'}`
													: `${overview[s.id].queue.length} episodes pending · ${s.subtitle}`}
											</Typography>
										</Box>
										<Button variant="outlined" endIcon={<ArrowForwardRounded />} onClick={() => navigate(s.id)}>
											Manage
										</Button>
									</Stack>
								</Paper>
							))}
						</Stack>
					</Box>
				) : active ? (
					<Box>
						<Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'flex-end' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
							<Box>
								<Typography variant="h4">{active.title}</Typography>
								<Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
									Manage your account, episodes, and downloads.
								</Typography>
							</Box>
							<Chip variant="outlined" label={overview[active.id].downloading ? 'Downloading' : msg?.serviceReady ? 'Ready' : 'Connecting…'} />
						</Stack>
						<Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, mb: 3 }}>
							<Stack direction="row" flexWrap="wrap" useFlexGap spacing={1.25} alignItems="center">
								<AuthButton />
								<AddToQueue />
								<StartQueueButton />
								<Button variant="outlined" startIcon={<FolderOutlined />} disabled={!msg?.serviceReady} onClick={() => void msg?.openFolder('content')}>
									Files
								</Button>
								<Button
									variant="text"
									color="inherit"
									disabled={!msg?.serviceReady || !queue.length}
									startIcon={<DeleteOutlineRounded />}
									onClick={() => void clear()}
								>
									Clear pending
								</Button>
							</Stack>
						</Paper>
						<MainFrame />
					</Box>
				) : null}
			</Box>
		</Box>
	);
};
export default Layout;
