import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { banco, TABELAS_BEM_ESTAR } from './banco'
import { anotarMotivo, apagarHobby, criarHobby, registrarVez, restaurarHobby } from './hobbies'

const dados = { nome: '  violão ', adesivo: 'musica' as const, frequencia: { vezes: 2, por: 'semana' as const } }

beforeEach(async () => {
  await Promise.all(banco.tables.map((t) => t.clear()))
})

describe('hobbies no banco', () => {
  it('cria com nome limpo e recusa nome vazio', async () => {
    const h = await criarHobby(dados)
    expect((await banco.hobbies.get(h.id))?.nome).toBe('violão')
    await expect(criarHobby({ ...dados, nome: '   ' })).rejects.toThrow()
  })

  it('"Fiz hoje" usa o dia local', async () => {
    const h = await criarHobby(dados)
    const v = await registrarVez(h.id, new Date(2026, 9, 28, 23, 55))
    expect(v.dia).toBe('2026-10-28')
  })

  it('anotar o porquê de novo no mesmo dia substitui; em outro dia acrescenta', async () => {
    const h = await criarHobby(dados)
    await anotarMotivo(h.id, { etiquetas: ['sem tempo'] }, '2026-10-20')
    await anotarMotivo(h.id, { etiquetas: ['sem energia'], texto: '  ' }, '2026-10-20')
    await anotarMotivo(h.id, { etiquetas: ['perdi a vontade'] }, '2026-10-27')
    const motivos = (await banco.hobbies.get(h.id))!.motivos
    expect(motivos).toEqual([
      { dia: '2026-10-20', etiquetas: ['sem energia'] },
      { dia: '2026-10-27', etiquetas: ['perdi a vontade'] },
    ])
  })

  it('apagar leva as vezes junto, e desfazer devolve tudo', async () => {
    const h = await criarHobby(dados)
    await registrarVez(h.id)
    await registrarVez(h.id)
    const apagado = await apagarHobby(h.id)
    expect(await banco.vezesHobby.count()).toBe(0)
    await restaurarHobby(apagado)
    expect(await banco.hobbies.count()).toBe(1)
    expect(await banco.vezesHobby.count()).toBe(2)
  })

  it('hobbies e vezes estão marcados como dados de saúde mental', () => {
    expect(TABELAS_BEM_ESTAR).toEqual(expect.arrayContaining(['hobbies', 'vezesHobby']))
  })
})
