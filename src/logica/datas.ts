// Datas "de calendário" (AAAA-MM-DD), sem hora e sem fuso: o dia 28 é o dia 28 em qualquer lugar.

export type Dia = string // 'AAAA-MM-DD'

export function diaLocal(data = new Date()): Dia {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${data.getFullYear()}-${p(data.getMonth() + 1)}-${p(data.getDate())}`
}

function paraUTC(dia: Dia): number {
  const [a, m, d] = dia.split('-').map(Number)
  return Date.UTC(a, m - 1, d)
}

/** Quantos dias vão de `de` até `ate` (negativo se `ate` vem antes). */
export function diasEntre(de: Dia, ate: Dia): number {
  return Math.round((paraUTC(ate) - paraUTC(de)) / 86_400_000)
}

export function somarDias(dia: Dia, n: number): Dia {
  const d = new Date(paraUTC(dia) + n * 86_400_000)
  const p = (x: number) => String(x).padStart(2, '0')
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`
}
