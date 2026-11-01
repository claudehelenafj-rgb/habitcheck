import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './estilos/global.css'
import './i18n'
import './instalacao'
import { App } from './App'
import { aplicar, carregar } from './preferencias'

// Aplica as preferências antes de desenhar, para não piscar no tema errado.
aplicar(carregar())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
