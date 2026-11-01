// Trava da aba Bem-estar, só na memória: recarregar o app tranca de novo, e ficar mais de 1 minuto
// em segundo plano também. Conta os erros de PIN para pedir uma pausa depois de 5.

import { useSyncExternalStore } from 'react'
import { pinConfere } from './dados/pin'
import { esperaRestante } from './logica/pin'

export const TRANCAR_DEPOIS_DE_MS = 60_000

let desbloqueado = false
let erros = 0
let ultimoErro: number | undefined
let escondidoEm: number | undefined
const ouvintes = new Set<() => void>()
const avisar = () => ouvintes.forEach((f) => f())

export function desbloquear() {
  desbloqueado = true
  erros = 0
  ultimoErro = undefined
  avisar()
}

export function bloquear() {
  desbloqueado = false
  avisar()
}

export function useDesbloqueado(): boolean {
  return useSyncExternalStore(
    (f) => {
      ouvintes.add(f)
      return () => ouvintes.delete(f)
    },
    () => desbloqueado,
  )
}

export function segundosParaTentar(agora = Date.now()): number {
  return esperaRestante(erros, ultimoErro, agora)
}

export type ResultadoTentativa = 'ok' | 'errado' | 'esperar'

export async function tentarPin(pin: string): Promise<ResultadoTentativa> {
  if (segundosParaTentar() > 0) return 'esperar'
  if (await pinConfere(pin)) {
    desbloquear()
    return 'ok'
  }
  erros++
  ultimoErro = Date.now()
  avisar()
  return 'errado'
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) escondidoEm = Date.now()
    else if (desbloqueado && escondidoEm !== undefined && Date.now() - escondidoEm > TRANCAR_DEPOIS_DE_MS) bloquear()
  })
}
