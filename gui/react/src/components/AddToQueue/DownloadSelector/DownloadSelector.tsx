import React from 'react';
import { Alert, Box, Button, Checkbox, Collapse, Divider, FormControl, FormControlLabel, Grid, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import { AddRounded, ExpandMoreRounded, ExpandLessRounded, ListRounded } from '@mui/icons-material';
import LoadingButton from '@mui/lab/LoadingButton';
import useStore from '../../../hooks/useStore';
import { messageChannelContext } from '../../../provider/MessageChannel';
import { useSnackbar } from 'notistack';

type DownloadSelectorProps = { onFinish?: () => unknown };

const DownloadSelector: React.FC<DownloadSelectorProps> = ({ onFinish }) => {
	const msg = React.useContext(messageChannelContext);
	const [store, dispatch] = useStore();
	const options = store.downloadOptions;
	const [availableDubs, setAvailableDubs] = React.useState<string[]>([]);
	const [availableSubs, setAvailableSubs] = React.useState<string[]>([]);
	const [busy, setBusy] = React.useState(false);
	const [advanced, setAdvanced] = React.useState(false);
	const [inlineError, setInlineError] = React.useState<string>();
	const { enqueueSnackbar } = useSnackbar();

	const update = (data: Partial<typeof options>) =>
		dispatch({
			type: 'downloadOptions',
			payload: { ...options, ...data }
		});
	const storeRef = React.useRef(store);
	storeRef.current = store;
	React.useEffect(() => {
		if (!msg?.serviceReady) return;
		let active = true;
		const service = msg.service;
		void Promise.all([
			msg.availableDubCodes(),
			msg.availableSubCodes(),
			msg.handleDefault('dubLang'),
			msg.handleDefault('dlsubs'),
			msg.handleDefault('q'),
			msg.handleDefault('fileName'),
			msg.handleDefault('dlVideoOnce')
		])
			.then(([dubs, subs, defaultDub, defaultSub, quality, fileName, videoOnce]) => {
				if (!active) return;
				setAvailableDubs(dubs);
				setAvailableSubs(subs);
				if (service && !storeRef.current.optionsByService[service]) {
					const previous = storeRef.current.downloadOptions;
					const dubLang = Array.isArray(defaultDub) ? defaultDub.filter((code: string) => dubs.includes(code)) : [];
					dispatch({
						type: 'downloadOptions',
						payload: {
							...previous,
							dubLang: dubLang.length ? dubLang : [dubs[0] || 'jpn'],
							dlsubs: Array.isArray(defaultSub) ? defaultSub : ['all'],
							q: Number.isInteger(quality) && quality >= 0 && quality <= 10 ? quality : 0,
							fileName: typeof fileName === 'string' ? fileName : '',
							dlVideoOnce: !!videoOnce
						}
					});
				}
			})
			.catch((error) => {
				if (active) enqueueSnackbar(error instanceof Error ? error.message : String(error), { variant: 'error' });
			});
		return () => {
			active = false;
		};
	}, [msg?.service, msg?.serviceReady]);

	const add = async () => {
		setInlineError(undefined);
		if (!msg?.serviceReady) return setInlineError('The platform is still initializing.');
		if (!options.id.trim()) return setInlineError('Choose a show from Search or enter its ID.');
		if (!options.all && !options.e.trim()) return setInlineError('Enter episodes or turn on Download all.');
		if (!options.dubLang.length) return setInlineError('Select at least one audio language.');
		setBusy(true);
		try {
			const result = await msg.resolveDetailed(options);
			if (!result.ok) return setInlineError(result.message || 'No episodes matched the selection.');
			enqueueSnackbar(`${result.added} episode${result.added === 1 ? '' : 's'} added to ${store.service} queue.`, { variant: 'success' });
			onFinish?.();
		} catch (error) {
			setInlineError(error instanceof Error ? error.message : String(error));
		} finally {
			setBusy(false);
		}
	};

	const listEpisodes = async () => {
		if (!options.id.trim()) return setInlineError('Enter a show ID before listing episodes.');
		if (!msg?.serviceReady) return;
		setBusy(true);
		setInlineError(undefined);
		try {
			const res = await msg.listEpisodes(options.id.trim());
			if (!res.isOk) throw new Error(res.reason.message || 'Unable to load episodes');
			if (!res.value.length) return setInlineError('No episodes are available for this series.');
			dispatch({ type: 'episodeListing', payload: res.value });
		} catch (error) {
			setInlineError(error instanceof Error ? error.message : String(error));
		} finally {
			setBusy(false);
		}
	};
	return (
		<Box>
			<Typography variant="overline" color="text.secondary">
				Episode selection
			</Typography>
			<Grid container spacing={2} sx={{ mt: 0.2 }}>
				<Grid size={{ xs: 12, sm: 6 }}>
					<TextField
						label="Show ID"
						size="small"
						fullWidth
						value={options.id}
						onChange={(event) => update({ id: event.target.value.trim() })}
						helperText="Choose a search result or paste an ID."
					/>
				</Grid>
				<Grid size={{ xs: 12, sm: 6 }}>
					<Stack spacing={1}>
						<Stack direction="row" spacing={1}>
							<TextField
								label="Episodes (e.g. 1,3-5)"
								size="small"
								fullWidth
								disabled={options.all}
								value={options.e}
								onChange={(event) => update({ e: event.target.value })}
							/>
							<Button
								variant="outlined"
								disabled={busy || !options.id || !msg?.serviceReady}
								onClick={() => void listEpisodes()}
								startIcon={<ListRounded />}
								sx={{ flexShrink: 0 }}
							>
								Browse
							</Button>
						</Stack>
						<FormControlLabel
							control={<Checkbox size="small" checked={options.all} onChange={(_, checked) => update({ all: checked, but: false })} />}
							label={<Typography variant="body2">Download all episodes</Typography>}
						/>
					</Stack>
				</Grid>
			</Grid>
			<Divider sx={{ my: 2.5 }} />
			<Typography variant="overline" color="text.secondary">
				Download preferences
			</Typography>
			<Grid container spacing={2} sx={{ mt: 0.3 }}>
				<Grid size={{ xs: 12, sm: 6 }}>
					<FormControl fullWidth size="small">
						<InputLabel id="audio-label">Audio languages</InputLabel>
						<Select
							multiple
							labelId="audio-label"
							label="Audio languages"
							value={options.dubLang}
							onChange={(event) => update({ dubLang: typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value })}
							renderValue={(items) => items.join(', ')}
						>
							{availableDubs.map((code) => (
								<MenuItem key={code} value={code}>
									<Checkbox checked={options.dubLang.includes(code)} size="small" />
									{code}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				</Grid>
				<Grid size={{ xs: 12, sm: 6 }}>
					<FormControl fullWidth size="small">
						<InputLabel id="sub-label">Subtitle languages</InputLabel>
						<Select
							labelId="sub-label"
							label="Subtitle languages"
							multiple
							value={options.dlsubs}
							onChange={(event) => update({ dlsubs: typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value })}
							renderValue={(items) => items.join(', ')}
						>
							{availableSubs.map((code) => (
								<MenuItem key={code} value={code}>
									<Checkbox checked={options.dlsubs.includes(code)} size="small" />
									{code}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				</Grid>
				<Grid size={{ xs: 12, sm: 6 }}>
					<TextField
						label="Quality (0 = best)"
						size="small"
						fullWidth
						type="number"
						value={options.q}
						inputProps={{ min: 0, max: 10 }}
						onChange={(event) => {
							const num = Number(event.target.value);
							if (Number.isInteger(num) && num >= 0 && num <= 10) update({ q: num });
						}}
					/>
				</Grid>
				<Grid size={{ xs: 12, sm: 6 }}>
					<TextField
						label="Filename override (optional)"
						size="small"
						fullWidth
						value={options.fileName}
						onChange={(event) => update({ fileName: event.target.value })}
					/>
				</Grid>
			</Grid>
			<Button
				size="small"
				variant="text"
				color="inherit"
				sx={{ mt: 2 }}
				endIcon={advanced ? <ExpandLessRounded /> : <ExpandMoreRounded />}
				onClick={() => setAdvanced(!advanced)}
			>
				Advanced options
			</Button>
			<Collapse in={advanced}>
				<Stack spacing={0.3} sx={{ py: 1, px: 1 }}>
					<FormControlLabel
						control={<Checkbox size="small" checked={options.but} onChange={(_, checked) => update({ but: checked, all: false })} />}
						label="Download all except selected episodes"
					/>
					<FormControlLabel
						control={<Checkbox size="small" checked={options.noaudio} onChange={(_, checked) => update({ noaudio: checked })} />}
						label="Skip audio download"
					/>
					<FormControlLabel
						control={<Checkbox size="small" checked={options.novids} onChange={(_, checked) => update({ novids: checked })} />}
						label="Skip video download"
					/>
					<FormControlLabel
						control={<Checkbox size="small" checked={options.dlVideoOnce} onChange={(_, checked) => update({ dlVideoOnce: checked })} />}
						label="Reuse downloaded video tracks"
					/>
					<FormControl size="small" sx={{ maxWidth: 320, mt: 1 }}>
						<InputLabel id="hardsub-label">Hardsub language</InputLabel>
						<Select labelId="hardsub-label" label="Hardsub language" value={options.hslang || 'none'} onChange={(event) => update({ hslang: event.target.value })}>
							<MenuItem value="none">No hardsubs</MenuItem>
							{availableSubs
								.filter((code) => !['all', 'none'].includes(code))
								.map((code) => (
									<MenuItem key={code} value={code}>
										{code}
									</MenuItem>
								))}
						</Select>
					</FormControl>
					{store.service === 'hidive' && (
						<FormControlLabel
							control={<Checkbox size="small" checked={options.simul} onChange={(_, checked) => update({ simul: checked })} />}
							label="Simulcast version"
						/>
					)}
				</Stack>
			</Collapse>
			{inlineError && (
				<Alert severity="error" sx={{ mt: 2 }} onClose={() => setInlineError(undefined)}>
					{inlineError}
				</Alert>
			)}
			<Divider sx={{ my: 2.5 }} />
			<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
				<Typography variant="caption" color="text.secondary">
					Preferences are saved separately for each platform.
				</Typography>
				<LoadingButton
					variant="contained"
					size="large"
					loading={busy}
					disabled={!msg?.serviceReady}
					startIcon={<AddRounded />}
					onClick={() => void add()}
					sx={{ minWidth: 155 }}
				>
					Add to queue
				</LoadingButton>
			</Stack>
		</Box>
	);
};
export default DownloadSelector;
