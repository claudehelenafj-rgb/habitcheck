// Sugestões de atividade para o momento (guia de saúde mental: atenção plena, movimento, interesses que recarregam).
// Junta as ideias da pessoa, os hobbies e o que já ajudou nos sintomas; a energia do momento filtra,
// a tensão pede algo que acalme, e as respostas de "ajudou?" sobem ou descem cada ideia.

import type { NomeAdesivo } from '../componentes/Adesivo'
import { faixa, faixaDoCheckin, type Checkin } from './checkin'
import type { Dia } from './datas'
import type { RegistroSintoma } from './sintomas'

export type NivelEnergia = 'baixa' | 'media' | 'alta'
export const NIVEIS: NivelEnergia[] = ['baixa', 'media', 'alta']
const ORDEM: Record<NivelEnergia, number> = { baixa: 0, media: 1, alta: 2 }

export function nivelEnergia(valor: number): NivelEnergia {
  const f = faixa(valor)
  return f === 'leve' ? 'baixa' : f === 'media' ? 'media' : 'alta'
}

/** Ideia da lista da pessoa: quanta energia pede e se ajuda a acalmar. */
export type Atividade = { id: string; texto: string; energia: NivelEnergia; acalma: boolean }

export const ATIVIDADES_INICIAIS: Atividade[] = [
  { id: 'respirar', texto: 'Respirar devagar por 3 minutos', energia: 'baixa', acalma: true },
  { id: 'atencao', texto: 'Atenção plena de 5 minutos: notar o que vejo, ouço e sinto', energia: 'baixa', acalma: true },
  { id: 'agua', texto: 'Beber um copo d’água', energia: 'baixa', acalma: true },
  { id: 'deitar', texto: 'Deitar 10 minutos com música calma', energia: 'baixa', acalma: true },
  { id: 'banho', texto: 'Tomar um banho morno', energia: 'baixa', acalma: true },
  { id: 'caminhar', texto: 'Caminhar 10 minutos', energia: 'media', acalma: true },
  { id: 'alongar', texto: 'Alongar por 5 minutos', energia: 'media', acalma: true },
  { id: 'mensagem', texto: 'Mandar mensagem para alguém de confiança', energia: 'media', acalma: false },
  { id: 'superficie', texto: 'Arrumar só uma superfície', energia: 'media', acalma: false },
  { id: 'dancar', texto: 'Dançar uma música', energia: 'alta', acalma: false },
  { id: 'caminhada', texto: 'Caminhada de 20 minutos', energia: 'alta', acalma: true },
]

export type OrigemSugestao = 'atividade' | 'hobby' | 'ajudou'

export type Candidato = {
  /** identifica a ideia no histórico de "ajudou?": origem + id ou texto */
  chave: string
  texto: string
  origem: OrigemSugestao
  energia: NivelEnergia
  acalma: boolean
  adesivo?: NomeAdesivo
  hobbyId?: string
  /** hobby: quantas vezes o intervalo combinado já passou (0 = em dia) */
  atraso?: number
  /** "o que ajudou" nos sintomas: quantas vezes foi anotado */
  vezesAjudou?: number
}

export type Resposta = 'sim' | 'maisOuMenos' | 'nao'

export type RegistroSugestao = {
  id: string
  chave: string
  texto: string
  origem: OrigemSugestao
  hobbyId?: string
  quando: string // ISO
  dia: Dia
  resposta?: Resposta
  /** a pessoa preferiu não responder */
  dispensada?: boolean
}

export type Contexto = {
  energia?: NivelEnergia
  /** ansiedade ou irritação de 7 a 10 (ou sintoma de 7 a 10): prefere o que acalma */
  tensaoAlta: boolean
  origem: 'checkin' | 'sintoma' | 'nenhum'
  quando?: string
}

/** Só conta como "agora" o que foi registrado nas últimas horas. */
export const HORAS_DE_CONTEXTO = 4

export function contexto(checkin: Checkin | undefined, sintoma: RegistroSintoma | undefined, agora: Date): Contexto {
  const recente = (iso?: string) => !!iso && agora.getTime() - new Date(iso).getTime() <= HORAS_DE_CONTEXTO * 3_600_000
  const c = recente(checkin?.quando) ? checkin : undefined
  const s = recente(sintoma?.quando) ? sintoma : undefined
  // vale o mais novo dos dois
  if (c && (!s || c.quando >= s.quando)) {
    return { energia: nivelEnergia(c.energia), tensaoAlta: faixaDoCheckin(c) === 'alta', origem: 'checkin', quando: c.quando }
  }
  if (s) return { tensaoAlta: s.intensidade >= 7, origem: 'sintoma', quando: s.quando }
  return { tensaoAlta: false, origem: 'nenhum' }
}

const PESO_RESPOSTA: Record<Resposta, number> = { sim: 3, maisOuMenos: 1, nao: -3 }

export function pontuar(c: Candidato, ctx: Contexto, historico: RegistroSugestao[], hoje: Dia): number {
  const respostas = historico
    .filter((r) => r.chave === c.chave && r.resposta)
    .sort((a, b) => b.quando.localeCompare(a.quando))
    .slice(0, 5)
  let pontos = respostas.reduce((s, r) => s + PESO_RESPOSTA[r.resposta!], 0)
  if (ctx.tensaoAlta) pontos += c.acalma ? 2 : -2
  if (c.atraso) pontos += Math.min(3, c.atraso)
  if (c.vezesAjudou) pontos += Math.min(3, c.vezesAjudou)
  // já escolhida hoje: dá a vez para outras ideias
  if (historico.some((r) => r.chave === c.chave && r.dia === hoje)) pontos -= 1
  return pontos
}

/**
 * Ideias em ordem. Nunca sugere algo que pede mais energia do que a pessoa tem agora.
 * "pagina" mostra as próximas (botão "Outras ideias"); depois da última, volta ao começo.
 */
export function sugerir(candidatos: Candidato[], ctx: Contexto, historico: RegistroSugestao[], hoje: Dia, quantas = 3, pagina = 0): Candidato[] {
  const energia = ctx.energia ?? 'baixa'
  const possiveis = candidatos
    .filter((c) => ORDEM[c.energia] <= ORDEM[energia])
    .map((c) => ({ c, pontos: pontuar(c, ctx, historico, hoje) }))
    .sort((a, b) => b.pontos - a.pontos || a.c.texto.localeCompare(b.c.texto, 'pt-BR'))
    .map((x) => x.c)
  if (!possiveis.length) return []
  const paginas = Math.ceil(possiveis.length / quantas)
  const inicio = (pagina % paginas) * quantas
  return possiveis.slice(inicio, inicio + quantas)
}

const normal = (t: string) => t.trim().toLocaleLowerCase('pt-BR')

/** Junta as três fontes de ideias, sem repetir o mesmo texto. */
export function juntarCandidatos(
  atividades: Atividade[],
  hobbies: Array<{ id: string; nome: string; adesivo: NomeAdesivo; atraso: number }>,
  ajudou: Array<{ nome: string; vezes: number }>,
): Candidato[] {
  const vistos = new Set<string>()
  const saida: Candidato[] = []
  const por = (c: Candidato) => {
    if (vistos.has(normal(c.texto))) return
    vistos.add(normal(c.texto))
    saida.push(c)
  }
  // hobbies pedem um pouco de energia; com energia baixa, o app sugere descanso
  for (const h of hobbies) por({ chave: `hobby:${h.id}`, texto: h.nome, origem: 'hobby', energia: 'media', acalma: false, adesivo: h.adesivo, hobbyId: h.id, atraso: h.atraso })
  for (const a of atividades) por({ chave: `atividade:${a.id}`, texto: a.texto, origem: 'atividade', energia: a.energia, acalma: a.acalma })
  // o que já ajudou num sintoma: pode ser pouca coisa (água, silêncio), então serve até com energia baixa
  for (const a of ajudou) por({ chave: `ajudou:${normal(a.nome)}`, texto: a.nome, origem: 'ajudou', energia: 'baixa', acalma: true, vezesAjudou: a.vezes })
  return saida
}

/** A escolha mais recente que ainda espera o "ajudou?" (de hoje ou de ontem). */
export function pendente(historico: RegistroSugestao[], hoje: Dia, ontem: Dia): RegistroSugestao | undefined {
  return historico
    .filter((r) => !r.resposta && !r.dispensada && (r.dia === hoje || r.dia === ontem))
    .sort((a, b) => b.quando.localeCompare(a.quando))[0]
}
