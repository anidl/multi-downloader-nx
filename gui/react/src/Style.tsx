import React from 'react';
import { Box, ThemeProvider, createTheme, Theme } from '@mui/material';

const makeTheme = (mode: 'dark' | 'light'): Partial<Theme> => {
	return createTheme({
		palette: {
			mode
		}
	});
};

const Style: FCWithChildren = ({ children }) => {
	return (
		<ThemeProvider theme={makeTheme('dark')}>
			<Box sx={{}} />
			{children}
		</ThemeProvider>
	);
};

export default Style;
