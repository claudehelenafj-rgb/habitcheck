import { describe, expect, it } from 'vitest'
import { deFusoParaUtc, desdobrar, lerData, lerDuracao, lerIcs, lerRRule } from './ics'

const APPLE = [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'PRODID:-//Apple Inc.//macOS 15.0//EN',
  'X-WR-CALNAME:Faculdade',
  'BEGIN:VTIMEZONE',
  'TZID:America/Sao_Paulo',
  'END:VTIMEZONE',
  'BEGIN:VEVENT',
  'UID:aula-123',
  'DTSTART;TZID=America/Sao_Paulo:20261102T190000',
  'DTEND;TZID=America/Sao_Paulo:20261102T210000',
  'SUMMARY:Aula de cálculo',
  'LOCATION:Sala 12\\, prédio B',
  'RRULE:FREQ=WEEKLY;BYDAY=MO,WE;COUNT=4',
  'BEGIN:VALARM',
  'TRIGGER:-PT15M',
  'DESCRIPTION:Lembrete do alarme não é título',
  'END:VALARM',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'UID:feriado-1',
  'DTSTART;VALUE=DATE:20261115',
  'DTEND;VALUE=DATE:20261116',
  'SUMMARY:Feriado',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'UID:cancelado',
  'DTSTART:20261110T120000Z',
  'STATUS:CANCELLED',
  'SUMMARY:Cancelado',
  'END:VEVENT',
  'END:VCALENDAR',
].join('\r\n')

describe('lendo .ics', () => {
  const r = lerIcs(APPLE)

  it('reconhece a origem e o nome do calendário', () => {
    expect(r.origem).toBe('apple')
    expect(r.nomeCalendario).toBe('Faculdade')
    expect(lerIcs('BEGIN:VCALENDAR\r\nPRODID:-//Google Inc//Google Calendar 70.9054//EN\r\nEND:VCALENDAR').origem).toBe('google')
  })

  it('lê título, local com vírgula, fuso e repetição; ignora o texto do alarme', () => {
    const aula = r.eventos.find((e) => e.uid === 'aula-123')!
    expect(aula.titulo).toBe('Aula de cálculo')
    expect(aula.local).toBe('Sala 12, prédio B')
    expect(aula.inicio).toBe('2026-11-02T22:00:00.000Z') // 19h em São Paulo = 22h UTC
    expect(aula.fim).toBe('2026-11-03T00:00:00.000Z')
    expect(aula.repeticao).toEqual({ freq: 'WEEKLY', intervalo: 1, vezes: 4, diasSemana: [1, 3] })
  })

  it('evento de dia inteiro e evento cancelado', () => {
    const feriado = r.eventos.find((e) => e.uid === 'feriado-1')!
    expect(feriado.diaInteiro).toBe(true)
    expect(new Date(feriado.inicio)).toEqual(new Date(2026, 10, 15))
    expect(r.eventos.some((e) => e.titulo === 'Cancelado')).toBe(false)
  })

  it('alteração de uma ocorrência vira exceção do evento original', () => {
    const texto = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT', 'UID:x', 'DTSTART:20261102T120000Z', 'DTEND:20261102T130000Z', 'RRULE:FREQ=DAILY;COUNT=3', 'SUMMARY:Diário', 'END:VEVENT',
      'BEGIN:VEVENT', 'UID:x', 'RECURRENCE-ID:20261103T120000Z', 'DTSTART:20261103T150000Z', 'DTEND:20261103T160000Z', 'SUMMARY:Diário (mudou)', 'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')
    const ev = lerIcs(texto).eventos
    expect(ev).toHaveLength(2)
    expect(ev[0].excecoes).toEqual(['2026-11-03T12:00:00.000Z'])
    expect(ev[1].uid).toBe('x|2026-11-03T12:00:00.000Z')
  })
})

describe('peças do formato', () => {
  it('desdobra linhas longas', () => {
    expect(desdobrar('SUMMARY:Aula de\r\n  cálculo\r\nEND:VEVENT')).toEqual(['SUMMARY:Aula de cálculo', 'END:VEVENT'])
  })

  it('datas: UTC, local e fuso com horário de verão', () => {
    expect(new Date(lerData('20261105T143000Z', {})!.instante).toISOString()).toBe('2026-11-05T14:30:00.000Z')
    expect(lerData('20261105T143000', {})!.instante).toBe(new Date(2026, 10, 5, 14, 30).getTime())
    expect(new Date(deFusoParaUtc(2026, 7, 10, 10, 0, 0, 'America/New_York')).toISOString()).toBe('2026-07-10T14:00:00.000Z')
    expect(new Date(deFusoParaUtc(2026, 1, 10, 10, 0, 0, 'America/New_York')).toISOString()).toBe('2026-01-10T15:00:00.000Z')
  })

  it('duração', () => {
    expect(lerDuracao('PT1H30M')).toBe(90 * 60_000)
    expect(lerDuracao('P1D')).toBe(86_400_000)
    expect(lerDuracao('P1W')).toBe(7 * 86_400_000)
  })

  it('repetição com UNTIL e INTERVAL', () => {
    expect(lerRRule('FREQ=MONTHLY;INTERVAL=2;UNTIL=20270101T000000Z')).toEqual({ freq: 'MONTHLY', intervalo: 2, ate: '2027-01-01T00:00:00.000Z' })
    expect(lerRRule('FREQ=SECONDLY')).toBeUndefined()
  })
})
