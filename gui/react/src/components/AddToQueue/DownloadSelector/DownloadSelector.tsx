import React from 'react';
import { Box, Button, TextField } from '@mui/material';
import useStore from '../../../hooks/useStore';
import MultiSelect from '../../reusable/MultiSelect';
import { messageChannelContext } from '../../../provider/MessageChannel';
import LoadingButton from '@mui/lab/LoadingButton';
import { useSnackbar } from 'notistack';

type DownloadSelectorProps = {
  onFinish?: () => unknown
}

const DownloadSelector: React.FC<DownloadSelectorProps> = ({ onFinish }) => {
  const messageHandler = React.useContext(messageChannelContext);
  const [store, dispatch] = useStore();
  const [availableDubs, setAvailableDubs] = React.useState<string[]>([]);
  const [availableSubs, setAvailableSubs ] = React.useState<string[]>([]);
  const [ loading, setLoading ] = React.useState(false);
  const { enqueueSnackbar } = useSnackbar();

  React.useEffect(() => {
    (async () => {
      /* If we don't wait the response is undefined? */
      await new Promise((resolve) => setTimeout(() => resolve(undefined), 100));
      const dubLang = messageHandler?.handleDefault('dubLang');
      const subLang = messageHandler?.handleDefault('dlsubs');
      const q = messageHandler?.handleDefault('q');
      const fileName = messageHandler?.handleDefault('fileName');
      const dlVideoOnce = messageHandler?.handleDefault('dlVideoOnce');
      const result = await Promise.all([dubLang, subLang, q, fileName, dlVideoOnce]);
      dispatch({
        type: 'downloadOptions',
        payload: {
          ...store.downloadOptions,
          dubLang: result[0],
          dlsubs: result[1],
          q: result[2],
          fileName: result[3],
          dlVideoOnce: result[4],
        }
      });
      setAvailableDubs(await messageHandler?.availableDubCodes() ?? []);
      setAvailableSubs(await messageHandler?.availableSubCodes() ?? []);
    })();
  }, []);

  const addToQueue = async () => {
    setLoading(true);
    const res = await messageHandler?.resolveItems(store.downloadOptions);
    if (!res)
      return enqueueSnackbar('The request failed. Please check if the ID is correct.', {
        variant: 'error'
      });
    setLoading(false);
    if (onFinish)
      onFinish();
  };

  const listEpisodes = async () => {
    if (!store.downloadOptions.id) {
      return enqueueSnackbar('Please enter a ID', {
        variant: 'error'
      });
    }
    setLoading(true);
    const res = await messageHandler?.listEpisodes(store.downloadOptions.id);
    if (!res || !res.isOk) {
      setLoading(false);
      return enqueueSnackbar('The request failed. Please check if the ID is correct.', {
        variant: 'error'
      });
    } else {
      dispatch({
        type: 'episodeListing',
        payload: res.value
      });
    }
    setLoading(false);
  };

  return <Box sx={{ display: 'flex', flexDirection: 'column' }}>
    <Box sx={{ m: 2, gap: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
      <TextField value={store.downloadOptions.id} required onChange={e => {
        dispatch({
          type: 'downloadOptions',
          payload: { ...store.downloadOptions, id: e.target.value }
        });
      }} label='Item ID' />
      <TextField type='number' value={store.downloadOptions.q} required onChange={e => {
        const parsed = parseInt(e.target.value);
        if (isNaN(parsed) || parsed < 0 || parsed > 10)
          return;
        dispatch({
          type: 'downloadOptions',
          payload: { ...store.downloadOptions, q: parsed }
        });
      }} label='Quality Level (0 for max)' />
      <TextField disabled={store.downloadOptions.all} value={store.downloadOptions.e} required onChange={e => {
        dispatch({
          type: 'downloadOptions',
          payload: { ...store.downloadOptions, e: e.target.value }
        });
      }} label='Episode Select' />
      <MultiSelect
        title='Dub Languages'
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
        title='Sub Languages'
        values={availableSubs}
        selected={store.downloadOptions.dlsubs}
        onChange={(e) => {
          dispatch({
            type: 'downloadOptions',
            payload: { ...store.downloadOptions, dlsubs: e }
          });
        }}
      />
      <TextField value={store.downloadOptions.fileName} onChange={e => {
        dispatch({
          type: 'downloadOptions',
          payload: { ...store.downloadOptions, fileName: e.target.value }
        });
      }} sx={{ width: '50%' }} label='Filename' />
      <Button onClick={() => dispatch({ type: 'downloadOptions', payload: { ...store.downloadOptions, all: !store.downloadOptions.all } })} variant={store.downloadOptions.all ? 'contained' : 'outlined'}>Download all</Button>
      <Button onClick={() => dispatch({ type: 'downloadOptions', payload: { ...store.downloadOptions, but: !store.downloadOptions.but } })} variant={store.downloadOptions.but ? 'contained' : 'outlined'}>Download all but</Button>
      <Button onClick={() => dispatch({ type: 'downloadOptions', payload: { ...store.downloadOptions, noaudio: !store.downloadOptions.noaudio } })} variant={store.downloadOptions.noaudio ? 'contained' : 'outlined'}>Skip Audio</Button>
      <Button onClick={() => dispatch({ type: 'downloadOptions', payload: { ...store.downloadOptions, novids: !store.downloadOptions.novids } })} variant={store.downloadOptions.novids ? 'contained' : 'outlined'}>Skip Video</Button>
      <Button onClick={() => dispatch({ type: 'downloadOptions', payload: { ...store.downloadOptions, dlVideoOnce: !store.downloadOptions.dlVideoOnce } })} variant={store.downloadOptions.dlVideoOnce ? 'contained' : 'outlined'}>Skip unnecessary Downloads</Button>
    </Box>
    <Box sx={{ gap: 2, flex: 0, m: 1, mb: 3, display: 'flex', justifyContent: 'center' }}>
      <LoadingButton loading={loading} onClick={listEpisodes} variant='contained'>List episodes</LoadingButton>
      <LoadingButton loading={loading} onClick={addToQueue} variant='contained'>Add to Queue</LoadingButton>
    </Box>
  </Box>; 
};

export default DownloadSelector;