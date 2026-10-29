// Motor de lembretes (Fase 1: funciona com o app aberto, mesmo em segundo plano).
// A cada 20 segundos confere as doses de hoje; quando é hora, mostra o aviso do sistema
// com a ação escrita e conta o aviso (para repetir com gentileza e para a revisão semanal).

import { useEffect, useRef } from 'react'
import { useBemEstar } from './dados/bemEstar'
import { jaAvisouTransicao, registrarTransicao, useConsultas } from './dados/consultas'
import { registrarAviso, useConfigAvisos, useDosesDoDia } from './dados/remedios'
import { planoReverso } from './logica/consultas'
import { useAgora } from './dados/timer'
import { diaLocal } from './logica/datas'
import { deveAvisar, textoDoLembrete, type DosePrevista } from './logica/remedios'
import { dentroDaJanela, horaDeDesacelerar, noiteDaRotina } from './logica/sono'

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

export type TextosLembretes = {
  remedio: string
  transicao: string
  arrumar: (titulo: string) => string
  sair: (titulo: string) => string
  acordarTitulo: string
  acordarCorpo: string
  desacelerarTitulo: string
  desacelerarCorpo: string
}

/** Avisos de transição das consultas: "começar a se arrumar" e "sair de casa" (uma vez cada, até 30 min depois). */
function useAvisosTransicao(agora: Date, textos: TextosLembretes) {
  const consultas = useConsultas()
  const emAndamento = useRef(new Set<string>())
  useEffect(() => {
    if (!consultas) return
    for (const c of consultas) {
      const plano = c.status === 'marcada' ? planoReverso(c) : null
      if (!plano) continue
      const momentos: Array<[string, Date, string]> = [
        [`${c.id}|${c.data}${c.hora}|arrumar`, plano.comecarArrumar, textos.arrumar(c.titulo)],
        [`${c.id}|${c.data}${c.hora}|sair`, plano.sairDeCasa, textos.sair(c.titulo)],
      ]
      for (const [id, quando, texto] of momentos) {
        const passou = agora.getTime() - quando.getTime()
        if (passou < 0 || passou > 30 * 60_000 || emAndamento.current.has(id)) continue
        emAndamento.current.add(id)
        ;(async () => {
          if (await jaAvisouTransicao(id)) return
          await registrarTransicao(id)
          const hora = quando.toTimeString().slice(0, 5)
          await mostrarAvisoSistema(textos.transicao, `${hora} · ${texto}`, id)
        })().finally(() => emAndamento.current.delete(id))
      }
    }
  }, [consultas, agora, textos])
}

/**
 * Sono (Bem-estar): "hora de levantar" no horário fixo de acordar e "hora de desacelerar" 30 min antes de deitar.
 * Uma vez por dia cada, até 30 min depois do horário. Só com a aba Bem-estar e a ferramenta Sono ligadas.
 */
function useAvisosSono(agora: Date, textos: TextosLembretes, ativo: boolean) {
  const config = useBemEstar()
  const emAndamento = useRef(new Set<string>())
  useEffect(() => {
    const sono = config?.sono
    if (!ativo || !sono || !config.ferramentas.includes('sono')) return
    const hoje = diaLocal(agora)
    const avisos: Array<[string, string, string]> = []
    if (sono.lembreteAcordar && sono.acordarAs && dentroDaJanela(sono.acordarAs, agora)) {
      avisos.push([`sono|acordar|${hoje}`, textos.acordarTitulo, `${sono.acordarAs} · ${textos.acordarCorpo}`])
    }
    if (sono.lembreteRotina && sono.deitarAs && dentroDaJanela(horaDeDesacelerar(sono.deitarAs), agora)) {
      avisos.push([`sono|desacelerar|${noiteDaRotina(agora, hoje)}`, textos.desacelerarTitulo, textos.desacelerarCorpo])
    }
    for (const [id, titulo, corpo] of avisos) {
      if (emAndamento.current.has(id)) continue
      emAndamento.current.add(id)
      ;(async () => {
        if (await jaAvisouTransicao(id)) return
        await registrarTransicao(id)
        await mostrarAvisoSistema(titulo, corpo, id)
      })().finally(() => emAndamento.current.delete(id))
    }
  }, [config, agora, textos, ativo])
}

/** Usar uma vez, na moldura do app. `bemEstar` = a aba Bem-estar está ligada. */
export function useLembretes(textos: TextosLembretes, bemEstar = false) {
  const tituloAviso = textos.remedio
  const agora = useAgora(20_000)
  const hoje = diaLocal(agora)
  const dados = useDosesDoDia(hoje)
  const { silencio } = useConfigAvisos()
  const emAndamento = useRef(new Set<string>())
  useAvisosTransicao(agora, textos)
  useAvisosSono(agora, textos, bemEstar)

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
