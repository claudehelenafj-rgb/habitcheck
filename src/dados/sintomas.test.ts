import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { banco, TABELAS_BEM_ESTAR } from './banco'
import { apagarSintoma, restaurarSintoma, salvarSintoma } from './sintomas'

const base = { sintoma: 'ansiedade', intensidade: 6, porques: ['prazo'], ajudou: [] }

beforeEach(async () => {
  await Promise.all(banco.tables.map((t) => t.clear()))
})

describe('salvar sintoma', () => {
  it('guarda o dia local e só os campos preenchidos', async () => {
    const r = await salvarSintoma({ ...base, porqueTexto: '  ', ajudouTexto: '', efeitoRemedio: false }, new Date(2026, 9, 31, 23, 50))
    const salvo = await banco.sintomas.get(r.id)
    expect(salvo?.dia).toBe('2026-10-31')
    expect(salvo).not.toHaveProperty('porqueTexto')
    expect(salvo).not.toHaveProperty('efeitoRemedio')
    expect(salvo).not.toHaveProperty('duracao')
  })

  it('recusa sintoma vazio e intensidade fora de 0 a 10', async () => {
    await expect(salvarSintoma({ ...base, sintoma: '  ' })).rejects.toThrow()
    await expect(salvarSintoma({ ...base, intensidade: 12 })).rejects.toThrow()
    expect(await banco.sintomas.count()).toBe(0)
  })

  it('apagar e desfazer devolve o mesmo registro', async () => {
    const r = await salvarSintoma({ ...base, duracao: 'horas', efeitoRemedio: true })
    await apagarSintoma(r.id)
    await restaurarSintoma(r)
    expect(await banco.sintomas.get(r.id)).toEqual(r)
  })

  it('a tabela de sintomas está marcada como dado de saúde mental', () => {
    expect(TABELAS_BEM_ESTAR).toContain('sintomas')
  })
})
