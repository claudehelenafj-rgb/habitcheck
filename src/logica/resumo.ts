// Contas do "Resumo para a consulta": tudo calculado no aparelho, a partir das anotações da pessoa.

import type { Checkin } from './checkin'
import { somarDias, type Dia } from './datas'
import { dosesDoDia, type RegistroDose, type Remedio } from './remedios'
import { maisFrequentes, type RegistroSintoma } from './sintomas'

const media = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : 0)

export function resumoCheckins(checkins: Checkin[]) {
  const dias = [...new Set(checkins.map((c) => c.dia))].sort()
  const porDia = dias.map((dia) => {
    const doDia = checkins.filter((c) => c.dia === dia)
    return {
      dia,
      ansiedade: Math.max(...doDia.map((c) => c.ansiedade)),
      irritacao: Math.max(...doDia.map((c) => c.irritacao)),
      energia: media(doDia.map((c) => c.energia)),
      sinais: [...new Set(doDia.flatMap((c) => c.sinais ?? []))],
    }
  })
  return {
    total: checkins.length,
    dias: dias.length,
    medias: {
      ansiedade: media(checkins.map((c) => c.ansiedade)),
      irritacao: media(checkins.map((c) => c.irritacao)),
      energia: media(checkins.map((c) => c.energia)),
    },
    diasAltos: porDia.filter((d) => Math.max(d.ansiedade, d.irritacao) >= 7).length,
    porDia,
  }
}

export function resumoSintomasDetalhado(sintomas: RegistroSintoma[]) {
  const nomes = [...new Set(sintomas.map((s) => s.sintoma))]
  const porSintoma = nomes
    .map((nome) => {
      const deste = sintomas.filter((s) => s.sintoma === nome)
      return { nome, vezes: deste.length, media: media(deste.map((s) => s.intensidade)), maior: Math.max(...deste.map((s) => s.intensidade)) }
    })
    .sort((a, b) => b.vezes - a.vezes || b.maior - a.maior || a.nome.localeCompare(b.nome, 'pt-BR'))
  return {
    registros: sintomas.length,
    dias: new Set(sintomas.map((s) => s.dia)).size,
    porSintoma,
    porques: maisFrequentes(sintomas.flatMap((s) => s.porques).filter((p) => p !== 'não sei'), 5),
    ajudou: maisFrequentes(sintomas.flatMap((s) => s.ajudou), 5),
    efeitoRemedio: sintomas.filter((s) => s.efeitoRemedio).sort((a, b) => a.quando.localeCompare(b.quando)),
  }
}

export type ResumoRemedio = { remedio: Remedio; previstas: number; tomadas: number; puladas: number; semResposta: number }

/**
 * Doses de cada remédio no período: só as que já deveriam ter acontecido (até agora)
 * e depois de o remédio ser cadastrado.
 */
export function resumoDoses(remedios: Remedio[], registros: RegistroDose[], inicio: Dia, hoje: Dia, agora: Date): ResumoRemedio[] {
  const status = new Map(registros.map((r) => [r.id, r.status]))
  return remedios.map((remedio) => {
    let previstas = 0
    let tomadas = 0
    let puladas = 0
    for (let dia = inicio; dia <= hoje; dia = somarDias(dia, 1)) {
      for (const dose of dosesDoDia([remedio], dia)) {
        if (dose.quando > agora || dose.quando < new Date(remedio.criadoEm)) continue
        previstas++
        const s = status.get(dose.id)
        if (s === 'tomei') tomadas++
        else if (s === 'pulei') puladas++
      }
    }
    return { remedio, previstas, tomadas, puladas, semResposta: previstas - tomadas - puladas }
  })
}
