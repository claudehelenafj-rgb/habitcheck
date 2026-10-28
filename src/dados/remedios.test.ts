import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { dosesDoDia } from '../logica/remedios'
import { banco } from './banco'
import { desfazerResposta, novoRemedio, registrarAviso, responderDose } from './remedios'

const remedio = { ...novoRemedio(), id: 'r1', nome: 'Vitamina D', horarios: ['08:00'], estoque: { quantidade: 10, porDose: 1, avisarComDias: 5 } }
const dose = dosesDoDia([remedio], '2026-10-28')[0]
const estoque = async () => (await banco.remedios.get('r1'))!.estoque!.quantidade

beforeEach(async () => {
  await Promise.all(banco.tables.map((t) => t.clear()))
  await banco.remedios.put(remedio)
})

describe('responder uma dose', () => {
  it('"Tomei" desconta do estoque uma vez só', async () => {
    await responderDose(dose, 'tomei')
    await responderDose(dose, 'tomei')
    expect(await estoque()).toBe(9)
    expect((await banco.doses.get(dose.id))?.status).toBe('tomei')
  })

  it('trocar de "Tomei" para "Pulei" devolve ao estoque', async () => {
    await responderDose(dose, 'tomei')
    await responderDose(dose, 'pulei')
    expect(await estoque()).toBe(10)
  })

  it('"Desfazer" volta a dose para sem resposta e devolve o estoque', async () => {
    await responderDose(dose, 'tomei')
    await desfazerResposta(dose)
    expect(await estoque()).toBe(10)
    expect((await banco.doses.get(dose.id))?.status).toBeUndefined()
  })

  it('"Adiar" guarda até quando e quantos avisos já tinham sido dados', async () => {
    await registrarAviso(dose)
    await responderDose(dose, 'adiada')
    const r = await banco.doses.get(dose.id)
    expect(r?.status).toBe('adiada')
    expect(r?.avisosAntesDeAdiar).toBe(1)
    expect(new Date(r!.adiadaAte!).getTime()).toBeGreaterThan(Date.now() + 9 * 60_000)
  })

  it('estoque nunca fica negativo', async () => {
    await banco.remedios.update('r1', { estoque: { quantidade: 0, porDose: 1, avisarComDias: 5 } })
    await responderDose(dose, 'tomei')
    expect(await estoque()).toBe(0)
  })
})
