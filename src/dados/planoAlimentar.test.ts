import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { banco } from './banco'
import { apagarPlano, lerPdfDoPlano, restaurarPlano, salvarPlano } from './planoAlimentar'

beforeEach(async () => {
  await Promise.all(banco.tables.map((t) => t.clear()))
})

const pdf = { nome: 'plano.pdf', tipo: 'application/pdf', tamanho: 1234, dados: 'data:application/pdf;base64,JVBERi0=' }

describe('plano alimentar no banco', () => {
  it('salva as refeições e o PDF; editar sem trocar mantém o PDF', async () => {
    const plano = await salvarPlano([{ id: 'cafe', hora: '07:00', opcoes: [['pão']] }, { id: 'ceia', opcoes: [] }], pdf, { usarNoApp: false })
    expect(plano.refeicoes).toEqual([{ id: 'cafe', hora: '07:00', opcoes: [['pão']] }])
    expect(plano.arquivo).toEqual({ nome: 'plano.pdf', tamanho: 1234 })
    expect((await lerPdfDoPlano())?.dados).toBe(pdf.dados)
    const editado = await salvarPlano([{ id: 'cafe', hora: '07:30', opcoes: [['pão']] }], 'manter', { usarNoApp: false })
    expect(editado.arquivo?.nome).toBe('plano.pdf')
    expect(await lerPdfDoPlano()).toBeTruthy()
  })

  it('plano escrito sem PDF não guarda arquivo', async () => {
    await salvarPlano([{ id: 'cafe', hora: '07:00', opcoes: [['pão']] }], pdf, { usarNoApp: false })
    const semPdf = await salvarPlano([{ id: 'almoco', hora: '12:00', opcoes: [] }], undefined, { usarNoApp: false })
    expect(semPdf.arquivo).toBeUndefined()
    expect(await lerPdfDoPlano()).toBeUndefined()
  })

  it('usar no app: liga as refeições do plano com os horários dele e desliga as outras', async () => {
    await salvarPlano([{ id: 'cafe', hora: '07:00', opcoes: [] }, { id: 'lancheManha', hora: '10:00', opcoes: [] }], undefined, { usarNoApp: true, avisar: true })
    const c = (await banco.configuracoes.get('alimentacao'))!.valor as { refeicoes: Array<{ id: string; ativa: boolean; hora?: string; lembrar: boolean }> }
    expect(c.refeicoes.filter((r) => r.ativa).map((r) => [r.id, r.hora, r.lembrar])).toEqual([
      ['cafe', '07:00', true],
      ['lancheManha', '10:00', true],
    ])
  })

  it('apagar leva o PDF junto, e desfazer traz os dois de volta', async () => {
    await salvarPlano([{ id: 'cafe', hora: '07:00', opcoes: [['pão']] }], pdf, { usarNoApp: false })
    const copia = await apagarPlano()
    expect(await banco.configuracoes.get('planoAlimentar')).toBeUndefined()
    expect(await lerPdfDoPlano()).toBeUndefined()
    await restaurarPlano(copia!)
    expect(((await banco.configuracoes.get('planoAlimentar'))!.valor as { refeicoes: unknown[] }).refeicoes).toHaveLength(1)
    expect((await lerPdfDoPlano())?.nome).toBe('plano.pdf')
  })
})
