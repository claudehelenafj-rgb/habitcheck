// "Como estou com o remédio": o que a pessoa percebe (sono, apetite, ansiedade, humor) e anotações,
// para conversar na consulta. Aparece na tela Remédios quando a aba Bem-estar está ligada.

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { apagarNotaRemedio, restaurarNotaRemedio, salvarNotaRemedio, useNotasRemedio } from '../dados/notasRemedio'
import { diaLocal, somarDias } from '../logica/datas'
import { ASPECTOS, MUDANCAS, type AspectoRemedio, type Mudanca } from '../logica/remedioNoPlano'
import type { Remedio } from '../logica/remedios'
import { mostrarAviso } from './Avisos'
import { Botao } from './Botao'

export function ComoEstouRemedio({ remedios }: { remedios: Remedio[] }) {
  const { t, i18n } = useTranslation()
  const notas = useNotasRemedio(somarDias(diaLocal(), -30))
  const [remedioId, setRemedioId] = useState('')
  const [aspectos, setAspectos] = useState<Partial<Record<AspectoRemedio, Mudanca>>>({})
  const [nota, setNota] = useState('')
  const vazio = !Object.keys(aspectos).length && !nota.trim()
  const nomeDe = (id?: string) => (id ? remedios.find((r) => r.id === id)?.nome ?? t('comoEstou.remedioApagado') : t('comoEstou.geral'))

  async function anotar() {
    if (vazio) return
    const n = await salvarNotaRemedio({ remedioId: remedioId || undefined, aspectos, nota })
    setAspectos({})
    setNota('')
    mostrarAviso(t('comoEstou.anotado'), () => apagarNotaRemedio(n.id))
  }

  return (
    <section aria-labelledby="titulo-como-estou" className="cartao flex flex-col gap-4 bg-papel p-4 sm:p-5">
      <h2 id="titulo-como-estou" className="text-2xl font-semibold">
        {t('comoEstou.titulo')}
      </h2>
      <p className="max-w-prose text-sm">{t('comoEstou.dica')}</p>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          anotar()
        }}
      >
        <label className="flex flex-col gap-1 self-start">
          <span className="font-bold">{t('comoEstou.qual')}</span>
          <select value={remedioId} onChange={(e) => setRemedioId(e.target.value)} className="min-h-11 rounded-full border-2 border-linha bg-papel px-3">
            <option value="">{t('comoEstou.geral')}</option>
            {remedios.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nome}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          {ASPECTOS.map((a) => (
            <fieldset key={a} className="flex flex-col gap-1.5">
              <legend className="mb-1 font-bold">{t(`comoEstou.aspectos.${a}`)}</legend>
              <div className="flex flex-wrap gap-1.5">
                {MUDANCAS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={aspectos[a] === m}
                    onClick={() =>
                      setAspectos((x) => {
                        const novo = { ...x }
                        if (novo[a] === m) delete novo[a]
                        else novo[a] = m
                        return novo
                      })
                    }
                    className={`min-h-9 rounded-full border-2 border-linha px-3 text-sm font-semibold ${aspectos[a] === m ? 'bg-morango-claro' : 'bg-papel'}`}
                  >
                    {aspectos[a] === m && '✓ '}
                    {t(`comoEstou.mudancas.${m}`)}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
        <label className="flex flex-col gap-1">
          <span className="font-bold">{t('comoEstou.nota')}</span>
          <input value={nota} onChange={(e) => setNota(e.target.value)} maxLength={300} className="min-h-11 rounded-full border-2 border-linha bg-papel px-4" />
        </label>
        <Botao type="submit" className="self-start" disabled={vazio}>
          {t('comoEstou.anotar')}
        </Botao>
      </form>

      {notas && notas.length > 0 && (
        <section aria-labelledby="titulo-notas-remedio" className="flex flex-col gap-2">
          <h3 id="titulo-notas-remedio" className="rotulo">
            {t('comoEstou.ultimas')}
          </h3>
          <ul className="flex flex-col gap-1.5">
            {notas.map((n) => {
              const data = new Date(n.quando).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' }).replace('.', '')
              const partes = ASPECTOS.filter((a) => n.aspectos[a]).map(
                (a) => `${t(`comoEstou.aspectos.${a}`).toLowerCase()} ${t(`comoEstou.mudancas.${n.aspectos[a]}`).toLowerCase()}`,
              )
              return (
                <li key={n.id} className="flex items-start gap-3 rounded-2xl border-2 border-linha/40 px-3 py-2 text-sm">
                  <span className="font-bold whitespace-nowrap">{data}</span>
                  <span className="flex-1">
                    <strong>{nomeDe(n.remedioId)}</strong>
                    {partes.length > 0 && `: ${partes.join(', ')}`}
                    {n.nota && ` · “${n.nota}”`}
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      await apagarNotaRemedio(n.id)
                      mostrarAviso(t('comoEstou.apagada'), () => restaurarNotaRemedio(n))
                    }}
                    aria-label={t('comoEstou.apagar', { data })}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-linha bg-papel font-bold"
                  >
                    ×
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </section>
  )
}
