// Avisos rápidos no canto da tela ("Anotado", "Foi para o lixo · Desfazer").
// Somem sozinhos depois de alguns segundos; o leitor de tela anuncia.

import { useEffect, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'

type Aviso = { id: number; texto: string; desfazer?: () => void }

let avisos: Aviso[] = []
let proximo = 1
const ouvintes = new Set<() => void>()
const avisar = () => ouvintes.forEach((f) => f())

export function mostrarAviso(texto: string, desfazer?: () => void) {
  avisos = [...avisos.slice(-2), { id: proximo++, texto, desfazer }]
  avisar()
}

function tirar(id: number) {
  avisos = avisos.filter((a) => a.id !== id)
  avisar()
}

function ItemAviso({ aviso }: { aviso: Aviso }) {
  const { t } = useTranslation()
  useEffect(() => {
    const timer = setTimeout(() => tirar(aviso.id), aviso.desfazer ? 8000 : 4000)
    return () => clearTimeout(timer)
  }, [aviso])
  return (
    <li className="flex items-center gap-3 rounded-full border-2 border-linha bg-papel py-2 pr-2 pl-5 font-semibold shadow-[3px_3px_0_var(--linha)]">
      <span>{aviso.texto}</span>
      {aviso.desfazer && (
        <button
          type="button"
          onClick={() => {
            aviso.desfazer?.()
            tirar(aviso.id)
          }}
          className="min-h-9 rounded-full border-2 border-botao bg-botao px-4 text-sm font-bold text-botao-texto"
        >
          {t('avisos.desfazer')}
        </button>
      )}
    </li>
  )
}

export function Avisos() {
  const lista = useSyncExternalStore(
    (f) => {
      ouvintes.add(f)
      return () => ouvintes.delete(f)
    },
    () => avisos,
  )
  return (
    <ol
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-28 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6 [&>li]:pointer-events-auto"
    >
      {lista.map((a) => (
        <ItemAviso key={a.id} aviso={a} />
      ))}
    </ol>
  )
}
