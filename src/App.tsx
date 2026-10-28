import { createHashRouter, Navigate, RouterProvider } from 'react-router'
import { DefinicoesAdesivo } from './componentes/Adesivo'
import { Moldura } from './componentes/Moldura'
import { DefinicoesGiz } from './componentes/Papelaria'
import { Ajustes } from './paginas/Ajustes'
import { BoasVindas } from './paginas/BoasVindas'
import { EmBreve } from './paginas/EmBreve'
import { Hoje } from './paginas/Hoje'
import { Caixa } from './paginas/Caixa'
import { Tarefas } from './paginas/Tarefas'
import { Mini } from './paginas/Mini'
import { Remedios } from './paginas/Remedios'
import { Consultas } from './paginas/Consultas'
import { Calendario } from './paginas/Calendario'
import { GuiaDeEstilo } from './paginas/GuiaDeEstilo'
import { useAplicarPreferencias } from './preferencias'
import { TELA_AJUSTES, TODAS_AS_TELAS } from './rotas'

// Rotas com "#" (ex.: #/hoje): funcionam em qualquer hospedagem estática e offline,
// sem precisar configurar o servidor.
const roteador = createHashRouter([
  {
    element: <Moldura />,
    children: [
      { index: true, element: <Navigate to="/hoje" replace /> },
      { path: '/hoje', element: <Hoje /> },
      { path: '/tarefas', element: <Tarefas /> },
      { path: '/caixa', element: <Caixa /> },
      { path: '/remedios', element: <Remedios /> },
      { path: '/consultas', element: <Consultas /> },
      { path: '/calendario', element: <Calendario /> },
      ...TODAS_AS_TELAS.filter((tela) => tela.etapa).map((tela) => ({
        path: tela.caminho,
        element: <EmBreve tela={tela} />,
      })),
      { path: TELA_AJUSTES.caminho, element: <Ajustes /> },
      { path: '*', element: <Navigate to="/hoje" replace /> },
    ],
  },
  { path: '/boas-vindas', element: <BoasVindas /> },
  { path: '/mini', element: <Mini /> },
  { path: '/estilo', element: <GuiaDeEstilo /> },
])

export function App() {
  useAplicarPreferencias()
  return (
    <>
      <DefinicoesAdesivo />
      <DefinicoesGiz />
      <RouterProvider router={roteador} />
    </>
  )
}
