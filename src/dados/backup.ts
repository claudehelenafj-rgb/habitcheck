// Exportar, importar e apagar todos os dados.
// Funciona para todas as tabelas do banco, inclusive as que forem criadas nas próximas etapas.

import type { BancoCaderninho } from './banco'

export const FORMATO_BACKUP = 'caderninho-backup'

export type Backup = {
  formato: typeof FORMATO_BACKUP
  versaoEsquema: number
  exportadoEm: string
  tabelas: Record<string, unknown[]>
}

export async function exportarTudo(db: BancoCaderninho, agora = new Date()): Promise<Backup> {
  const tabelas: Record<string, unknown[]> = {}
  await db.transaction('r', db.tables, async () => {
    for (const tabela of db.tables) tabelas[tabela.name] = await tabela.toArray()
  })
  return { formato: FORMATO_BACKUP, versaoEsquema: db.verno, exportadoEm: agora.toISOString(), tabelas }
}

export class BackupInvalido extends Error {}

/** Confere o arquivo antes de mexer em qualquer dado. */
export function lerBackup(texto: string): Backup {
  let dados: unknown
  try {
    dados = JSON.parse(texto)
  } catch {
    throw new BackupInvalido('Este arquivo não é um backup do Caderninho.')
  }
  const b = dados as Partial<Backup>
  if (b?.formato !== FORMATO_BACKUP || typeof b.tabelas !== 'object' || b.tabelas === null) {
    throw new BackupInvalido('Este arquivo não é um backup do Caderninho.')
  }
  for (const linhas of Object.values(b.tabelas)) {
    if (!Array.isArray(linhas)) throw new BackupInvalido('O backup está incompleto ou corrompido.')
  }
  return b as Backup
}

/**
 * Substitui todos os dados pelos do backup, numa única transação:
 * se algo der errado no meio, nada muda.
 * Tabelas que não existem nesta versão do app são ignoradas.
 */
export async function importarTudo(db: BancoCaderninho, backup: Backup): Promise<void> {
  if (backup.versaoEsquema > db.verno) {
    throw new BackupInvalido('Este backup veio de uma versão mais nova do Caderninho. Atualize o app e tente de novo.')
  }
  await db.transaction('rw', db.tables, async () => {
    for (const tabela of db.tables) {
      await tabela.clear()
      const linhas = backup.tabelas[tabela.name]
      if (linhas?.length) await tabela.bulkAdd(linhas)
    }
  })
}

export async function apagarTudo(db: BancoCaderninho): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    for (const tabela of db.tables) await tabela.clear()
  })
}

export function nomeArquivoBackup(agora = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `caderninho-backup-${agora.getFullYear()}-${p(agora.getMonth() + 1)}-${p(agora.getDate())}.json`
}
