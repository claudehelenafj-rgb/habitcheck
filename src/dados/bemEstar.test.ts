import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { banco } from './banco'
import { mudarBemEstar, mudarSono } from './bemEstar'

const config = async () => (await banco.configuracoes.get('bemEstar'))?.valor as Record<string, unknown>

beforeEach(async () => {
  await Promise.all(banco.tables.map((t) => t.clear()))
})

describe('configuração do Bem-estar', () => {
  it('mudanças rápidas seguidas não apagam umas às outras', async () => {
    // como clicar em "Me avisar" e logo digitar o horário de deitar, antes de a tela atualizar
    await Promise.all([mudarSono({ acordarAs: '07:30' }), mudarSono({ lembreteAcordar: true }), mudarSono({ deitarAs: '23:00' })])
    expect((await config()).sono).toEqual({ acordarAs: '07:30', lembreteAcordar: true, deitarAs: '23:00' })
  })

  it('acrescentar duas etiquetas ao mesmo tempo guarda as duas', async () => {
    const mais = (s: string) => mudarBemEstar((c) => ({ listaPorques: [...(c.listaPorques ?? ['prazo']), s] }))
    await Promise.all([mais('barulho'), mais('calor')])
    expect((await config()).listaPorques).toEqual(['prazo', 'barulho', 'calor'])
  })
})
