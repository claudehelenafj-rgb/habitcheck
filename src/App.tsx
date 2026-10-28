import { createHashRouter, Navigate, RouterProvider } from 'react-router'
import { DefinicoesAdesivo } from './componentes/Adesivo'
import { Moldura } from './componentes/Moldura'
import { DefinicoesGiz } from './componentes/Papelaria'
import { Ajustes } from './paginas/Ajustes'
import { EmBreve } from './paginas/EmBreve'
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
      ...TODAS_AS_TELAS.filter((tela) => tela.id !== 'ajustes').map((tela) => ({
        path: tela.caminho,
        element: <EmBreve tela={tela} />,
      })),
      { path: TELA_AJUSTES.caminho, element: <Ajustes /> },
      { path: '*', element: <Navigate to="/hoje" replace /> },
    ],
  },
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
