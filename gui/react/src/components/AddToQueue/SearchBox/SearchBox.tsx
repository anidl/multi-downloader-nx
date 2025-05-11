import React, { RefObject } from 'react';
import { Box, ClickAwayListener, Divider, List, ListItem, Paper, TextField, Typography } from '@mui/material';
import { SearchResponse } from '../../../../../../@types/messageHandler';
import useStore from '../../../hooks/useStore';
import { messageChannelContext } from '../../../provider/MessageChannel';
import './SearchBox.css';
import ContextMenu from '../../reusable/ContextMenu';
import { useSnackbar } from 'notistack';

const SearchBox: React.FC = () => {
  const messageHandler = React.useContext(messageChannelContext);
  const [store, dispatch] = useStore();
  const [search, setSearch] = React.useState('');

  const [focus, setFocus] = React.useState(false);

  const [searchResult, setSearchResult] = React.useState<undefined|SearchResponse>();
  const anchor = React.useRef<HTMLDivElement>(null);

  const { enqueueSnackbar } = useSnackbar();

  const selectItem = (id: string) => {
    dispatch({
      type: 'downloadOptions',
      payload: {
        ...store.downloadOptions,
        id
      }
    });
  };

  React.useEffect(() => {
    if (search.trim().length === 0)
      return setSearchResult({ isOk: true, value: [] });

    const timeOutId = setTimeout(async () => {
      if (search.trim().length > 3) {
        const s = await messageHandler?.search({search});
        if (s && s.isOk)
          s.value = s.value.slice(0, 10);
        setSearchResult(s);
      }
    }, 500);
    return () => clearTimeout(timeOutId);
  }, [search]);

  const anchorBounding = anchor.current?.getBoundingClientRect();
  return <ClickAwayListener onClickAway={() => setFocus(false)}>
    <Box sx={{ m: 2 }}>
      <TextField ref={anchor} value={search} onClick={() => setFocus(true)} onChange={e => setSearch(e.target.value)} variant='outlined' label='Search' fullWidth  />
      {searchResult !== undefined && searchResult.isOk && searchResult.value.length > 0 && focus &&
      <Paper sx={{ position: 'fixed', maxHeight: '50%', width: `${anchorBounding?.width}px`,
        left: anchorBounding?.x, top: (anchorBounding?.y ?? 0) + (anchorBounding?.height ?? 0), zIndex: 99, overflowY: 'scroll'}}>
        <List>
          {searchResult && searchResult.isOk ?
            searchResult.value.map((a, ind, arr) => {
              const imageRef = React.createRef<HTMLImageElement>();
              const summaryRef = React.createRef<HTMLParagraphElement>();
              return <Box key={a.id}>
                <ListItem className='listitem-hover' onClick={() => {
                  selectItem(a.id);
                  setFocus(false);
                }}>
                  <Box sx={{ display: 'flex' }}>
                    <Box sx={{ width: '20%', height: '100%', pr: 2 }}>
                      <img ref={imageRef} src={a.image} style={{ width: '100%', height: 'auto' }} alt="thumbnail"/>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', maxWidth: '70%' }}>
                      <Typography variant='h6' component='h6' color='text.primary' sx={{  }}>
                        {a.name}
                      </Typography>
                      {a.desc && <Typography variant='caption' component='p' color='text.primary' sx={{ pt: 1, pb: 1 }} ref={summaryRef}>
                        {a.desc}
                      </Typography>}
                      {a.lang && <Typography variant='caption' component='p' color='text.primary' sx={{  }}>
                        Languages: {a.lang.join(', ')}
                      </Typography>}
                      <Typography variant='caption' component='p' color='text.primary' sx={{  }}>
                        ID: {a.id}
                      </Typography>
                    </Box>
                  </Box>
                </ListItem>
                <ContextMenu options={[ { text: 'Copy image URL', onClick: async () => {
                  await navigator.clipboard.writeText(a.image);
                  enqueueSnackbar('Copied URL to clipboard', {
                    variant: 'info'
                  });
                }},
                {
                  text: 'Open image in new tab',
                  onClick: () => {
                    window.open(a.image);
                  }
                } ]} popupItem={imageRef as RefObject<HTMLElement>} />
                {a.desc &&
                  <ContextMenu options={[
                    {
                      onClick: async () => {
                        await navigator.clipboard.writeText(a.desc!);
                        enqueueSnackbar('Copied summary to clipboard', {
                          variant: 'info'
                        });
                      },
                      text: 'Copy summary to clipboard'
                    }
                  ]} popupItem={summaryRef as RefObject<HTMLElement>} />
                }
                {(ind < arr.length - 1) && <Divider />}
              </Box>;
            })
            : <></>}
        </List>
      </Paper>}
    </Box>
  </ClickAwayListener>;
};

export default SearchBox;
