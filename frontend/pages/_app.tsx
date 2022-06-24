import '../styles/globals.css'
import type { AppProps } from 'next/app'

import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, CssBaseline } from '@mui/material';
import DrawerNav from '../components/DrawerNav';
// import ResponsiveAppBar from '../components/AppBar';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function MyApp({ Component, pageProps }: AppProps) {
  return (<ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Component {...pageProps} />
        {/* </Box>
      </Box> */}
    </ThemeProvider>)
}

export default MyApp
