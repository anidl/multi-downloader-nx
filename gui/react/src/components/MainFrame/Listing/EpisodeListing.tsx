import { Accordion, AccordionSummary, AccordionDetails, Box, List, ListItem, Typography, Backdrop, Divider, Container, Dialog, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import { ExpandMore } from '@mui/icons-material'
import React from "react";
import useStore from "../../../hooks/useStore";
import { Episode } from "../../../../../../@types/messageHandler";

const EpisodeListing: React.FC = () => {
  const [store, dispatch] = useStore();

  const [season, setSeason] = React.useState<'all'|string>('all');

  const seasons = React.useMemo(() => {
    const s: string[] = [];
    for (const {season} of store.episodeListing) {
      if (s.includes(season))
        continue;
      s.push(season);
    }
    return s;
  }, [ store.episodeListing ])

  const [selected, setSelected] = React.useState<string[]>([]);

  React.useEffect(() => {
    setSelected(parseSelect(store.downloadOptions.e));
  }, [ store.episodeListing ])

  const close = () => {
    dispatch({
      type: 'episodeListing',
      payload: []
    });
    dispatch({
      type: 'downloadOptions',
      payload: {
        ...store.downloadOptions,
        e: `${([...new Set([...parseSelect(store.downloadOptions.e), ...selected])]).join(',')}`
      }
    })
  }

  return <Dialog open={store.episodeListing.length > 0} onClose={close} scroll='paper' maxWidth='xl' sx={{ p: 2 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 200px 20px' }}>
        <Typography color='text.primary' variant="h5" sx={{ textAlign: 'center', alignItems: 'center', justifyContent: 'center', display: 'flex' }}>
          Episodes
        </Typography>
        <FormControl sx={{ mr: 2, mt: 2 }}>
          <InputLabel id='seasonSelectLabel'>Season</InputLabel>
          <Select labelId="seasonSelectLabel" label='Season' value={season} onChange={(e) => setSeason(e.target.value)}>
            <MenuItem value='all'>Show all Epsiodes</MenuItem>
            {seasons.map((a, index) => {
              return <MenuItem value={a} key={`MenuItem_SeasonSelect_${index}`}>
                {a}
              </MenuItem>
            })}
          </Select>
        </FormControl>
      </Box>
      <List>
        {store.episodeListing.filter((a) => season === 'all' ? true : a.season === season).map((item, index, { length }) => {
          const e = isNaN(parseInt(item.e)) ? item.e : parseInt(item.e);
          const isSelected = selected.includes(e.toString());
          return <Box key={`Episode_List_Item_${index}`} sx={{
              backdropFilter: isSelected ? 'brightness(1.5)' : '',
              '&:hover': {
                backdropFilter: 'brightness(1.5)'
              }
            }}
            onClick={() => {
              let arr: string[] = [];
              if (isSelected) {
                arr = [...selected.filter(a => a !== e)];
              } else {
                arr = [...selected, e.toString()];
              }
              setSelected(arr);
            }}>
            <ListItem sx={{ display: 'grid', gridTemplateColumns: '50px 1fr 5fr' }}>
              <Typography color='text.primary' sx={{ textAlign: 'center' }}>
                {e}
              </Typography>
              <img style={{ width: 'inherit', maxHeight: '200px' }} src={item.img}></img>
              <Box sx={{ display: 'flex', flexDirection: 'column', pl: 1 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr min-content' }}>
                  <Typography color='text.primary' variant="h5">
                    {item.name}
                  </Typography>
                  <Typography color='text.primary'>
                    {item.time.startsWith('00:') ? item.time.slice(3) : item.time}
                  </Typography>
                </Box>
                <Typography color='text.primary'>
                  {item.description}
                </Typography>
              </Box>
            </ListItem>
            {index < length - 1 && <Divider />}
          </Box>
        })}
      </List>
  </Dialog>
}

const parseSelect = (s: string): string[] => {
  const ret: string[] = [];
  s.split(',').forEach(item => {
    if (item.includes('-')) {
      let split = item.split('-');
      if (split.length !== 2)
        return;
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
  })
  return [...new Set(ret)];
}

export default EpisodeListing;