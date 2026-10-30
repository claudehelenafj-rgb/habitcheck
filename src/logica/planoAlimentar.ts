// Plano alimentar da pessoa (o PDF que ela recebeu): o app lê o texto no próprio aparelho, acha as refeições, os
// horários e as opções de cada uma, e a pessoa confere antes de salvar. Nada sai do aparelho.
// O app não julga o plano: mostra o que está escrito, na hora de cada refeição (as calorias ficam de fora).

import { IDS_REFEICAO, type IdRefeicao, type Refeicao } from './alimentacao'

/** Uma opção de uma refeição: os itens, um por linha ("2 fatias de pão integral", "1 ovo mexido", "Obs: ..."). */
export type OpcaoPlano = string[]

export type RefeicaoPlano = {
  id: IdRefeicao
  /** como está escrito no plano ("Colação", "Café da manhã / Lanche") */
  nome?: string
  hora?: string
  /** observação do título ("todas as opções podem acompanhar salada") */
  nota?: string
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
  const m = normalizar(texto).match(/(?:^|[^\d,./])([01]?\d|2[0-3])\s*(?::\s*([0-5]\d)\s*(?:h|hs)?|(?:hs|horas?|h)(?![a-z])\s*([0-5]\d)?)(?![\d/])/)
  if (!m) return undefined
  const minutos = m[2] ?? m[3] ?? '00'
  return `${m[1].padStart(2, '0')}:${minutos}`
}

/** Tira as calorias ("— 115,00 kcal", a coluna "Kcal" do título): o app não mostra calorias. */
export function semCalorias(s: string): string {
  return s
    .replace(/\s*[—–-]?\s*\d+(?:[.,]\d+)?\s*kcal\b\.?/gi, '')
    .replace(/\s*[—–-]?\s*\bkcal\b\s*$/i, '')
    .trim()
}

/** Nomes de refeição; "lanche" sozinho vira lanche da manhã ou da tarde pelo horário (ou pela posição). */
type Tipo = IdRefeicao | 'lanche?'
const NOMES: Array<[string, Tipo]> = (
  [
    ['assim que acordar', 'acordar'],
    ['ao acordar', 'acordar'],
    ['ao despertar', 'acordar'],
    ['em jejum', 'acordar'],
    ['jejum', 'acordar'],
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

const comoPalavra = (nome: string) => new RegExp(`(^|[^a-z])${nome}(?=[^a-z]|$)`, 'g')

/** O que pode sobrar numa linha de título além do nome e do horário ("Refeição 1 –", "às", "horário", "/"). */
const ENCHIMENTO = /\b(refeicao|refeicoes|horario|as|a|ou|de|do|da|e|opcoes|opcao|min|h|hs|horas?|\d+[aoªº]?)\b/g
const HORARIO = /\d{1,2}\s*[:h]\s*\d{0,2}/g
const PARENTESES = /\(([^)]*)\)/g

/** Seções que não são refeição: a refeição em andamento acaba aí. */
const SECOES_FORA = /^(lista de )?(substituic|orientac|observac|recomendac|dicas|suplement|hidratac|lista de compras|informac)/
/** Rodapé de aviso legal no fim do documento. */
const FIM_DO_PLANO = /uso exclusivo|conteudo confidencial/

/** "Opção 2", "Substituição 1" (o jeito do Dietbox), "Alternativa 3": a próxima opção da mesma refeição. */
const MARCA_OPCAO = /^(?:opcao|op\.|substituicao|alternativa|variacao)\s*(?:\d+|[a-d]\b|i{1,3}\b)?\s*[:.)\-–—]?\s*(.*)$/

/** Observação de uma opção ("Obs: sanduíche de frango"). */
const OBS = /^(obs|observacao|dica|modo de preparo)\b/

const tirarMarcador = (s: string) => s.replace(/^[\s•·▪►●◦*\-–—✓>]+/, '').trim()
const temMarcador = (s: string) => /^\s*[•·▪►●◦*✓]/.test(s) || /^\s*[-–—]\s/.test(s)

/** Primeira letra maiúscula, o resto como está (ou minúsculo, se veio tudo em maiúsculas). */
function capitalizar(s: string): string {
  const base = s === s.toUpperCase() ? s.toLowerCase() : s
  return base.charAt(0).toUpperCase() + base.slice(1)
}

/** O nome como está no plano, sem horário, numeração ("Refeição 3") e separadores. */
function nomeLimpo(cabeca: string): string | undefined {
  const nome = cabeca
    .replace(PARENTESES, ' ')
    .replace(/(?:^|\s)(?:as|às)?\s*\d{1,2}\s*(?::\s*\d{2}\s*(?:h|hs)?|(?:hs|horas?|h)(?![a-zà-ú])\s*(?:\d{2})?)(?:min)?/gi, ' ')
    .replace(/^\s*refei[cç][aã]o\s*\d*\s*[ªº]?/i, ' ')
    .replace(/^[\s:–—\-|]+|[\s:–—\-|]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return nome ? capitalizar(nome) : undefined
}

type Cabecalho = { tipo: Tipo; nome?: string; hora?: string; nota?: string; resto?: string }

/**
 * É título de refeição? Ex.: "CAFÉ DA MANHÃ – 7h", "07:00 Almoço", "Refeição 3: Almoço (12h30)", "Ceia: 1 iogurte",
 * "09:45 - Café da manhã / Lanche — Kcal", "19:30 - Jantar (todas as opções com salada)".
 */
export function lerCabecalho(linha: string): Cabecalho | undefined {
  const original = semCalorias(tirarMarcador(linha.normalize('NFC')))
  if (!original || original.length > 110) return undefined
  // o ":" dos horários (09:45) não separa título e conteúdo
  const mascara = original.replace(/\d{1,2}:\d{2}/g, (m) => '0'.repeat(m.length)).replace(PARENTESES, (m) => '0'.repeat(m.length))
  const sep = mascara.search(/:|\s[–—-]\s|\s[–—]|[–—]\s/)
  const tentativas: Array<[string, string]> = [[original, '']]
  if (sep > 0) tentativas.push([original.slice(0, sep), original.slice(sep).replace(/^[:\s–—-]+/, '').trim()])
  for (const [cabeca, resto] of tentativas) {
    const n = normalizar(cabeca)
    const achado = NOMES.find(([nome]) => new RegExp(comoPalavra(nome).source).test(n))
    if (!achado) continue
    // sobra o quê, tirando os nomes de refeição ("Café da manhã / Lanche"), o horário, os parênteses e o enchimento?
    let sobra = n.replace(PARENTESES, ' ')
    for (const [nome] of NOMES) sobra = sobra.replace(comoPalavra(nome), ' ')
    sobra = sobra.replace(HORARIO, ' ').replace(ENCHIMENTO, ' ').replace(/[^a-z]/g, '')
    if (sobra.length > 2) continue
    const notas = [...cabeca.matchAll(PARENTESES)].map((m) => m[1].trim()).filter((x) => x.length >= 6 && !horaDoTexto(x))
    let hora = horaDoTexto(cabeca)
    let primeiro = resto
    // "Café da manhã: 7h" ou "Almoço – às 12h30": o resto é só o horário
    if (resto && !hora && horaDoTexto(resto) && normalizar(resto).replace(HORARIO, ' ').replace(ENCHIMENTO, ' ').replace(/[^a-z]/g, '').length <= 2) {
      hora = horaDoTexto(resto)
      primeiro = ''
    }
    return {
      tipo: achado[1],
      nome: nomeLimpo(cabeca),
      hora,
      ...(notas.length ? { nota: capitalizar(notas.join('; ')) } : {}),
      resto: primeiro || undefined,
    }
  }
  return undefined
}

/** Cabeçalho e rodapé de página (data e hora da impressão, endereço do site, "Página 1 de 3"), linhas vazias. */
function linhaDeRuido(n: string): boolean {
  return (
    !n.replace(/[^a-z0-9]/g, '') ||
    /^pagina\s*\d+/.test(n) ||
    /^\d+\s*(\/|de)\s*\d+$/.test(n.trim()) ||
    /^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(n) ||
    /https?:\/\/|www\./.test(n) ||
    /^total\b/.test(n)
  )
}

type EmLeitura = RefeicaoPlano & { tipo: Tipo; comMarcadores: boolean; ultimoComMarcador: boolean }

/**
 * Lê as linhas de texto do plano e devolve as refeições encontradas, na ordem do dia.
 * "Opção 1", "Substituição 2" (ou uma linha só com "ou") separam as opções; sem isso, a refeição tem uma opção só.
 * O que vem antes da primeira refeição (nome, dados do profissional, metas) e as seções de orientações ficam de fora.
 * Num plano com marcadores (•), a linha sem marcador que continua a de cima ("(40g)", "pequena (180ml)") se junta a ela.
 */
export function lerPlano(linhas: string[]): RefeicaoPlano[] {
  const achadas: EmLeitura[] = []
  let atual: EmLeitura | undefined
  const novaOpcao = () => {
    if (atual && atual.opcoes.at(-1)?.length !== 0) atual.opcoes.push([])
  }
  const item = (texto: string, comMarcador: boolean) => {
    if (!atual || !texto) return
    if (!atual.opcoes.length) atual.opcoes.push([])
    atual.opcoes.at(-1)!.push(texto)
    atual.ultimoComMarcador = comMarcador
    if (comMarcador) atual.comMarcadores = true
  }

  for (const bruta of linhas) {
    const marcado = temMarcador(bruta)
    const linha = semCalorias(tirarMarcador(bruta.normalize('NFC')))
    const n = normalizar(linha)
    if (FIM_DO_PLANO.test(n)) {
      atual = undefined
      continue
    }
    if (linhaDeRuido(n)) continue
    const cab = lerCabecalho(linha)
    // no meio de uma refeição, um item com marcador só vira título se tiver horário ("• Café" é comida)
    if (cab && !(marcado && atual && !cab.hora)) {
      atual = { tipo: cab.tipo, id: 'cafe', nome: cab.nome, hora: cab.hora, nota: cab.nota, opcoes: [], comMarcadores: false, ultimoComMarcador: false }
      achadas.push(atual)
      if (cab.resto) {
        const op = normalizar(cab.resto).match(MARCA_OPCAO)
        item(op ? cab.resto.slice(cab.resto.length - op[1].length) : cab.resto, false)
      }
      continue
    }
    if (!atual) continue
    const op = n.match(MARCA_OPCAO)
    if (op || n === 'ou') {
      novaOpcao()
      const resto = op?.[1] ? linha.slice(linha.length - op[1].length).trim() : ''
      if (resto) item(resto, false)
      continue
    }
    if (SECOES_FORA.test(n) && linha.length <= 60) {
      atual = undefined
      continue
    }
    const opcao = atual.opcoes.at(-1)
    const anterior = opcao?.at(-1)
    const continua =
      !marcado &&
      anterior !== undefined &&
      atual.comMarcadores &&
      !OBS.test(n) &&
      (atual.ultimoComMarcador || OBS.test(normalizar(anterior)) || /^[a-z(]/.test(n) || /^ou\b/.test(n))
    if (continua) opcao![opcao!.length - 1] = `${anterior} ${linha}`
    else item(linha, marcado)
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
      ja.nota ??= r.nota
    } else
      porId.set(r.id, {
        id: r.id,
        ...(r.nome ? { nome: r.nome } : {}),
        ...(r.hora ? { hora: r.hora } : {}),
        ...(r.nota ? { nota: r.nota } : {}),
        opcoes,
      })
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

/**
 * Usar o plano nas refeições do app: as do plano ficam ligadas, com o horário dele; as outras, desligadas.
 * `avisar`: liga o lembrete das refeições do plano que têm horário.
 */
export function aplicarNoConfig(refeicoes: Refeicao[], plano: RefeicaoPlano[], avisar = false): Refeicao[] {
  return refeicoes.map((r) => {
    const p = plano.find((x) => x.id === r.id)
    if (!p) return { ...r, ativa: false }
    const hora = p.hora ?? r.hora
    return { ...r, ativa: true, hora, ...(avisar && hora ? { lembrar: true } : {}) }
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

/** A refeição do plano que corresponde a uma refeição do app. */
export function doPlano(plano: PlanoAlimentar | null | undefined, id: IdRefeicao): RefeicaoPlano | undefined {
  return plano?.refeicoes.find((r) => r.id === id)
}

/** "Obs: sanduíche de frango" → a observação, se a opção tiver uma. */
export function observacao(item: string): string | undefined {
  const m = item.match(/^(?:obs|observa[cç][aã]o|dica)\s*[:.-]\s*(.*)$/i)
  return m ? m[1].trim() : undefined
}

/**
 * Texto curto das opções para o aviso: a observação de cada opção (o resumo que o plano já dá) ou os itens dela,
 * separados por "ou". Passando do limite, corta com "…".
 */
export function resumoDasOpcoes(opcoes: OpcaoPlano[], ou: string, limite = 160): string {
  const partes = opcoes.map((o) => {
    const obs = o.map(observacao).find(Boolean)
    return obs ? obs.split(/\s*->/)[0].replace(/[.\s]+$/, '') : o.filter((x) => !observacao(x)).join(', ')
  })
  const texto = partes.filter(Boolean).join(` ${ou} `)
  return texto.length > limite ? `${texto.slice(0, limite - 1).trimEnd()}…` : texto
}
