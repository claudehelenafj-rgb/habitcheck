import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { lerIcs } from './ics'
import { ehZip, lerZip } from './zip'

describe('zip do Google Agenda', () => {
  const dados = new Uint8Array(readFileSync(new URL('./exemplos/google-agenda.zip', import.meta.url)))

  it('reconhece e abre o .zip com os .ics dentro', async () => {
    expect(ehZip(dados)).toBe(true)
    const arquivos = await lerZip(dados)
    expect(arquivos.map((a) => a.nome).sort()).toEqual(['faculdade_abc@group.calendar.google.com.ics', 'pessoal@gmail.com.ics'])
    const eventos = arquivos.flatMap((a) => lerIcs(new TextDecoder().decode(a.conteudo)).eventos.map((e) => e.titulo)).sort()
    expect(eventos).toEqual(['Almoço com a Bia', 'Prova de cálculo'])
  })

  it('arquivo que não é zip', async () => {
    expect(ehZip(new TextEncoder().encode('BEGIN:VCALENDAR'))).toBe(false)
    await expect(lerZip(new Uint8Array(30))).rejects.toThrow()
  })
})
