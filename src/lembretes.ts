// Motor de lembretes (Fase 1: funciona com o app aberto, mesmo em segundo plano).
// A cada 20 segundos confere as doses de hoje; quando é hora, mostra o aviso do sistema
// com a ação escrita e conta o aviso (para repetir com gentileza e para a revisão semanal).

import { useEffect, useRef } from 'react'
import { useBemEstar } from './dados/bemEstar'
import { useUltimoCheckin } from './dados/checkins'
import { useAvaliacoes } from './dados/faculdade'
import { lembreteDeHoje, type Avaliacao } from './logica/faculdade'
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
  checkinTitulo: string
  checkinCorpo: string
  /** prova ou entrega daqui a 14 ou 3 dias: [título, texto] */
  avaliacao: (a: Avaliacao, dias: number) => [string, string]
  /** "avisos discretos": título e texto que trocam todos os outros */
  discretoTitulo: string
  discretoCorpo: string
}

/** Com avisos discretos, todo aviso vira "Caderninho · lembrete" (nada de remédio ou assunto na tela de bloqueio). */
function comDiscricao(textos: TextosLembretes, discretos: boolean, titulo: string, corpo: string): [string, string] {
  return discretos ? [textos.discretoTitulo, textos.discretoCorpo] : [titulo, corpo]
}

/** Não lembra do check-in se a pessoa fez um há menos de 1 hora. */
const MINUTOS_SEM_REPETIR_CHECKIN = 60

/** Avisos de transição das consultas: "começar a se arrumar" e "sair de casa" (uma vez cada, até 30 min depois). */
function useAvisosTransicao(agora: Date, textos: TextosLembretes, discretos: boolean) {
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
          await mostrarAvisoSistema(...comDiscricao(textos, discretos, textos.transicao, `${hora} · ${texto}`), id)
        })().finally(() => emAndamento.current.delete(id))
      }
    }
  }, [consultas, agora, textos, discretos])
}

/**
 * Bem-estar: "hora de levantar" no horário fixo de acordar, "hora de desacelerar" 30 min antes de deitar e
 * "hora do check-in" nos horários escolhidos (só se não houve check-in na última hora).
 * Uma vez por dia cada, até 30 min depois do horário. Só com a aba Bem-estar e a ferramenta ligadas.
 */
function useAvisosBemEstar(agora: Date, textos: TextosLembretes, ativo: boolean, discretos: boolean) {
  const config = useBemEstar()
  const ultimoCheckin = useUltimoCheckin()
  const emAndamento = useRef(new Set<string>())
  useEffect(() => {
    if (!ativo || !config || ultimoCheckin === undefined) return
    const hoje = diaLocal(agora)
    const avisos: Array<[string, string, string]> = []
    const sono = config.sono
    if (sono && config.ferramentas.includes('sono')) {
      if (sono.lembreteAcordar && sono.acordarAs && dentroDaJanela(sono.acordarAs, agora)) {
        avisos.push([`sono|acordar|${hoje}`, textos.acordarTitulo, `${sono.acordarAs} · ${textos.acordarCorpo}`])
      }
      if (sono.lembreteRotina && sono.deitarAs && dentroDaJanela(horaDeDesacelerar(sono.deitarAs), agora)) {
        avisos.push([`sono|desacelerar|${noiteDaRotina(agora, hoje)}`, textos.desacelerarTitulo, textos.desacelerarCorpo])
      }
    }
    const lembrar = config.checkinLembretes
    const fezHaPouco = ultimoCheckin && agora.getTime() - new Date(ultimoCheckin.quando).getTime() < MINUTOS_SEM_REPETIR_CHECKIN * 60_000
    if (lembrar?.ativo && config.ferramentas.includes('checkin') && !fezHaPouco) {
      for (const h of lembrar.horarios) {
        if (dentroDaJanela(h, agora)) avisos.push([`checkin|${hoje}|${h}`, textos.checkinTitulo, `${h} · ${textos.checkinCorpo}`])
      }
    }
    for (const [id, titulo, corpo] of avisos) {
      if (emAndamento.current.has(id)) continue
      emAndamento.current.add(id)
      ;(async () => {
        if (await jaAvisouTransicao(id)) return
        await registrarTransicao(id)
        await mostrarAvisoSistema(...comDiscricao(textos, discretos, titulo, corpo), id)
      })().finally(() => emAndamento.current.delete(id))
    }
  }, [config, ultimoCheckin, agora, textos, ativo, discretos])
}

/** A partir desta hora, avisa das provas e entregas de daqui a 14 e 3 dias (uma vez no dia). */
const HORA_AVISO_FACULDADE = 9

function useAvisosFaculdade(agora: Date, textos: TextosLembretes, ativo: boolean, discretos: boolean) {
  const avaliacoes = useAvaliacoes()
  const emAndamento = useRef(new Set<string>())
  useEffect(() => {
    if (!ativo || !avaliacoes || agora.getHours() < HORA_AVISO_FACULDADE) return
    const hoje = diaLocal(agora)
    for (const a of avaliacoes) {
      const dias = lembreteDeHoje(a, hoje)
      if (!dias) continue
      const id = `faculdade|${a.id}|${dias}`
      if (emAndamento.current.has(id)) continue
      emAndamento.current.add(id)
      ;(async () => {
        if (await jaAvisouTransicao(id)) return
        await registrarTransicao(id)
        await mostrarAvisoSistema(...comDiscricao(textos, discretos, ...textos.avaliacao(a, dias)), id)
      })().finally(() => emAndamento.current.delete(id))
    }
  }, [avaliacoes, agora, textos, ativo, discretos])
}

export type AreasDosLembretes = { bemEstar?: boolean; faculdade?: boolean }

/** Usar uma vez, na moldura do app, com as áreas ligadas. */
export function useLembretes(textos: TextosLembretes, areas: AreasDosLembretes = {}) {
  const tituloAviso = textos.remedio
  const agora = useAgora(20_000)
  const hoje = diaLocal(agora)
  const dados = useDosesDoDia(hoje)
  const { silencio, discretos = false } = useConfigAvisos()
  const emAndamento = useRef(new Set<string>())
  useAvisosTransicao(agora, textos, discretos)
  useAvisosBemEstar(agora, textos, !!areas.bemEstar, discretos)
  useAvisosFaculdade(agora, textos, !!areas.faculdade, discretos)

  useEffect(() => {
    if (!dados) return
    for (const dose of dados.doses) {
      const registro = dados.registros.find((r) => r.id === dose.id)
      if (!deveAvisar(dose, registro, agora, silencio) || emAndamento.current.has(dose.id)) continue
      emAndamento.current.add(dose.id)
      avisar(dose, comDiscricao(textos, discretos, tituloAviso, `${dose.horario} · ${textoDoLembrete(dose.remedio)}`)).finally(() =>
        emAndamento.current.delete(dose.id),
      )
    }
  }, [dados, agora, silencio, tituloAviso, textos, discretos])
}

async function avisar(dose: DosePrevista, [titulo, corpo]: [string, string]) {
  await registrarAviso(dose)
  await mostrarAvisoSistema(titulo, corpo, dose.id)
}
