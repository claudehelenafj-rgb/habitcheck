// Remédios: doses de hoje (Tomei / Adiar / Pular), avisos do sistema e, para cada remédio,
// a grade da semana ("eu tomei hoje?") e o estoque.

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Adesivo } from '../componentes/Adesivo'
import { Botao } from '../componentes/Botao'
import { BotoesDose } from '../componentes/BotoesDose'
import { EditorRemedio } from '../componentes/EditorRemedio'
import { GradeSemanal, type Dia as DiaGrade } from '../componentes/GradeSemanal'
import { compreiMais, desfazerResposta, novoRemedio, useRegistros, useRemedios } from '../dados/remedios'
import { useAgora } from '../dados/timer'
import { estaInstalado } from '../instalacao'
import { pedirPermissaoAvisos, permissaoAvisos, type PermissaoAvisos } from '../lembretes'
import { diaLocal } from '../logica/datas'
import {
  diasDaSemana,
  diasDeEstoque,
  dosesDoDia,
  estadoDoDia,
  estadoDose,
  precisaComprar,
  textoDoLembrete,
  type EstadoDose,
  type RegistroDose,
  type Remedio,
} from '../logica/remedios'

const ROTULO_ESTADO: Record<EstadoDose, string> = {
  tomei: 'remedios.estTomei',
  pulei: 'remedios.estPulei',
  adiada: 'remedios.estAdiada',
  agora: 'remedios.estAgora',
  depois: 'remedios.estDepois',
}

function AvisosSistema() {
  const { t } = useTranslation()
  const [permissao, setPermissao] = useState<PermissaoAvisos>(permissaoAvisos)
  const ehApple = /iPad|iPhone|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document
  return (
    <section aria-labelledby="titulo-avisos" className="cartao flex flex-col gap-2 bg-papel p-5">
      <h2 id="titulo-avisos" className="text-xl font-semibold">
        {t('remedios.avisosSistema')}
      </h2>
      <p>{t('remedios.avisosTexto')}</p>
      {permissao === 'default' && (
        <Botao className="self-start" onClick={async () => setPermissao(await pedirPermissaoAvisos())}>
          {t('remedios.ativarAvisos')}
        </Botao>
      )}
      {permissao === 'granted' && <p className="font-semibold">✓ {t('remedios.avisosAtivos')}</p>}
      {permissao === 'denied' && <p className="font-semibold">! {t('remedios.avisosNegados')}</p>}
      {permissao === 'sem-suporte' && <p className="font-semibold">{t('remedios.avisosSemSuporte')}</p>}
      {ehApple && !estaInstalado() && <p className="text-sm">{t('remedios.avisosIpad')}</p>}
      <p className="text-sm text-tinta-suave">{t('remedios.avisosAberto')}</p>
    </section>
  )
}

function CartaoRemedio({ remedio, registros, hoje, editar }: { remedio: Remedio; registros: RegistroDose[]; hoje: string; editar: () => void }) {
  const { t, i18n } = useTranslation()
  const [comprando, setComprando] = useState(false)
  const [unidades, setUnidades] = useState(30)
  const dias: DiaGrade[] = diasDaSemana(hoje).map((dia) => {
    const data = new Date(`${dia}T12:00:00`)
    const estado = estadoDoDia(remedio, dia, registros, hoje)
    return {
      rotulo: data.toLocaleDateString(i18n.language, { weekday: 'short' }).replace('.', '').toUpperCase(),
      nomeCompleto: data.toLocaleDateString(i18n.language, { weekday: 'long' }),
      numero: data.getDate(),
      estado: estado === 'nao-toma' ? 'futuro' : estado,
      hoje: dia === hoje,
    }
  })
  const estoque = diasDeEstoque(remedio)
  return (
    <article className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-xl font-semibold">{remedio.nome}</h3>
        {!remedio.ativo && <span className="rounded-full border-2 border-linha/50 px-2 text-xs font-bold">{t('remedios.pausado')}</span>}
        <span className="flex flex-wrap gap-1">
          {remedio.horarios.map((h) => (
            <span key={h} className="rounded-full border-2 border-linha/40 bg-papel px-2 text-sm font-bold tabular-nums">
              {h}
            </span>
          ))}
        </span>
        <button type="button" onClick={editar} className="ml-auto text-sm font-bold underline decoration-2 underline-offset-4">
          {t('remedios.editar')}
        </button>
      </div>
      {remedio.observacao && <p className="text-sm">{remedio.observacao}</p>}
      <GradeSemanal titulo={t('remedios.semana')} adesivo="pilula" tom="bg-morango-claro" dias={dias} />
      {estoque !== null && (
        <div className={`flex flex-wrap items-center gap-3 rounded-2xl border-2 p-3 ${precisaComprar(remedio) ? 'border-linha bg-manteiga' : 'border-linha/40'}`}>
          <span className="font-bold">{t('remedios.estoque')}:</span>
          <span>{t('remedios.estoqueDias', { count: estoque })}</span>
          {precisaComprar(remedio) && <span className="font-semibold">! {t('remedios.comprar')}</span>}
          {comprando ? (
            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={async (e) => {
                e.preventDefault()
                await compreiMais(remedio.id, unidades)
                setComprando(false)
              }}
            >
              <label className="flex flex-col text-sm font-bold">
                {t('remedios.quantasUnidades')}
                <input
                  type="number"
                  min={1}
                  value={unidades}
                  onChange={(e) => setUnidades(Math.max(1, Number(e.target.value) || 1))}
                  className="min-h-10 w-24 rounded-xl border-2 border-linha bg-papel px-3 tabular-nums"
                />
              </label>
              <Botao type="submit" className="min-h-10 px-4 text-sm">
                {t('remedios.adicionar')}
              </Botao>
            </form>
          ) : (
            <Botao variante="secundario" tom="bg-menta" className="ml-auto min-h-10 px-4 text-sm" onClick={() => setComprando(true)}>
              {t('remedios.compreiMais')}
            </Botao>
          )}
        </div>
      )}
    </article>
  )
}

export function Remedios() {
  const { t } = useTranslation()
  const agora = useAgora(20_000)
  const hoje = diaLocal(agora)
  const semana = diasDaSemana(hoje)
  const remedios = useRemedios()
  const registros = useRegistros(semana)
  const [editando, setEditando] = useState<{ remedio: Remedio; novo: boolean } | null>(null)
  if (!remedios || !registros) return null
  const doses = dosesDoDia(remedios, hoje)

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 tabIndex={-1} className="flex flex-1 items-center gap-3 text-4xl font-semibold outline-none sm:text-5xl">
          <Adesivo nome="pilula" tamanho={56} />
          {t('remedios.titulo')}
        </h1>
        <Botao onClick={() => setEditando({ remedio: novoRemedio(), novo: true })} icone={<span aria-hidden="true">+</span>}>
          {t('remedios.novo')}
        </Botao>
      </div>
      <p className="max-w-prose text-sm">{t('remedios.aviso')}</p>

      {remedios.length === 0 ? (
        <div className="cartao flex flex-col items-center gap-3 bg-morango-claro p-8 text-center">
          <Adesivo nome="pilula" tamanho={72} />
          <p className="text-2xl font-semibold">{t('remedios.vazio')}</p>
          <p className="max-w-prose">{t('remedios.vazioDica')}</p>
        </div>
      ) : (
        <>
          <section aria-labelledby="titulo-doses" className="flex flex-col gap-3">
            <h2 id="titulo-doses" className="text-2xl font-semibold">
              {t('remedios.hoje')}
            </h2>
            {doses.length === 0 && <p>{t('remedios.semDoses')}</p>}
            <ul className="flex flex-col gap-3">
              {doses.map((dose) => {
                const registro = registros.find((r) => r.id === dose.id)
                const estado = estadoDose(dose, registro, agora)
                const respondida = estado === 'tomei' || estado === 'pulei'
                return (
                  <li key={dose.id} className={`cartao flex flex-col gap-3 p-4 sm:flex-row sm:items-center ${estado === 'agora' ? 'bg-morango-claro' : 'bg-papel'}`}>
                    <span className="font-titulo text-3xl font-semibold tabular-nums">{dose.horario}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">{textoDoLembrete(dose.remedio)}</p>
                      <p className="text-sm">
                        <span className="rounded-full border-2 border-linha/50 px-2 text-xs font-bold">
                          {estado === 'tomei' && '✓ '}
                          {t(ROTULO_ESTADO[estado])}
                        </span>
                      </p>
                    </div>
                    {respondida ? (
                      <Botao variante="contorno" className="min-h-10 px-4 text-sm" onClick={() => desfazerResposta(dose)}>
                        {t('avisos.desfazer')}
                      </Botao>
                    ) : (
                      <BotoesDose dose={dose} />
                    )}
                  </li>
                )
              })}
            </ul>
          </section>

          <section className="flex flex-col gap-6">
            {remedios.map((r) => (
              <CartaoRemedio key={r.id} remedio={r} registros={registros} hoje={hoje} editar={() => setEditando({ remedio: r, novo: false })} />
            ))}
          </section>
        </>
      )}

      <AvisosSistema />

      {editando && <EditorRemedio remedio={editando.remedio} novo={editando.novo} fechar={() => setEditando(null)} />}
    </div>
  )
}
