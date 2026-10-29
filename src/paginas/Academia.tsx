// Academia: hábitos de movimento com plano se-então e versão mínima. Começa por modelos prontos
// (editáveis); arquivar não apaga nada e não tem culpa.

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Adesivo } from '../componentes/Adesivo'
import { Botao } from '../componentes/Botao'
import { CartaoHabito, HabitosArquivados } from '../componentes/CartaoHabito'
import { EditorHabito } from '../componentes/EditorHabito'
import { novoHabito, useHabitos, useRegistrosHabito } from '../dados/habitos'
import { useAgora } from '../dados/timer'
import { diaLocal } from '../logica/datas'
import { MODELOS_ACADEMIA, type Habito } from '../logica/habitos'

export function Academia() {
  const { t } = useTranslation()
  const habitos = useHabitos('academia')
  const registros = useRegistrosHabito()
  const hoje = diaLocal(useAgora(60_000))
  const [editando, setEditando] = useState<{ habito: Habito; novo: boolean } | null>(null)
  if (!habitos || !registros) return null
  const ativos = habitos.filter((h) => !h.arquivadoEm)
  const arquivados = habitos.filter((h) => h.arquivadoEm)
  const doModelo = (chave: string) => {
    const m = MODELOS_ACADEMIA.find((x) => x.chave === chave)!
    return novoHabito({
      area: 'academia',
      adesivo: m.adesivo,
      meta: m.meta,
      bloco: m.bloco,
      titulo: t(`academia.modelos.${chave}.titulo`),
      se: t(`academia.modelos.${chave}.se`),
      entao: t(`academia.modelos.${chave}.entao`),
      minima: t(`academia.modelos.${chave}.minima`),
      ...(m.comBase ? { base: t(`academia.modelos.${chave}.base`).split(',').map((x) => x.trim()) } : {}),
    })
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 tabIndex={-1} className="flex flex-1 items-center gap-3 text-4xl font-semibold outline-none sm:text-5xl">
          <Adesivo nome="haltere" tamanho={56} />
          {t('nav.academia')}
        </h1>
        {ativos.length > 0 && (
          <Botao variante="secundario" tom="bg-pessego" icone={<span aria-hidden="true">+</span>} onClick={() => setEditando({ habito: novoHabito({ area: 'academia' }), novo: true })}>
            {t('academia.novo')}
          </Botao>
        )}
      </div>
      <p className="max-w-prose">{t('academia.intro')}</p>

      {ativos.length ? (
        <ul className="grid items-start gap-8 lg:grid-cols-2">
          {ativos.map((h) => (
            <li key={h.id}>
              <CartaoHabito habito={h} registros={registros} hoje={hoje} editar={() => setEditando({ habito: h, novo: false })} />
            </li>
          ))}
        </ul>
      ) : (
        <section aria-labelledby="titulo-comecar" className="cartao flex flex-col gap-4 bg-pessego p-5">
          <h2 id="titulo-comecar" className="text-2xl font-semibold">
            {t('academia.comecarTitulo')}
          </h2>
          <p>{t('academia.comecarTexto')}</p>
          <ul className="grid gap-3 md:grid-cols-3">
            {MODELOS_ACADEMIA.map((m) => (
              <li key={m.chave}>
                <button
                  type="button"
                  onClick={() => setEditando({ habito: doModelo(m.chave), novo: true })}
                  className="flex h-full w-full flex-col items-start gap-2 rounded-2xl border-2 border-linha bg-papel p-4 text-left transition-transform hover:-translate-y-0.5"
                >
                  <span className="flex items-center gap-2 text-lg font-bold">
                    <Adesivo nome={m.adesivo} tamanho={32} />
                    {t(`academia.modelos.${m.chave}.titulo`)}
                  </span>
                  <span className="text-sm">
                    {t('academia.seEntao', { se: t(`academia.modelos.${m.chave}.se`), entao: t(`academia.modelos.${m.chave}.entao`) })}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <Botao variante="contorno" className="self-start" onClick={() => setEditando({ habito: novoHabito({ area: 'academia' }), novo: true })}>
            {t('academia.doZero')}
          </Botao>
        </section>
      )}

      <HabitosArquivados habitos={arquivados} />

      {editando && <EditorHabito habito={editando.habito} novo={editando.novo} fechar={() => setEditando(null)} />}
    </div>
  )
}
