import React from 'react';
import { Box, Button, Divider, FormControl, InputBase, InputLabel, Link, MenuItem, Select, TextField, Tooltip, Typography } from '@mui/material';
import useStore from '../../../hooks/useStore';
import MultiSelect from '../../reusable/MultiSelect';
import { messageChannelContext } from '../../../provider/MessageChannel';
import LoadingButton from '@mui/lab/LoadingButton';
import { useSnackbar } from 'notistack';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

type DownloadSelectorProps = {
	onFinish?: () => unknown;
};

const DownloadSelector: React.FC<DownloadSelectorProps> = ({ onFinish }) => {
	const messageHandler = React.useContext(messageChannelContext);
	const [store, dispatch] = useStore();
	const [availableDubs, setAvailableDubs] = React.useState<string[]>([]);
	const [availableSubs, setAvailableSubs] = React.useState<string[]>([]);
	const [loading, setLoading] = React.useState(false);
	const { enqueueSnackbar } = useSnackbar();
	const ITEM_HEIGHT = 48;
	const ITEM_PADDING_TOP = 8;

	React.useEffect(() => {
		if (!messageHandler?.serviceReady) return;
		let cancelled = false;
		(async () => {
			try {
				const defaults = await Promise.all([
					messageHandler.handleDefault('dubLang'),
					messageHandler.handleDefault('dlsubs'),
					messageHandler.handleDefault('q'),
					messageHandler.handleDefault('fileName'),
					messageHandler.handleDefault('dlVideoOnce')
				]);
				// Respect browser-persisted choices instead of resetting them on every dialog open.
				if (!cancelled && !localStorage.getItem('anidl.gui.preferences.v1')) {
					dispatch({ type: 'downloadOptions', payload: {
						...store.downloadOptions, dubLang: defaults[0], dlsubs: defaults[1],
						q: defaults[2], fileName: defaults[3], dlVideoOnce: defaults[4]
					} });
				}
				const [dubs, subs] = await Promise.all([
					messageHandler.availableDubCodes(), messageHandler.availableSubCodes()
				]);
				if (!cancelled) {
					setAvailableDubs(dubs);
					setAvailableSubs(subs);
				}
			} catch (error) {
				if (!cancelled) enqueueSnackbar(error instanceof Error ? error.message : String(error), { variant: 'error' });
			}
		})();
		return () => { cancelled = true; };
	}, [messageHandler?.serviceReady, store.service]);

	const addToQueue = async () => {
		if (!messageHandler?.serviceReady) {
			return enqueueSnackbar('The service is still initializing. Please try again.', { variant: 'warning' });
		}
		if (!store.downloadOptions.id.trim()) {
			return enqueueSnackbar('Enter or select a show ID first.', { variant: 'warning' });
		}
		if (!store.downloadOptions.all && !store.downloadOptions.e.trim()) {
			return enqueueSnackbar('Select episodes or enable Download All.', { variant: 'warning' });
		}
		setLoading(true);
		try {
			const added = await messageHandler.resolveItems(store.downloadOptions);
			if (!added) {
				enqueueSnackbar('No episodes were added. Verify the ID, episode selection and authentication.', { variant: 'error' });
				return;
			}
			enqueueSnackbar('Episodes added to the queue successfully.', { variant: 'success' });
			onFinish?.();
		} catch (error) {
			enqueueSnackbar(error instanceof Error ? error.message : String(error), { variant: 'error' });
		} finally {
			setLoading(false);
		}
	};

	const listEpisodes = async () => {
		if (!store.downloadOptions.id.trim()) return enqueueSnackbar('Enter a show ID first.', { variant: 'warning' });
		if (!messageHandler?.serviceReady) return enqueueSnackbar('Service is still initializing.', { variant: 'warning' });
		setLoading(true);
		try {
			const result = await messageHandler.listEpisodes(store.downloadOptions.id);
			if (!result.isOk) {
				enqueueSnackbar(result.reason?.message || 'Could not list episodes for this ID.', { variant: 'error' });
				return;
			}
			if (!result.value.length) {
				enqueueSnackbar('No episodes found for this ID.', { variant: 'info' });
				return;
			}
			dispatch({ type: 'episodeListing', payload: result.value });
		} catch (error) {
			enqueueSnackbar(error instanceof Error ? error.message : String(error), { variant: 'error' });
		} finally {
			setLoading(false);
		}
	};

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
			<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '5px' }}>
				<Box
					sx={{
						width: '100%',
						maxWidth: '50rem',
						minHeight: '21rem',
						flexWrap: 'wrap',
						gap: '1.5rem',
						margin: '10px',
						display: 'flex',
						justifyContent: 'space-between'
						//backgroundColor: '#ffffff30',
					}}
				>
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							gap: '0.7rem'
							//backgroundColor: '#ff000030'
						}}
					>
						<Typography sx={{ fontSize: '1.4rem' }}>General Options</Typography>
						<TextField
							value={store.downloadOptions.id}
							required
							onChange={(e) => {
								dispatch({
									type: 'downloadOptions',
									payload: { ...store.downloadOptions, id: e.target.value }
								});
							}}
							label="Show ID"
						/>
						<TextField
							type="number"
							value={store.downloadOptions.q}
							required
							onChange={(e) => {
								const parsed = parseInt(e.target.value);
								if (isNaN(parsed) || parsed < 0 || parsed > 10) return;
								dispatch({
									type: 'downloadOptions',
									payload: { ...store.downloadOptions, q: parsed }
								});
							}}
							label="Quality Level (0 for max)"
						/>
						<Box sx={{ display: 'flex', gap: '5px' }}>
							<Button
								sx={{ textTransform: 'none' }}
								onClick={() => dispatch({ type: 'downloadOptions', payload: { ...store.downloadOptions, noaudio: !store.downloadOptions.noaudio } })}
								variant={store.downloadOptions.noaudio ? 'contained' : 'outlined'}
							>
								Skip Audio
							</Button>
							<Button
								sx={{ textTransform: 'none' }}
								onClick={() => dispatch({ type: 'downloadOptions', payload: { ...store.downloadOptions, novids: !store.downloadOptions.novids } })}
								variant={store.downloadOptions.novids ? 'contained' : 'outlined'}
							>
								Skip Video
							</Button>
						</Box>
						<Button
							sx={{ textTransform: 'none' }}
							onClick={() => dispatch({ type: 'downloadOptions', payload: { ...store.downloadOptions, dlVideoOnce: !store.downloadOptions.dlVideoOnce } })}
							variant={store.downloadOptions.dlVideoOnce ? 'contained' : 'outlined'}
						>
							Skip Unnecessary
						</Button>
						<Tooltip title={store.service == 'hidive' ? '' : <Typography>Simulcast is only supported on Hidive</Typography>} arrow placement="top">
							<Box>
								<Button
									sx={{ textTransform: 'none' }}
									disabled={store.service != 'hidive'}
									onClick={() => dispatch({ type: 'downloadOptions', payload: { ...store.downloadOptions, simul: !store.downloadOptions.simul } })}
									variant={store.downloadOptions.simul ? 'contained' : 'outlined'}
								>
									Download Simulcast ver.
								</Button>
							</Box>
						</Tooltip>
					</Box>
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							gap: '0.7rem'
							//backgroundColor: '#00000020'
						}}
					>
						<Typography sx={{ fontSize: '1.4rem' }}>Episode Options</Typography>
						<Box
							sx={{
								display: 'flex',
								flexDirection: 'column',
								gap: '1px'
							}}
						>
							<Box
								sx={{
									borderColor: '#595959',
									borderStyle: 'solid',
									borderWidth: '1px',
									borderRadius: '5px',
									//backgroundColor: '#ff4567',
									width: '15rem',
									height: '3.5rem',
									display: 'flex',
									'&:hover': {
										borderColor: '#ffffff'
									}
								}}
							>
								<InputBase
									sx={{
										ml: 2,
										flex: 1
									}}
									disabled={store.downloadOptions.all}
									value={store.downloadOptions.e}
									required
									onChange={(e) => {
										dispatch({
											type: 'downloadOptions',
											payload: { ...store.downloadOptions, e: e.target.value }
										});
									}}
									placeholder="Episode Select"
								/>
								<Divider orientation="vertical" />
								<LoadingButton
									loading={loading}
									disableElevation
									disableFocusRipple
									disableRipple
									disableTouchRipple
									onClick={listEpisodes}
									variant="text"
									sx={{ textTransform: 'none' }}
								>
									<Typography>
										List
										<br />
										Episodes
									</Typography>
								</LoadingButton>
							</Box>
						</Box>
						<Button
							sx={{ textTransform: 'none' }}
							onClick={() => dispatch({ type: 'downloadOptions', payload: { ...store.downloadOptions, all: !store.downloadOptions.all } })}
							variant={store.downloadOptions.all ? 'contained' : 'outlined'}
						>
							Download All
						</Button>
						<Button
							sx={{ textTransform: 'none' }}
							onClick={() => dispatch({ type: 'downloadOptions', payload: { ...store.downloadOptions, but: !store.downloadOptions.but } })}
							variant={store.downloadOptions.but ? 'contained' : 'outlined'}
						>
							Download All but
						</Button>
					</Box>
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							gap: '0.7rem'
							//backgroundColor: '#00ff0020'
						}}
					>
						<Typography sx={{ fontSize: '1.4rem' }}>Language Options</Typography>
						<MultiSelect
							title="Dub Languages"
							values={availableDubs}
							selected={store.downloadOptions.dubLang}
							onChange={(e) => {
								dispatch({
									type: 'downloadOptions',
									payload: { ...store.downloadOptions, dubLang: e }
								});
							}}
							allOption
						/>

						<MultiSelect
							title="Sub Languages"
							values={availableSubs}
							selected={store.downloadOptions.dlsubs}
							onChange={(e) => {
								dispatch({
									type: 'downloadOptions',
									payload: { ...store.downloadOptions, dlsubs: e }
								});
							}}
						/>
						<Tooltip title={store.service == 'crunchy' ? '' : <Typography>Hardsubs are only supported on Crunchyroll</Typography>} arrow placement="top">
							<Box
								sx={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									width: '100%',
									gap: '1rem'
								}}
							>
								<Box
									sx={{
										borderRadius: '5px',
										//backgroundColor: '#ff4567',
										width: '15rem',
										height: '3.5rem',
										display: 'flex'
									}}
								>
									<FormControl fullWidth>
										<InputLabel id="hsLabel">Hardsub Language</InputLabel>
										<Select
											MenuProps={{
												slotProps: {
													paper: {
														style: {
															maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
															width: 250
														}
													}
												}
											}}
											labelId="hsLabel"
											label="Hardsub Language"
											disabled={store.service != 'crunchy'}
											value={store.downloadOptions.hslang}
											onChange={(e) => {
												dispatch({
													type: 'downloadOptions',
													payload: { ...store.downloadOptions, hslang: (e.target.value as string) === '' ? undefined : (e.target.value as string) }
												});
											}}
										>
											<MenuItem value="">No Hardsub</MenuItem>
											{availableSubs.map((lang) => {
												if (lang === 'all' || lang === 'none') return undefined;
												return <MenuItem key={lang} value={lang}>{lang}</MenuItem>;
											})}
										</Select>
									</FormControl>
								</Box>

								<Tooltip
									title={
										<Typography>
											Downloads the hardsub version of the selected subtitle.
											<br />
											Subtitles are displayed <b>PERMANENTLY!</b>
											<br />
											You can choose only <b>1</b> subtitle per video!
										</Typography>
									}
									arrow
									placement="top"
								>
									<InfoOutlinedIcon
										sx={{
											transition: '100ms',
											ml: '0.35rem',
											mr: '0.65rem',
											'&:hover': {
												color: '#ffffff30'
											}
										}}
									/>
								</Tooltip>
							</Box>
						</Tooltip>
					</Box>
				</Box>
				<Box sx={{ width: '95%', height: '0.3rem', backgroundColor: '#ffffff50', borderRadius: '10px', marginBottom: '20px' }} />
				<Box
					sx={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						width: '100%',
						gap: '15px'
					}}
				>
					<TextField
						value={store.downloadOptions.fileName}
						onChange={(e) => {
							dispatch({
								type: 'downloadOptions',
								payload: { ...store.downloadOptions, fileName: e.target.value }
							});
						}}
						sx={{ width: '87%' }}
						label="Filename Overwrite"
					/>
					<Tooltip title={<Typography>Click here to see the documentation</Typography>} arrow placement="top">
						<Link href="https://github.com/anidl/multi-downloader-nx/blob/master/docs/DOCUMENTATION.md#filename-template" rel="noopener noreferrer" target="_blank">
							<InfoOutlinedIcon
								sx={{
									transition: '100ms',
									'&:hover': {
										color: '#ffffff30'
									}
								}}
							/>
						</Link>
					</Tooltip>
				</Box>
			</Box>
			<Box sx={{ width: '95%', height: '0.3rem', backgroundColor: '#ffffff50', borderRadius: '10px', marginTop: '10px' }} />

			<LoadingButton sx={{ margin: '15px', textTransform: 'none' }} disabled={!messageHandler?.serviceReady} loading={loading} onClick={() => void addToQueue()} variant="contained">
				Add to Queue
			</LoadingButton>
		</Box>
	);
};

export default DownloadSelector;
