import { describe, expect, it } from 'vitest'
import {
  avisoDeConta,
  desmarcarPaga,
  formatarValor,
  lerValor,
  marcarPaga,
  ordenarContas,
  proximoVencimento,
  resumoDoMes,
  somarMeses,
  valorParaCampo,
  vencimentoNoMes,
  vencimentosEntre,
  lerGastoRapido,
  poteDoGasto,
  saldoDoPote,
  desistenciasDoMes,
  fimDaEspera,
  guardadoPorMes,
  horasParaDecidir,
  prontoParaDecidir,
  progressoCofrinho,
  type Cofrinho,
  type Conta,
  type Deposito,
  type Desejo,
  type Gasto,
  type Pote,
} from './dinheiro'

const conta = (extra: Partial<Conta> = {}): Conta => ({
  id: 'c1',
  nome: 'Luz',
  valor: 12990,
  dia: 10,
  repete: true,
  avisarDiasAntes: 3,
  pagamentos: [],
  criadaEm: '2026-10-01T10:00:00Z',
  ...extra,
})

describe('vencimentos', () => {
  it('dia 31 em mês de 30 dias vence no dia 30; em fevereiro, no último dia', () => {
    expect(vencimentoNoMes({ dia: 31 }, '2026-11')).toBe('2026-11-30')
    expect(vencimentoNoMes({ dia: 31 }, '2026-02')).toBe('2026-02-28')
    expect(vencimentoNoMes({ dia: 30 }, '2028-02')).toBe('2028-02-29')
    expect(vencimentoNoMes({ dia: 31 }, '2026-12')).toBe('2026-12-31')
  })

  it('somar meses, virando o ano', () => {
    expect(somarMeses('2026-12', 1)).toBe('2027-01')
    expect(somarMeses('2026-01', -1)).toBe('2025-12')
  })

  it('próximo vencimento: este mês; pago, o próximo; não pago no mês passado, atrasada', () => {
    expect(proximoVencimento(conta(), '2026-10-05')).toMatchObject({ dia: '2026-10-10', diasAte: 5, estado: 'depois' })
    expect(proximoVencimento(conta(), '2026-10-08')).toMatchObject({ estado: 'perto' })
    expect(proximoVencimento(conta(), '2026-10-10')).toMatchObject({ estado: 'hoje' })
    const pagaOut = marcarPaga(conta(), '2026-10', new Date())
    expect(proximoVencimento(pagaOut, '2026-10-12')).toMatchObject({ dia: '2026-11-10' })
    // já existia em setembro e setembro não foi marcado: aparece como atrasada (só o mês passado, nunca uma fila)
    const semPagarSetembro = marcarPaga(conta({ criadaEm: '2026-09-01T10:00:00Z' }), '2026-10', new Date())
    expect(proximoVencimento(semPagarSetembro, '2026-10-12')).toMatchObject({ dia: '2026-09-10', estado: 'atrasada', diasAte: -32 })
    // criada depois do vencimento do mês passado: não cobra o mês passado
    expect(proximoVencimento(conta({ criadaEm: '2026-09-20T10:00:00Z' }), '2026-10-02')).toMatchObject({ dia: '2026-10-10' })
    // cadastrada no dia 15 com vencimento no dia 10: a primeira é no mês que vem
    expect(proximoVencimento(conta({ criadaEm: '2026-10-15T10:00:00Z' }), '2026-10-15')).toMatchObject({ dia: '2026-11-10' })
  })

  it('conta de uma vez só: até ser paga', () => {
    const ipva = conta({ repete: false, mes: '2026-11', dia: 20 })
    expect(proximoVencimento(ipva, '2026-10-29')).toMatchObject({ dia: '2026-11-20', diasAte: 22 })
    expect(proximoVencimento(marcarPaga(ipva, '2026-11', new Date()), '2026-10-29')).toBeNull()
  })

  it('lembrete: alguns dias antes e no dia, só se não foi paga', () => {
    expect(avisoDeConta(conta(), '2026-10-07')?.tipo).toBe('antes')
    expect(avisoDeConta(conta(), '2026-10-08')).toBeNull()
    expect(avisoDeConta(conta(), '2026-10-10')?.tipo).toBe('dia')
    expect(avisoDeConta(marcarPaga(conta(), '2026-10', new Date()), '2026-10-10')).toBeNull()
    expect(avisoDeConta(conta({ avisarDiasAntes: 0 }), '2026-10-07')).toBeNull()
  })

  it('marcar e desmarcar paga (com o valor do mês)', () => {
    const c = marcarPaga(conta(), '2026-10', new Date('2026-10-09T12:00:00Z'))
    expect(c.pagamentos).toEqual([{ mes: '2026-10', quando: '2026-10-09T12:00:00.000Z', valor: 12990 }])
    expect(marcarPaga(c, '2026-10', new Date())).toBe(c)
    expect(desmarcarPaga(c, '2026-10').pagamentos).toEqual([])
  })

  it('ordem: a mais urgente primeiro; sem nada para pagar, no fim', () => {
    const lista = ordenarContas(
      [conta({ id: 'a', nome: 'Internet', dia: 25 }), conta({ id: 'b', nome: 'Aluguel', dia: 5 }), conta({ id: 'c', nome: 'IPVA', repete: false, mes: '2026-01' , pagamentos: [{ mes: '2026-01', quando: '' }] })],
      '2026-10-03',
    )
    expect(lista.map((x) => x.conta.nome)).toEqual(['Aluguel', 'Internet', 'IPVA'])
  })

  it('calendário: vencimentos no intervalo, inclusive em meses diferentes', () => {
    const lista = vencimentosEntre([conta({ dia: 31 }), conta({ id: 'x', repete: false, mes: '2026-11', dia: 2 })], '2026-10-26', '2026-11-30')
    expect(lista.map((x) => x.dia)).toEqual(['2026-10-31', '2026-11-30', '2026-11-02'])
  })
})

describe('reais em centavos', () => {
  it('lê do jeito que a pessoa escrever', () => {
    expect(lerValor('35')).toBe(3500)
    expect(lerValor('35,9')).toBe(3590)
    expect(lerValor('35,90')).toBe(3590)
    expect(lerValor('35.90')).toBe(3590)
    expect(lerValor('R$ 1.234,56')).toBe(123456)
    expect(lerValor('1.234')).toBe(123400)
    expect(lerValor('0,1')).toBe(10)
    expect(lerValor('abc')).toBeNull()
    expect(lerValor('')).toBeNull()
  })

  it('mostra em reais e prepara o campo', () => {
    expect(formatarValor(123456).replace(/\s/g, ' ')).toBe('R$ 1.234,56')
    expect(valorParaCampo(3590)).toBe('35,90')
    expect(valorParaCampo(undefined)).toBe('')
  })
})

describe('resumo do mês', () => {
  it('soma as contas que vencem no mês e o que já foi pago', () => {
    const luz = marcarPaga(conta(), '2026-10', new Date())
    const net = conta({ id: 'n', nome: 'Internet', valor: 9990, dia: 20 })
    const variavel = conta({ id: 'v', nome: 'Cartão', valor: undefined, dia: 15 })
    const ipva = conta({ id: 'i', nome: 'IPVA', repete: false, mes: '2026-11', valor: 50000 })
    expect(resumoDoMes([luz, net, variavel, ipva], '2026-10')).toEqual({ total: 22980, pago: 12990, contas: 3, pagas: 1 })
    expect(resumoDoMes([luz, net, variavel, ipva], '2026-11')).toEqual({ total: 72980, pago: 0, contas: 4, pagas: 0 })
    // conta criada depois do vencimento deste mês não entra
    expect(resumoDoMes([conta({ criadaEm: '2026-10-15T10:00:00Z' })], '2026-10').contas).toBe(0)
  })
})

describe('potes da semana', () => {
  const semana = ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01']
  const mercado: Pote = { id: 'm', nome: 'Mercado', limite: 30000, palavras: [], ordem: 0 }
  const fora: Pote = { id: 'f', nome: 'Comida fora', limite: 10000, palavras: ['ifood', 'restaurante'], ordem: 1 }
  const g = (valor: number, poteId: string | undefined, dia: string): Gasto => ({ id: `${valor}${dia}`, valor, descricao: '', poteId, dia, quando: '' })

  it('saldo da semana: só os gastos de segunda a domingo; a barra esvazia', () => {
    const gastos = [g(5000, 'm', '2026-10-25'), g(12000, 'm', '2026-10-26'), g(3000, 'm', '2026-11-01'), g(2000, 'f', '2026-10-27'), g(9999, undefined, '2026-10-28')]
    expect(saldoDoPote(mercado, gastos, semana)).toEqual({ gasto: 15000, saldo: 15000, fracao: 0.5 })
    expect(saldoDoPote(fora, gastos, semana)).toEqual({ gasto: 2000, saldo: 8000, fracao: 0.8 })
  })

  it('virada da semana: na segunda o pote começa cheio de novo', () => {
    const proxima = semana.map((d) => {
      const x = new Date(`${d}T12:00:00`)
      x.setDate(x.getDate() + 7)
      return x.toISOString().slice(0, 10)
    })
    expect(saldoDoPote(mercado, [g(12000, 'm', '2026-10-30')], proxima)).toEqual({ gasto: 0, saldo: 30000, fracao: 1 })
  })

  it('passar do combinado: saldo negativo, barra vazia (sem drama)', () => {
    expect(saldoDoPote(fora, [g(13000, 'f', '2026-10-27')], semana)).toEqual({ gasto: 13000, saldo: -3000, fracao: 0 })
  })

  it('gasto rápido: número primeiro, depois o que foi', () => {
    expect(lerGastoRapido('35 ifood')).toEqual({ valor: 3500, descricao: 'ifood' })
    expect(lerGastoRapido('35,90 mercado do bairro')).toEqual({ valor: 3590, descricao: 'mercado do bairro' })
    expect(lerGastoRapido('R$ 12 uber')).toEqual({ valor: 1200, descricao: 'uber' })
    expect(lerGastoRapido('1.250 aluguel')).toEqual({ valor: 125000, descricao: 'aluguel' })
    expect(lerGastoRapido('12.5 pão')).toEqual({ valor: 1250, descricao: 'pão' })
    expect(lerGastoRapido('35')).toBeNull()
    expect(lerGastoRapido('ligar 35 vezes')).toBeNull()
    expect(lerGastoRapido('comprar pão')).toBeNull()
  })

  it('o pote do gasto: pelo nome ou pelas palavras, sem acento nem maiúscula', () => {
    expect(poteDoGasto('ifood', [mercado, fora])?.id).toBe('f')
    expect(poteDoGasto('Restaurante japonês', [mercado, fora])?.id).toBe('f')
    expect(poteDoGasto('mercado do bairro', [mercado, fora])?.id).toBe('m')
    expect(poteDoGasto('comida fora com amigos', [mercado, fora])?.id).toBe('f')
    expect(poteDoGasto('uber', [mercado, fora])).toBeUndefined()
    // palavra pela metade não conta
    expect(poteDoGasto('supermercado', [mercado, fora])).toBeUndefined()
  })
})

describe('pausa antes de comprar', () => {
  const desejo = (extra: Partial<Desejo> = {}): Desejo => ({ id: 'd', nome: 'Fone novo', valor: 25000, criadoEm: '2026-10-29T14:30:00.000Z', ...extra })

  it('espera 48 horas antes do "ainda quero?"', () => {
    expect(fimDaEspera(desejo()).toISOString()).toBe('2026-10-31T14:30:00.000Z')
    expect(horasParaDecidir(desejo(), new Date('2026-10-30T18:00:00.000Z'))).toBe(21)
    expect(prontoParaDecidir(desejo(), new Date('2026-10-31T14:29:00.000Z'))).toBe(false)
    expect(prontoParaDecidir(desejo(), new Date('2026-10-31T14:30:00.000Z'))).toBe(true)
    expect(horasParaDecidir(desejo(), new Date('2026-11-02T00:00:00.000Z'))).toBe(0)
    // relógio da tela um pouco antes de anotar: continua 48
    expect(horasParaDecidir(desejo(), new Date('2026-10-29T14:29:30.000Z'))).toBe(48)
    expect(prontoParaDecidir(desejo({ decisao: 'desisti' }), new Date('2026-11-02T00:00:00.000Z'))).toBe(false)
  })

  it('o que ficou com a pessoa no mês', () => {
    const lista = [
      desejo({ id: 'a', decisao: 'desisti', decididoEm: '2026-10-31T15:00:00.000Z' }),
      desejo({ id: 'b', decisao: 'desisti', valor: undefined, decididoEm: '2026-10-20T15:00:00.000Z' }),
      desejo({ id: 'c', decisao: 'comprei', decididoEm: '2026-10-31T15:00:00.000Z' }),
      desejo({ id: 'e', decisao: 'desisti', decididoEm: '2026-11-01T15:00:00.000Z' }),
    ]
    expect(desistenciasDoMes(lista, '2026-10')).toEqual({ quantos: 2, valor: 25000 })
  })
})

describe('cofrinho', () => {
  const cofrinho: Cofrinho = { id: 'c', nome: 'Viagem', meta: 100000, criadoEm: '' }
  const dep = (valor: number, dia: string, cofrinhoId = 'c'): Deposito => ({ id: `${valor}${dia}`, cofrinhoId, valor, dia, quando: '' })
  const depositos = [dep(20000, '2026-08-10'), dep(15000, '2026-10-02'), dep(-5000, '2026-10-15'), dep(5000, '2026-10-20'), dep(99999, '2026-10-20', 'outro')]

  it('progresso: guardado menos o que saiu; nunca passa de 100%', () => {
    expect(progressoCofrinho(cofrinho, depositos)).toEqual({ guardado: 35000, fracao: 0.35, falta: 65000 })
    expect(progressoCofrinho({ ...cofrinho, meta: 30000 }, depositos)).toEqual({ guardado: 35000, fracao: 1, falta: 0 })
  })

  it('guardado por mês: os últimos 6 meses, só o que entrou', () => {
    expect(guardadoPorMes(depositos, 'c', '2026-10-29')).toEqual([
      { mes: '2026-05', valor: 0 },
      { mes: '2026-06', valor: 0 },
      { mes: '2026-07', valor: 0 },
      { mes: '2026-08', valor: 20000 },
      { mes: '2026-09', valor: 0 },
      { mes: '2026-10', valor: 20000 },
    ])
  })
})
