import React from "react";
import { Box, Button, Checkbox, Chip, FormControl, FormControlLabel, IconButton, InputLabel, MenuItem, OutlinedInput, Select, TextField } from "@mui/material";
import useStore from "../../../hooks/useStore";
import MultiSelect from "../../MultiSelect";
import { messageChannelContext } from "../../../provider/MessageChannel";
import { Check, Close } from "@mui/icons-material";

const DownloadSelector: React.FC = () => {
  const messageHandler = React.useContext(messageChannelContext);
  const [store, dispatch] = useStore();
  const [dubLangCodes, setDubLangCodes] = React.useState<string[]>([]);

  React.useEffect(() => {
    (async () => {
      const codes = await messageHandler?.dubLangCodes();
      setDubLangCodes(codes ?? []);
    })();
  }, []);

  return <Box sx={{ display: 'flex', flexDirection: 'column' }}>
    <Box sx={{ m: 2, gap: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
      <TextField value={store.downloadOptions.id} required onChange={e => {
        dispatch({
          type: 'downloadOptions',
          payload: { ...store.downloadOptions, id: e.target.value }
        })
      }} label='Item ID' />
      <TextField type='number' value={store.downloadOptions.q} required onChange={e => {
        const parsed = parseInt(e.target.value);
        if (isNaN(parsed) || parsed < 0 || parsed > 10)
          return;
        dispatch({
          type: 'downloadOptions',
          payload: { ...store.downloadOptions, q: parsed }
        })
      }} label='Quality Level (0 for max)' />
      <TextField disabled={store.downloadOptions.all} value={store.downloadOptions.e} required onChange={e => {
        dispatch({
          type: 'downloadOptions',
          payload: { ...store.downloadOptions, e: e.target.value }
        })
      }} label='Episode Select' />
      <MultiSelect
        title='Dub Languages'
        values={dubLangCodes}
        selected={store.downloadOptions.dubLang}
        onChange={(e) => {
          dispatch({
            type: 'downloadOptions',
            payload: { ...store.downloadOptions, dubLang: e }
          });
        }}
      />
      <TextField value={store.downloadOptions.fileName} onChange={e => {
        dispatch({
          type: 'downloadOptions',
          payload: { ...store.downloadOptions, fileName: e.target.value }
        })
      }} sx={{ width: '50%' }} label='Filename' />
      <Button onClick={() => dispatch({ type: 'downloadOptions', payload: { ...store.downloadOptions, all: !store.downloadOptions.all } })} variant={store.downloadOptions.all ? 'contained' : 'outlined'}>Download all</Button>
      <Button onClick={() => dispatch({ type: 'downloadOptions', payload: { ...store.downloadOptions, but: !store.downloadOptions.but } })} variant={store.downloadOptions.but ? 'contained' : 'outlined'}>Download all but</Button>
    </Box>
    <Box sx={{ flex: 0, m: 1, mb: 3, display: 'flex', justifyContent: 'center' }}>
      <Button variant='contained'>Add to Queue</Button>
    </Box>
  </Box> 
};

export default DownloadSelector;