// Eventos do calendário no banco local, e importação de arquivos .ics e .zip.

import { useLiveQuery } from 'dexie-react-hooks'
import { mesclarImportacao, type Evento, type ResultadoImportacao } from '../logica/calendario'
import { lerIcs } from '../logica/ics'
import { ehZip, lerZip } from '../logica/zip'
import { banco, novoId } from './banco'

export function useEventos(): Evento[] | undefined {
  return useLiveQuery(() => banco.eventos.toArray())
}

export function novoEvento(inicio: Date, titulo = ''): Evento {
  const fim = new Date(inicio.getTime() + 60 * 60_000)
  return { id: novoId(), titulo, inicio: inicio.toISOString(), fim: fim.toISOString(), diaInteiro: false, origem: 'caderninho', criadoEm: new Date().toISOString() }
}

export async function salvarEvento(e: Evento) {
  await banco.eventos.put(e)
}

export async function apagarEvento(id: string): Promise<Evento | undefined> {
  const e = await banco.eventos.get(id)
  await banco.eventos.delete(id)
  return e
}

/** Lê .ics ou .zip (exportação do Google) e junta com o que já existe, sem duplicar. */
export async function importarCalendario(arquivo: File): Promise<ResultadoImportacao> {
  const bytes = new Uint8Array(await arquivo.arrayBuffer())
  const textos = ehZip(bytes)
    ? (await lerZip(bytes)).filter((a) => a.nome.toLowerCase().endsWith('.ics')).map((a) => new TextDecoder().decode(a.conteudo))
    : [new TextDecoder().decode(bytes)]
  if (!textos.some((t) => t.includes('BEGIN:VCALENDAR'))) throw new Error('arquivo-invalido')
  const importados = textos.flatMap((texto) => {
    const lido = lerIcs(texto)
    return lido.eventos.map((e) => ({
      titulo: e.titulo,
      inicio: e.inicio,
      fim: e.fim,
      diaInteiro: e.diaInteiro,
      local: e.local,
      descricao: e.descricao,
      repeticao: e.repeticao,
      excecoes: e.excecoes,
      origem: lido.origem,
      nomeCalendario: lido.nomeCalendario,
      uidExterno: `${lido.origem}:${e.uid}`,
    }))
  })
  return banco.transaction('rw', banco.eventos, async () => {
    const existentes = await banco.eventos.toArray()
    const { salvar, resultado } = mesclarImportacao(existentes, importados, novoId, new Date().toISOString())
    await banco.eventos.bulkPut(salvar)
    return resultado
  })
}
