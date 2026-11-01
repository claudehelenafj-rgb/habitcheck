// Instalação do app (PWA).
// Chrome e Edge avisam que o app pode ser instalado (evento beforeinstallprompt);
// guardamos esse aviso para mostrar um botão "Instalar" nos Ajustes.
// Safari (Mac e iPad) não tem esse evento: lá mostramos o passo a passo.

import { useSyncExternalStore } from 'react'

type AvisoInstalacao = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

let aviso: AvisoInstalacao | null = null
const ouvintes = new Set<() => void>()
const avisar = () => ouvintes.forEach((f) => f())

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  aviso = e as AvisoInstalacao
  avisar()
})
window.addEventListener('appinstalled', () => {
  aviso = null
  avisar()
})

export function estaInstalado(): boolean {
  return (
    matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function usePodeInstalar(): boolean {
  return useSyncExternalStore(
    (f) => {
      ouvintes.add(f)
      return () => ouvintes.delete(f)
    },
    () => aviso !== null,
  )
}

export async function instalar(): Promise<boolean> {
  if (!aviso) return false
  await aviso.prompt()
  const { outcome } = await aviso.userChoice
  aviso = null
  avisar()
  return outcome === 'accepted'
}
