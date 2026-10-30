import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { banco } from './banco'
import { comecarRitual, irParaPasso, mudarConfigRituais, mudarRespostas, refazerRitual, terminarRitual } from './rituais'

beforeEach(async () => {
  await Promise.all(banco.tables.map((t) => t.clear()))
})

describe('rituais no banco', () => {
  it('começar de novo no mesmo dia continua de onde parou', async () => {
    const r = await comecarRitual('manha', '2026-10-28', 'dia')
    expect(r).toMatchObject({ id: 'manha|2026-10-28', passo: 'dia' })
    await irParaPasso(r.id, 'tarefasA')
    const deNovo = await comecarRitual('manha', '2026-10-28', 'dia')
    expect(deNovo.passo).toBe('tarefasA')
    expect(deNovo.comecouEm).toBe(r.comecouEm)
    expect(await banco.rituais.count()).toBe(1)
  })

  it('terminar guarda a hora; fazer de novo volta ao primeiro passo', async () => {
    const r = await comecarRitual('noite', '2026-10-28', 'feito')
    await irParaPasso(r.id, 'amanha')
    await terminarRitual(r.id)
    expect((await banco.rituais.get(r.id))!.feitoEm).toBeTruthy()
    await refazerRitual(r.id, 'feito')
    const refeito = (await banco.rituais.get(r.id))!
    expect(refeito.passo).toBe('feito')
    expect(refeito.feitoEm).toBeUndefined()
  })

  it('mudar o lembrete de um ritual não apaga o do outro', async () => {
    await mudarConfigRituais((c) => ({ lembretes: { ...c.lembretes, manha: { ativo: true, hora: '07:30' } } }))
    await mudarConfigRituais((c) => ({ lembretes: { ...c.lembretes, noite: { ...c.lembretes.noite, ativo: true } } }))
    const guardada = (await banco.configuracoes.get('rituais'))!.valor
    expect(guardada).toEqual({
      lembretes: { manha: { ativo: true, hora: '07:30' }, noite: { ativo: true, hora: '21:30' }, revisao: { ativo: false, hora: '18:00', diaSemana: 0 } },
    })
  })

  it('revisão: as respostas se juntam sem apagar as outras; trocar de passo marca quando entrou nele', async () => {
    const r = await comecarRitual('revisao', '2026-10-26', 'semana')
    expect(r.passoDesde).toBe(r.comecouEm)
    await mudarRespostas(r.id, { funcionou: 'água na mesa' })
    await mudarRespostas(r.id, { ajusto: 'deitar mais cedo' })
    expect((await banco.rituais.get(r.id))!.respostas).toEqual({ funcionou: 'água na mesa', ajusto: 'deitar mais cedo' })
    await new Promise((ok) => setTimeout(ok, 5))
    await irParaPasso(r.id, 'dinheiro')
    const depois = (await banco.rituais.get(r.id))!
    expect(depois.passo).toBe('dinheiro')
    expect(depois.passoDesde! > r.passoDesde!).toBe(true)
    await irParaPasso(r.id, 'dinheiro')
    expect((await banco.rituais.get(r.id))!.passoDesde).toBe(depois.passoDesde)
  })
})
