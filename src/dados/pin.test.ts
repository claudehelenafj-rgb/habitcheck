import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { banco } from './banco'
import { definirPin, pinConfere, temPin, tirarPin } from './pin'

beforeEach(async () => {
  await Promise.all(banco.tables.map((t) => t.clear()))
})

describe('PIN guardado', () => {
  it('guarda só o resumo, confere e pode ser tirado', async () => {
    expect(await temPin()).toBe(false)
    await definirPin('2468')
    expect(JSON.stringify(await banco.configuracoes.get('bemEstarPin'))).not.toContain('2468')
    expect(await pinConfere('2468')).toBe(true)
    expect(await pinConfere('1357')).toBe(false)
    await tirarPin()
    expect(await temPin()).toBe(false)
    expect(await pinConfere('2468')).toBe(false)
  })
})
