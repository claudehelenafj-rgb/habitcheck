// Alimentação: regularidade, não restrição. Bolinhas das refeições e copos de água de hoje, o plano alimentar
// da pessoa (o PDF dela, lido no aparelho, com o que comer em cada horário), a semana,
// "não sei o que comer", comidas fáceis, lista de compras e os horários de cada refeição com lembrete para
// comer mesmo sem fome. Sem calorias, peso ou julgamento.

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import { Adesivo } from '../componentes/Adesivo'
import { ComidasFaceis, ListaDeCompras, NaoSeiOQueComer } from '../componentes/ComidasECompras'
import { GradeSemanal, type Dia as DiaGrade } from '../componentes/GradeSemanal'
import { BolinhasRefeicoes, CoposDeAgua, nomeRefeicao } from '../componentes/Refeicoes'
import { MeuPlanoAlimentar } from '../componentes/PlanoAlimentar'
import { mudarConfigAlimentacao, useComidas, useCompras, useConfigAlimentacao, useDiasAlimentacao } from '../dados/alimentacao'
import { useAgora } from '../dados/timer'
import { estadoDiaAlimentacao, progressoDoDia, type ConfigAlimentacao, type IdRefeicao, type Refeicao } from '../logica/alimentacao'
import { diaLocal } from '../logica/datas'
import { diasDaSemana } from '../logica/remedios'

const campo = 'min-h-11 rounded-full border-2 border-linha bg-papel px-4'

function mudarRefeicao(id: IdRefeicao, mudanca: Partial<Refeicao>) {
  return mudarConfigAlimentacao((c) => ({ refeicoes: c.refeicoes.map((r) => (r.id === id ? { ...r, ...mudanca } : r)) }))
}

function Horarios({ config }: { config: ConfigAlimentacao }) {
  const { t } = useTranslation()
  return (
    <details className="cartao bg-papel p-4">
      <summary className="cursor-pointer text-xl font-semibold">{t('alimentacao.horariosTitulo')}</summary>
      <div className="mt-4 flex flex-col gap-4">
        <p className="max-w-prose text-sm">{t('alimentacao.horariosDica')}</p>
        <ul className="grid gap-3 md:grid-cols-2">
          {config.refeicoes.map((r) => (
            <li key={r.id} className="flex flex-col gap-3 rounded-2xl border-2 border-linha/40 p-4">
              <label className="flex items-center gap-2 font-bold">
                <input type="checkbox" checked={r.ativa} onChange={(e) => mudarRefeicao(r.id, { ativa: e.target.checked })} className="h-5 w-5 accent-[var(--chocolate)]" />
                {t('alimentacao.usar', { refeicao: nomeRefeicao(t, r) })}
              </label>
              {r.ativa && (
                <>
                  <div className="flex flex-wrap items-end gap-3">
                    <label className="flex min-w-0 flex-1 basis-40 flex-col gap-1">
                      <span className="text-sm font-bold">{t('alimentacao.nome')}</span>
                      <input
                        defaultValue={r.nome ?? ''}
                        placeholder={t(`alimentacao.refeicoes.${r.id}`)}
                        maxLength={30}
                        onBlur={(e) => mudarRefeicao(r.id, { nome: e.target.value.trim() || undefined })}
                        className={campo}
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-sm font-bold">{t('alimentacao.horario')}</span>
                      <input type="time" value={r.hora ?? ''} onChange={(e) => mudarRefeicao(r.id, { hora: e.target.value || undefined })} className={campo} />
                    </label>
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={r.lembrar}
                      disabled={!r.hora}
                      onChange={(e) => mudarRefeicao(r.id, { lembrar: e.target.checked })}
                      className="h-5 w-5 accent-[var(--chocolate)]"
                    />
                    {t('alimentacao.lembrar')}
                  </label>
                </>
              )}
            </li>
          ))}
        </ul>
        <label className="flex flex-wrap items-center gap-2">
          <span className="font-bold">{t('alimentacao.quantosCopos')}</span>
          <select value={config.aguaMeta} onChange={(e) => {
              // lê o valor já, no toque: a mudança é gravada depois, numa transação
              const aguaMeta = Number(e.target.value)
              void mudarConfigAlimentacao(() => ({ aguaMeta }))
            }} className={campo}>
            {Array.from({ length: 13 }, (_, i) => i + 3).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
    </details>
  )
}

export function Alimentacao() {
  const { t, i18n } = useTranslation()
  const hoje = diaLocal(useAgora(60_000))
  const semana = diasDaSemana(hoje)
  const config = useConfigAlimentacao()
  const dias = useDiasAlimentacao(semana)
  const comidas = useComidas()
  const compras = useCompras()
  const { hash } = useLocation()
  const pronto = !!(config && dias && comidas && compras)

  // vindo do "Não sei o que comer" do cartão Agora: vai direto para as ideias
  useEffect(() => {
    if (!pronto || hash !== '#nao-sei') return
    const secao = document.getElementById('nao-sei')
    secao?.scrollIntoView({ block: 'start' })
    secao?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true })
  }, [pronto, hash])

  if (!config || !dias || !comidas || !compras) return null
  const doDia = (dia: string) => dias.find((d) => d.dia === dia)

  const grade: DiaGrade[] = semana.map((dia) => {
    const data = new Date(`${dia}T12:00:00`)
    const { feitas, total } = progressoDoDia(config, doDia(dia))
    return {
      rotulo: data.toLocaleDateString(i18n.language, { weekday: 'short' }).replace('.', '').toUpperCase(),
      nomeCompleto: data.toLocaleDateString(i18n.language, { weekday: 'long' }),
      numero: data.getDate(),
      estado: estadoDiaAlimentacao(config, doDia(dia), dia, hoje),
      hoje: dia === hoje,
      marca: `${feitas}/${total}`,
    }
  })

  return (
    <div className="flex flex-col gap-8">
      <h1 tabIndex={-1} className="flex items-center gap-3 text-4xl font-semibold outline-none sm:text-5xl">
        <Adesivo nome="prato" tamanho={56} />
        {t('nav.alimentacao')}
      </h1>
      <p className="max-w-prose">{t('alimentacao.intro')}</p>

      <section aria-labelledby="titulo-hoje-comida" className="cartao flex flex-col gap-5 bg-menta p-5">
        <h2 id="titulo-hoje-comida" className="text-2xl font-semibold">
          {t('alimentacao.hoje')}
        </h2>
        <div className="flex flex-col gap-2">
          <h3 className="rotulo">{t('alimentacao.refeicoesTitulo')}</h3>
          <BolinhasRefeicoes config={config} dia={doDia(hoje)} hoje={hoje} />
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="rotulo">{t('alimentacao.agua')}</h3>
          <CoposDeAgua config={config} dia={doDia(hoje)} hoje={hoje} />
        </div>
      </section>

      <MeuPlanoAlimentar config={config} />

      <GradeSemanal titulo={t('alimentacao.semana')} adesivo="prato" tom="bg-papel" dias={grade} textoMinimo={t('alimentacao.algumas')} />

      <NaoSeiOQueComer config={config} comidas={comidas} />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <ComidasFaceis config={config} comidas={comidas} />
        <ListaDeCompras compras={compras} />
      </div>

      <Horarios config={config} />
    </div>
  )
}
