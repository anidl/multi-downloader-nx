import React from 'react';
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';

const theme = createTheme({
	palette: {
		mode: 'dark',
		primary: { main: '#8b9dff' },
		secondary: { main: '#8be3d0' },
		background: { default: '#0b1020', paper: '#151d30' },
		text: { primary: '#f1f4ff', secondary: '#a5b1cd' },
		divider: 'rgba(173,192,236,0.13)'
	},
	shape: { borderRadius: 14 },
	typography: { fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif' },
	components: {
		MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 650, borderRadius: 11 } } },
		MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
		MuiDialog: { styleOverrides: { paper: { border: '1px solid rgba(173,192,236,.15)', maxWidth: 'min(94vw, 960px)' } } }
	}
});

const Style: FCWithChildren = ({ children }) => (
	<ThemeProvider theme={theme}>
		<CssBaseline />
		<Box sx={{
			minHeight: '100vh',
			background: 'radial-gradient(ellipse at 12% 0%, rgba(99,108,221,.19), transparent 42%), radial-gradient(ellipse at 96% 90%, rgba(50,154,159,.12), transparent 40%), #0b1020',
			color: 'text.primary'
		}}>
			{children}
		</Box>
	</ThemeProvider>
);

export default Style;
