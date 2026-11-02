import { Box, Chip, IconButton, LinearProgress, Paper, Stack, Tooltip, Typography } from '@mui/material';
import React from 'react';
import { messageChannelContext } from '../../../provider/MessageChannel';
import { queueContext } from '../../../provider/QueueProvider';
import DeleteIcon from '@mui/icons-material/Delete';
import { DownloadOutlined, InboxOutlined } from '@mui/icons-material';
import useDownloadManager from '../DownloadManager/DownloadManager';
import { useSnackbar } from 'notistack';

const Queue: React.FC = () => {
	const { data, current } = useDownloadManager();
	const queue = React.useContext(queueContext);
	const msg = React.useContext(messageChannelContext);
	const { enqueueSnackbar } = useSnackbar();

	const remove = async (index: number) => {
		try { await msg?.removeFromQueue(index); }
		catch (error) { enqueueSnackbar(error instanceof Error ? error.message : String(error), { variant: 'error' }); }
	};

	const active = data?.downloadInfo ?? current;
	const percent = data ? Math.max(0, Math.min(100, Number(data.progress.percent) || 0)) : 0;

	return (
		<Box sx={{ width: '100%' }}>
			<Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
				<Typography variant="h6" fontWeight={750}>Download queue</Typography>
				<Chip size="small" label={active ? 'Downloading' : queue.length ? 'Ready' : 'Empty'} color={active ? 'primary' : 'default'} variant="outlined" />
			</Stack>
			{active && (
				<Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, mb: 2, bgcolor: 'background.paper' }}>
					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ sm: 'center' }}>
						{active.image && <Box component="img" alt="" src={active.image} sx={{ width: { xs: '100%', sm: 180 }, height: 110, objectFit: 'cover', borderRadius: 2 }} />}
						<Box sx={{ flexGrow: 1, minWidth: 0 }}>
							<Stack direction="row" spacing={1} alignItems="center" mb={1}>
								<DownloadOutlined color="primary" fontSize="small" />
								<Typography variant="overline" color="primary">Current download</Typography>
							</Stack>
							<Typography variant="subtitle1" fontWeight={750} noWrap>{active.parent.title}</Typography>
							<Typography variant="body2" color="text.secondary" noWrap>{active.title}</Typography>
							<LinearProgress variant={data ? 'determinate' : 'indeterminate'} value={percent} sx={{ mt: 2, mb: 1, height: 8, borderRadius: 8 }} />
							<Typography variant="caption" color="text.secondary">
								{data ? `${percent.toFixed(1)}% · ${data.progress.cur}/${data.progress.total} parts · ${(data.progress.downloadSpeed / 1048576).toFixed(2)} MB/s` : 'Preparing download…'}
							</Typography>
						</Box>
					</Stack>
				</Paper>
			)}
			{queue.length === 0 && !active ? (
				<Paper variant="outlined" sx={{ py: 7, px: 2, textAlign: 'center', bgcolor: 'rgba(21,29,48,.65)', borderStyle: 'dashed' }}>
					<InboxOutlined sx={{ fontSize: 46, color: 'text.secondary', mb: 1 }} />
					<Typography variant="h6" fontWeight={700}>Your queue is empty</Typography>
					<Typography variant="body2" color="text.secondary">Select “Add to Queue” to choose your first episodes.</Typography>
				</Paper>
			) : (
				<Stack spacing={1.5}>
					{queue.map((item, index) => (
						<Paper variant="outlined" key={`${item.id}-${item.e}-${index}`} sx={{ p: 1.5, bgcolor: 'background.paper' }}>
							<Stack direction="row" spacing={2} alignItems="center">
								{item.image && <Box component="img" src={item.image} alt="" sx={{ width: { xs: 65, sm: 128 }, height: { xs: 65, sm: 80 }, objectFit: 'cover', borderRadius: 1.5, flexShrink: 0 }} />}
								<Box flexGrow={1} minWidth={0}>
									<Typography fontWeight={700} noWrap>{item.parent.title}</Typography>
									<Typography variant="body2" color="text.secondary" noWrap>{`S${item.parent.season}E${item.episode} · ${item.title}`}</Typography>
									<Typography variant="caption" color="text.secondary">{`Audio: ${item.dubLang.join(', ')} · Subtitles: ${item.dlsubs.join(', ')} · Quality: ${item.q || 'Best'}`}</Typography>
								</Box>
								<Tooltip title="Remove from queue">
									<IconButton color="error" aria-label="Remove from queue" onClick={() => void remove(index)}><DeleteIcon /></IconButton>
								</Tooltip>
							</Stack>
						</Paper>
					))}
				</Stack>
			)}
		</Box>
	);
};
export default Queue;
