import { Box, Typography } from '@mui/material';
import React from 'react';

export default class ErrorHandler extends React.Component<{
  children: React.ReactNode|React.ReactNode[]
}, {
  error?: {
    er: Error,
    stack: React.ErrorInfo
  }
}> {
  
  constructor(props: {
    children: React.ReactNode|React.ReactNode[]
  }) {
    super(props);
    this.state = { error: undefined };
  }
  
  componentDidCatch(er: Error, stack: React.ErrorInfo) {
    this.setState({ error: { er, stack } });
  }
  
  render(): React.ReactNode {
    return this.state.error ? 
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 2 }}>
        <Typography variant='body1' color='red'>
          {`${this.state.error.er.name}: ${this.state.error.er.message}`}
          <br/>
          {this.state.error.stack.componentStack.split('\n').map(a => {
            return <>
              {a}
              <br/>
            </>;
          })}
        </Typography>
      </Box> : this.props.children;
  }
}