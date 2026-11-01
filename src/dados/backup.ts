// Exportar, importar e apagar os dados: tudo, só o Bem-estar ou tudo menos o Bem-estar.
// Funciona para todas as tabelas do banco, inclusive as que forem criadas nas próximas etapas.

import { TABELAS_BEM_ESTAR, type BancoCaderninho } from './banco'

export const FORMATO_BACKUP = 'caderninho-backup'

/**
 * Alcance do arquivo: "tudo"; "bemEstar" (só os dados de saúde mental); "semBemEstar" (tudo menos eles).
 * Ao restaurar, só o que está no alcance é substituído: o resto do app fica como está.
 */
export type Escopo = 'tudo' | 'bemEstar' | 'semBemEstar'

export type Backup = {
  formato: typeof FORMATO_BACKUP
  versaoEsquema: number
  exportadoEm: string
  escopo?: Escopo
  tabelas: Record<string, unknown[]>
}

/** Configurações que pertencem ao Bem-estar (o PIN fica fora do arquivo "só o Bem-estar"). */
export const CHAVES_BEM_ESTAR = ['bemEstar', 'bemEstarPin']
const ehDoBemEstar = (tabela: string) => (TABELAS_BEM_ESTAR as readonly string[]).includes(tabela)

function noEscopo(escopo: Escopo, tabela: string): boolean {
  if (escopo === 'tudo' || tabela === 'configuracoes') return true
  return escopo === 'bemEstar' ? ehDoBemEstar(tabela) : !ehDoBemEstar(tabela)
}

function chaveNoEscopo(escopo: Escopo, chave: string): boolean {
  if (escopo === 'tudo') return true
  if (escopo === 'bemEstar') return chave === 'bemEstar'
  return !CHAVES_BEM_ESTAR.includes(chave)
}

export async function exportarTudo(db: BancoCaderninho, agora = new Date(), escopo: Escopo = 'tudo'): Promise<Backup> {
  const tabelas: Record<string, unknown[]> = {}
  await db.transaction('r', db.tables, async () => {
    for (const tabela of db.tables) {
      if (!noEscopo(escopo, tabela.name)) continue
      const linhas = await tabela.toArray()
      tabelas[tabela.name] =
        tabela.name === 'configuracoes' ? linhas.filter((c) => chaveNoEscopo(escopo, (c as { chave: string }).chave)) : linhas
    }
  })
  return { formato: FORMATO_BACKUP, versaoEsquema: db.verno, exportadoEm: agora.toISOString(), escopo, tabelas }
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
  if (b.escopo !== undefined && !['tudo', 'bemEstar', 'semBemEstar'].includes(b.escopo)) {
    throw new BackupInvalido('O backup está incompleto ou corrompido.')
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
  const escopo = backup.escopo ?? 'tudo'
  await db.transaction('rw', db.tables, async () => {
    for (const tabela of db.tables) {
      if (!noEscopo(escopo, tabela.name)) continue
      const linhas = backup.tabelas[tabela.name] ?? []
      if (tabela.name === 'configuracoes') {
        // só as chaves do alcance saem e entram; as outras ficam
        const fora = (await db.configuracoes.toArray()).filter((c) => chaveNoEscopo(escopo, c.chave)).map((c) => c.chave)
        await db.configuracoes.bulkDelete(fora)
        await db.configuracoes.bulkPut((linhas as Array<{ chave: string; valor: unknown }>).filter((c) => chaveNoEscopo(escopo, c.chave)))
        continue
      }
      await tabela.clear()
      if (linhas.length) await tabela.bulkAdd(linhas)
    }
  })
}

/** Apaga só os dados do Bem-estar (as tabelas e a configuração; o PIN fica, se houver). */
export async function apagarBemEstar(db: BancoCaderninho): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    for (const nome of TABELAS_BEM_ESTAR) await db.table(nome).clear()
    await db.configuracoes.delete('bemEstar')
  })
}

export async function apagarTudo(db: BancoCaderninho): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    for (const tabela of db.tables) await tabela.clear()
  })
}

export function nomeArquivoBackup(agora = new Date(), escopo: Escopo = 'tudo'): string {
  const p = (n: number) => String(n).padStart(2, '0')
  const sufixo = escopo === 'bemEstar' ? '-bem-estar' : escopo === 'semBemEstar' ? '-sem-bem-estar' : ''
  return `caderninho-backup${sufixo}-${agora.getFullYear()}-${p(agora.getMonth() + 1)}-${p(agora.getDate())}.json`
}
