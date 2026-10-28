// Tela Hoje: o coração do app.
// Folha do dia (data, saudação, relógio e quanto falta), cartão "Agora", até 3 tarefas A,
// o dia em blocos, progresso por área, bônus recolhido e o plano de 2 semanas.

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useOutletContext } from 'react-router'
import { Adesivo, type NomeAdesivo } from '../componentes/Adesivo'
import { Botao } from '../componentes/Botao'
import { CartaoAgora } from '../componentes/CartaoAgora'
import { CartaoPlano } from '../componentes/CartaoPlano'
import { CartaoTarefa } from '../componentes/CartaoTarefa'
import { EditorTarefa } from '../componentes/EditorTarefa'
import { AnelProgresso } from '../componentes/Enfeites'
import type { ContextoMoldura } from '../componentes/Moldura'
import type { Tarefa } from '../dados/banco'
import { atualizarPerfil } from '../dados/perfil'
import { useTarefas } from '../dados/tarefas'
import { useAgora } from '../dados/timer'
import { AREAS } from '../design/areas'
import { abrirJanelinha } from '../janelinha'
import { diaLocal } from '../logica/datas'
import {
  BLOCOS,
  blocoDoHorario,
  blocoJaPassou,
  candidatosDeTarefas,
  escolherAgora,
  fimDoBloco,
  formatarDuracao,
  minutosAte,
  tarefasDoDia,
  type Bloco,
} from '../logica/hoje'
import { deveAcolher, diaDoPlano, DURACAO_PLANO, periodoDoDia, retomarPlano } from '../logica/planoInicio'
import { agruparTarefas } from '../logica/tarefas'

const ADESIVO_BLOCO: Record<Bloco, NomeAdesivo> = { manha: 'sol', tarde: 'flor', noite: 'lua' }

function FolhaDoDia({ agora, nome }: { agora: Date; nome?: string }) {
  const { t, i18n } = useTranslation()
  const saudacao = t(`saudacao.${periodoDoDia(agora.getHours())}`)
  const bloco = blocoDoHorario(agora)
  const semana = agora.toLocaleDateString(i18n.language, { weekday: 'long' })
  const mes = agora.toLocaleDateString(i18n.language, { month: 'long' })
  const hora = agora.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })
  return (
    <header className="relative pt-3">
      <div aria-hidden="true" className="estampa estampa-atual absolute inset-x-0 top-0 h-12 rounded-t-[1.75rem] bg-destaque-claro" />
      <div className="folha-destacavel relative flex flex-wrap items-center gap-x-6 gap-y-3 rounded-b-[1.75rem] border-x-2 border-b-2 border-linha bg-papel px-5 pb-5 shadow-[3px_3px_0_var(--linha)] sm:px-7">
        <div className="flex items-center gap-3">
          <span className="font-titulo text-6xl leading-none font-semibold tabular-nums">{agora.getDate()}</span>
          <span className="flex flex-col">
            <span className="rotulo">{semana}</span>
            <span className="font-destaque text-2xl italic">{mes}</span>
          </span>
        </div>
        <h1 tabIndex={-1} className="min-w-0 flex-1 text-3xl font-semibold outline-none sm:text-4xl">
          {nome ? t('saudacao.comNome', { saudacao, nome }) : t('saudacao.semNome', { saudacao })}
        </h1>
        <div className="flex flex-col items-start sm:items-end">
          <span className="font-titulo text-4xl font-semibold tabular-nums">{hora}</span>
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            <Adesivo nome={ADESIVO_BLOCO[bloco]} tamanho={20} />
            {t('hoje.blocoAcaba', { bloco: t(`hoje.blocos.${bloco}`), tempo: formatarDuracao(minutosAte(agora, fimDoBloco(agora))) })}
          </span>
        </div>
      </div>
    </header>
  )
}

function LinhaDoDia({ tarefas, agora }: { tarefas: Tarefa[]; agora: Date }) {
  const { t } = useTranslation()
  const atual = blocoDoHorario(agora)
  const semBloco = tarefas.filter((x) => !x.bloco)
  return (
    <section aria-labelledby="titulo-linha" className="flex flex-col gap-3">
      <h2 id="titulo-linha" className="text-2xl font-semibold">
        {t('hoje.linhaDia')}
      </h2>
      <ol className="grid gap-3 md:grid-cols-3">
        {BLOCOS.map((bloco) => {
          const doBloco = tarefas.filter((x) => x.bloco === bloco)
          const passou = blocoJaPassou(bloco, atual)
          const eAgora = bloco === atual
          return (
            <li
              key={bloco}
              aria-current={eAgora ? 'time' : undefined}
              className={`relative flex flex-col gap-2 rounded-[1.5rem] border-2 p-4 ${
                eAgora ? 'border-linha bg-papel shadow-[3px_3px_0_var(--linha)]' : passou ? 'border-dashed border-linha/50' : 'border-linha/40 bg-papel'
              }`}
            >
              <p className="flex items-center gap-2 font-bold">
                <Adesivo nome={ADESIVO_BLOCO[bloco]} tamanho={26} />
                {t(`hoje.blocos.${bloco}`)}
                {(eAgora || passou) && (
                  <span className="ml-auto rounded-full border-2 border-linha/50 px-2 text-xs">{eAgora ? t('hoje.agoraBloco') : t('hoje.passou')}</span>
                )}
              </p>
              {doBloco.length ? (
                <ul className="flex flex-col gap-1.5">
                  {doBloco.map((x) => (
                    <ItemLinha key={x.id} tarefa={x} />
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-tinta-suave">{t('hoje.livre')}</p>
              )}
            </li>
          )
        })}
      </ol>
      {semBloco.length > 0 && (
        <div className="flex flex-col gap-1.5 rounded-[1.5rem] border-2 border-linha/40 p-4">
          <p className="font-bold">{t('hoje.qualquerHora')}</p>
          <ul className="flex flex-wrap gap-2">
            {semBloco.map((x) => (
              <ItemLinha key={x.id} tarefa={x} />
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

function ItemLinha({ tarefa }: { tarefa: Tarefa }) {
  const area = tarefa.area ? AREAS[tarefa.area] : undefined
  const feita = !!tarefa.feitaEm
  return (
    <li className={`flex items-center gap-2 rounded-full border-2 border-linha/60 py-1 pr-3 pl-1 text-sm font-semibold ${area ? area.claro : 'bg-papel'}`}>
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-linha bg-papel text-xs" aria-hidden="true">
        {feita ? '✓' : ''}
      </span>
      {area && <Adesivo nome={area.adesivo} tamanho={18} />}
      <span className={feita ? 'line-through decoration-2' : ''}>{tarefa.titulo}</span>
      <span className="so-leitor">{feita ? '(feita)' : ''}</span>
    </li>
  )
}

function ProgressoAreas({ tarefas, areasAtivas }: { tarefas: Tarefa[]; areasAtivas: ContextoMoldura['perfil']['areasAtivas'] }) {
  const { t } = useTranslation()
  const porArea = areasAtivas
    .map((id) => {
      const daArea = tarefas.filter((x) => x.area === id)
      return { area: AREAS[id], feitos: daArea.filter((x) => x.feitaEm).length, total: daArea.length }
    })
    .filter((x) => x.total > 0)
  return (
    <section aria-labelledby="titulo-progresso" className="cartao flex flex-col gap-3 bg-papel p-5">
      <h2 id="titulo-progresso" className="text-xl font-semibold">
        {t('hoje.progresso')}
      </h2>
      {porArea.length ? (
        <div className="flex flex-wrap gap-5">
          {porArea.map(({ area, feitos, total }) => (
            <AnelProgresso key={area.id} feitos={feitos} total={total} nome={t(`nav.${area.id}`)} adesivo={area.adesivo} cor={area.forteCss} />
          ))}
        </div>
      ) : (
        <p className="text-sm">{t('hoje.progressoVazio')}</p>
      )}
    </section>
  )
}

export function Hoje() {
  const { t } = useTranslation()
  const { perfil, visitaAnterior } = useOutletContext<ContextoMoldura>()
  const [acolhimentoFechado, setAcolhimentoFechado] = useState(false)
  const [editando, setEditando] = useState<Tarefa | null>(null)
  const agora = useAgora(15_000)
  const tarefas = useTarefas()
  const hoje = diaLocal(agora)
  const dia = diaDoPlano(perfil.inicioPlano, hoje)

  const acolher = !acolhimentoFechado && deveAcolher(visitaAnterior, hoje)
  const diaAlcancado = visitaAnterior ? diaDoPlano(perfil.inicioPlano, visitaAnterior) : dia
  const podeContinuar = acolher && visitaAnterior && diaAlcancado < DURACAO_PLANO

  if (!tarefas) return null
  const doDia = tarefasDoDia(tarefas, hoje)
  const grupos = agruparTarefas(tarefas, hoje)
  const candidato = escolherAgora(candidatosDeTarefas(tarefas, hoje), agora)
  const tarefasA = doDia.filter((x) => x.prioridade === 'A')
  const bonus = [...grupos.b, ...grupos.c]

  return (
    <div className="flex flex-col gap-6">
      <FolhaDoDia agora={agora} nome={perfil.nome} />

      {acolher && (
        <section role="status" className="cartao flex flex-col gap-3 bg-lavanda p-5">
          <p className="flex items-center gap-2 text-2xl font-semibold">
            <Adesivo nome="coracao" tamanho={40} />
            {perfil.nome ? t('acolher.tituloComNome', { nome: perfil.nome }) : t('acolher.titulo')}
          </p>
          <p className="text-lg">{t('acolher.texto')}</p>
          <div className="flex flex-wrap gap-2">
            {podeContinuar ? (
              <>
                <Botao
                  onClick={async () => {
                    await atualizarPerfil({ inicioPlano: retomarPlano(perfil.inicioPlano, visitaAnterior, hoje) })
                    setAcolhimentoFechado(true)
                  }}
                >
                  {t('acolher.continuar', { dia: Math.min(diaAlcancado + 1, DURACAO_PLANO) })}
                </Botao>
                <Botao variante="contorno" onClick={() => setAcolhimentoFechado(true)}>
                  {t('acolher.seguir')}
                </Botao>
              </>
            ) : (
              <Botao variante="contorno" onClick={() => setAcolhimentoFechado(true)}>
                {t('acolher.fechar')}
              </Botao>
            )}
          </div>
        </section>
      )}

      <CartaoAgora
        candidato={candidato}
        semNada={
          tarefasA.length === 0 && (
            <Link to="/tarefas" className="self-start font-bold underline decoration-2 underline-offset-4">
              {t('hoje.escolherA')}
            </Link>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="titulo-a" className="flex flex-col gap-3">
          <h2 id="titulo-a" className="text-2xl font-semibold">
            {t('hoje.tarefasA')}
          </h2>
          {tarefasA.length ? (
            <ul className="flex flex-col gap-3">
              {tarefasA.map((x) => (
                <li key={x.id}>
                  <CartaoTarefa tarefa={x} editar={() => setEditando(x)} />
                </li>
              ))}
            </ul>
          ) : (
            <Link to="/tarefas" className="cartao block bg-papel p-4 font-semibold">
              {t('tarefas.vazioA')} →
            </Link>
          )}
          {bonus.length > 0 && (
            <details className="rounded-[1.5rem] border-2 border-linha/40 p-4">
              <summary className="cursor-pointer font-bold">{t('hoje.bonus', { count: bonus.length })}</summary>
              <ul className="mt-3 flex flex-col gap-3">
                {bonus.map((x) => (
                  <li key={x.id}>
                    <CartaoTarefa tarefa={x} editar={() => setEditando(x)} />
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>

        <div className="flex flex-col gap-4">
          <ProgressoAreas tarefas={doDia} areasAtivas={perfil.areasAtivas} />
          <div className="cartao flex flex-col gap-2 bg-papel p-5">
            <Botao variante="secundario" tom="bg-azul-nevoa" className="self-start" onClick={() => abrirJanelinha()} icone={<Adesivo nome="balao" tamanho={24} />}>
              {t('hoje.janelinha')}
            </Botao>
            <p className="text-sm">{t('hoje.janelinhaDica')}</p>
          </div>
        </div>
      </div>

      <LinhaDoDia tarefas={doDia} agora={agora} />

      {!perfil.planoEscondido && <CartaoPlano dia={dia} />}

      {editando && <EditorTarefa tarefa={editando} nova={false} fechar={() => setEditando(null)} />}
    </div>
  )
}

