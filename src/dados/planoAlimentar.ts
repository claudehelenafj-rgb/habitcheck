// Plano alimentar no banco local: as refeições conferidas pela pessoa (configuracoes, chave "planoAlimentar")
// e o PDF (tabela arquivos). Fica só neste aparelho e entra no backup.

import { useLiveQuery } from 'dexie-react-hooks'
import { aplicarNoConfig, limparPlano, type PlanoAlimentar, type RefeicaoPlano } from '../logica/planoAlimentar'
import { banco, type Arquivo } from './banco'
import { mudarConfigAlimentacao } from './alimentacao'

const CHAVE = 'planoAlimentar'
const ID_PDF = 'planoAlimentar'

/** null = ainda não há plano; undefined = carregando */
export function usePlanoAlimentar(): PlanoAlimentar | null | undefined {
  return useLiveQuery(async () => ((await banco.configuracoes.get(CHAVE))?.valor as PlanoAlimentar | undefined) ?? null, [])
}

export type PdfNovo = Pick<Arquivo, 'nome' | 'tipo' | 'tamanho' | 'dados'>

/**
 * Salva as refeições conferidas. `pdf`: um PDF novo, ou 'manter' o que já está guardado (editar sem trocar).
 * `usarNoApp`: as refeições e os horários do app passam a ser os do plano.
 */
export async function salvarPlano(refeicoes: RefeicaoPlano[], pdf: PdfNovo | 'manter' | undefined, usarNoApp: boolean): Promise<PlanoAlimentar> {
  const limpas = limparPlano(refeicoes)
  const agora = new Date().toISOString()
  const plano = await banco.transaction('rw', banco.configuracoes, banco.arquivos, async () => {
    const antes = (await banco.configuracoes.get(CHAVE))?.valor as PlanoAlimentar | undefined
    let arquivo = pdf === 'manter' ? antes?.arquivo : undefined
    if (pdf && pdf !== 'manter') {
      await banco.arquivos.put({ id: ID_PDF, ...pdf, salvoEm: agora })
      arquivo = { nome: pdf.nome, tamanho: pdf.tamanho }
    }
    if (!arquivo) await banco.arquivos.delete(ID_PDF)
    const novo: PlanoAlimentar = { refeicoes: limpas, ...(arquivo ? { arquivo } : {}), salvoEm: agora }
    await banco.configuracoes.put({ chave: CHAVE, valor: novo })
    return novo
  })
  if (usarNoApp) await mudarConfigAlimentacao((c) => ({ refeicoes: aplicarNoConfig(c.refeicoes, plano.refeicoes) }))
  return plano
}

/** O PDF guardado (para abrir), ou undefined. */
export async function lerPdfDoPlano(): Promise<Arquivo | undefined> {
  return banco.arquivos.get(ID_PDF)
}

export type CopiaPlano = { plano: PlanoAlimentar; pdf?: Arquivo }

/** Apaga o plano e o PDF; devolve a cópia para o "Desfazer". As refeições do app continuam como estão. */
export async function apagarPlano(): Promise<CopiaPlano | undefined> {
  return banco.transaction('rw', banco.configuracoes, banco.arquivos, async () => {
    const plano = (await banco.configuracoes.get(CHAVE))?.valor as PlanoAlimentar | undefined
    if (!plano) return undefined
    const pdf = await banco.arquivos.get(ID_PDF)
    await banco.configuracoes.delete(CHAVE)
    await banco.arquivos.delete(ID_PDF)
    return { plano, pdf }
  })
}

export async function restaurarPlano({ plano, pdf }: CopiaPlano) {
  await banco.transaction('rw', banco.configuracoes, banco.arquivos, async () => {
    await banco.configuracoes.put({ chave: CHAVE, valor: plano })
    if (pdf) await banco.arquivos.put(pdf)
  })
}
