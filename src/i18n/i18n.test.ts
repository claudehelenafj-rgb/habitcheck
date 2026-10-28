import { describe, expect, it } from 'vitest'
import { en } from './en'
import { ptBR } from './pt-BR'

function chaves(obj: object, prefixo = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null ? chaves(v, `${prefixo}${k}.`) : [`${prefixo}${k}`],
  )
}

function variaveis(texto: string): string[] {
  return [...texto.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).sort()
}

describe('traduções', () => {
  it('inglês tem exatamente as mesmas chaves do português', () => {
    expect(chaves(en).sort()).toEqual(chaves(ptBR).sort())
  })

  it('nenhum texto está vazio e as variáveis {{...}} batem entre os idiomas', () => {
    const pegar = (obj: object, chave: string) =>
      chave.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], obj) as string
    for (const chave of chaves(ptBR)) {
      const pt = pegar(ptBR, chave)
      const ing = pegar(en, chave)
      expect(pt.trim(), chave).not.toBe('')
      expect(ing.trim(), chave).not.toBe('')
      expect(variaveis(ing), chave).toEqual(variaveis(pt))
    }
  })
})

describe('chaves usadas no código', () => {
  // Lê todos os arquivos do app e confere cada t('chave.fixa') contra o português.
  // Chaves montadas com crase (`nav.${id}`) não entram: o teste de paridade acima já cobre os dois idiomas.
  const arquivos = import.meta.glob('../**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
  const existentes = new Set(chaves(ptBR).map((c) => c.replace(/_(one|other)$/, '')))

  it('toda chave fixa de t(...) existe nas traduções', () => {
    const faltando: string[] = []
    let conferidas = 0
    for (const [arquivo, codigo] of Object.entries(arquivos)) {
      if (arquivo.includes('.test.')) continue
      for (const [, chave] of codigo.matchAll(/\bt\(\s*'([\w.]+)'/g)) {
        conferidas++
        if (!existentes.has(chave)) faltando.push(`${arquivo}: ${chave}`)
      }
    }
    expect(conferidas).toBeGreaterThan(100)
    expect(faltando).toEqual([])
  })
})
