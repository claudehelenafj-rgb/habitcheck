import { describe, expect, it } from 'vitest'
import { CONFIG_ALIMENTACAO_PADRAO } from './alimentacao'
import {
  aplicarNoConfig,
  horaDoTexto,
  lerCabecalho,
  lerPlano,
  limparPlano,
  opcoesParaTexto,
  refeicaoDoHorario,
  textoParaOpcoes,
} from './planoAlimentar'

// planos inventados, escritos de jeitos diferentes, como costumam vir nos PDFs

describe('horário e título de refeição', () => {
  it('lê os jeitos comuns de escrever a hora', () => {
    expect(horaDoTexto('07:00')).toBe('07:00')
    expect(horaDoTexto('às 7h')).toBe('07:00')
    expect(horaDoTexto('12h30')).toBe('12:30')
    expect(horaDoTexto('9 horas')).toBe('09:00')
    expect(horaDoTexto('(15:30h)')).toBe('15:30')
    expect(horaDoTexto('2 hambúrgueres')).toBeUndefined()
    expect(horaDoTexto('200 g de arroz')).toBeUndefined()
  })

  it('reconhece títulos e não confunde com itens', () => {
    expect(lerCabecalho('CAFÉ DA MANHÃ – 7h')).toMatchObject({ tipo: 'cafe', nome: 'Café da manhã', hora: '07:00' })
    expect(lerCabecalho('Refeição 3: Almoço (12h30)')).toMatchObject({ tipo: 'almoco', hora: '12:30' })
    expect(lerCabecalho('10:00 Colação')).toMatchObject({ tipo: 'lancheManha', nome: 'Colação', hora: '10:00' })
    expect(lerCabecalho('Ceia: 1 iogurte natural')).toMatchObject({ tipo: 'ceia', resto: '1 iogurte natural' })
    expect(lerCabecalho('Jantar: 19h')).toMatchObject({ tipo: 'jantar', hora: '19:00', resto: undefined })
    expect(lerCabecalho('• Lanche')).toMatchObject({ tipo: 'lanche?' })
    expect(lerCabecalho('Café com leite sem açúcar')).toBeUndefined()
    expect(lerCabecalho('1 xícara de café')).toBeUndefined()
    expect(lerCabecalho('Almoço livre no domingo, com a família')).toBeUndefined()
  })
})

describe('lendo o plano', () => {
  it('títulos com horário e "Opção 1 / Opção 2"; ignora o cabeçalho e as orientações', () => {
    const plano = lerPlano([
      'Plano alimentar',
      'Paciente: Fulana de Tal',
      'CAFÉ DA MANHÃ – 7h',
      'Opção 1',
      '• 2 fatias de pão integral',
      '• 1 ovo mexido',
      'Opção 2: 1 tapioca com queijo',
      '1 fruta',
      'LANCHE DA MANHÃ – 10h',
      '1 fruta',
      'Almoço – 12h30',
      'Arroz, feijão, salada e 1 proteína',
      'Página 1 de 2',
      'Lanche da tarde – 16h',
      '1 iogurte',
      'ou',
      '1 punhado de castanhas',
      'Jantar – 19h30',
      'Igual ao almoço',
      'Ceia – 21h30',
      '1 xícara de chá',
      'Orientações gerais',
      'Beber água ao longo do dia',
    ])
    expect(plano.map((r) => [r.id, r.hora])).toEqual([
      ['cafe', '07:00'],
      ['lancheManha', '10:00'],
      ['almoco', '12:30'],
      ['lanche', '16:00'],
      ['jantar', '19:30'],
      ['ceia', '21:30'],
    ])
    expect(plano[0].opcoes).toEqual([['2 fatias de pão integral', '1 ovo mexido'], ['1 tapioca com queijo', '1 fruta']])
    expect(plano[3].opcoes).toEqual([['1 iogurte'], ['1 punhado de castanhas']])
    expect(plano[5].opcoes).toEqual([['1 xícara de chá']])
    expect(JSON.stringify(plano)).not.toContain('Fulana')
    expect(JSON.stringify(plano)).not.toContain('água')
  })

  it('sem horário: "lanche" antes do almoço é o da manhã; depois, o da tarde', () => {
    const plano = lerPlano(['Café da manhã:', 'pão', 'Lanche:', 'banana', 'Almoço:', 'arroz', 'Lanche:', 'iogurte', 'Jantar:', 'sopa'])
    expect(plano.map((r) => r.id)).toEqual(['cafe', 'lancheManha', 'almoco', 'lanche', 'jantar'])
    expect(plano.every((r) => !r.hora)).toBe(true)
  })

  it('a mesma refeição duas vezes junta as opções', () => {
    const plano = lerPlano(['Almoço 12h', 'arroz e feijão', 'Almoço', 'macarrão'])
    expect(plano).toEqual([{ id: 'almoco', hora: '12:00', nome: 'Almoço', opcoes: [['arroz e feijão'], ['macarrão']] }])
  })

  it('PDF sem texto de refeição (foto escaneada, outro assunto): nada encontrado', () => {
    expect(lerPlano([])).toEqual([])
    expect(lerPlano(['Relatório', 'Resultados do exame'])).toEqual([])
  })
})

describe('conferir, salvar e usar', () => {
  it('opções viram texto com linha em branco entre elas, e voltam', () => {
    const opcoes = [['2 fatias de pão', '1 ovo'], ['1 tapioca']]
    expect(opcoesParaTexto(opcoes)).toBe('2 fatias de pão\n1 ovo\n\n1 tapioca')
    expect(textoParaOpcoes('2 fatias de pão\n1 ovo\n\n\n1 tapioca\n')).toEqual(opcoes)
    expect(textoParaOpcoes('Opção 1: pão\nOpção 2\n- tapioca')).toEqual([['pão'], ['tapioca']])
    expect(textoParaOpcoes('  \n')).toEqual([])
  })

  it('limpar: tira refeições vazias e põe em ordem de horário', () => {
    const r = limparPlano([
      { id: 'jantar', hora: '19:00', opcoes: [] },
      { id: 'ceia', opcoes: [] },
      { id: 'cafe', hora: '07:00', opcoes: [['pão']] },
    ])
    expect(r.map((x) => x.id)).toEqual(['cafe', 'jantar'])
  })

  it('usar o plano: as refeições dele ficam ligadas com o horário dele; as outras, desligadas', () => {
    const r = aplicarNoConfig(CONFIG_ALIMENTACAO_PADRAO.refeicoes, [
      { id: 'cafe', hora: '07:00', opcoes: [] },
      { id: 'lancheManha', hora: '10:00', opcoes: [] },
      { id: 'almoco', opcoes: [] },
    ])
    expect(r.map((x) => [x.id, x.ativa, x.hora])).toEqual([
      ['cafe', true, '07:00'],
      ['lancheManha', true, '10:00'],
      ['almoco', true, '12:30'],
      ['lanche', false, '16:00'],
      ['jantar', false, '19:30'],
      ['ceia', false, '21:30'],
    ])
  })

  it('o que posso comer agora: do horário da refeição até a próxima', () => {
    const plano = [
      { id: 'cafe' as const, hora: '07:00', opcoes: [] },
      { id: 'almoco' as const, hora: '12:30', opcoes: [] },
      { id: 'ceia' as const, hora: '21:30', opcoes: [] },
    ]
    const em = (h: number, m = 0) => new Date(2026, 9, 28, h, m)
    expect(refeicaoDoHorario(plano, em(6))).toEqual({ atual: undefined, proxima: plano[0] })
    expect(refeicaoDoHorario(plano, em(7))).toEqual({ atual: plano[0], proxima: plano[1] })
    expect(refeicaoDoHorario(plano, em(12, 29)).atual).toBe(plano[0])
    expect(refeicaoDoHorario(plano, em(23, 50))).toEqual({ atual: plano[2], proxima: undefined })
  })
})
