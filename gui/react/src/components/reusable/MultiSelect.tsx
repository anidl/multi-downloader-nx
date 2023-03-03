import React from 'react';
import { FormControl, InputLabel, MenuItem, OutlinedInput, Select, Theme, useTheme } from '@mui/material';

export type MultiSelectProps = {
  values: string[],
  selected: string[],
  onChange: (values: string[]) => unknown,
  title: string,
  allOption?: boolean
}

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250
    }
  }
};

function getStyles(name: string, personName: readonly string[], theme: Theme) {
  return {
    fontWeight:
      (personName ?? []).indexOf(name) === -1
        ? theme.typography.fontWeightRegular
        : theme.typography.fontWeightMedium
  };
}

const MultiSelect: React.FC<MultiSelectProps> = (props) => {
  const theme = useTheme();

  return <div>
    <FormControl sx={{ m: 1, width: 300 }}>
      <InputLabel id="multi-select-label">{props.title}</InputLabel>
      <Select
        labelId="multi-select-label"
        id="multi-select"
        multiple
        value={(props.selected ?? [])}
        onChange={e => {
          const val = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
          if (props.allOption && val.includes('all')) {
            if (props.values.length === val.length - 1)
              props.onChange([]);
            else 
              props.onChange(props.values);
          } else {
            props.onChange(val);
          }
        }}
        input={<OutlinedInput id="select-multiple-chip" label={props.title} />}
        renderValue={(selected) => (
          selected.join(', ')
        )}
        MenuProps={MenuProps}
      >
        {props.values.concat(props.allOption ? 'all' : []).map((name) => (
          <MenuItem
            key={`${props.title}_${name}`}
            value={name}
            style={getStyles(name, props.selected, theme)}
          >
            {name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  </div>;
};

export default MultiSelect;