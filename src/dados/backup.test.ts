import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { BancoCaderninho } from './banco'
import { apagarTudo, BackupInvalido, exportarTudo, importarTudo, lerBackup, nomeArquivoBackup } from './backup'

let db: BancoCaderninho
let contador = 0

beforeEach(async () => {
  db = new BancoCaderninho(`teste-${contador++}`)
  await db.open()
  await db.configuracoes.put({ chave: 'idioma', valor: 'pt-BR' })
  await db.caixaEntrada.add({ id: 'c1', texto: 'comprar pilha', criadoEm: '2026-10-28T10:00:00.000Z' })
  await db.tarefas.add({
    id: 't1',
    titulo: 'Ler aula 3',
    prioridade: 'A',
    passos: [{ id: 'p1', texto: 'abrir o arquivo', feito: false }],
    criadaEm: '2026-10-28T10:00:00.000Z',
  })
})

afterEach(async () => {
  await db.delete()
})

describe('backup', () => {
  it('exporta todas as tabelas com data e versão', async () => {
    const b = await exportarTudo(db, new Date('2026-10-28T12:00:00Z'))
    expect(b.formato).toBe('caderninho-backup')
    expect(b.exportadoEm).toBe('2026-10-28T12:00:00.000Z')
    expect(b.versaoEsquema).toBe(db.verno)
    expect(Object.keys(b.tabelas).sort()).toEqual(db.tables.map((t) => t.name).sort())
    expect(b.tabelas.tarefas).toHaveLength(1)
  })

  it('exportar, apagar e importar devolve exatamente os mesmos dados', async () => {
    const antes = await exportarTudo(db)
    const texto = JSON.stringify(antes)
    await apagarTudo(db)
    expect(await db.tarefas.count()).toBe(0)
    expect(await db.caixaEntrada.count()).toBe(0)

    await importarTudo(db, lerBackup(texto))
    const depois = await exportarTudo(db)
    expect(depois.tabelas).toEqual(antes.tabelas)
  })

  it('importar substitui o que existia, sem misturar', async () => {
    const b = await exportarTudo(db)
    await db.caixaEntrada.add({ id: 'c2', texto: 'item novo', criadoEm: '2026-10-29T10:00:00.000Z' })
    await importarTudo(db, b)
    expect((await db.caixaEntrada.toArray()).map((i) => i.id)).toEqual(['c1'])
  })

  it('recusa arquivos que não são backup, sem apagar nada', async () => {
    expect(() => lerBackup('isto não é json')).toThrow(BackupInvalido)
    expect(() => lerBackup('{"formato":"outra-coisa","tabelas":{}}')).toThrow(BackupInvalido)
    expect(() => lerBackup('{"formato":"caderninho-backup","tabelas":{"tarefas":"x"}}')).toThrow(BackupInvalido)
    expect(await db.tarefas.count()).toBe(1)
  })

  it('recusa backup de uma versão mais nova do app', async () => {
    const b = await exportarTudo(db)
    await expect(importarTudo(db, { ...b, versaoEsquema: db.verno + 1 })).rejects.toThrow(BackupInvalido)
    expect(await db.tarefas.count()).toBe(1)
  })

  it('se a importação falha no meio, nada muda', async () => {
    const b = await exportarTudo(db)
    // duas tarefas com o mesmo id fazem o bulkAdd falhar depois de limpar as tabelas
    const quebrado = { ...b, tabelas: { ...b.tabelas, tarefas: [b.tabelas.tarefas[0], b.tabelas.tarefas[0]] } }
    await expect(importarTudo(db, quebrado)).rejects.toThrow()
    expect(await db.tarefas.count()).toBe(1)
    expect(await db.caixaEntrada.count()).toBe(1)
  })

  it('dá ao arquivo um nome com a data', () => {
    expect(nomeArquivoBackup(new Date(2026, 9, 3))).toBe('caderninho-backup-2026-10-03.json')
  })
})
