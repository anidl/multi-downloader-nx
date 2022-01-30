import React from "react";
import { Box, Divider, List, ListItem, Paper, TextField, Typography } from "@mui/material";
import { SearchResponse } from "../../../../../../@types/messageHandler";
import useStore from "../../../hooks/useStore";
import { messageChannelContext } from "../../../provider/MessageChannel";
import './SearchBox.css';

const SearchBox: React.FC = () => {
  const messageHandler = React.useContext(messageChannelContext);
  const [store, dispatch] = useStore();
  const [search, setSearch] = React.useState('');

  const [focus, setFocus] = React.useState(false);

  const [searchResult, setSearchResult] = React.useState<undefined|SearchResponse>();
  const anchor = React.useRef<HTMLDivElement>(null);

  const selectItem = (id: string) => {
    console.log(id);
    dispatch({
      type: 'downloadOptions',
      payload: {
        ...store.downloadOptions,
        id
      }
    });
  };

  React.useEffect(() => {
    (async () => {
      if (search.trim().length === 0)
        return setSearchResult({ isOk: true, value: [] });
      const s = await messageHandler?.search({search});
      if (s && s.isOk)
        s.value = s.value.slice(0, 10);
      setSearchResult(s);
    })();
  }, [search]);

  const anchorBounding = anchor.current?.getBoundingClientRect();


  return <Box onBlurCapture={() => /* Delay to capture onclick */setTimeout(() => setFocus(false), 100) } onFocusCapture={() => setFocus(true)}  sx={{ m: 2 }}>
    <TextField ref={anchor} value={search} onChange={e => setSearch(e.target.value)} variant='outlined' label='Search' fullWidth  />
    {searchResult !== undefined && searchResult.isOk && searchResult.value.length > 0 && focus &&
    <Paper sx={{ position: 'absolute', maxHeight: '50%', width: `${anchorBounding?.width}px`, 
      left: anchorBounding?.x, top: (anchorBounding?.y ?? 0) + (anchorBounding?.height ?? 0), zIndex: 99, overflowY: 'scroll'}}>
      <List>
        {searchResult && searchResult.isOk ?
          searchResult.value.map((a, ind, arr) => {
            return <Box key={a.id}>
              <ListItem className='listitem-hover' onClick={() => selectItem(a.id)}>
                <Box sx={{ display: 'flex' }}>
                  <Box sx={{ width: '20%', height: '100%', pr: 2 }}>
                    <img src={a.image} style={{ width: '100%', height: '100%' }}/>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', maxWidth: '70%' }}>
                    <Typography variant='h6' component='h6' color='text.primary' sx={{  }}>
                      {a.name}
                    </Typography>
                    {a.desc && <Typography variant='caption' component='p' color='text.primary' sx={{ pt: 1, pb: 1 }}>
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
              {(ind < arr.length - 1) && <Divider />}
            </Box>
          })
        : <></>}
      </List>
    </Paper>}
  </Box>
}

export default SearchBox;