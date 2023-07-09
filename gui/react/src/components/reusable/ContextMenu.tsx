import { Box, Button, Divider, List, SxProps } from '@mui/material';
import React from 'react';

export type Option = {
  text: string,
  onClick: () => unknown
}

export type ContextMenuProps<T extends HTMLElement> = {
  options: ('divider'|Option)[],
  popupItem: React.RefObject<T>
}

const buttonSx: SxProps = {
  '&:hover': {
    background: 'rgb(0, 30, 60)'
  },
  fontSize: '0.7rem',
  minHeight: '30px',
  justifyContent: 'center',
  p: 0
};

function ContextMenu<T extends HTMLElement, >(props: ContextMenuProps<T>) {
  const [anchor, setAnchor] = React.useState( { x: 0, y: 0 } );

  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    const { popupItem: ref } = props;
    if (ref.current === null)
      return;
    const listener = (ev: MouseEvent) => {
      ev.preventDefault();
      setAnchor({ x: ev.x + 10, y: ev.y + 10 });
      setShow(true);
    };
    ref.current.addEventListener('contextmenu', listener);

    return () => {
      if (ref.current)
        ref.current.removeEventListener('contextmenu', listener);
    };
  }, [ props.popupItem ]);

  return show ? <Box sx={{ zIndex: 1400, p: 1, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(5px)', position: 'fixed', left: anchor.x, top: anchor.y }}>
    <List sx={{ p: 0, m: 0, display: 'flex', flexDirection: 'column' }}>
      {props.options.map((item, i) => {
        return item === 'divider' ? <Divider key={`ContextMenu_Divider_${i}_${item}`}/> :
          <Button color='inherit' key={`ContextMenu_Value_${i}_${item}`} onClick={() => {
            item.onClick();
            setShow(false);
          }} sx={buttonSx}>
            {item.text}
          </Button>;
      })}
      <Divider />
      <Button fullWidth color='inherit' onClick={() => setShow(false)} sx={buttonSx} >
        Close
      </Button>
    </List>
  </Box> : <></>;
}

export default ContextMenu;
