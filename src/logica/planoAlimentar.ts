// Plano alimentar da pessoa (o PDF que ela recebeu): o app lê o texto no próprio aparelho, acha as refeições, os
// horários e as opções de cada uma, e a pessoa confere antes de salvar. Nada sai do aparelho.
// O app não julga o plano: mostra o que está escrito, na hora de cada refeição.

import { IDS_REFEICAO, type IdRefeicao, type Refeicao } from './alimentacao'

/** Uma opção de uma refeição: os itens, um por linha ("2 fatias de pão integral", "1 ovo mexido"). */
export type OpcaoPlano = string[]

export type RefeicaoPlano = {
  id: IdRefeicao
  /** como está escrito no plano ("Colação", "Café da manhã") */
  nome?: string
  hora?: string
  opcoes: OpcaoPlano[]
}

export type PlanoAlimentar = {
  refeicoes: RefeicaoPlano[]
  /** o PDF guardado no aparelho (sem PDF: plano escrito à mão) */
  arquivo?: { nome: string; tamanho: number }
  salvoEm: string
}

const normalizar = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

/** "07:00", "7h", "7 h", "12h30", "12:30h", "7 horas" → 'HH:MM'. */
export function horaDoTexto(texto: string): string | undefined {
  const m = normalizar(texto).match(/(?:^|[^\d,.])([01]?\d|2[0-3])\s*(?::\s*([0-5]\d)\s*(?:h|hs)?|(?:hs|horas?|h)(?![a-z])\s*([0-5]\d)?)(?!\d)/)
  if (!m) return undefined
  const minutos = m[2] ?? m[3] ?? '00'
  return `${m[1].padStart(2, '0')}:${minutos}`
}

/** Nomes de refeição; "lanche" sozinho vira lanche da manhã ou da tarde pelo horário (ou pela posição). */
type Tipo = IdRefeicao | 'lanche?'
const NOMES: Array<[string, Tipo]> = (
  [
    ['cafe da manha', 'cafe'],
    ['desjejum', 'cafe'],
    ['pequeno almoco', 'cafe'],
    ['lanche da manha', 'lancheManha'],
    ['lanche manha', 'lancheManha'],
    ['lanche matinal', 'lancheManha'],
    ['colacao', 'lancheManha'],
    ['lanche da tarde', 'lanche'],
    ['lanche tarde', 'lanche'],
    ['lanche vespertino', 'lanche'],
    ['cafe da tarde', 'lanche'],
    ['merenda', 'lanche'],
    ['almoco', 'almoco'],
    ['jantar', 'jantar'],
    ['janta', 'jantar'],
    ['ceia', 'ceia'],
    ['cafe', 'cafe'],
    ['lanche', 'lanche?'],
  ] as Array<[string, Tipo]>
).sort((a, b) => b[0].length - a[0].length)

/** O que pode sobrar numa linha de título além do nome e do horário ("Refeição 1 –", "às", "horário"). */
const ENCHIMENTO = /\b(refeicao|refeicoes|horario|as|a|de|do|da|e|opcoes|opcao|min|h|hs|horas?|\d+[aoªº]?)\b/g

const SECOES_FORA = /^(lista de )?(substituic|orientac|observac|recomendac|dicas|suplement|hidratac|lista de compras|informac)/

const MARCA_OPCAO = /^(?:opcao|op\.)\s*(?:\d+|[a-d]\b|i{1,3}\b)?\s*[:.)\-–—]?\s*(.*)$/

const tirarMarcador = (s: string) => s.replace(/^[\s•·▪►●◦*\-–—✓]+/, '').trim()

/** Primeira letra maiúscula, o resto como está (ou minúsculo, se veio tudo em maiúsculas). */
function capitalizar(s: string): string {
  const base = s === s.toUpperCase() ? s.toLowerCase() : s
  return base.charAt(0).toUpperCase() + base.slice(1)
}

type Cabecalho = { tipo: Tipo; nome?: string; hora?: string; resto?: string }

/** É título de refeição? Ex.: "CAFÉ DA MANHÃ – 7h", "07:00 Almoço", "Refeição 3: Almoço (12h30)", "Ceia: 1 iogurte". */
export function lerCabecalho(linha: string): Cabecalho | undefined {
  const original = tirarMarcador(linha.normalize('NFC'))
  if (!original || original.length > 90) return undefined
  const sep = original.search(/:|\s[–—-]\s|\s[–—]|[–—]\s/)
  const tentativas: Array<[string, string]> = [[original, '']]
  if (sep > 0) tentativas.push([original.slice(0, sep), original.slice(sep).replace(/^[:\s–—-]+/, '').trim()])
  for (const [cabeca, resto] of tentativas) {
    const n = normalizar(cabeca)
    const achado = NOMES.find(([nome]) => new RegExp(`(^|[^a-z])${nome}([^a-z]|$)`).test(n))
    if (!achado) continue
    const [nome, tipo] = achado
    const sobra = n.replace(nome, ' ').replace(/\d{1,2}\s*[:h]\s*\d{0,2}/g, ' ').replace(ENCHIMENTO, ' ').replace(/[^a-z]/g, '')
    if (sobra.length > 2) continue
    const i = n.indexOf(nome)
    const trecho = cabeca.slice(i, i + nome.length)
    let hora = horaDoTexto(cabeca)
    let primeiro = resto
    // "Café da manhã: 7h" ou "Almoço – às 12h30": o resto é só o horário
    if (resto && !hora && horaDoTexto(resto) && normalizar(resto).replace(/\d{1,2}\s*[:h]\s*\d{0,2}/g, ' ').replace(ENCHIMENTO, ' ').replace(/[^a-z]/g, '').length <= 2) {
      hora = horaDoTexto(resto)
      primeiro = ''
    }
    return { tipo, nome: normalizar(trecho) === nome ? capitalizar(trecho) : undefined, hora, resto: primeiro || undefined }
  }
  return undefined
}

function linhaDeRuido(n: string): boolean {
  return !n.replace(/[^a-z0-9]/g, '') || /^pagina\s*\d+/.test(n) || /^\d+\s*(\/|de)\s*\d+$/.test(n.trim())
}

/**
 * Lê as linhas de texto do plano e devolve as refeições encontradas, na ordem do dia.
 * "Opção 1", "Opção 2" (ou uma linha só com "ou") separam as opções; sem isso, a refeição tem uma opção só.
 * O que vem antes da primeira refeição (nome, dados do profissional) e as seções de orientações ficam de fora.
 */
export function lerPlano(linhas: string[]): RefeicaoPlano[] {
  const achadas: Array<RefeicaoPlano & { tipo: Tipo }> = []
  let atual: (RefeicaoPlano & { tipo: Tipo }) | undefined
  const novaOpcao = () => atual && atual.opcoes.at(-1)?.length !== 0 && atual.opcoes.push([])
  const item = (texto: string) => {
    if (!atual) return
    if (!atual.opcoes.length) atual.opcoes.push([])
    atual.opcoes.at(-1)!.push(texto)
  }

  for (const bruta of linhas) {
    const linha = tirarMarcador(bruta.normalize('NFC'))
    const n = normalizar(linha)
    if (linhaDeRuido(n)) continue
    const cab = lerCabecalho(linha)
    if (cab) {
      atual = { tipo: cab.tipo, id: 'cafe', nome: cab.nome, hora: cab.hora, opcoes: [] }
      achadas.push(atual)
      if (cab.resto) {
        const op = normalizar(cab.resto).match(MARCA_OPCAO)
        item(op ? cab.resto.slice(cab.resto.length - op[1].length) : cab.resto)
      }
      continue
    }
    if (SECOES_FORA.test(n) && linha.length <= 60) {
      atual = undefined
      continue
    }
    if (!atual) continue
    const op = n.match(MARCA_OPCAO)
    if (op || n === 'ou') {
      novaOpcao()
      const resto = op?.[1] ? linha.slice(linha.length - op[1].length).trim() : ''
      if (resto) item(resto)
      continue
    }
    item(linha)
  }

  // "lanche" sozinho: pelo horário (antes do meio-dia é o da manhã) ou por vir antes do almoço
  let viuAlmoco = false
  for (const r of achadas) {
    if (r.tipo === 'almoco') viuAlmoco = true
    r.id = r.tipo !== 'lanche?' ? r.tipo : r.hora ? (r.hora < '12:00' ? 'lancheManha' : 'lanche') : viuAlmoco ? 'lanche' : 'lancheManha'
  }

  // a mesma refeição duas vezes (ex.: dias diferentes): as opções se juntam
  const porId = new Map<IdRefeicao, RefeicaoPlano>()
  for (const r of achadas) {
    const opcoes = r.opcoes.filter((o) => o.length)
    const ja = porId.get(r.id)
    if (ja) {
      ja.opcoes.push(...opcoes)
      ja.hora ??= r.hora
      ja.nome ??= r.nome
    } else porId.set(r.id, { id: r.id, ...(r.nome ? { nome: r.nome } : {}), ...(r.hora ? { hora: r.hora } : {}), opcoes })
  }
  return [...porId.values()].sort((a, b) => IDS_REFEICAO.indexOf(a.id) - IDS_REFEICAO.indexOf(b.id))
}

// ---------- conferir e editar ----------

/** Para o campo de texto: uma opção por bloco, com uma linha em branco entre as opções. */
export function opcoesParaTexto(opcoes: OpcaoPlano[]): string {
  return opcoes.map((o) => o.join('\n')).join('\n\n')
}

/** Do campo de texto para as opções: linha em branco (ou "Opção 2") começa outra opção. */
export function textoParaOpcoes(texto: string): OpcaoPlano[] {
  const opcoes: OpcaoPlano[] = [[]]
  for (const bruta of texto.split(/\r?\n/)) {
    const linha = tirarMarcador(bruta)
    const n = normalizar(linha)
    const op = n.match(MARCA_OPCAO)
    if (!linha || op || n === 'ou') {
      if (opcoes.at(-1)!.length) opcoes.push([])
      const resto = op?.[1] ? linha.slice(linha.length - op[1].length).trim() : ''
      if (resto) opcoes.at(-1)!.push(resto)
      continue
    }
    opcoes.at(-1)!.push(linha)
  }
  return opcoes.filter((o) => o.length)
}

/** Refeições sem horário e sem opções não entram (sobram de um PDF que não deu para ler direito). */
export function limparPlano(refeicoes: RefeicaoPlano[]): RefeicaoPlano[] {
  return refeicoes
    .filter((r) => r.hora || r.opcoes.length)
    .sort((a, b) => (a.hora && b.hora ? a.hora.localeCompare(b.hora) : IDS_REFEICAO.indexOf(a.id) - IDS_REFEICAO.indexOf(b.id)))
}

/** Usar o plano nas refeições do app: as do plano ficam ligadas, com o horário dele; as outras, desligadas. */
export function aplicarNoConfig(refeicoes: Refeicao[], plano: RefeicaoPlano[]): Refeicao[] {
  return refeicoes.map((r) => {
    const p = plano.find((x) => x.id === r.id)
    return p ? { ...r, ativa: true, hora: p.hora ?? r.hora } : { ...r, ativa: false }
  })
}

// ---------- o que posso comer agora ----------

const minutosDe = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5))

/**
 * A refeição do plano para agora: do horário dela até o horário da próxima (a última vai até a meia-noite).
 * Antes da primeira do dia, nenhuma; `proxima` diz qual vem depois.
 */
export function refeicaoDoHorario(plano: RefeicaoPlano[], agora: Date): { atual?: RefeicaoPlano; proxima?: RefeicaoPlano } {
  const comHora = plano.filter((r) => r.hora).sort((a, b) => a.hora!.localeCompare(b.hora!))
  const m = agora.getHours() * 60 + agora.getMinutes()
  const atual = comHora.filter((r) => minutosDe(r.hora!) <= m).at(-1)
  const proxima = comHora.find((r) => minutosDe(r.hora!) > m)
  return { atual, proxima }
}
