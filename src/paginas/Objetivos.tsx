// Meus objetivos: cada objetivo numa folha de caderno, com o porquê escrito pela pessoa e o que faz ele andar
// (hábitos, tarefas e sessões de estudo, cofrinhos). Poucos de cada vez: dá para deixar algum de lado.

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import { Adesivo } from '../componentes/Adesivo'
import { mostrarAviso } from '../componentes/Avisos'
import { Botao } from '../componentes/Botao'
import { EstrelaGiz, FolhaCaderno } from '../componentes/Papelaria'
import type { Objetivo, Tarefa } from '../dados/banco'
import { useCofrinhos, useDepositos } from '../dados/dinheiro'
import { useHabitosAtivos } from '../dados/habitos'
import {
  apagarObjetivo,
  arquivarObjetivo,
  ligarAoObjetivo,
  mudarObjetivo,
  novoObjetivo,
  restaurarObjetivo,
  salvarObjetivo,
  useObjetivos,
  type TipoLigado,
} from '../dados/objetivos'
import { useTarefas } from '../dados/tarefas'
import { AREAS } from '../design/areas'
import { diaLocal } from '../logica/datas'
import { formatarValor, progressoCofrinho, type Cofrinho, type Deposito } from '../logica/dinheiro'
import { vezesNaSemana, type Habito, type RegistroHabito } from '../logica/habitos'
import { ligadosAo, objetivosAtivos, SUGESTAO_OBJETIVOS } from '../logica/objetivos'

const CORES_GIZ = ['#F49625', '#EA5E86', '#F7C948', '#5BB8A8', '#8E6BBF']
const textoFolha = 'block w-full resize-none bg-transparent outline-none placeholder:text-tinta/40'

type Dados = { habitos: Habito[]; registros: RegistroHabito[]; tarefas: Tarefa[]; cofrinhos: Cofrinho[]; depositos: Deposito[]; objetivos: Objetivo[] }

/** Título e porquê editáveis na própria folha: grava ao sair do campo. */
function CamposDaFolha({ objetivo }: { objetivo: Objetivo }) {
  const { t } = useTranslation()
  return (
    <>
      <label className="block">
        <span className="rotulo block leading-8">{t('objetivos.meuObjetivo')}</span>
        <textarea
          rows={2}
          defaultValue={objetivo.titulo}
          maxLength={140}
          onBlur={(e) => {
            const titulo = e.target.value.trim()
            if (titulo && titulo !== objetivo.titulo) void mudarObjetivo(objetivo.id, { titulo })
            else e.target.value = objetivo.titulo
          }}
          className={`${textoFolha} font-titulo text-2xl leading-8 font-semibold`}
        />
      </label>
      <label className="block">
        <span className="rotulo block leading-8">{t('objetivos.porque')}</span>
        <textarea
          rows={3}
          defaultValue={objetivo.porque}
          maxLength={400}
          placeholder={t('objetivos.exemploPorque')}
          onBlur={(e) => {
            const porque = e.target.value.trim()
            if (porque !== objetivo.porque) void mudarObjetivo(objetivo.id, { porque })
          }}
          className={`${textoFolha} text-lg leading-8`}
        />
      </label>
    </>
  )
}

/** Marcar o que faz o objetivo andar. O que está em outro objetivo mostra onde está e muda para este ao marcar. */
function Ligar({ objetivo, dados }: { objetivo: Objetivo; dados: Dados }) {
  const { t } = useTranslation()
  const nomeDe = (id?: string) => dados.objetivos.find((o) => o.id === id)?.titulo
  const grupos: Array<{ tipo: TipoLigado; titulo: string; itens: Array<{ id: string; nome: string; objetivoId?: string }> }> = [
    { tipo: 'habito', titulo: t('objetivos.habitos'), itens: dados.habitos.filter((h) => !h.arquivadoEm).map((h) => ({ id: h.id, nome: h.titulo, objetivoId: h.objetivoId })) },
    {
      tipo: 'tarefa',
      titulo: t('objetivos.tarefas'),
      itens: dados.tarefas
        .filter((x) => !x.feitaEm)
        .sort((a, b) => a.criadaEm.localeCompare(b.criadaEm))
        .map((x) => ({ id: x.id, nome: x.titulo, objetivoId: x.objetivoId })),
    },
    { tipo: 'cofrinho', titulo: t('objetivos.cofrinhos'), itens: dados.cofrinhos.filter((c) => !c.arquivadoEm).map((c) => ({ id: c.id, nome: c.nome, objetivoId: c.objetivoId })) },
  ]
  return (
    <div role="group" aria-label={t('objetivos.ligarA', { objetivo: objetivo.titulo })} className="flex flex-col gap-4 rounded-2xl border-2 border-dashed border-linha/50 bg-papel p-4">
      {grupos.map((g) => (
        <fieldset key={g.tipo} className="flex flex-col gap-1.5">
          <legend className="mb-1 font-bold">{g.titulo}</legend>
          {g.itens.length ? (
            g.itens.map((item) => {
              const aqui = item.objetivoId === objetivo.id
              const outro = !aqui && item.objetivoId ? nomeDe(item.objetivoId) : undefined
              return (
                <label key={item.id} className="flex min-h-10 cursor-pointer items-start gap-2">
                  <input
                    type="checkbox"
                    checked={aqui}
                    onChange={() => ligarAoObjetivo(g.tipo, item.id, aqui ? undefined : objetivo.id)}
                    className="mt-1 h-5 w-5 shrink-0 accent-[var(--chocolate)]"
                  />
                  <span className="break-words">
                    {item.nome}
                    {outro && <span className="text-sm text-tinta-suave"> ({t('objetivos.emOutro', { objetivo: outro })})</span>}
                  </span>
                </label>
              )
            })
          ) : (
            <p className="text-sm">{t('objetivos.nenhum')}</p>
          )}
        </fieldset>
      ))}
    </div>
  )
}

function OQueFaco({ objetivo, dados }: { objetivo: Objetivo; dados: Dados }) {
  const { t, i18n } = useTranslation()
  const hoje = diaLocal()
  const ligados = ligadosAo(objetivo.id, dados)
  const abertas = ligados.tarefas.filter((x) => !x.feitaEm)
  const feitas = ligados.tarefas.length - abertas.length
  if (!ligados.habitos.length && !ligados.tarefas.length && !ligados.cofrinhos.length) return <p className="leading-8">{t('objetivos.nadaLigado')}</p>
  return (
    <ul className="leading-8">
      {ligados.habitos.map((h) => (
        <li key={h.id} className="flex flex-wrap items-center gap-x-2">
          <Adesivo nome={h.adesivo} tamanho={22} />
          <span className="font-semibold">{h.titulo}</span>
          <span className="text-sm">· {t('objetivos.vezesNaSemana', { vezes: vezesNaSemana(dados.registros.filter((r) => r.habitoId === h.id), hoje), meta: h.meta })}</span>
        </li>
      ))}
      {abertas.map((x) => (
        <li key={x.id} className="flex flex-wrap items-center gap-x-2">
          <Adesivo nome={x.area ? AREAS[x.area].adesivo : 'lista'} tamanho={22} />
          <span className="font-semibold">{x.titulo}</span>
        </li>
      ))}
      {feitas > 0 && <li className="text-sm">✓ {t('objetivos.tarefasFeitas', { count: feitas })}</li>}
      {ligados.cofrinhos.map((c) => {
        const p = progressoCofrinho(c, dados.depositos)
        return (
          <li key={c.id} className="flex flex-wrap items-center gap-x-2">
            <Adesivo nome="cofrinho" tamanho={22} />
            <span className="font-semibold">{c.nome}</span>
            <span className="text-sm">· {t('objetivos.guardado', { guardado: formatarValor(p.guardado, i18n.language), meta: formatarValor(c.meta, i18n.language) })}</span>
          </li>
        )
      })}
    </ul>
  )
}

function FolhaObjetivo({ objetivo, dados, indice }: { objetivo: Objetivo; dados: Dados; indice: number }) {
  const { t } = useTranslation()
  const [ligando, setLigando] = useState(false)
  return (
    <li id={`objetivo-${objetivo.id}`} className="relative scroll-mt-6 list-none">
      <FolhaCaderno inclinacao={indice % 2 ? 0.8 : -0.8}>
        <article aria-label={objetivo.titulo} className="flex flex-col">
          {/* desfazer ou mudança em outra tela: os campos voltam com o texto guardado */}
          <CamposDaFolha key={`${objetivo.titulo}|${objetivo.porque}`} objetivo={objetivo} />
          <p className="rotulo leading-8">{t('objetivos.oQueFaco')}</p>
          <OQueFaco objetivo={objetivo} dados={dados} />
          <div className="mt-3 flex flex-col gap-3">
            <Botao variante="secundario" tom="bg-manteiga" className="self-start" onClick={() => setLigando((l) => !l)} aria-expanded={ligando}>
              {ligando ? t('objetivos.pronto') : t('objetivos.ligar')}
            </Botao>
            {ligando && <Ligar objetivo={objetivo} dados={dados} />}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <button
                type="button"
                onClick={async () => {
                  await arquivarObjetivo(objetivo.id, true)
                  mostrarAviso(t('objetivos.deixado', { titulo: objetivo.titulo }), () => arquivarObjetivo(objetivo.id, false))
                }}
                className="text-sm font-bold underline decoration-2 underline-offset-4"
              >
                {t('objetivos.deixarDeLado')}
              </button>
              <button
                type="button"
                aria-label={t('objetivos.apagarNome', { titulo: objetivo.titulo })}
                onClick={async () => {
                  const copia = await apagarObjetivo(objetivo.id)
                  if (copia) mostrarAviso(t('objetivos.apagado'), () => restaurarObjetivo(copia))
                }}
                className="text-sm font-bold underline decoration-2 underline-offset-4"
              >
                {t('objetivos.apagar')}
              </button>
            </div>
          </div>
        </article>
      </FolhaCaderno>
      <EstrelaGiz cor={CORES_GIZ[indice % CORES_GIZ.length]} tamanho={44} className="-top-5 -right-3" />
    </li>
  )
}

function NovoObjetivo({ fechar, primeiro }: { fechar?: () => void; primeiro: boolean }) {
  const { t } = useTranslation()
  const [titulo, setTitulo] = useState('')
  const [porque, setPorque] = useState('')
  const [erro, setErro] = useState('')
  return (
    <div className="relative">
      <FolhaCaderno inclinacao={-0.6}>
        <form
          className="flex flex-col"
          onSubmit={async (e) => {
            e.preventDefault()
            if (!titulo.trim()) return setErro(t('objetivos.semTitulo'))
            await salvarObjetivo(novoObjetivo(titulo.trim(), porque.trim()))
            mostrarAviso(t('objetivos.criado'))
            setTitulo('')
            setPorque('')
            setErro('')
            fechar?.()
          }}
        >
          <label className="block">
            <span className="rotulo block leading-8">{t('objetivos.meuObjetivo')}</span>
            <textarea
              rows={2}
              autoFocus={!primeiro}
              value={titulo}
              maxLength={140}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder={t('objetivos.exemploObjetivo')}
              className={`${textoFolha} font-titulo text-2xl leading-8 font-semibold`}
            />
          </label>
          <label className="block">
            <span className="rotulo block leading-8">{t('objetivos.porque')}</span>
            <textarea
              rows={3}
              value={porque}
              maxLength={400}
              onChange={(e) => setPorque(e.target.value)}
              placeholder={t('objetivos.exemploPorque')}
              className={`${textoFolha} text-lg leading-8`}
            />
          </label>
          <p aria-live="polite" className="min-h-6 font-semibold">
            {erro && <>! {erro}</>}
          </p>
          <div className="flex flex-wrap gap-2">
            <Botao type="submit">{t('objetivos.salvar')}</Botao>
            {fechar && (
              <Botao variante="contorno" onClick={fechar}>
                {t('objetivos.cancelar')}
              </Botao>
            )}
          </div>
        </form>
      </FolhaCaderno>
      <EstrelaGiz cor="#F7C948" tamanho={52} className="-top-6 -right-4" />
    </div>
  )
}

export function Objetivos() {
  const { t } = useTranslation()
  const objetivos = useObjetivos()
  const habitos = useHabitosAtivos()
  const tarefas = useTarefas()
  const cofrinhos = useCofrinhos()
  const depositos = useDepositos()
  const [criando, setCriando] = useState(false)
  const { hash } = useLocation()
  const pronto = !!(objetivos && habitos && tarefas && cofrinhos && depositos)

  // vindo da revisão semanal ("quero mudar"): vai direto para o objetivo
  useEffect(() => {
    if (!pronto || !hash.startsWith('#objetivo-')) return
    const folha = document.getElementById(hash.slice(1))
    folha?.scrollIntoView({ block: 'start' })
    folha?.querySelector<HTMLElement>('textarea')?.focus({ preventScroll: true })
  }, [pronto, hash])

  if (!objetivos || !habitos || !tarefas || !cofrinhos || !depositos) return null
  const dados: Dados = { habitos: habitos.habitos, registros: habitos.registros, tarefas, cofrinhos, depositos, objetivos }
  const ativos = objetivosAtivos(objetivos)
  const deLado = objetivos.filter((o) => o.arquivadoEm)

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 tabIndex={-1} className="flex flex-1 items-center gap-3 text-4xl font-semibold outline-none sm:text-5xl">
          <Adesivo nome="estrela" tamanho={56} />
          {t('nav.objetivos')}
        </h1>
        {ativos.length > 0 && !criando && (
          <Botao onClick={() => setCriando(true)} icone={<span aria-hidden="true">+</span>}>
            {t('objetivos.novo')}
          </Botao>
        )}
      </div>
      <p className="max-w-prose">{t('objetivos.intro')}</p>

      {ativos.length === 0 && (
        <div className="flex max-w-2xl flex-col gap-6">
          <p className="text-lg font-semibold">{t('objetivos.vazio')}</p>
          <NovoObjetivo primeiro />
        </div>
      )}
      {criando && (
        <div className="max-w-2xl">
          <NovoObjetivo fechar={() => setCriando(false)} primeiro={false} />
        </div>
      )}
      {ativos.length > SUGESTAO_OBJETIVOS && <p className="max-w-prose rounded-2xl border-2 border-linha/40 bg-manteiga px-4 py-3">{t('objetivos.muitos')}</p>}

      {ativos.length > 0 && (
        <ul className="grid items-start gap-10 lg:grid-cols-2">
          {ativos.map((o, i) => (
            <FolhaObjetivo key={o.id} objetivo={o} dados={dados} indice={i} />
          ))}
        </ul>
      )}

      {deLado.length > 0 && (
        <details className="cartao bg-papel p-4">
          <summary className="cursor-pointer font-bold">{t('objetivos.deLado', { count: deLado.length })}</summary>
          <ul className="mt-3 flex flex-col gap-2">
            {deLado.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-linha/40 px-3 py-2">
                <span className="min-w-0 flex-1 font-semibold break-words">{o.titulo}</span>
                <Botao variante="contorno" onClick={() => arquivarObjetivo(o.id, false)}>
                  {t('objetivos.trazerDeVolta')}
                </Botao>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
