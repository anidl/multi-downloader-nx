import React from 'react';
import { Box, CircularProgress, InputAdornment, List, ListItemButton, Paper, Stack, TextField, Typography } from '@mui/material';
import { SearchRounded } from '@mui/icons-material';
import { SearchResponseItem } from '../../../../../../@types/messageHandler';
import useStore from '../../../hooks/useStore';
import { messageChannelContext } from '../../../provider/MessageChannel';
import { useSnackbar } from 'notistack';

const SearchBox: React.FC = () => {
	const messageHandler = React.useContext(messageChannelContext);
	const [store, dispatch] = useStore();
	const [search, setSearch] = React.useState('');
	const [results, setResults] = React.useState<SearchResponseItem[]>([]);
	const [loading, setLoading] = React.useState(false);
	const { enqueueSnackbar } = useSnackbar();

	React.useEffect(() => {
		let cancelled = false;
		const term = search.trim();
		if (term.length < 3 || !messageHandler?.serviceReady) {
			setResults([]);
			setLoading(false);
			return;
		}
		setLoading(true);
		const timer = window.setTimeout(() => {
			void messageHandler
				.search({ search: term })
				.then((response) => {
					if (cancelled) return;
					if (!response.isOk) throw new Error(response.reason.message || 'Search failed');
					setResults(response.value.slice(0, 8));
				})
				.catch((error) => {
					if (!cancelled) {
						setResults([]);
						enqueueSnackbar(error instanceof Error ? error.message : String(error), { variant: 'error' });
					}
				})
				.finally(() => {
					if (!cancelled) setLoading(false);
				});
		}, 450);
		return () => {
			cancelled = true;
			window.clearTimeout(timer);
		};
	}, [search, messageHandler?.service, messageHandler?.serviceReady]);

	return (
		<Box sx={{ mb: 2 }}>
			<TextField
				fullWidth
				size="small"
				value={search}
				placeholder="Search the catalog by title…"
				label="Search series"
				onChange={(event) => setSearch(event.target.value)}
				InputProps={{
					startAdornment: (
						<InputAdornment position="start">
							<SearchRounded color="action" />
						</InputAdornment>
					),
					endAdornment: loading ? (
						<InputAdornment position="end">
							<CircularProgress size={18} />
						</InputAdornment>
					) : null
				}}
			/>
			{search.trim().length >= 3 && !loading && results.length === 0 && (
				<Typography variant="caption" sx={{ display: 'block', mt: 1 }} color="text.secondary">
					No results yet. You can enter the series ID manually below.
				</Typography>
			)}
			{results.length > 0 && (
				<Paper variant="outlined" sx={{ mt: 1, maxHeight: 260, overflowY: 'auto' }}>
					<List disablePadding>
						{results.map((item) => (
							<ListItemButton
								key={item.id}
								divider
								onClick={() => {
									dispatch({ type: 'downloadOptions', payload: { ...store.downloadOptions, id: item.id, e: '', all: false } });
									setSearch('');
									setResults([]);
								}}
							>
								<Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
									{item.image && <Box component="img" alt="" src={item.image} sx={{ width: 58, height: 54, borderRadius: 1, objectFit: 'cover' }} />}
									<Box sx={{ flex: 1, minWidth: 0 }}>
										<Typography variant="body2" fontWeight={750} noWrap>
											{item.name}
										</Typography>
										<Typography variant="caption" color="text.secondary">
											ID: {item.id}
											{item.lang?.length ? ` · ${item.lang.join(', ')}` : ''}
										</Typography>
									</Box>
								</Stack>
							</ListItemButton>
						))}
					</List>
				</Paper>
			)}
		</Box>
	);
};
export default SearchBox;
