import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { GeolocationProvider } from './components/GeolocationProvider';
import theme from './theme';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GeolocationProvider>
        <App />
      </GeolocationProvider>
    </ThemeProvider>
  </StrictMode>,
);
