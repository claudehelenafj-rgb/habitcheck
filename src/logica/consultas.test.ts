import { describe, expect, it } from 'vitest'
import { gerarIcs, nomeArquivoIcs, planoReverso, proximaDaRepeticao, situacaoMarcar, somarMeses, type Consulta } from './consultas'

function consulta(dados: Partial<Consulta> = {}): Consulta {
  return {
    id: 'c1',
    titulo: 'Dentista',
    status: 'marcada',
    data: '2026-11-05',
    hora: '14:30',
    duracaoMin: 60,
    deslocamentoMin: 30,
    preparoMin: 30,
    folgaPct: 30,
    preparo: [{ id: 'p1', texto: 'Documento com foto', feito: false }],
    criadaEm: '2026-10-28T10:00:00Z',
    ...dados,
  }
}

describe('planejamento de trás para frente', () => {
  it('sair de casa = deslocamento + folga; arrumar = preparo + folga antes de sair', () => {
    const p = planoReverso(consulta())!
    // 30 min + 30% = 39 min antes de 14:30 = 13:51 → arredonda para 13:50
    expect(p.sairDeCasa).toEqual(new Date(2026, 10, 5, 13, 50))
    // 39 min antes de 13:50 = 13:11 → 13:10
    expect(p.comecarArrumar).toEqual(new Date(2026, 10, 5, 13, 10))
    expect(p.fim).toEqual(new Date(2026, 10, 5, 15, 30))
  })

  it('mais folga, mais cedo', () => {
    const p = planoReverso(consulta({ folgaPct: 50 }))!
    expect(p.sairDeCasa).toEqual(new Date(2026, 10, 5, 13, 45))
    expect(p.comecarArrumar).toEqual(new Date(2026, 10, 5, 13, 0))
  })

  it('atravessa a meia-noite para trás', () => {
    const p = planoReverso(consulta({ data: '2026-11-05', hora: '00:20', deslocamentoMin: 20, preparoMin: 20, folgaPct: 25 }))!
    expect(p.sairDeCasa).toEqual(new Date(2026, 10, 4, 23, 55))
    expect(p.comecarArrumar).toEqual(new Date(2026, 10, 4, 23, 30))
  })

  it('sem data ou hora não calcula', () => {
    expect(planoReverso(consulta({ hora: undefined }))).toBeNull()
  })
})

describe('repetição', () => {
  it('soma meses e ajusta o dia 31', () => {
    expect(somarMeses('2026-05-10', 6)).toBe('2026-11-10')
    expect(somarMeses('2026-08-31', 6)).toBe('2027-02-28')
    expect(somarMeses('2027-08-31', 6)).toBe('2028-02-29') // bissexto
    expect(somarMeses('2026-11-15', 3)).toBe('2027-02-15')
  })

  it('consulta feita que repete vira um novo "preciso marcar" com prazo', () => {
    const c = consulta({ recorrenciaMeses: 6, preparo: [{ id: 'p1', texto: 'Documento', feito: true }] })
    const nova = proximaDaRepeticao(c, '2026-11-05', 'c2', '2026-11-05T18:00:00Z')!
    expect(nova).toMatchObject({ id: 'c2', status: 'marcar', marcarAte: '2027-05-05', data: undefined, hora: undefined })
    expect(nova.preparo[0].feito).toBe(false)
    expect(proximaDaRepeticao(consulta(), '2026-11-05', 'c3', '')).toBeNull()
  })
})

describe('preciso marcar', () => {
  it('hora de marcar, em breve, tranquilo ou sem prazo', () => {
    expect(situacaoMarcar('2026-10-20', '2026-10-28')).toBe('hora-de-marcar')
    expect(situacaoMarcar('2026-10-28', '2026-10-28')).toBe('hora-de-marcar')
    expect(situacaoMarcar('2026-11-20', '2026-10-28')).toBe('em-breve')
    expect(situacaoMarcar('2027-03-01', '2026-10-28')).toBe('tranquilo')
    expect(situacaoMarcar(undefined, '2026-10-28')).toBe('sem-prazo')
  })
})

describe('arquivo .ics', () => {
  const textos = { arrumar: 'Começar a se arrumar', sair: 'Sair de casa' }
  const ics = gerarIcs(consulta({ local: 'Rua das Flores, 10; sala 2', perguntas: 'Perguntar sobre a dor' }), textos, new Date('2026-10-28T10:00:00Z'))!

  it('tem evento com início e fim e linhas terminadas em CRLF', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(ics).toContain(`DTSTART:${new Date(2026, 10, 5, 14, 30).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`)
    expect(ics).toContain('SUMMARY:Dentista')
    expect(ics.split('\r\n').every((l) => new TextEncoder().encode(l).length <= 75)).toBe(true)
  })

  it('escapa vírgula e ponto e vírgula do endereço', () => {
    expect(ics).toContain('LOCATION:Rua das Flores\\, 10\\; sala 2')
  })

  it('tem os dois alarmes com a ação escrita: arrumar 80 min antes e sair 40 min antes', () => {
    expect(ics).toContain('DESCRIPTION:Começar a se arrumar\r\nTRIGGER:-PT80M')
    expect(ics).toContain('DESCRIPTION:Sair de casa\r\nTRIGGER:-PT40M')
    expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(2)
  })

  it('nome do arquivo sem acentos', () => {
    expect(nomeArquivoIcs(consulta({ titulo: 'Retorno clínico' }))).toBe('retorno-clinico-2026-11-05.ics')
  })
})
