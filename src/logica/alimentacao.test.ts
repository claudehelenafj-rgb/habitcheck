import { describe, expect, it } from 'vitest'
import {
  alternarRefeicao,
  blocoDaRefeicao,
  candidatosDeRefeicoes,
  CONFIG_ALIMENTACAO_PADRAO as padrao,
  deveLembrarRefeicao,
  diaVazio,
  estadoDiaAlimentacao,
  progressoDoDia,
  refeicaoNaHora,
  tocarCopo,
  type ConfigAlimentacao,
} from './alimentacao'
import { escolherAgora, type Candidato } from './hoje'

const hoje = '2026-10-29'
const as = (hhmm: string) => new Date(`${hoje}T${hhmm}:00`)

describe('refeições e água', () => {
  it('marcar e desmarcar refeição; progresso só das refeições ativas', () => {
    let d = alternarRefeicao(diaVazio(hoje), 'almoco', as('12:40'))
    d = alternarRefeicao(d, 'cafe', as('08:10'))
    expect(progressoDoDia(padrao, d)).toMatchObject({ feitas: 2, total: 4 })
    const semLanche: ConfigAlimentacao = { ...padrao, refeicoes: padrao.refeicoes.map((r) => (r.id === 'lanche' ? { ...r, ativa: false } : r)) }
    expect(progressoDoDia(semLanche, d)).toMatchObject({ feitas: 2, total: 3 })
    d = alternarRefeicao(d, 'cafe', as('08:20'))
    expect(d.refeicoes.cafe).toBeUndefined()
  })

  it('copos: tocar no copo 3 enche até ele; tocar de novo no último esvazia esse', () => {
    let d = tocarCopo(diaVazio(hoje), 3)
    expect(d.agua).toBe(3)
    d = tocarCopo(d, 3)
    expect(d.agua).toBe(2)
    d = tocarCopo(d, 1)
    expect(d.agua).toBe(1)
  })

  it('na hora: do horário até 1 hora depois, se ainda não marcou', () => {
    expect(refeicaoNaHora(padrao, undefined, as('12:29'))).toBeUndefined()
    expect(refeicaoNaHora(padrao, undefined, as('12:30'))?.id).toBe('almoco')
    expect(refeicaoNaHora(padrao, undefined, as('13:29'))?.id).toBe('almoco')
    expect(refeicaoNaHora(padrao, undefined, as('13:30'))).toBeUndefined()
    const comeu = alternarRefeicao(diaVazio(hoje), 'almoco', as('12:35'))
    expect(refeicaoNaHora(padrao, comeu, as('12:50'))).toBeUndefined()
  })

  it('lembrete: só com lembrete ligado, até 30 min depois, sem ter marcado', () => {
    const almoco = { ...padrao.refeicoes[1], lembrar: true }
    expect(deveLembrarRefeicao(almoco, undefined, as('12:30'))).toBe(true)
    expect(deveLembrarRefeicao(almoco, undefined, as('13:01'))).toBe(false)
    expect(deveLembrarRefeicao({ ...almoco, lembrar: false }, undefined, as('12:40'))).toBe(false)
    expect(deveLembrarRefeicao({ ...almoco, ativa: false }, undefined, as('12:40'))).toBe(false)
    expect(deveLembrarRefeicao(almoco, alternarRefeicao(diaVazio(hoje), 'almoco', as('12:31')), as('12:40'))).toBe(false)
  })

  it('bloco da linha do dia pelo horário', () => {
    expect(padrao.refeicoes.map(blocoDaRefeicao)).toEqual(['manha', 'tarde', 'tarde', 'noite'])
    expect(blocoDaRefeicao({ id: 'jantar', ativa: true, lembrar: false })).toBe('noite')
  })

  it('semana: todas, algumas ou nenhuma (sem erro); futuro', () => {
    let d = diaVazio('2026-10-27')
    for (const r of padrao.refeicoes) d = alternarRefeicao(d, r.id, as('12:00'))
    expect(estadoDiaAlimentacao(padrao, d, '2026-10-27', hoje)).toBe('feito')
    expect(estadoDiaAlimentacao(padrao, alternarRefeicao(diaVazio(hoje), 'cafe', as('08:00')), hoje, hoje)).toBe('minimo')
    expect(estadoDiaAlimentacao(padrao, undefined, '2026-10-28', hoje)).toBe('vazio')
    expect(estadoDiaAlimentacao(padrao, undefined, '2026-10-30', hoje)).toBe('futuro')
  })
})

describe('refeição no cartão "Agora"', () => {
  const nome = (r: { id: string }) => r.id
  const tarefaA: Candidato = {
    tipo: 'tarefa',
    id: 't1',
    titulo: 'Ler',
    tarefa: { id: 't1', titulo: 'Ler', prioridade: 'A', dia: hoje, passos: [], criadaEm: '' },
  }

  it('na hora, vem antes das tarefas A; depois de 1 hora, sai', () => {
    const c1 = [...candidatosDeRefeicoes(padrao, undefined, as('12:40'), nome), tarefaA]
    expect(escolherAgora(c1, as('12:40'))?.id).toBe('refeicao|almoco')
    const c2 = [...candidatosDeRefeicoes(padrao, undefined, as('13:40'), nome), tarefaA]
    expect(escolherAgora(c2, as('13:40'))?.id).toBe('t1')
  })

  it('remédio na hora continua na frente', () => {
    const remedio: Candidato = { tipo: 'remedio', id: 'r1', titulo: 'Remédio', horario: as('12:30') }
    const c = [...candidatosDeRefeicoes(padrao, undefined, as('12:40'), nome), remedio]
    expect(escolherAgora(c, as('12:40'))?.id).toBe('r1')
  })
})
