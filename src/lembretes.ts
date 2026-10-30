// Motor de lembretes (Fase 1: funciona com o app aberto, mesmo em segundo plano).
// A cada 20 segundos confere as doses de hoje; quando é hora, mostra o aviso do sistema
// com a ação escrita e conta o aviso (para repetir com gentileza e para a revisão semanal).

import { useEffect, useRef } from 'react'
import { useBemEstar } from './dados/bemEstar'
import { useUltimoCheckin } from './dados/checkins'
import { useAlimentacaoDeHoje } from './dados/alimentacao'
import { usePlanoAlimentar } from './dados/planoAlimentar'
import { doPlano, type RefeicaoPlano } from './logica/planoAlimentar'
import { useContasAtivas, useDesejosAtivos } from './dados/dinheiro'
import { useAvaliacoes, useConfigFaculdade } from './dados/faculdade'
import { marcarAvisoFoco, useEstadoFoco } from './dados/foco'
import { useHabitosAtivos } from './dados/habitos'
import { useConfigRituais, useRituaisDesde } from './dados/rituais'
import { avisoAcompanhado, lembreteDeHoje, type Avaliacao } from './logica/faculdade'
import { deveLembrarRefeicao, type Refeicao } from './logica/alimentacao'
import { avisoDeConta, fimDaEspera, prontoParaDecidir, type Conta, type Desejo, type Vencimento } from './logica/dinheiro'
import { acabouFase, type EstadoFoco, type FaseFoco } from './logica/foco'
import { deveAvisarVespera, deveLembrar, type Habito } from './logica/habitos'
import { deveLembrarRitual, diaDoRitual, idRitual, RITUAIS, type IdRitual } from './logica/rituais'
import { TELAS_AREAS } from './rotas'
import { tocarSino } from './telaFoco'
import { jaAvisouTransicao, registrarTransicao, useConsultas } from './dados/consultas'
import { registrarAviso, useConfigAvisos, useDosesDoDia } from './dados/remedios'
import { planoReverso } from './logica/consultas'
import { useAgora } from './dados/timer'
import { diaLocal, somarDias } from './logica/datas'
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

export async function mostrarAvisoSistema(titulo: string, corpo: string, tag: string, destino = '#/hoje') {
  if (permissaoAvisos() !== 'granted') return
  try {
    const aviso = new Notification(titulo, { body: corpo, tag, icon: './icone-192.png', requireInteraction: true })
    aviso.onclick = () => {
      window.focus()
      location.hash = destino
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
  /** estudo acompanhado daqui a 10 min: [título, texto] */
  acompanhado: (onde: string, hora: string) => [string, string]
  /** lembrete do hábito, com o plano se-então escrito: [título, texto] */
  habito: (h: Habito) => [string, string]
  /** véspera do hábito: deixar a base pronta e combinar com a companhia: [título, texto] */
  vespera: (h: Habito) => [string, string]
  /** conta a pagar, alguns dias antes ou no dia: [título, texto] */
  conta: (c: Conta, aviso: { tipo: 'antes' | 'dia'; vencimento: Vencimento }) => [string, string]
  /** a espera de 48 h da lista de desejos acabou: [título, texto] */
  desejo: (d: Desejo) => [string, string]
  /** hora de comer: [título, texto]; com plano alimentar, o texto diz o que o plano manda */
  refeicao: (r: Refeicao, doPlano?: RefeicaoPlano) => [string, string]
  /** hora do ritual da manhã ou da noite: [título, texto] */
  ritual: (r: IdRitual) => [string, string]
  /** fim de uma fase do modo foco: [título, texto] */
  fimFoco: (fase: FaseFoco) => [string, string]
  /** "avisos discretos": título e texto que trocam todos os outros */
  discretoTitulo: string
  discretoCorpo: string
}

type TextosDiscretos = Pick<TextosLembretes, 'discretoTitulo' | 'discretoCorpo'>

/** Com avisos discretos, todo aviso vira "Caderninho · lembrete" (nada de remédio ou assunto na tela de bloqueio). */
function comDiscricao(textos: TextosDiscretos, discretos: boolean, titulo: string, corpo: string): [string, string] {
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

/**
 * Faculdade: provas e entregas de daqui a 14 e 3 dias (uma vez no dia, a partir das 9h) e o estudo
 * acompanhado, 10 min antes de cada combinado.
 */
function useAvisosFaculdade(agora: Date, textos: TextosLembretes, ativo: boolean, discretos: boolean) {
  const avaliacoes = useAvaliacoes()
  const config = useConfigFaculdade()
  const emAndamento = useRef(new Set<string>())
  useEffect(() => {
    if (!ativo || !avaliacoes || !config) return
    const hoje = diaLocal(agora)
    const avisos: Array<[string, [string, string]]> = []
    if (agora.getHours() >= HORA_AVISO_FACULDADE) {
      for (const a of avaliacoes) {
        const dias = lembreteDeHoje(a, hoje)
        if (dias) avisos.push([`faculdade|${a.id}|${dias}`, textos.avaliacao(a, dias)])
      }
    }
    for (const c of config.acompanhado) {
      const dia = avisoAcompanhado(c, agora)
      if (dia) avisos.push([`acompanhado|${c.id}|${dia}`, textos.acompanhado(c.onde, c.hora)])
    }
    for (const [id, [titulo, corpo]] of avisos) {
      if (emAndamento.current.has(id)) continue
      emAndamento.current.add(id)
      ;(async () => {
        if (await jaAvisouTransicao(id)) return
        await registrarTransicao(id)
        await mostrarAvisoSistema(...comDiscricao(textos, discretos, titulo, corpo), id, '#/faculdade')
      })().finally(() => emAndamento.current.delete(id))
    }
  }, [avaliacoes, config, agora, textos, ativo, discretos])
}

/**
 * Fim de uma fase do modo foco: sino (se ligado) e, com o app fora da vista, aviso do sistema.
 * Um por fase, mesmo com a tela de foco e a moldura conferindo ao mesmo tempo.
 */
export async function avisarFimDeFase(e: EstadoFoco, textos: TextosDiscretos & Pick<TextosLembretes, 'fimFoco'>, discretos: boolean) {
  if (!(await marcarAvisoFoco(e.faseInicio))) return
  if (e.som) {
    tocarSino()
    navigator.vibrate?.([120, 80, 120])
  }
  if (document.visibilityState !== 'visible') {
    await mostrarAvisoSistema(...comDiscricao(textos, discretos, ...textos.fimFoco(e.fase)), `foco|${e.faseInicio}`, '#/foco')
  }
}

/**
 * Hábitos: o lembrete no horário (até 30 min depois, uma vez por dia, só se ainda não fez hoje) e o aviso da
 * véspera (deixar a base de lançamento pronta e combinar com a companhia, só se ainda falta).
 */
function useAvisosHabitos(agora: Date, textos: TextosLembretes, discretos: boolean) {
  const dados = useHabitosAtivos()
  const emAndamento = useRef(new Set<string>())
  useEffect(() => {
    if (!dados) return
    const hoje = diaLocal(agora)
    const avisos: Array<[string, [string, string], string]> = []
    for (const h of dados.habitos) {
      // o clique no aviso abre a tela da área do hábito
      const destino = `#${TELAS_AREAS.find((tela) => tela.area === h.area)?.caminho ?? '/hoje'}`
      if (deveLembrar(h, dados.registros.filter((r) => r.habitoId === h.id), agora)) avisos.push([`habito|${h.id}|${hoje}`, textos.habito(h), destino])
      const amanha = deveAvisarVespera(h, agora)
      if (amanha) avisos.push([`vespera|${h.id}|${amanha}`, textos.vespera(h), destino])
    }
    for (const [id, [titulo, corpo], destino] of avisos) {
      if (emAndamento.current.has(id)) continue
      emAndamento.current.add(id)
      ;(async () => {
        if (await jaAvisouTransicao(id)) return
        await registrarTransicao(id)
        await mostrarAvisoSistema(...comDiscricao(textos, discretos, titulo, corpo), id, destino)
      })().finally(() => emAndamento.current.delete(id))
    }
  }, [dados, agora, textos, discretos])
}

/** Refeições com lembrete: na hora (até 30 min depois), uma vez por dia, só se ainda não marcou. Só com a área ligada. */
function useAvisosAlimentacao(agora: Date, textos: TextosLembretes, discretos: boolean) {
  const hoje = diaLocal(agora)
  const comida = useAlimentacaoDeHoje(hoje)
  const plano = usePlanoAlimentar()
  const emAndamento = useRef(new Set<string>())
  useEffect(() => {
    if (!comida || plano === undefined) return
    for (const r of comida.config.refeicoes) {
      if (!deveLembrarRefeicao(r, comida.dia, agora)) continue
      const id = `refeicao|${r.id}|${hoje}`
      if (emAndamento.current.has(id)) continue
      emAndamento.current.add(id)
      ;(async () => {
        if (await jaAvisouTransicao(id)) return
        await registrarTransicao(id)
        await mostrarAvisoSistema(...comDiscricao(textos, discretos, ...textos.refeicao(r, doPlano(plano, r.id))), id, '#/hoje')
      })().finally(() => emAndamento.current.delete(id))
    }
  }, [comida, plano, agora, hoje, textos, discretos])
}

/** A partir desta hora, avisa das contas (alguns dias antes e no dia do vencimento). */
const HORA_AVISO_CONTAS = 9

/** Contas a pagar: uma vez no dia de avisar e uma vez no vencimento, só se não foi paga. Só com a área ligada. */
function useAvisosContas(agora: Date, textos: TextosLembretes, discretos: boolean) {
  const contas = useContasAtivas()
  const emAndamento = useRef(new Set<string>())
  useEffect(() => {
    if (!contas || agora.getHours() < HORA_AVISO_CONTAS) return
    const hoje = diaLocal(agora)
    for (const c of contas) {
      const aviso = avisoDeConta(c, hoje)
      if (!aviso) continue
      const id = `conta|${c.id}|${aviso.vencimento.mes}|${aviso.tipo}`
      if (emAndamento.current.has(id)) continue
      emAndamento.current.add(id)
      ;(async () => {
        if (await jaAvisouTransicao(id)) return
        await registrarTransicao(id)
        await mostrarAvisoSistema(...comDiscricao(textos, discretos, ...textos.conta(c, aviso)), id, '#/dinheiro')
      })().finally(() => emAndamento.current.delete(id))
    }
  }, [contas, agora, textos, discretos])
}

/**
 * Lista de desejos: quando a espera de 48 h acaba, um "ainda quer?" (uma vez, das 9h às 21h, até 3 dias depois).
 * Só com a área ligada.
 */
function useAvisosDesejos(agora: Date, textos: TextosLembretes, discretos: boolean) {
  const desejos = useDesejosAtivos()
  const emAndamento = useRef(new Set<string>())
  useEffect(() => {
    const hora = agora.getHours()
    if (!desejos || hora < HORA_AVISO_CONTAS || hora >= 21) return
    for (const d of desejos) {
      if (!prontoParaDecidir(d, agora) || agora.getTime() - fimDaEspera(d).getTime() > 3 * 24 * 3_600_000) continue
      const id = `desejo|${d.id}`
      if (emAndamento.current.has(id)) continue
      emAndamento.current.add(id)
      ;(async () => {
        if (await jaAvisouTransicao(id)) return
        await registrarTransicao(id)
        await mostrarAvisoSistema(...comDiscricao(textos, discretos, ...textos.desejo(d)), id, '#/dinheiro')
      })().finally(() => emAndamento.current.delete(id))
    }
  }, [desejos, agora, textos, discretos])
}

/** Rituais com lembrete: no horário (até 30 min depois), uma vez por dia, só se o ritual daquele dia não foi feito. */
function useAvisosRituais(agora: Date, textos: TextosLembretes, discretos: boolean) {
  const config = useConfigRituais()
  const registros = useRituaisDesde(somarDias(diaLocal(agora), -1))
  const emAndamento = useRef(new Set<string>())
  useEffect(() => {
    if (!config || !registros) return
    for (const r of RITUAIS) {
      const id = idRitual(r, diaDoRitual(r, agora))
      if (!deveLembrarRitual(config.lembretes[r], registros.find((x) => x.id === id), agora)) continue
      const aviso = `ritual|${id}`
      if (emAndamento.current.has(aviso)) continue
      emAndamento.current.add(aviso)
      ;(async () => {
        if (await jaAvisouTransicao(aviso)) return
        await registrarTransicao(aviso)
        await mostrarAvisoSistema(...comDiscricao(textos, discretos, ...textos.ritual(r)), aviso, `#/rituais/${r}`)
      })().finally(() => emAndamento.current.delete(aviso))
    }
  }, [config, registros, agora, textos, discretos])
}

/** Com a pessoa em outra tela do app, o fim da fase de foco também avisa (a cada 20 s). */
function useAvisosFoco(agora: Date, textos: TextosLembretes, discretos: boolean) {
  const foco = useEstadoFoco()
  useEffect(() => {
    if (foco && foco.avisadoEm !== foco.faseInicio && acabouFase(foco, agora)) void avisarFimDeFase(foco, textos, discretos)
  }, [foco, agora, textos, discretos])
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
  useAvisosFoco(agora, textos, discretos)
  useAvisosHabitos(agora, textos, discretos)
  useAvisosAlimentacao(agora, textos, discretos)
  useAvisosContas(agora, textos, discretos)
  useAvisosDesejos(agora, textos, discretos)
  useAvisosRituais(agora, textos, discretos)

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
