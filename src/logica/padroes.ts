// Padrões nas anotações do Bem-estar, sempre como observação ("nos dias depois de noites curtas, você anotou...").
// Só aparecem com dados suficientes dos dois lados e uma diferença clara. Nunca dizem que uma coisa causa a outra.

import type { Checkin } from './checkin'
import { somarDias, type Dia } from './datas'
import { dosesDoDia, momento, type RegistroDose, type Remedio } from './remedios'
import type { RegistroSintoma } from './sintomas'
import { minutosDeSono, type RegistroSono } from './sono'

/** dias mínimos em cada grupo para comparar */
export const MINIMO_DIAS = 3
/** diferença mínima (pontos de 0 a 10) para virar observação */
export const DIFERENCA_MINIMA = 1.5

export type Padrao =
  | { tipo: 'sonoTensao'; curto: number; outros: number }
  | { tipo: 'sonoEnergia'; curto: number; outros: number }
  | { tipo: 'doseSintomas'; semTomar: number; tomou: number }
  | { tipo: 'diaDaSemana'; diaSemana: number; media: number; geral: number }

const media = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
const umaCasa = (n: number) => Math.round(n * 10) / 10

function porDia(checkins: Checkin[]) {
  const mapa = new Map<Dia, { tensao: number; energias: number[] }>()
  for (const c of checkins) {
    const atual = mapa.get(c.dia) ?? { tensao: 0, energias: [] }
    atual.tensao = Math.max(atual.tensao, c.ansiedade, c.irritacao)
    atual.energias.push(c.energia)
    mapa.set(c.dia, atual)
  }
  return mapa
}

export type DadosPadroes = {
  checkins: Checkin[]
  sintomas: RegistroSintoma[]
  sonos: RegistroSono[]
  remedios: Remedio[]
  doses: RegistroDose[]
  /** período: de "inicio" até o dia antes de "hoje" (hoje ainda não acabou) */
  inicio: Dia
  hoje: Dia
}

export function padroes(d: DadosPadroes): Padrao[] {
  const saida: Padrao[] = []
  const dias = porDia(d.checkins.filter((c) => c.dia >= d.inicio && c.dia < d.hoje))
  const sonoDaNoiteAnterior = new Map(d.sonos.map((s) => [somarDias(s.noite, 1), minutosDeSono(s)]))

  // 1 e 2: noites com menos de 6 h e o dia seguinte
  const curtos: Array<{ tensao: number; energia: number }> = []
  const outros: Array<{ tensao: number; energia: number }> = []
  for (const [dia, v] of dias) {
    const sono = sonoDaNoiteAnterior.get(dia)
    if (sono === undefined) continue
    ;(sono < 6 * 60 ? curtos : outros).push({ tensao: v.tensao, energia: media(v.energias) })
  }
  if (curtos.length >= MINIMO_DIAS && outros.length >= MINIMO_DIAS) {
    const [tc, to] = [media(curtos.map((x) => x.tensao)), media(outros.map((x) => x.tensao))]
    if (tc - to >= DIFERENCA_MINIMA) saida.push({ tipo: 'sonoTensao', curto: umaCasa(tc), outros: umaCasa(to) })
    const [ec, eo] = [media(curtos.map((x) => x.energia)), media(outros.map((x) => x.energia))]
    if (eo - ec >= DIFERENCA_MINIMA) saida.push({ tipo: 'sonoEnergia', curto: umaCasa(ec), outros: umaCasa(eo) })
  }

  // 3: dias com alguma dose sem tomar e a quantidade de sintomas anotados
  const sintomasPorDia = new Map<Dia, number>()
  for (const s of d.sintomas) sintomasPorDia.set(s.dia, (sintomasPorDia.get(s.dia) ?? 0) + 1)
  const status = new Map(d.doses.map((r) => [r.id, r.status]))
  const semTomar: number[] = []
  const tomou: number[] = []
  for (let dia = d.inicio; dia < d.hoje; dia = somarDias(dia, 1)) {
    // doses de antes de o remédio ser cadastrado não contam como "sem tomar"
    const previstas = dosesDoDia(d.remedios, dia).filter((p) => p.quando >= new Date(p.remedio.criadoEm))
    if (!previstas.length) continue
    const faltou = previstas.some((p) => status.get(p.id) !== 'tomei')
    ;(faltou ? semTomar : tomou).push(sintomasPorDia.get(dia) ?? 0)
  }
  if (semTomar.length >= MINIMO_DIAS && tomou.length >= MINIMO_DIAS) {
    const [ms, mt] = [media(semTomar), media(tomou)]
    if (ms - mt >= 1) saida.push({ tipo: 'doseSintomas', semTomar: umaCasa(ms), tomou: umaCasa(mt) })
  }

  // 4: dia da semana com mais tensão anotada
  const porSemana = new Map<number, number[]>()
  for (const [dia, v] of dias) {
    const ds = momento(dia, '12:00').getDay()
    porSemana.set(ds, [...(porSemana.get(ds) ?? []), v.tensao])
  }
  const todas = [...dias.values()].map((v) => v.tensao)
  if (todas.length) {
    const geral = media(todas)
    const candidatos = [...porSemana]
      .filter(([, xs]) => xs.length >= MINIMO_DIAS)
      .map(([diaSemana, xs]) => ({ diaSemana, media: media(xs) }))
      .sort((a, b) => b.media - a.media)
    const topo = candidatos[0]
    if (topo && topo.media - geral >= DIFERENCA_MINIMA) {
      saida.push({ tipo: 'diaDaSemana', diaSemana: topo.diaSemana, media: umaCasa(topo.media), geral: umaCasa(geral) })
    }
  }
  return saida
}
