import { Box, List, ListItem, Typography, Divider, Dialog, Select, MenuItem, FormControl, InputLabel, Checkbox } from '@mui/material';
import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';
import React, { RefObject } from 'react';
import useStore from '../../../../hooks/useStore';
import ContextMenu from '../../../reusable/ContextMenu';
import { useSnackbar } from 'notistack';

const EpisodeListing: React.FC = () => {
	const [store, dispatch] = useStore();

	const [season, setSeason] = React.useState<'all' | string>('all');
	const { enqueueSnackbar } = useSnackbar();

	const seasons = React.useMemo(() => {
		const s: string[] = [];
		for (const { season } of store.episodeListing) {
			if (s.includes(season)) continue;
			s.push(season);
		}
		return s;
	}, [store.episodeListing]);

	const [selected, setSelected] = React.useState<string[]>([]);

	React.useEffect(() => {
		setSelected(parseSelect(store.downloadOptions.e));
	}, [store.episodeListing]);

	const close = () => {
		const mergedEpisodes = [...parseEpisodes(store.downloadOptions.e), ...selected];
		dispatch({
			type: 'downloadOptions',
			payload: {
				...store.downloadOptions,
				e: serializeEpisodes(mergedEpisodes)
			}
		});
		dispatch({ type: 'episodeListing', payload: [] });
	};

	const getEpisodesForSeason = (season: string | 'all') => {
		return store.episodeListing.filter((a) => (season === 'all' ? true : a.season === season));
	};

	return (
		<Dialog open={store.episodeListing.length > 0} onClose={close} scroll="paper" maxWidth="xl" sx={{ p: 2 }}>
			<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 200px 20px' }}>
				<Typography color="text.primary" variant="h5" sx={{ textAlign: 'center', alignItems: 'center', justifyContent: 'center', display: 'flex' }}>
					Episodes
				</Typography>
				<FormControl sx={{ mr: 2, mt: 2 }}>
					<InputLabel id="seasonSelectLabel">Season</InputLabel>
					<Select labelId="seasonSelectLabel" label="Season" value={season} onChange={(e) => setSeason(e.target.value)}>
						<MenuItem value="all">Show all Epsiodes</MenuItem>
						{seasons.map((a, index) => {
							return (
								<MenuItem value={a} key={`MenuItem_SeasonSelect_${index}`}>
									{a}
								</MenuItem>
							);
						})}
					</Select>
				</FormControl>
			</Box>
			<List>
				<ListItem sx={{ display: 'grid', gridTemplateColumns: '25px 1fr 5fr' }}>
					<Checkbox
						indeterminate={store.episodeListing.some((a) => selected.includes(a.e)) && !store.episodeListing.every((a) => selected.includes(a.e))}
						checked={store.episodeListing.every((a) => selected.includes(a.e))}
						onChange={() => {
							if (selected.length > 0) {
								setSelected([]);
							} else {
								setSelected(getEpisodesForSeason(season).map((a) => a.e));
							}
						}}
					/>
				</ListItem>
				{getEpisodesForSeason(season).map((item, index, { length }) => {
					const e = isNaN(parseInt(item.e)) ? item.e : parseInt(item.e);
					const idStr = `S${item.season}E${e}`;
					const isSelected = selected.includes(e.toString());
					const imageRef = React.createRef<HTMLImageElement>();
					const summaryRef = React.createRef<HTMLParagraphElement>();
					return (
						<Box {...{ mouseData: isSelected }} key={`Episode_List_Item_${index}`}>
							<ListItem
								sx={{
									backdropFilter: isSelected ? 'brightness(1.5)' : '',
									'&:hover': { backdropFilter: 'brightness(1.5)' },
									display: 'grid',
									gridTemplateColumns: '25px 50px 1fr 5fr'
								}}
								onClick={() => {
									let arr: string[] = [];
									if (isSelected) {
										arr = [...selected.filter((a) => a !== e.toString())];
									} else {
										arr = [...selected, e.toString()];
									}
									setSelected(arr.filter((a) => a.length > 0));
								}}
							>
								{isSelected ? <CheckBox /> : <CheckBoxOutlineBlank />}
								<Typography color="text.primary" sx={{ textAlign: 'center' }}>
									{idStr}
								</Typography>
								<img ref={imageRef} style={{ width: 'inherit', maxHeight: '200px', minWidth: '150px' }} src={item.img} alt="thumbnail" />
								<Box sx={{ display: 'flex', flexDirection: 'column', pl: 1 }}>
									<Box sx={{ display: 'grid', gridTemplateColumns: '1fr min-content' }}>
										<Typography color="text.primary" variant="h5">
											{item.name}
										</Typography>
										<Typography color="text.primary">{item.time.startsWith('00:') ? item.time.slice(3) : item.time}</Typography>
									</Box>
									<Typography color="text.primary" ref={summaryRef}>
										{item.description}
									</Typography>
									<Box sx={{ display: 'grid', gridTemplateColumns: 'fit-content 1fr' }}>
										<Typography>
											<br />
											Available audio languages: {item.lang.join(', ')}
										</Typography>
									</Box>
								</Box>
							</ListItem>
							<ContextMenu
								options={[
									{
										text: 'Copy image URL',
										onClick: async () => {
											await navigator.clipboard.writeText(item.img);
											enqueueSnackbar('Copied URL to clipboard', {
												variant: 'info'
											});
										}
									},
									{
										text: 'Open image in new tab',
										onClick: () => {
											window.open(item.img);
										}
									}
								]}
								popupItem={imageRef as RefObject<HTMLElement>}
							/>
							<ContextMenu
								options={[
									{
										onClick: async () => {
											await navigator.clipboard.writeText(item.description!);
											enqueueSnackbar('Copied summary to clipboard', {
												variant: 'info'
											});
										},
										text: 'Copy summary to clipboard'
									}
								]}
								popupItem={summaryRef as RefObject<HTMLElement>}
							/>
							{index < length - 1 && <Divider />}
						</Box>
					);
				})}
			</List>
		</Dialog>
	);
};
const parseEpisodes = (e: string): string[] => {
	if (!e) return [];
	return e
		.split(',')
		.map((s) => s.trim())
		.filter((s) => s.length > 0);
};
const serializeEpisodes = (episodes: string[]): string => {
	return [...new Set(episodes)].join(',');
};

const parseSelect = (s: string): string[] => {
	const ret: string[] = [];
	s.split(',').forEach((item) => {
		if (item.includes('-')) {
			const split = item.split('-');
			if (split.length !== 2) return;
			const match = split[0].match(/[A-Za-z]+/);
			if (match && match.length > 0) {
				if (match.index && match.index !== 0) {
					return;
				}
				const letters = split[0].substring(0, match[0].length);
				const number = parseInt(split[0].substring(match[0].length));
				const b = parseInt(split[1]);
				if (isNaN(number) || isNaN(b)) {
					return;
				}
				for (let i = number; i <= b; i++) {
					ret.push(`${letters}${i}`);
				}
			} else {
				const a = parseInt(split[0]);
				const b = parseInt(split[1]);
				if (isNaN(a) || isNaN(b)) {
					return;
				}
				for (let i = a; i <= b; i++) {
					ret.push(`${i}`);
				}
			}
		} else {
			ret.push(item);
		}
	});
	return [...new Set(ret)];
};

export default EpisodeListing;
