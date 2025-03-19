import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { GeolocationProvider } from './components/GeolocationProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GeolocationProvider>
      <App />
    </GeolocationProvider>
  </StrictMode>,
)