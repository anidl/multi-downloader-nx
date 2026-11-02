import React from 'react';
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';

export type ColorMode = 'dark' | 'light';
export const colorModeContext = React.createContext<{ mode: ColorMode; toggle: () => void }>({
	mode: 'dark',
	toggle: () => undefined
});
const modeKey = 'anidl.gui.color-mode.v1';

const makeTheme = (mode: ColorMode) =>
	createTheme({
		palette: {
			mode,
			primary: { main: mode === 'dark' ? '#ffffff' : '#151515', contrastText: mode === 'dark' ? '#101010' : '#ffffff' },
			secondary: { main: mode === 'dark' ? '#b8b8b8' : '#505050' },
			background: { default: mode === 'dark' ? '#090909' : '#f6f6f6', paper: mode === 'dark' ? '#151515' : '#ffffff' },
			text: { primary: mode === 'dark' ? '#f6f6f6' : '#101010', secondary: mode === 'dark' ? '#a1a1a1' : '#646464' },
			divider: mode === 'dark' ? '#303030' : '#e7e7e7',
			error: { main: mode === 'dark' ? '#f09b9b' : '#ad3737' },
			success: { main: mode === 'dark' ? '#c3e4c3' : '#31733c' }
		},
		shape: { borderRadius: 12 },
		typography: {
			fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
			h4: { fontWeight: 800, letterSpacing: '-.035em' },
			h5: { fontWeight: 760, letterSpacing: '-.026em' },
			h6: { fontWeight: 730 },
			button: { textTransform: 'none', fontWeight: 680 }
		},
		components: {
			MuiCssBaseline: { styleOverrides: { body: { margin: 0 }, '*': { boxSizing: 'border-box' } } },
			MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' }, outlined: { borderColor: mode === 'dark' ? '#303030' : '#e7e7e7' } } },
			MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { borderRadius: 10, paddingInline: 18, minHeight: 39 } } },
			MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 10 } } },
			MuiDialog: { styleOverrides: { paper: { border: '1px solid', borderColor: mode === 'dark' ? '#373737' : '#dedede', maxWidth: 'min(96vw, 960px)' } } },
			MuiTooltip: { styleOverrides: { tooltip: { backgroundColor: mode === 'dark' ? '#f5f5f5' : '#151515', color: mode === 'dark' ? '#101010' : '#ffffff' } } }
		}
	});

const Style: FCWithChildren = ({ children }) => {
	const [mode, setMode] = React.useState<ColorMode>(() => {
		try {
			return localStorage.getItem(modeKey) === 'light' ? 'light' : 'dark';
		} catch {
			return 'dark';
		}
	});
	const toggle = React.useCallback(
		() =>
			setMode((previous) => {
				const next = previous === 'dark' ? 'light' : 'dark';
				try {
					localStorage.setItem(modeKey, next);
				} catch {
					/* storage disabled */
				}
				return next;
			}),
		[]
	);
	const theme = React.useMemo(() => makeTheme(mode), [mode]);
	return (
		<colorModeContext.Provider value={{ mode, toggle }}>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				<Box sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>{children}</Box>
			</ThemeProvider>
		</colorModeContext.Provider>
	);
};
export default Style;
