import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

/// <reference types="vite-plugin-pwa/client" />
import { registerSW } from 'virtual:pwa-register'

registerSW({
  onNeedRefresh() {
    window.location.reload()
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
