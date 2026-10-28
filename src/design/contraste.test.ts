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
])('%s', (_modo, vars) => {
  const cor = (nome: string) => resolver(vars, nome)

  it('texto principal passa AA sobre fundo, papel e todos os tons claros', () => {
    for (const fundo of ['fundo', 'papel', ...TONS_CLAROS]) {
      expect(contraste(cor('tinta'), cor(fundo)), `tinta sobre ${fundo}`).toBeGreaterThanOrEqual(MINIMO_TEXTO)
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
    for (const fundo of ['fundo', 'papel', ...TONS_CLAROS]) {
      expect(contraste(cor('linha'), cor(fundo)), `linha sobre ${fundo}`).toBeGreaterThanOrEqual(MINIMO_ICONE)
    }
  })

  it('tons fortes usados sem contorno passam 3:1 sobre o fundo', () => {
    const semContorno = _modo === 'modo escuro' ? TONS_FORTES : ['forte-piscina', 'forte-chocolate']
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
