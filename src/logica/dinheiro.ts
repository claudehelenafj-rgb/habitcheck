// Dinheiro (estratégias gerais do guia: lembrete com a ação escrita, deixar à vista, revisão semanal).
// Tudo fica no aparelho; nada se conecta ao banco; sem conselho de investimento.
// Valores sempre em centavos (números inteiros, sem erro de arredondamento), mostrados em reais.

import { diasEntre, type Dia } from './datas'

export type Centavos = number
/** 'AAAA-MM' */
export type Mes = string

export type Pagamento = { mes: Mes; quando: string; valor?: Centavos }

export type Conta = {
  id: string
  nome: string
  /** opcional: há contas que mudam todo mês */
  valor?: Centavos
  /** dia do vencimento (1 a 31); em mês mais curto, vence no último dia */
  dia: number
  /** todo mês ou uma vez só (no mês `mes`) */
  repete: boolean
  mes?: Mes
  /** a ação do lembrete, escrita pela pessoa (ex.: "pagar no app do banco e marcar aqui") */
  acao?: string
  /** avisar alguns dias antes (0 = só no dia) */
  avisarDiasAntes: number
  pagamentos: Pagamento[]
  criadaEm: string // ISO
}

const p2 = (n: number) => String(n).padStart(2, '0')

export const mesDe = (dia: Dia): Mes => dia.slice(0, 7)

export function somarMeses(mes: Mes, n: number): Mes {
  const [a, m] = mes.split('-').map(Number)
  const total = a * 12 + (m - 1) + n
  return `${Math.floor(total / 12)}-${p2((total % 12) + 1)}`
}

export function ultimoDiaDoMes(mes: Mes): number {
  const [a, m] = mes.split('-').map(Number)
  return new Date(a, m, 0).getDate()
}

/** Vencimento no mês: dia 31 em mês de 30 dias vence no dia 30; em fevereiro, no 28 (ou 29). */
export function vencimentoNoMes(conta: Pick<Conta, 'dia'>, mes: Mes): Dia {
  return `${mes}-${p2(Math.min(conta.dia, ultimoDiaDoMes(mes)))}`
}

/** Conta mensal só vence nos meses em que já existia no dia do vencimento (cadastrar no dia 15 não cobra o dia 10). */
function existiaNoVencimento(conta: Conta, mes: Mes): boolean {
  return !conta.repete || vencimentoNoMes(conta, mes) >= conta.criadaEm.slice(0, 10)
}

export const pagaNoMes = (conta: Pick<Conta, 'pagamentos'>, mes: Mes) => conta.pagamentos.some((p) => p.mes === mes)

export type EstadoConta = 'atrasada' | 'hoje' | 'perto' | 'depois'

export type Vencimento = { mes: Mes; dia: Dia; diasAte: number; estado: EstadoConta }

function vencimento(conta: Conta, mes: Mes, hoje: Dia): Vencimento {
  const dia = vencimentoNoMes(conta, mes)
  const diasAte = diasEntre(hoje, dia)
  const estado: EstadoConta = diasAte < 0 ? 'atrasada' : diasAte === 0 ? 'hoje' : diasAte <= Math.max(conta.avisarDiasAntes, 3) ? 'perto' : 'depois'
  return { mes, dia, diasAte, estado }
}

/**
 * O próximo vencimento ainda não pago. Conta mensal: olha o mês passado (atrasada, se não foi paga), este mês e o
 * próximo, só os vencimentos depois de a conta ser cadastrada. Conta de uma vez: o mês dela, até ser paga.
 * Nada para pagar: null.
 */
export function proximoVencimento(conta: Conta, hoje: Dia): Vencimento | null {
  if (!conta.repete) {
    if (!conta.mes || pagaNoMes(conta, conta.mes)) return null
    return vencimento(conta, conta.mes, hoje)
  }
  const atual = mesDe(hoje)
  for (const mes of [somarMeses(atual, -1), atual, somarMeses(atual, 1)]) {
    if (pagaNoMes(conta, mes) || !existiaNoVencimento(conta, mes)) continue
    return vencimento(conta, mes, hoje)
  }
  return null
}

/** Lembrete de hoje: "antes" (no dia de avisar) ou "dia" (no vencimento). Só se ainda não foi paga. */
export function avisoDeConta(conta: Conta, hoje: Dia): { tipo: 'antes' | 'dia'; vencimento: Vencimento } | null {
  const v = proximoVencimento(conta, hoje)
  if (!v) return null
  if (v.diasAte === 0) return { tipo: 'dia', vencimento: v }
  if (conta.avisarDiasAntes > 0 && v.diasAte === conta.avisarDiasAntes) return { tipo: 'antes', vencimento: v }
  return null
}

export function marcarPaga(conta: Conta, mes: Mes, agora: Date): Conta {
  if (pagaNoMes(conta, mes)) return conta
  return { ...conta, pagamentos: [...conta.pagamentos, { mes, quando: agora.toISOString(), ...(conta.valor ? { valor: conta.valor } : {}) }] }
}

export function desmarcarPaga(conta: Conta, mes: Mes): Conta {
  return { ...conta, pagamentos: conta.pagamentos.filter((p) => p.mes !== mes) }
}

/** Contas da mais urgente para a mais longe (as sem nada para pagar vão para o fim). */
export function ordenarContas(contas: Conta[], hoje: Dia): Array<{ conta: Conta; vencimento: Vencimento | null }> {
  return contas
    .map((conta) => ({ conta, vencimento: proximoVencimento(conta, hoje) }))
    .sort((a, b) => (a.vencimento?.diasAte ?? Infinity) - (b.vencimento?.diasAte ?? Infinity) || a.conta.nome.localeCompare(b.conta.nome))
}

/** Vencimentos que caem entre dois dias (para o calendário), pagos ou não. */
export function vencimentosEntre(contas: Conta[], de: Dia, ate: Dia): Array<{ conta: Conta; dia: Dia; paga: boolean }> {
  const lista: Array<{ conta: Conta; dia: Dia; paga: boolean }> = []
  for (const conta of contas) {
    const meses: Mes[] = []
    if (conta.repete) for (let m = mesDe(de); m <= mesDe(ate); m = somarMeses(m, 1)) meses.push(m)
    else if (conta.mes) meses.push(conta.mes)
    for (const mes of meses) {
      const dia = vencimentoNoMes(conta, mes)
      if (dia >= de && dia <= ate && existiaNoVencimento(conta, mes)) lista.push({ conta, dia, paga: pagaNoMes(conta, mes) })
    }
  }
  return lista
}

/** Resumo neutro do mês: quanto há em contas que vencem nele e quanto já foi pago (contas sem valor só contam). */
export function resumoDoMes(contas: Conta[], mes: Mes): { total: Centavos; pago: Centavos; contas: number; pagas: number } {
  let total = 0
  let pago = 0
  let quantas = 0
  let pagas = 0
  for (const c of contas) {
    const venceNoMes = c.repete ? existiaNoVencimento(c, mes) : c.mes === mes
    if (!venceNoMes) continue
    quantas++
    const pagamento = c.pagamentos.find((p) => p.mes === mes)
    const valor = pagamento?.valor ?? c.valor ?? 0
    total += valor
    if (pagamento) {
      pagas++
      pago += valor
    }
  }
  return { total, pago, contas: quantas, pagas }
}

// ---------- reais ----------

/**
 * Lê um valor escrito do jeito que der ("35", "35,9", "35.90", "R$ 1.234,56", "1234.5") e devolve em centavos.
 * Vírgula ou ponto seguidos de 1 ou 2 dígitos no fim são os centavos; os outros pontos são de milhar.
 */
export function lerValor(texto: string): Centavos | null {
  const limpo = texto.replace(/[^\d.,-]/g, '')
  if (!/\d/.test(limpo)) return null
  const m = limpo.match(/^(-?[\d.,]*?)(?:[.,](\d{1,2}))?$/)
  if (!m) return null
  const inteiro = Number((m[1] || '0').replace(/[.,]/g, ''))
  const centavos = m[2] ? Number(m[2].padEnd(2, '0')) : 0
  if (!Number.isFinite(inteiro)) return null
  return Math.round(inteiro * 100 + centavos) * (limpo.startsWith('-') ? -1 : 1)
}

export function formatarValor(centavos: Centavos, idioma = 'pt-BR'): string {
  return new Intl.NumberFormat(idioma, { style: 'currency', currency: 'BRL' }).format(centavos / 100)
}

/** Para preencher o campo de valor ao editar ("35,90"). */
export function valorParaCampo(centavos: Centavos | undefined): string {
  if (centavos === undefined) return ''
  return (centavos / 100).toFixed(2).replace('.', ',')
}

// ---------- potes da semana ----------

/** Pote da semana: quanto dá para gastar de segunda a domingo (mercado, lazer, transporte...). */
export type Pote = {
  id: string
  nome: string
  limite: Centavos
  /** palavras que levam um gasto rápido para este pote (ex.: "ifood, restaurante") */
  palavras: string[]
  ordem: number
}

export type Gasto = { id: string; valor: Centavos; descricao: string; poteId?: string; dia: Dia; quando: string }

/** Gastos da semana (segunda a domingo) do dia dado. A semana vira na segunda: cada pote começa cheio de novo. */
export function gastosDaSemana(gastos: Gasto[], semana: Dia[]): Gasto[] {
  const dias = new Set(semana)
  return gastos.filter((g) => dias.has(g.dia))
}

export function saldoDoPote(pote: Pote, gastos: Gasto[], semana: Dia[]): { gasto: Centavos; saldo: Centavos; fracao: number } {
  const gasto = gastosDaSemana(gastos, semana)
    .filter((g) => g.poteId === pote.id)
    .reduce((soma, g) => soma + g.valor, 0)
  const saldo = pote.limite - gasto
  return { gasto, saldo, fracao: pote.limite > 0 ? Math.max(0, Math.min(1, saldo / pote.limite)) : 0 }
}

const normalizar = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

/**
 * Gasto rápido na captura: "35 ifood", "35,90 mercado", "R$ 12 uber". O número vem primeiro e precisa de algo
 * escrito depois. Devolve null para o resto (vira item da caixa de entrada, como sempre).
 */
export function lerGastoRapido(linha: string): { valor: Centavos; descricao: string } | null {
  const m = linha.trim().match(/^(?:r\$\s*)?(\d[\d.]*(?:,\d{1,2})?|\d+\.\d{1,2})\s+(.*\S)$/i)
  if (!m) return null
  const valor = lerValor(m[1])
  if (!valor || valor <= 0) return null
  return { valor, descricao: m[2].trim() }
}

/** Em que pote cai o gasto: o nome do pote ou uma das palavras dele aparece na descrição. */
export function poteDoGasto(descricao: string, potes: Pote[]): Pote | undefined {
  const palavras = normalizar(descricao).split(/[^a-z0-9]+/).filter(Boolean)
  const texto = ` ${palavras.join(' ')} `
  return [...potes]
    .sort((a, b) => a.ordem - b.ordem)
    .find((p) => [p.nome, ...p.palavras].some((x) => normalizar(x) && texto.includes(` ${normalizar(x).split(/[^a-z0-9]+/).filter(Boolean).join(' ')} `)))
}

// ---------- pausa antes de comprar e cofrinho ----------

/** Compra por impulso que foi para a lista de desejos e espera 48 h antes do "ainda quero?". */
export type Desejo = { id: string; nome: string; valor?: Centavos; criadoEm: string; decididoEm?: string; decisao?: 'comprei' | 'desisti' }

/** Meta de economia (pode ficar ligada a um objetivo). */
export type Cofrinho = { id: string; nome: string; meta: Centavos; objetivoId?: string; criadoEm: string; arquivadoEm?: string }

/** Dinheiro guardado (positivo) ou tirado (negativo) de um cofrinho. */
export type Deposito = { id: string; cofrinhoId: string; valor: Centavos; dia: Dia; quando: string }

/** A compra por impulso espera 48 horas antes do "ainda quero?". */
export const ESPERA_DESEJO_H = 48

export function fimDaEspera(d: Pick<Desejo, 'criadoEm'>): Date {
  return new Date(new Date(d.criadoEm).getTime() + ESPERA_DESEJO_H * 3_600_000)
}

/** Horas que faltam para decidir (0 = já pode; nunca mais de 48, mesmo com o relógio da tela um pouco atrás). */
export function horasParaDecidir(d: Pick<Desejo, 'criadoEm'>, agora: Date): number {
  return Math.min(ESPERA_DESEJO_H, Math.max(0, Math.ceil((fimDaEspera(d).getTime() - agora.getTime()) / 3_600_000)))
}

export function prontoParaDecidir(d: Desejo, agora: Date): boolean {
  return !d.decisao && agora >= fimDaEspera(d)
}

/** O que ficou com a pessoa no mês: desejos que ela decidiu não comprar. */
export function desistenciasDoMes(desejos: Desejo[], mes: Mes): { quantos: number; valor: Centavos } {
  const lista = desejos.filter((d) => d.decisao === 'desisti' && d.decididoEm && mesDe(d.decididoEm.slice(0, 10)) === mes)
  return { quantos: lista.length, valor: lista.reduce((s, d) => s + (d.valor ?? 0), 0) }
}

export function guardadoNoCofrinho(depositos: Deposito[], cofrinhoId: string): Centavos {
  return depositos.filter((d) => d.cofrinhoId === cofrinhoId).reduce((s, d) => s + d.valor, 0)
}

export function progressoCofrinho(c: Cofrinho, depositos: Deposito[]): { guardado: Centavos; fracao: number; falta: Centavos } {
  const guardado = guardadoNoCofrinho(depositos, c.id)
  return { guardado, fracao: c.meta > 0 ? Math.max(0, Math.min(1, guardado / c.meta)) : 0, falta: Math.max(0, c.meta - guardado) }
}

/** O que foi guardado em cada um dos últimos `n` meses (só o que entrou; o que saiu conta no total, não aqui). */
export function guardadoPorMes(depositos: Deposito[], cofrinhoId: string, hoje: Dia, n = 6): Array<{ mes: Mes; valor: Centavos }> {
  const atual = mesDe(hoje)
  return Array.from({ length: n }, (_, i) => somarMeses(atual, i - n + 1)).map((mes) => ({
    mes,
    valor: depositos.filter((d) => d.cofrinhoId === cofrinhoId && d.valor > 0 && mesDe(d.dia) === mes).reduce((s, d) => s + d.valor, 0),
  }))
}
