import { Box, CircularProgress, IconButton, LinearProgress, Skeleton, Tooltip, Typography } from '@mui/material';
import React from 'react';
import { messageChannelContext } from '../../../provider/MessageChannel';
import { queueContext } from '../../../provider/QueueProvider';
import DeleteIcon from '@mui/icons-material/Delete';

import useDownloadManager from '../DownloadManager/DownloadManager';

const Queue: React.FC = () => {
	const { data, current } = useDownloadManager();
	const queue = React.useContext(queueContext);
	const msg = React.useContext(messageChannelContext);

	if (!msg) return <>Never</>;

	return data || queue.length > 0 ? (
		<>
			{data && (
				<>
					<Box
						sx={{
							display: 'flex',
							width: '100%',
							flexDirection: 'column',
							alignItems: 'center'
						}}
					>
						<Box
							sx={{
								marginTop: '2rem',
								marginBottom: '1rem',
								height: '12rem',
								width: '93vw',
								maxWidth: '93rem',
								backgroundColor: '#282828',
								boxShadow: '0px 0px 50px #00000090',
								borderRadius: '10px',
								display: 'flex',
								transition: '250ms'
							}}
						>
							<img
								style={{
									borderRadius: '5px',
									margin: '5px',
									boxShadow: '0px 0px 10px #00000090',
									userSelect: 'none'
								}}
								src={data.downloadInfo.image}
								height="auto"
								width="auto"
								alt="Thumbnail"
							/>
							<Box
								sx={{
									display: 'flex',
									flexDirection: 'column',
									width: '100%',
									justifyContent: 'center'
								}}
							>
								<Box
									sx={{
										display: 'flex'
									}}
								>
									<Box
										sx={{
											//backgroundColor: '#ff0000',
											width: '70%',
											marginLeft: '10px'
										}}
									>
										<Box
											sx={{
												flexDirection: 'column',
												display: 'flex',
												justifyContent: 'space-between'
											}}
										>
											<Typography
												color="text.primary"
												sx={{
													fontSize: '1.8rem'
												}}
											>
												{data.downloadInfo.parent.title}
											</Typography>
											<Typography
												color="text.primary"
												sx={{
													fontSize: '1.2rem'
												}}
											>
												{data.downloadInfo.title}
											</Typography>
										</Box>
									</Box>
									<Box
										sx={{
											//backgroundColor: '#00ff00',
											width: '30%',
											display: 'flex',
											flexDirection: 'column',
											justifyContent: 'center',
											alignItems: 'center'
										}}
									>
										<Typography
											color="text.primary"
											sx={{
												fontSize: '1.8rem'
											}}
										>
											Downloading: {data.downloadInfo.language.name}
										</Typography>
									</Box>
								</Box>
								<Box
									sx={{
										height: '50%',
										display: 'flex',
										flexDirection: 'column',
										justifyContent: 'center',
										alignItems: 'center'
										//backgroundColor: '#0000ff',
									}}
								>
									<LinearProgress
										variant="determinate"
										sx={{
											height: '20px',
											width: '97.53%',
											margin: '10px',
											boxShadow: '0px 0px 10px #00000090',
											borderRadius: '10px'
										}}
										value={typeof data.progress.percent === 'string' ? parseInt(data.progress.percent) : data.progress.percent}
									/>
									<Box>
										<Typography
											color="text.primary"
											sx={{
												fontSize: '1.3rem'
											}}
										>
											{data.progress.cur} / {data.progress.total} parts ({data.progress.percent}% | {formatTime(data.progress.time)} |{' '}
											{(data.progress.downloadSpeed / 1024 / 1024).toFixed(2)} MB/s | {(data.progress.bytes / 1024 / 1024).toFixed(2)}MB)
										</Typography>
									</Box>
								</Box>
							</Box>
						</Box>
					</Box>
				</>
			)}
			{current && !data && (
				<>
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center'
						}}
					>
						<Box
							sx={{
								marginTop: '2rem',
								marginBottom: '1rem',
								height: '12rem',
								width: '93vw',
								maxWidth: '93rem',
								backgroundColor: '#282828',
								boxShadow: '0px 0px 50px #00000090',
								borderRadius: '10px',
								display: 'flex',
								overflow: 'hidden',
								transition: '250ms'
							}}
						>
							<img
								style={{
									borderRadius: '5px',
									margin: '5px',
									boxShadow: '0px 0px 10px #00000090',
									userSelect: 'none',
									maxWidth: '20.5rem'
								}}
								src={current.image}
								height="auto"
								width="auto"
								alt="Thumbnail"
							/>
							<Box
								sx={{
									display: 'flex',
									flexDirection: 'column',
									width: '100%',
									justifyContent: 'center'
									//backgroundColor: '#ffffff0f'
								}}
							>
								<Box
									sx={{
										display: 'flex'
									}}
								>
									<Box
										sx={{
											width: '70%',
											marginLeft: '10px'
										}}
									>
										<Box
											sx={{
												flexDirection: 'column',
												display: 'flex',
												justifyContent: 'space-between'
											}}
										>
											<Typography
												color="text.primary"
												sx={{
													fontSize: '1.8rem'
												}}
											>
												{current.parent.title}
											</Typography>
											<Typography
												color="text.primary"
												sx={{
													fontSize: '1.2rem'
												}}
											>
												{current.title}
											</Typography>
										</Box>
									</Box>
									<Box
										sx={{
											//backgroundColor: '#00ff00',
											width: '30%',
											display: 'flex',
											flexDirection: 'column',
											justifyContent: 'center',
											alignItems: 'center'
										}}
									>
										<Box
											sx={{
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'space-between',
												position: 'relative'
											}}
										>
											<Typography
												color="text.primary"
												sx={{
													fontSize: '1.8rem'
												}}
											>
												Downloading:
											</Typography>
											<CircularProgress
												variant="indeterminate"
												sx={{
													marginLeft: '2rem'
												}}
											/>
										</Box>
									</Box>
								</Box>
								<Box
									sx={{
										height: '50%',
										display: 'flex',
										flexDirection: 'column',
										justifyContent: 'center',
										alignItems: 'center'
										//backgroundColor: '#0000ff',
									}}
								>
									<LinearProgress
										variant="indeterminate"
										sx={{
											height: '20px',
											width: '97.53%',
											margin: '10px',
											boxShadow: '0px 0px 10px #00000090',
											borderRadius: '10px'
										}}
									/>
									<Box>
										<Typography
											color="text.primary"
											sx={{
												fontSize: '1.3rem'
											}}
										>
											0 / ? parts (0% | XX:XX | 0 MB/s | 0MB)
										</Typography>
									</Box>
								</Box>
							</Box>
						</Box>
					</Box>
				</>
			)}
			{queue.map((queueItem, index, { length }) => {
				return (
					<Box
						key={`queue_item_${index}`}
						sx={{
							display: 'flex',
							mb: '-1.5rem',
							flexDirection: 'column',
							alignItems: 'center'
						}}
					>
						<Box
							sx={{
								marginTop: '1.5rem',
								marginBottom: '1.5rem',
								height: '11rem',
								width: '90vw',
								maxWidth: '90rem',
								backgroundColor: '#282828',
								boxShadow: '0px 0px 10px #00000090',
								borderRadius: '10px',
								display: 'flex',
								overflow: 'hidden'
							}}
						>
							<img
								style={{
									borderRadius: '5px',
									margin: '5px',
									boxShadow: '0px 0px 5px #00000090',
									userSelect: 'none',
									maxWidth: '18.5rem'
								}}
								src={queueItem.image}
								height="auto"
								width="auto"
								alt="Thumbnail"
							/>
							<Box
								sx={{
									margin: '5px',
									display: 'flex',
									width: '100%',
									justifyContent: 'space-between'
								}}
							>
								<Box
									sx={{
										width: '30%',
										marginRight: '5px',
										marginLeft: '5px',
										display: 'flex',
										flexDirection: 'column',
										justifyContent: 'space-between',
										overflow: 'hidden',
										textOverflow: 'ellipsis'
									}}
								>
									<Typography
										color="text.primary"
										sx={{
											fontSize: '1.8rem',
											overflow: 'hidden',
											whiteSpace: 'nowrap',
											textOverflow: 'ellipsis'
										}}
									>
										{queueItem.parent.title}
									</Typography>
									<Typography
										color="text.primary"
										sx={{
											fontSize: '1.6rem',
											marginTop: '-0.4rem',
											marginBottom: '0.4rem'
										}}
									>
										S{queueItem.parent.season}E{queueItem.episode}
									</Typography>
									<Typography
										color="text.primary"
										sx={{
											fontSize: '1.2rem',
											marginTop: '-0.4rem',
											marginBottom: '0.4rem',
											textOverflow: 'ellipsis'
										}}
									>
										{queueItem.title}
									</Typography>
								</Box>
								<Box
									sx={{
										width: '40%',
										marginRight: '5px',
										marginLeft: '5px',
										display: 'flex',
										flexDirection: 'column',
										overflow: 'hidden',
										whiteSpace: 'nowrap',
										justifyContent: 'space-between'
									}}
								>
									<Typography
										color="text.primary"
										sx={{
											fontSize: '1.8rem',
											overflow: 'hidden',
											whiteSpace: 'nowrap',
											textOverflow: 'ellipsis'
										}}
									>
										Dub(s): {queueItem.dubLang.join(', ')}
									</Typography>
									<Typography
										color="text.primary"
										sx={{
											fontSize: '1.8rem',
											overflow: 'hidden',
											whiteSpace: 'nowrap',
											textOverflow: 'ellipsis'
										}}
									>
										Sub(s): {queueItem.dlsubs.join(', ')}
									</Typography>
									<Typography
										color="text.primary"
										sx={{
											fontSize: '1.8rem'
										}}
									>
										Quality: {queueItem.q}
									</Typography>
								</Box>
								<Box
									sx={{
										marginRight: '5px',
										marginLeft: '5px',
										width: '30%',
										justifyContent: 'center',
										alignItems: 'center',
										display: 'flex'
									}}
								>
									<Tooltip title="Delete from queue" arrow placement="top">
										<IconButton
											onClick={() => {
												msg.removeFromQueue(index);
											}}
											sx={{
												backgroundColor: '#ff573a25',
												height: '40px',
												transition: '250ms',
												'&:hover': {
													backgroundColor: '#ff573a'
												}
											}}
										>
											<DeleteIcon />
										</IconButton>
									</Tooltip>
								</Box>
							</Box>
						</Box>
					</Box>
				);
			})}
		</>
	) : (
		<Box
			sx={{
				display: 'flex',
				width: '100%',
				height: '12rem',
				flexDirection: 'column',
				alignItems: 'center'
			}}
		>
			<Typography
				color="text.primary"
				sx={{
					fontSize: '2rem',
					margin: '10px'
				}}
			>
				Selected episodes will be shown here
			</Typography>
			<Box
				sx={{
					display: 'flex',
					margin: '10px'
				}}
			>
				<Skeleton variant="rectangular" height={'10rem'} width={'20rem'} sx={{ margin: '5px', borderRadius: '5px' }} />
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column'
					}}
				>
					<Skeleton variant="text" height={'100%'} width={'30rem'} sx={{ margin: '5px', borderRadius: '5px' }} />
					<Skeleton variant="text" height={'100%'} width={'30rem'} sx={{ margin: '5px', borderRadius: '5px' }} />
				</Box>
			</Box>
			<Box
				sx={{
					display: 'flex',
					margin: '10px'
				}}
			>
				<Skeleton variant="rectangular" height={'10rem'} width={'20rem'} sx={{ margin: '5px', borderRadius: '5px' }} />
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column'
					}}
				>
					<Skeleton variant="text" height={'100%'} width={'30rem'} sx={{ margin: '5px', borderRadius: '5px' }} />
					<Skeleton variant="text" height={'100%'} width={'30rem'} sx={{ margin: '5px', borderRadius: '5px' }} />
				</Box>
			</Box>
		</Box>
	);
};

const formatTime = (time: number) => {
	time = Math.floor(time / 1000);
	const minutes = Math.floor(time / 60);
	time = time % 60;

	return `${minutes.toFixed(0).length < 2 ? `0${minutes}` : minutes}m${time.toFixed(0).length < 2 ? `0${time}` : time}s`;
};

export default Queue;
