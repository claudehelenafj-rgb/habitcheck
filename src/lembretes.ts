// Motor de lembretes (Fase 1: funciona com o app aberto, mesmo em segundo plano).
// A cada 20 segundos confere as doses de hoje; quando é hora, mostra o aviso do sistema
// com a ação escrita e conta o aviso (para repetir com gentileza e para a revisão semanal).

import { useEffect, useRef } from 'react'
import { registrarAviso, useConfigAvisos, useDosesDoDia } from './dados/remedios'
import { useAgora } from './dados/timer'
import { diaLocal } from './logica/datas'
import { deveAvisar, textoDoLembrete, type DosePrevista } from './logica/remedios'

export type PermissaoAvisos = NotificationPermission | 'sem-suporte'

export function permissaoAvisos(): PermissaoAvisos {
  return 'Notification' in window ? Notification.permission : 'sem-suporte'
}

export async function pedirPermissaoAvisos(): Promise<PermissaoAvisos> {
  if (!('Notification' in window)) return 'sem-suporte'
  return Notification.requestPermission()
}

async function mostrarAvisoSistema(titulo: string, corpo: string, tag: string) {
  if (permissaoAvisos() !== 'granted') return
  try {
    const aviso = new Notification(titulo, { body: corpo, tag, icon: './icone-192.png', requireInteraction: true })
    aviso.onclick = () => {
      window.focus()
      location.hash = '#/hoje'
      aviso.close()
    }
  } catch {
    // iPad/iPhone só aceitam avisos pelo service worker
    const registro = await navigator.serviceWorker?.getRegistration()
    await registro?.showNotification(titulo, { body: corpo, tag, icon: './icone-192.png' })
  }
}

/** Usar uma vez, na moldura do app. */
export function useLembretes(tituloAviso: string) {
  const agora = useAgora(20_000)
  const hoje = diaLocal(agora)
  const dados = useDosesDoDia(hoje)
  const { silencio } = useConfigAvisos()
  const emAndamento = useRef(new Set<string>())

  useEffect(() => {
    if (!dados) return
    for (const dose of dados.doses) {
      const registro = dados.registros.find((r) => r.id === dose.id)
      if (!deveAvisar(dose, registro, agora, silencio) || emAndamento.current.has(dose.id)) continue
      emAndamento.current.add(dose.id)
      avisar(dose, tituloAviso).finally(() => emAndamento.current.delete(dose.id))
    }
  }, [dados, agora, silencio, tituloAviso])
}

async function avisar(dose: DosePrevista, titulo: string) {
  await registrarAviso(dose)
  await mostrarAvisoSistema(titulo, `${dose.horario} · ${textoDoLembrete(dose.remedio)}`, dose.id)
}
