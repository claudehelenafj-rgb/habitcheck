// "Vale conversar com um profissional" (guia de saúde mental, seção "quando buscar ajuda").
// Cartão gentil, que a pessoa fecha e que não volta antes de 30 dias. O app não diagnostica: só repara
// que as anotações das últimas 2 semanas estão pesadas.

import type { Checkin } from './checkin'
import { diasEntre, somarDias, type Dia } from './datas'
import type { Hobby } from './hobbies'
import type { RegistroSintoma } from './sintomas'

export const JANELA_AJUDA = 14
/** "a maioria dos dias" de 14 */
export const DIAS_PESADOS = 8
export const DIAS_HUMOR_BAIXO = 5
export const PAUSA_AJUDA = 30

const SINTOMAS_PESADOS = ['ansiedade', 'tristeza', 'irritação', 'choro']
const SINTOMAS_HUMOR = ['tristeza', 'choro']
const MOTIVOS_SEM_ENERGIA = ['sem energia', 'perdi a vontade']

export type MotivoAjuda = 'diasPesados' | 'hobbiesSemEnergia'

export function motivoParaAjuda(
  checkins: Checkin[],
  sintomas: RegistroSintoma[],
  hobbies: Hobby[],
  hoje: Dia,
  dispensadaEm?: Dia,
): MotivoAjuda | null {
  if (dispensadaEm && diasEntre(dispensadaEm, hoje) < PAUSA_AJUDA) return null
  const inicio = somarDias(hoje, -(JANELA_AJUDA - 1))
  const naJanela = (dia: Dia) => dia >= inicio && dia <= hoje
  const pesados = new Set<Dia>()
  const humorBaixo = new Set<Dia>()
  for (const c of checkins.filter((c) => naJanela(c.dia))) {
    if (Math.max(c.ansiedade, c.irritacao) >= 7) pesados.add(c.dia)
    if (c.energia <= 3) humorBaixo.add(c.dia)
  }
  for (const s of sintomas.filter((s) => naJanela(s.dia))) {
    if (SINTOMAS_PESADOS.includes(s.sintoma) && s.intensidade >= 7) pesados.add(s.dia)
    if (SINTOMAS_HUMOR.includes(s.sintoma) && s.intensidade >= 4) humorBaixo.add(s.dia)
  }
  if (pesados.size >= DIAS_PESADOS) return 'diasPesados'
  const hobbySemEnergia = hobbies.some((h) => h.motivos.some((m) => naJanela(m.dia) && m.etiquetas.some((e) => MOTIVOS_SEM_ENERGIA.includes(e))))
  if (hobbySemEnergia && humorBaixo.size >= DIAS_HUMOR_BAIXO) return 'hobbiesSemEnergia'
  return null
}
