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
