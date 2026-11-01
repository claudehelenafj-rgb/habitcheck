// Álbum de adesivos: cada coisa feita cola um adesivo na página do mês. Hábito feito (a versão mínima também
// conta), tarefa concluída e ritual terminado. Nada sai do álbum por ter falhado; só some se a pessoa desfizer ou
// apagar o registro. Adesivos especiais chegam com o total de adesivos e ficam para sempre.

import type { NomeAdesivo } from '../componentes/Adesivo'
import type { Tarefa } from '../dados/banco'
import { AREAS } from '../design/areas'
import { diaLocal, type Dia } from './datas'
import { mesDe, somarMeses, type Mes } from './dinheiro'
import type { Habito, RegistroHabito } from './habitos'
import type { IdRitual, RegistroRitual } from './rituais'

export type TipoAdesivo = 'habito' | 'tarefa' | 'ritual'

export type AdesivoDoAlbum = {
  id: string
  tipo: TipoAdesivo
  nome: NomeAdesivo
  /** nome do hábito ou da tarefa (o do ritual vem das traduções) */
  titulo: string
  ritual?: IdRitual
  dia: Dia
  /** hábito feito na versão mínima */
  minimo?: boolean
  quando: string // ISO, para a ordem
}

export type DadosAlbum = {
  habitos: Habito[]
  registros: RegistroHabito[]
  tarefas: Tarefa[]
  rituais: RegistroRitual[]
}

const ADESIVO_RITUAL: Record<IdRitual, NomeAdesivo> = { manha: 'sol', noite: 'lua', revisao: 'calendario' }

/** Todos os adesivos ganhos, do mais antigo para o mais novo. */
export function adesivosDoAlbum(d: DadosAlbum): AdesivoDoAlbum[] {
  const habitos = new Map(d.habitos.map((h) => [h.id, h]))
  const lista: AdesivoDoAlbum[] = []
  for (const r of d.registros) {
    const h = habitos.get(r.habitoId)
    if (!h) continue
    lista.push({ id: `h|${r.id}`, tipo: 'habito', nome: r.adesivo ?? h.adesivo, titulo: h.titulo, dia: r.dia, minimo: r.nivel === 'minimo' || undefined, quando: r.quando })
  }
  for (const t of d.tarefas) {
    if (!t.feitaEm) continue
    const nome = t.area ? AREAS[t.area].adesivo : 'estrela'
    lista.push({ id: `t|${t.id}`, tipo: 'tarefa', nome, titulo: t.titulo, dia: t.feitaNoDia ?? diaLocal(new Date(t.feitaEm)), quando: t.feitaEm })
  }
  for (const r of d.rituais) {
    if (!r.feitoEm) continue
    // a revisão é guardada pela segunda-feira da semana; o adesivo vai para o dia em que foi feita
    const dia = r.ritual === 'revisao' ? diaLocal(new Date(r.feitoEm)) : r.dia
    lista.push({ id: `r|${r.id}`, tipo: 'ritual', nome: ADESIVO_RITUAL[r.ritual], titulo: '', ritual: r.ritual, dia, quando: r.feitoEm })
  }
  return lista.sort((a, b) => a.dia.localeCompare(b.dia) || a.quando.localeCompare(b.quando) || a.id.localeCompare(b.id))
}

export const doMes = (lista: AdesivoDoAlbum[], mes: Mes) => lista.filter((a) => mesDe(a.dia) === mes)

/** As páginas do álbum: do mês do primeiro adesivo até o mês de hoje (sem adesivos, só a página de hoje). */
export function mesesDoAlbum(lista: AdesivoDoAlbum[], hoje: Dia): Mes[] {
  const atual = mesDe(hoje)
  const primeiro = lista.length ? mesDe(lista[0].dia) : atual
  const meses: Mes[] = []
  for (let m = primeiro < atual ? primeiro : atual; m <= atual; m = somarMeses(m, 1)) meses.push(m)
  return meses
}

/** Quanto cada adesivo fica torto na página (sempre o mesmo para o mesmo adesivo). */
export function inclinacao(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return (Math.abs(h) % 17) - 8
}

/** Quantos de cada tipo na página. */
export function contagemPorTipo(lista: AdesivoDoAlbum[]): Record<TipoAdesivo, number> {
  const c: Record<TipoAdesivo, number> = { habito: 0, tarefa: 0, ritual: 0 }
  for (const a of lista) c[a.tipo]++
  return c
}

// ---------- Adesivos especiais ----------

export type Especial = { nome: NomeAdesivo; aos: number }

/** Chegam com o total de adesivos do álbum. Depois de ganho, o especial é da pessoa (desfazer não tira). */
export const ESPECIAIS: Especial[] = [
  { nome: 'arcoIris', aos: 10 },
  { nome: 'pipa', aos: 25 },
  { nome: 'foguete', aos: 50 },
  { nome: 'cogumelo', aos: 100 },
  { nome: 'coroa', aos: 200 },
  { nome: 'joia', aos: 365 },
]

/** Especiais ganhos: nome → dia em que chegou. */
export type EspeciaisGanhos = Partial<Record<NomeAdesivo, Dia>>

/** Os especiais que o total já alcançou e que ainda não foram guardados, com o dia do adesivo que os trouxe. */
export function especiaisNovos(lista: AdesivoDoAlbum[], ganhos: EspeciaisGanhos): Array<{ nome: NomeAdesivo; dia: Dia }> {
  return ESPECIAIS.filter((e) => !ganhos[e.nome] && lista.length >= e.aos).map((e) => ({ nome: e.nome, dia: lista[e.aos - 1].dia }))
}

/** O próximo especial e quantos adesivos faltam (null quando já ganhou todos). */
export function proximoEspecial(total: number, ganhos: EspeciaisGanhos): { nome: NomeAdesivo; aos: number; faltam: number } | null {
  const e = ESPECIAIS.find((x) => !ganhos[x.nome] && x.aos > total) ?? null
  return e && { ...e, faltam: e.aos - total }
}

/** Adesivos que dá para escolher para um hábito: o da área e os especiais já ganhos. */
export function adesivosParaEscolher(padrao: NomeAdesivo, ganhos: EspeciaisGanhos): NomeAdesivo[] {
  return [padrao, ...ESPECIAIS.filter((e) => ganhos[e.nome] && e.nome !== padrao).map((e) => e.nome)]
}
