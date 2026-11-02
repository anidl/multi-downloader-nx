import React from 'react';
import {
	Box,
	Button,
	Checkbox,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	FormControlLabel,
	InputLabel,
	MenuItem,
	Select,
	Stack,
	Typography
} from '@mui/material';
import useStore from '../../../../hooks/useStore';

function splitEpisodes(input: string): string[] {
	const values: string[] = [];
	for (const entry of input
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean)) {
		const match = /^(\d+)-(\d+)$/.exec(entry);
		if (match) {
			const from = Number(match[1]);
			const to = Number(match[2]);
			if (to >= from && to - from < 1000) {
				for (let episode = from; episode <= to; episode++) values.push(String(episode));
				continue;
			}
		}
		values.push(entry);
	}
	return [...new Set(values)];
}

const EpisodeListing: React.FC = () => {
	const [store, dispatch] = useStore();
	const episodes = store.episodeListing;
	const [season, setSeason] = React.useState('all');
	const [selected, setSelected] = React.useState<string[]>([]);
	React.useEffect(() => {
		if (episodes.length) {
			setSelected(splitEpisodes(store.downloadOptions.e));
			setSeason('all');
		}
	}, [episodes]);
	const seasons = React.useMemo(() => [...new Set(episodes.map((e) => e.season))], [episodes]);
	const shown = React.useMemo(() => episodes.filter((e) => season === 'all' || e.season === season), [episodes, season]);
	const allShown = shown.length > 0 && shown.every((item) => selected.includes(item.e));
	const toggle = (value: string) => setSelected((old) => (old.includes(value) ? old.filter((item) => item !== value) : [...old, value]));
	const close = (apply: boolean) => {
		if (apply)
			dispatch({
				type: 'downloadOptions',
				payload: { ...store.downloadOptions, e: selected.join(','), all: false, but: false }
			});
		dispatch({ type: 'episodeListing', payload: [] });
	};
	return (
		<Dialog open={episodes.length > 0} onClose={() => close(false)} fullWidth maxWidth="md" scroll="paper">
			<DialogTitle>
				<Typography variant="h5">Choose episodes</Typography>
				<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
					Select the episodes to add to the current platform queue.
				</Typography>
			</DialogTitle>
			<DialogContent dividers>
				<Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={1.5} sx={{ mb: 2 }}>
					<FormControl size="small" sx={{ minWidth: 180 }}>
						<InputLabel id="season-choice">Season</InputLabel>
						<Select label="Season" labelId="season-choice" value={season} onChange={(event) => setSeason(event.target.value)}>
							<MenuItem value="all">All seasons</MenuItem>
							{seasons.map((item) => (
								<MenuItem key={item} value={item}>
									{item}
								</MenuItem>
							))}
						</Select>
					</FormControl>
					<FormControlLabel
						label="Select all visible"
						control={
							<Checkbox
								checked={allShown}
								indeterminate={!allShown && shown.some((item) => selected.includes(item.e))}
								onChange={(_, checked) =>
									setSelected((old) => (checked ? [...new Set([...old, ...shown.map((e) => e.e)])] : old.filter((e) => !shown.some((item) => item.e === e))))
								}
							/>
						}
					/>
				</Stack>
				<Stack spacing={1}>
					{shown.map((item, index) => (
						<Box
							key={`${item.id}-${item.e}-${index}`}
							onClick={() => toggle(item.e)}
							sx={{
								display: 'flex',
								alignItems: 'center',
								gap: 2,
								py: 1.25,
								px: 1,
								borderRadius: 2,
								cursor: 'pointer',
								'&:hover': { bgcolor: 'action.hover' },
								border: '1px solid',
								borderColor: 'divider'
							}}
						>
							<Checkbox checked={selected.includes(item.e)} tabIndex={-1} />
							{item.img && <Box component="img" src={item.img} alt="" sx={{ width: 76, height: 54, objectFit: 'cover', borderRadius: 1, flexShrink: 0 }} />}
							<Box sx={{ flex: 1, minWidth: 0 }}>
								<Typography variant="body2" fontWeight={750}>
									S{item.season} · E{item.episode || item.e} — {item.name}
								</Typography>
								<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.4 }} noWrap>
									{item.description}
								</Typography>
								<Typography variant="caption" color="text.secondary">
									{item.lang.join(', ')}
								</Typography>
							</Box>
						</Box>
					))}
				</Stack>
			</DialogContent>
			<DialogActions sx={{ px: 3, py: 2 }}>
				<Typography variant="caption" color="text.secondary" sx={{ mr: 'auto' }}>
					{selected.length} selected
				</Typography>
				<Button color="inherit" onClick={() => close(false)}>
					Cancel
				</Button>
				<Button variant="contained" disabled={!selected.length} onClick={() => close(true)}>
					Use selection
				</Button>
			</DialogActions>
		</Dialog>
	);
};
export default EpisodeListing;
