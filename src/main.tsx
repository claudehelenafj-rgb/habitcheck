import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './estilos/global.css'
import { DefinicoesAdesivo } from './componentes/Adesivo'
import { DefinicoesGiz } from './componentes/Papelaria'
import { GuiaDeEstilo } from './paginas/GuiaDeEstilo'
import { aplicar, carregar } from './preferencias'

// Aplica as preferências antes de desenhar, para não piscar no tema errado.
aplicar(carregar())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DefinicoesAdesivo />
    <DefinicoesGiz />
    <GuiaDeEstilo />
  </StrictMode>,
)
