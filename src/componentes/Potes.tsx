// Potes da semana: quanto dá para gastar em cada um de segunda a domingo, a barra que esvazia com os gastos,
// anotar gasto (também pelo ⌘K: "35 ifood") e os gastos da semana. Passar do combinado não vira bronca.

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  anotarGasto,
  apagarGasto,
  apagarPote,
  mudarGasto,
  novoPote,
  restaurarGasto,
  restaurarPote,
  salvarPote,
} from '../dados/dinheiro'
import type { Dia } from '../logica/datas'
import { formatarValor, gastosDaSemana, lerValor, saldoDoPote, valorParaCampo, type Gasto, type Pote } from '../logica/dinheiro'
import { mostrarAviso } from './Avisos'
import { Botao } from './Botao'
import { ATALHO_CAPTURA } from './Captura'

const campo = 'min-h-11 rounded-full border-2 border-linha bg-papel px-4'

function EditarPote({ pote, fechar }: { pote: Pote; fechar: () => void }) {
  const { t } = useTranslation()
  const [nome, setNome] = useState(pote.nome)
  const [limite, setLimite] = useState(valorParaCampo(pote.limite))
  const [palavras, setPalavras] = useState(pote.palavras.join(', '))
  const valor = lerValor(limite)
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault()
        if (!nome.trim() || !valor || valor <= 0) return
        await salvarPote({ ...pote, nome: nome.trim(), limite: valor, palavras: palavras.split(',').map((x) => x.trim()).filter(Boolean) })
        fechar()
      }}
    >
      <div className="flex flex-wrap gap-2">
        <label className="flex min-w-0 flex-1 basis-36 flex-col gap-1">
          <span className="text-sm font-bold">{t('dinheiro.nomePote')}</span>
          <input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={30} className={campo} />
        </label>
        <label className="flex min-w-0 flex-1 basis-28 flex-col gap-1">
          <span className="text-sm font-bold">{t('dinheiro.porSemana')}</span>
          <input value={limite} onChange={(e) => setLimite(e.target.value)} inputMode="decimal" className={`${campo} tabular-nums`} />
        </label>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-bold">{t('dinheiro.palavras')}</span>
        <input value={palavras} onChange={(e) => setPalavras(e.target.value)} placeholder={t('dinheiro.palavrasExemplo')} className={campo} />
        <span className="text-sm">{t('dinheiro.palavrasDica', { atalho: ATALHO_CAPTURA })}</span>
      </label>
      <div className="flex flex-wrap gap-2">
        <Botao type="submit" className="min-h-10 px-4 text-sm" disabled={!nome.trim() || !valor || valor <= 0}>
          {t('editorHabito.salvar')}
        </Botao>
        <Botao variante="contorno" className="min-h-10 px-4 text-sm" onClick={fechar}>
          {t('editorHabito.cancelar')}
        </Botao>
        <Botao
          variante="contorno"
          className="ml-auto min-h-10 px-4 text-sm"
          onClick={async () => {
            const apagado = await apagarPote(pote.id)
            mostrarAviso(t('dinheiro.poteApagado', { nome: pote.nome }), () => restaurarPote(apagado))
          }}
        >
          {t('editorHabito.apagar')}
        </Botao>
      </div>
    </form>
  )
}

function CartaoPote({ pote, gastos, semana }: { pote: Pote; gastos: Gasto[]; semana: Dia[] }) {
  const { t, i18n } = useTranslation()
  const [editando, setEditando] = useState(false)
  const { gasto, saldo, fracao } = saldoDoPote(pote, gastos, semana)
  const reais = (v: number) => formatarValor(v, i18n.language)
  return (
    <li className="flex flex-col gap-2 rounded-2xl border-2 border-linha bg-papel p-4">
      {editando ? (
        <EditarPote pote={pote} fechar={() => setEditando(false)} />
      ) : (
        <>
          <div className="flex flex-wrap items-baseline gap-x-3">
            <h3 className="flex-1 text-lg font-bold break-words">{pote.nome}</h3>
            <button type="button" onClick={() => setEditando(true)} aria-label={t('dinheiro.editarPote', { nome: pote.nome })} className="text-sm font-bold underline decoration-2 underline-offset-4">
              {t('academia.editar')}
            </button>
          </div>
          {/* a barra esvazia conforme os gastos; os números ao lado dizem o mesmo em texto */}
          <div aria-hidden="true" className="h-5 overflow-hidden rounded-full border-2 border-linha bg-papel">
            <div className="h-full rounded-full" style={{ width: `${fracao * 100}%`, background: 'var(--forte-piscina)' }} />
          </div>
          <p className="text-sm">
            <span className="font-bold tabular-nums">{saldo >= 0 ? t('dinheiro.sobram', { valor: reais(saldo) }) : t('dinheiro.alem', { valor: reais(-saldo) })}</span>
            {' · '}
            <span className="tabular-nums">{t('dinheiro.gastoDe', { gasto: reais(gasto), limite: reais(pote.limite) })}</span>
          </p>
        </>
      )}
    </li>
  )
}

function AnotarGasto({ potes }: { potes: Pote[] }) {
  const { t } = useTranslation()
  const [valor, setValor] = useState('')
  const [descricao, setDescricao] = useState('')
  const [poteId, setPoteId] = useState('')
  const lido = lerValor(valor)
  return (
    <form
      className="flex flex-col gap-2 rounded-2xl border-2 border-dashed border-linha/50 p-4"
      onSubmit={async (e) => {
        e.preventDefault()
        if (!lido || lido <= 0) return
        await anotarGasto(lido, descricao || t('dinheiro.gasto'), poteId || undefined)
        setValor('')
        setDescricao('')
        setPoteId('')
      }}
    >
      <h3 className="font-bold">{t('dinheiro.anotarGasto')}</h3>
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex w-32 flex-col gap-1">
          <span className="text-sm font-bold">{t('dinheiro.quanto')}</span>
          <input value={valor} onChange={(e) => setValor(e.target.value)} inputMode="decimal" placeholder="35,90" className={`${campo} tabular-nums`} />
        </label>
        <label className="flex min-w-0 flex-1 basis-40 flex-col gap-1">
          <span className="text-sm font-bold">{t('dinheiro.oQueFoi')}</span>
          <input value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={60} placeholder={t('dinheiro.oQueFoiExemplo')} className={campo} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-bold">{t('dinheiro.pote')}</span>
          <select value={poteId} onChange={(e) => setPoteId(e.target.value)} className={campo}>
            <option value="">{t('dinheiro.poteAutomatico')}</option>
            {potes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </label>
        <Botao type="submit" variante="contorno" disabled={!lido || lido <= 0}>
          + {t('dinheiro.anotar')}
        </Botao>
      </div>
      <p className="text-sm">{t('dinheiro.dicaCaptura', { atalho: ATALHO_CAPTURA })}</p>
    </form>
  )
}

function GastosDaSemana({ gastos, potes, semana }: { gastos: Gasto[]; potes: Pote[]; semana: Dia[] }) {
  const { t, i18n } = useTranslation()
  const lista = gastosDaSemana(gastos, semana).sort((a, b) => b.quando.localeCompare(a.quando))
  if (!lista.length) return null
  return (
    <details className="rounded-2xl border-2 border-linha/40 bg-papel/60 p-3" open={lista.some((g) => !g.poteId)}>
      <summary className="cursor-pointer font-bold">{t('dinheiro.gastosDaSemana', { count: lista.length })}</summary>
      <ul className="mt-2 flex flex-col gap-2">
        {lista.map((g) => (
          <li key={g.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="w-20 text-sm tabular-nums">
              {new Date(`${g.dia}T12:00:00`).toLocaleDateString(i18n.language, { weekday: 'short', day: 'numeric' }).replace('.', '')}
            </span>
            <span className="min-w-0 flex-1 basis-32 break-words">
              <span className="font-semibold tabular-nums">{formatarValor(g.valor, i18n.language)}</span> · {g.descricao}
            </span>
            <label>
              <span className="so-leitor">{t('dinheiro.poteDe', { descricao: g.descricao })}</span>
              <select
                value={g.poteId ?? ''}
                onChange={(e) => mudarGasto(g.id, { poteId: e.target.value || undefined })}
                className={`min-h-10 rounded-full border-2 px-3 text-sm ${g.poteId ? 'border-linha/50 bg-papel' : 'border-linha bg-manteiga font-bold'}`}
              >
                <option value="">{t('dinheiro.semPote')}</option>
                {potes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={async () => {
                const apagado = await apagarGasto(g.id)
                if (apagado) mostrarAviso(t('dinheiro.gastoApagado'), () => restaurarGasto(apagado))
              }}
              aria-label={t('dinheiro.apagarGasto', { descricao: g.descricao })}
              className="text-sm font-bold underline decoration-2 underline-offset-4"
            >
              {t('editorHabito.apagar')}
            </button>
          </li>
        ))}
      </ul>
    </details>
  )
}

export function PotesDaSemana({ potes, gastos, semana }: { potes: Pote[]; gastos: Gasto[]; semana: Dia[] }) {
  const { t, i18n } = useTranslation()
  const [nome, setNome] = useState('')
  const [limite, setLimite] = useState('')
  const valor = lerValor(limite)
  const data = (d: Dia) => new Date(`${d}T12:00:00`).toLocaleDateString(i18n.language, { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '')
  const ideias = t('dinheiro.ideiasPotes')
    .split('|')
    .filter((x) => !potes.some((p) => p.nome.toLowerCase() === x.toLowerCase()))

  return (
    <section aria-labelledby="titulo-potes" className="cartao flex flex-col gap-4 bg-menta p-5">
      <div>
        <h2 id="titulo-potes" className="text-2xl font-semibold">
          {t('dinheiro.potesTitulo')}
        </h2>
        <p className="text-sm">{t('dinheiro.semanaDe', { de: data(semana[0]), ate: data(semana[6]) })}</p>
      </div>
      {potes.length ? (
        <ul className="grid gap-3 md:grid-cols-2">
          {potes.map((p) => (
            <CartaoPote key={p.id} pote={p} gastos={gastos} semana={semana} />
          ))}
        </ul>
      ) : (
        <p>{t('dinheiro.semPotes')}</p>
      )}
      <form
        className="flex flex-col gap-2"
        onSubmit={async (e) => {
          e.preventDefault()
          if (!nome.trim() || !valor || valor <= 0) return
          await novoPote({ nome: nome.trim(), limite: valor })
          setNome('')
          setLimite('')
        }}
      >
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex min-w-0 flex-1 basis-40 flex-col gap-1">
            <span className="text-sm font-bold">{t('dinheiro.novoPote')}</span>
            <input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={30} placeholder={t('dinheiro.novoPoteExemplo')} className={campo} />
          </label>
          <label className="flex w-36 flex-col gap-1">
            <span className="text-sm font-bold">{t('dinheiro.porSemana')}</span>
            <input value={limite} onChange={(e) => setLimite(e.target.value)} inputMode="decimal" placeholder="150,00" className={`${campo} tabular-nums`} />
          </label>
          <Botao type="submit" variante="secundario" tom="bg-papel" disabled={!nome.trim() || !valor || valor <= 0}>
            + {t('dinheiro.criarPote')}
          </Botao>
        </div>
        {ideias.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-sm">
            <span className="font-semibold">{t('quarto.ideiasRotulo')}</span>
            {ideias.map((x) => (
              <button key={x} type="button" onClick={() => setNome(x)} className="min-h-9 rounded-full border-2 border-linha/50 bg-papel px-3 font-semibold">
                {x}
              </button>
            ))}
          </div>
        )}
      </form>
      {potes.length > 0 && <AnotarGasto potes={potes} />}
      <GastosDaSemana gastos={gastos} potes={potes} semana={semana} />
    </section>
  )
}
