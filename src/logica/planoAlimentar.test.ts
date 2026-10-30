import { describe, expect, it } from 'vitest'
import { CONFIG_ALIMENTACAO_PADRAO } from './alimentacao'
import {
  aplicarNoConfig,
  horaDoTexto,
  lerCabecalho,
  lerPlano,
  limparPlano,
  observacao,
  opcoesParaTexto,
  refeicaoDoHorario,
  resumoDasOpcoes,
  semCalorias,
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

  it('jeito do Dietbox: coluna de calorias, "Substituição N", "Assim que acordar", linhas quebradas, rodapé', () => {
    // tudo inventado, só no formato
    const plano = lerPlano([
      '01/02/2026, 08:00 — Dietbox',
      'Profissional Exemplo',
      'CRN: 00/00000',
      'Plano Alimentar',
      'Pessoa Exemplo',
      'Todos os dias',
      '-> Meta de água: 2L por dia',
      '06:30 - Assim que acordar — Kcal',
      '• Beber um copo de água (300ml) — 0,00 kcal',
      '09:00 - Café da manhã / Lanche — Kcal',
      '• Pão integral: 2 fatias (50g) — 115,00 kcal',
      '• Ovo mexido: 1 unidade OU Queijo branco: 1 fatia — 74,50 kcal',
      '(30g)',
      '• Suco natural: 1 copo — 90,00 kcal',
      'pequeno (200ml)',
      'Obs: Sanduíche de ovo + suco. -> EM CASA: pode trocar o suco por',
      'café com leite',
      'Substituição 1 — Kcal',
      '• Tapioca: 3 colheres de sopa (60g) — 198,00 kcal',
      '• Queijo coalho: 1 fatia (30g) — 68,00 kcal',
      'Obs: Tapioca com queijo',
      '12:30 - Almoço — Kcal',
      '• Salada crua à vontade — 1,95 kcal',
      'https://exemplo.app/plano/imprimir — 1/2',
      '01/02/2026, 08:00 — Dietbox',
      '• Arroz (cozido): 4 colheres de sopa — 112,22 kcal',
      '19:30 - Jantar (TODAS AS OPÇÕES PODEM TER SALADA) — Kcal',
      '• Sopa de legumes: 1 prato — 150,00 kcal',
      'Substituição 1 — Kcal',
      '• Omelete: 2 ovos — 149,00 kcal',
      'Este documento é de uso exclusivo do destinatário e pode ter conteúdo confidencial.',
      'proibido.',
      'https://exemplo.app/plano/imprimir — 2/2',
    ])
    expect(plano.map((r) => [r.id, r.hora, r.nome])).toEqual([
      ['acordar', '06:30', 'Assim que acordar'],
      ['cafe', '09:00', 'Café da manhã / Lanche'],
      ['almoco', '12:30', 'Almoço'],
      ['jantar', '19:30', 'Jantar'],
    ])
    expect(plano[1].opcoes).toEqual([
      [
        'Pão integral: 2 fatias (50g)',
        'Ovo mexido: 1 unidade OU Queijo branco: 1 fatia (30g)',
        'Suco natural: 1 copo pequeno (200ml)',
        'Obs: Sanduíche de ovo + suco. -> EM CASA: pode trocar o suco por café com leite',
      ],
      ['Tapioca: 3 colheres de sopa (60g)', 'Queijo coalho: 1 fatia (30g)', 'Obs: Tapioca com queijo'],
    ])
    expect(plano[2].opcoes).toEqual([['Salada crua à vontade', 'Arroz (cozido): 4 colheres de sopa']])
    expect(plano[3]).toMatchObject({ nota: 'Todas as opções podem ter salada', opcoes: [['Sopa de legumes: 1 prato'], ['Omelete: 2 ovos']] })
    const tudo = JSON.stringify(plano)
    for (const fora of ['kcal', 'Kcal', 'Dietbox', 'CRN', 'Pessoa Exemplo', 'https', 'exclusivo', 'proibido', 'Meta de água']) expect(tudo).not.toContain(fora)
  })

  it('"• Café" no meio de uma refeição é comida, não título', () => {
    const plano = lerPlano(['Lanche da tarde 16h', '• Pão de queijo', '• Café', 'Jantar 19h', '• Sopa'])
    expect(plano.map((r) => [r.id, r.opcoes])).toEqual([
      ['lanche', [['Pão de queijo', 'Café']]],
      ['jantar', [['Sopa']]],
    ])
  })

  it('PDF sem texto de refeição (foto escaneada, outro assunto): nada encontrado', () => {
    expect(lerPlano([])).toEqual([])
    expect(lerPlano(['Relatório', 'Resultados do exame'])).toEqual([])
  })
})

describe('conferir, salvar e usar', () => {
  it('calorias e observações', () => {
    expect(semCalorias('Pão: 2 fatias (50g) — 115,00 kcal')).toBe('Pão: 2 fatias (50g)')
    expect(semCalorias('12:30 - Almoço — Kcal')).toBe('12:30 - Almoço')
    expect(semCalorias('Total: 1.850 kcal')).toBe('Total:')
    expect(observacao('Obs: Tapioca com queijo')).toBe('Tapioca com queijo')
    expect(observacao('Tapioca')).toBeUndefined()
  })

  it('resumo para o aviso: a observação de cada opção (ou os itens), separados por "ou"', () => {
    expect(resumoDasOpcoes([['1 fruta']], 'ou')).toBe('1 fruta')
    expect(resumoDasOpcoes([['Pão', 'Ovo', 'Obs: Sanduíche de ovo. -> Em casa: café'], ['Tapioca', 'Queijo']], 'ou')).toBe('Sanduíche de ovo ou Tapioca, Queijo')
    expect(resumoDasOpcoes([['a'.repeat(200)]], 'ou')).toHaveLength(160)
  })

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

  it('usar o plano com aviso: liga o lembrete das refeições do plano que têm horário', () => {
    const r = aplicarNoConfig(CONFIG_ALIMENTACAO_PADRAO.refeicoes, [{ id: 'acordar', hora: '06:30', opcoes: [] }, { id: 'cafe', opcoes: [] }], true)
    expect(r.filter((x) => x.ativa).map((x) => [x.id, x.hora, x.lembrar])).toEqual([
      ['acordar', '06:30', true],
      ['cafe', '08:00', true],
    ])
    expect(r.filter((x) => !x.ativa).every((x) => !x.lembrar)).toBe(true)
  })

  it('usar o plano: as refeições dele ficam ligadas com o horário dele; as outras, desligadas', () => {
    const r = aplicarNoConfig(CONFIG_ALIMENTACAO_PADRAO.refeicoes, [
      { id: 'cafe', hora: '07:00', opcoes: [] },
      { id: 'lancheManha', hora: '10:00', opcoes: [] },
      { id: 'almoco', opcoes: [] },
    ])
    expect(r.map((x) => [x.id, x.ativa, x.hora])).toEqual([
      ['acordar', false, '07:00'],
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
