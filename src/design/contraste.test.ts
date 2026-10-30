import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { contraste, MINIMO_ICONE, MINIMO_TEXTO } from './contraste'

// Lê os tokens direto do CSS, para o teste nunca ficar desatualizado.
const css = readFileSync(new URL('../estilos/tokens.css', import.meta.url), 'utf8')

function bloco(seletor: string): Record<string, string> {
  const inicio = css.indexOf(seletor + ' {')
  if (inicio < 0) throw new Error(`Seletor não encontrado: ${seletor}`)
  const corpo = css.slice(inicio, css.indexOf('}', inicio))
  const vars: Record<string, string> = {}
  for (const [, nome, valor] of corpo.matchAll(/--([\w-]+):\s*([^;]+);/g)) vars[nome] = valor.trim()
  return vars
}

function resolver(vars: Record<string, string>, nome: string): string {
  let valor = vars[nome]
  for (let i = 0; i < 5 && valor?.startsWith('var('); i++) valor = vars[valor.slice(6, -1)]
  if (!valor) throw new Error(`Token sem valor: ${nome}`)
  return valor
}

const claro = bloco(':root')
const escuro = { ...claro, ...bloco(":root[data-modo='escuro']") }
// Os blocos do Índigo definem todos os tokens; o claro serve só de reserva.
const indigo = { ...claro, ...bloco("[data-tema='indigo']") }
const indigoEscuro = { ...claro, ...bloco("[data-modo='escuro'][data-tema='indigo']") }

const TONS_CLAROS = [
  'claro-lavanda',
  'claro-azul-nevoa',
  'claro-pessego',
  'claro-manteiga',
  'claro-menta',
  'claro-morango',
]
const TONS_FORTES = ['forte-rosa', 'forte-tomate', 'forte-laranja', 'forte-piscina', 'forte-agua', 'forte-chocolate']

describe.each([
  ['modo claro', claro],
  ['modo escuro', escuro],
  ['Índigo claro', indigo],
  ['Índigo escuro', indigoEscuro],
])('%s', (_modo, vars) => {
  const modoEscuro = _modo.endsWith('escuro')
  const cor = (nome: string) => resolver(vars, nome)

  it('texto principal passa AA sobre fundo e papel', () => {
    for (const fundo of ['fundo', 'papel']) {
      expect(contraste(cor('tinta'), cor(fundo)), `tinta sobre ${fundo}`).toBeGreaterThanOrEqual(MINIMO_TEXTO)
    }
  })

  // Nos dois modos, o texto dentro de um cartão em tom claro é chocolate.
  it('texto chocolate passa AA sobre todos os tons claros', () => {
    for (const fundo of TONS_CLAROS) {
      expect(contraste(cor('chocolate'), cor(fundo)), `chocolate sobre ${fundo}`).toBeGreaterThanOrEqual(MINIMO_TEXTO)
      expect(contraste(cor('chocolate'), cor(fundo)), `contorno sobre ${fundo}`).toBeGreaterThanOrEqual(MINIMO_ICONE)
    }
  })

  it('texto suave passa AA sobre fundo e papel', () => {
    for (const fundo of ['fundo', 'papel']) {
      expect(contraste(cor('tinta-suave'), cor(fundo)), `tinta-suave sobre ${fundo}`).toBeGreaterThanOrEqual(
        MINIMO_TEXTO,
      )
    }
  })

  it('botão principal passa AA', () => {
    expect(contraste(cor('botao-texto'), cor('botao-fundo'))).toBeGreaterThanOrEqual(MINIMO_TEXTO)
  })

  // No modo claro, laranja, verde-água, tomate e rosa ficam abaixo de 3:1 sobre o creme.
  // Por isso todo ícone, check e barra forte é desenhado com contorno em "linha",
  // e é o contorno que precisa passar 3:1.
  it('contorno de ícones, checks e barras passa 3:1 sobre fundo e papel', () => {
    for (const fundo of ['fundo', 'papel']) {
      expect(contraste(cor('linha'), cor(fundo)), `linha sobre ${fundo}`).toBeGreaterThanOrEqual(MINIMO_ICONE)
    }
  })

  it('tons fortes usados sem contorno passam 3:1 sobre o fundo', () => {
    const semContorno = modoEscuro ? TONS_FORTES : ['forte-piscina', 'forte-chocolate']
    for (const forte of semContorno) {
      expect(contraste(cor(forte), cor('fundo')), `${forte} sobre fundo`).toBeGreaterThanOrEqual(MINIMO_ICONE)
    }
  })
})

describe('selos com texto (iguais nos dois modos)', () => {
  const cor = (nome: string) => resolver(claro, nome)
  const pares: Array<[string, string]> = [
    ['chocolate', 'rosa-selo'],
    ['chocolate', 'tomate-selo'],
    ['chocolate', 'laranja'],
    ['chocolate', 'verde-agua'],
    ['creme', 'verde-piscina'],
    ['creme', 'chocolate'],
  ]
  it.each(pares)('%s sobre %s passa AA', (texto, fundo) => {
    expect(contraste(cor(texto), cor(fundo))).toBeGreaterThanOrEqual(MINIMO_TEXTO)
  })
})

describe('temas', () => {
  it.each(['cereja', 'piscina', 'pessego'])('texto do destaque no tema %s passa AA', (tema) => {
    const vars = { ...claro, ...bloco(`:root[data-tema='${tema}']`) }
    expect(contraste(resolver(vars, 'destaque-texto'), resolver(vars, 'destaque'))).toBeGreaterThanOrEqual(
      MINIMO_TEXTO,
    )
  })
})

describe('Índigo', () => {
  it('destaque e botão passam AA nos dois modos', () => {
    for (const vars of [indigo, indigoEscuro]) {
      const cor = (nome: string) => resolver(vars, nome)
      expect(contraste(cor('destaque-texto'), cor('destaque'))).toBeGreaterThanOrEqual(MINIMO_TEXTO)
      expect(contraste(cor('botao-texto'), cor('botao-fundo'))).toBeGreaterThanOrEqual(MINIMO_TEXTO)
    }
  })

  // A mostarda é clara demais para ícone solto sobre o papel-gelo (1,9:1): só entra com contorno.
  it('mostarda sozinha não passa sobre o fundo claro, e por isso leva contorno', () => {
    const cor = (nome: string) => resolver(indigo, nome)
    expect(contraste(cor('mostarda'), cor('fundo'))).toBeLessThan(MINIMO_ICONE)
    expect(contraste(cor('linha'), cor('mostarda'))).toBeGreaterThanOrEqual(MINIMO_ICONE)
  })

  it('texto índigo-noite passa AA sobre o azul-lavanda', () => {
    const cor = (nome: string) => resolver(indigo, nome)
    expect(contraste(cor('tinta'), cor('azul-lavanda'))).toBeGreaterThanOrEqual(MINIMO_TEXTO)
  })
})

describe('Bem-estar', () => {
  // só os valores em hex: --forte-ameixa em hex é a versão do modo escuro
  const bem = Object.fromEntries(
    [...css.matchAll(/--(ameixa|lilas-nevoa|forte-ameixa):\s*(#[0-9a-f]{6})/g)].map(([, nome, hex]) => [nome, hex]),
  )
  it('ameixa passa 3:1 como ícone no claro, e a versão clara passa no escuro', () => {
    expect(contraste(bem['ameixa'], resolver(claro, 'fundo'))).toBeGreaterThanOrEqual(MINIMO_ICONE)
    expect(contraste(bem['forte-ameixa'], resolver(escuro, 'fundo'))).toBeGreaterThanOrEqual(MINIMO_ICONE)
    expect(contraste(bem['forte-ameixa'], resolver(indigoEscuro, 'fundo'))).toBeGreaterThanOrEqual(MINIMO_ICONE)
  })
  it('texto chocolate e índigo-noite passam AA sobre o lilás-névoa', () => {
    expect(contraste(resolver(claro, 'chocolate'), bem['lilas-nevoa'])).toBeGreaterThanOrEqual(MINIMO_TEXTO)
    expect(contraste(resolver(indigo, 'chocolate'), bem['lilas-nevoa'])).toBeGreaterThanOrEqual(MINIMO_TEXTO)
  })
})
