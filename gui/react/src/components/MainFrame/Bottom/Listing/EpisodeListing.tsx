import { Accordion, AccordionSummary, AccordionDetails, Box, List, ListItem, Typography } from "@mui/material";
import { ExpandMore } from '@mui/icons-material'
import React from "react";
import useStore from "../../../../hooks/useStore";
import { Episode } from "../../../../../../../@types/messageHandler";

const EpisodeListing: React.FC = () => {
  const [store] = useStore();

  const [expended, setExpended] = React.useState('');

  const [data, setData] = React.useState<{
    [seasonHeader: string]: Episode[]
  }>({});

  React.useEffect(() => {
    const map: {
      [seasonHeader: string]: Episode[]
    } = {};

    store.episodeListing.forEach(item => {
      const title = `S${item.season} - ${item.seasonTitle}`;
      if (Object.prototype.hasOwnProperty.call(map, title)) {
        map[title].push(item);
      } else {
        map[title] = [ item ];
      }
    })

    setData(map);
  }, [store]);

  return <Box>
    {Object.entries(data).map(([key, items], index) => {
      return <Accordion key={`Season_${index}`} expanded={expended === key} onChange={() => setExpended(key === expended ? '' : key)}>
        <AccordionSummary 
          expandIcon={<ExpandMore />}
          aria-controls="panel1bh-content"
          id="panel1bh-header"
        >
          <Typography sx={{ width: '80%', flexShrink: 0 }}>
            {key}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {items.map((item, index) => {
            return <Typography key={`Season_Item_${index}`} sx={{ paddingBottom: 1 }}>
              {`[${item.e}] - ${item.name} ( ${item.lang.join(', ')} ) `}
            </Typography>
          })}
        </AccordionDetails>
      </Accordion>;
    })}
  </Box>
}

export default EpisodeListing;