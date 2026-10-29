// Página do "Resumo para a consulta", pronta para imprimir ou salvar em PDF.
// Fundo branco e texto escuro em qualquer tema; tudo calculado no aparelho, nada sai daqui.

import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'
import { usePadroes, TextoPadrao } from '../componentes/Padroes'
import { PARTES_RESUMO, type ParteResumo } from '../componentes/ResumoConsulta'
import { useBemEstar } from '../dados/bemEstar'
import { useCheckinsDesde } from '../dados/checkins'
import { useHobbies } from '../dados/hobbies'
import { useNotasRemedio } from '../dados/notasRemedio'
import { usePerfil } from '../dados/perfil'
import { useRegistrosDesde, useRemedios } from '../dados/remedios'
import { useSintomasDesde } from '../dados/sintomas'
import { useSonos } from '../dados/sono'
import { useAgora } from '../dados/timer'
import { diaLocal, somarDias, type Dia } from '../logica/datas'
import { situacao } from '../logica/hobbies'
import { ASPECTOS } from '../logica/remedioNoPlano'
import { resumoCheckins, resumoDoses, resumoSintomasDetalhado } from '../logica/resumo'
import { minutosDeSono, noiteDificil, resumoSono } from '../logica/sono'

const dataDe = (dia: Dia) => new Date(`${dia}T12:00:00`)

function Tabela({ titulo, colunas, linhas }: { titulo: string; colunas: string[]; linhas: Array<Array<string | number>> }) {
  return (
    // tabela larga rola dentro do próprio espaço no celular; a página não rola para o lado
    <div className="mt-2 overflow-x-auto">
    <table className="w-full border-collapse text-sm">
      <caption className="so-leitor">{titulo}</caption>
      <thead>
        <tr className="border-b-2 border-[#1c1c1c] text-left">
          {colunas.map((c) => (
            <th key={c} className="py-1 pr-3">
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {linhas.map((l, i) => (
          <tr key={i} className="border-b border-[#bbb]">
            {l.map((c, j) => (
              <td key={j} className="py-1 pr-3 align-top tabular-nums">
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  )
}

function Parte({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5 break-inside-avoid-page">
      <h2 className="border-b-2 border-[#1c1c1c] pb-1 text-xl font-bold">{titulo}</h2>
      {children}
    </section>
  )
}

export function ResumoImpressao() {
  const { t, i18n } = useTranslation()
  const [params] = useSearchParams()
  const titulo = useRef<HTMLHeadingElement>(null)
  const agora = useAgora(60_000)
  const hoje = diaLocal(agora)
  const semanas = [2, 4, 8].includes(Number(params.get('semanas'))) ? Number(params.get('semanas')) : 2
  const pedidas = params.get('inclui')?.split(',') ?? [...PARTES_RESUMO]
  const inclui = (p: ParteResumo) => pedidas.includes(p)
  const inicio = somarDias(hoje, -semanas * 7)

  const perfil = usePerfil()
  const config = useBemEstar()
  const checkins = useCheckinsDesde(inicio)
  const sintomas = useSintomasDesde(inicio)
  const sonos = useSonos()
  const remedios = useRemedios()
  const doses = useRegistrosDesde(inicio)
  const hobbies = useHobbies()
  const notas = useNotasRemedio(inicio)
  const lista = usePadroes(inicio, hoje)

  useEffect(() => {
    titulo.current?.focus()
  }, [])

  const curto = (d: Dia) => dataDe(d).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' }).replace('.', '')
  const longo = (d: Dia) => dataDe(d).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' })
  const n = (x: number) => x.toLocaleString(i18n.language, { maximumFractionDigits: 1 })
  const hm = (min: number) => t('sono.duracao', { h: Math.floor(min / 60), min: String(min % 60).padStart(2, '0') })

  const pronto = perfil !== undefined && config && checkins && sintomas && sonos && remedios && doses && hobbies && notas && lista
  const ck = checkins && resumoCheckins(checkins)
  const si = sintomas && resumoSintomasDetalhado(sintomas)
  const noites = sonos?.filter((s) => s.noite >= somarDias(inicio, -1) && s.noite < hoje) ?? []
  const so = resumoSono(noites, somarDias(inicio, -1))
  const ativos = remedios?.filter((r) => r.ativo) ?? []
  const rd = remedios && doses ? resumoDoses(ativos, doses, inicio, hoje, agora) : []
  const nomeRemedio = (id?: string) => (id ? remedios?.find((r) => r.id === id)?.nome ?? '–' : t('comoEstou.geral'))

  return (
    <div className="resumo-impressao min-h-screen bg-white px-5 py-8 text-[#1c1c1c]">
      <div className="nao-imprimir mx-auto mb-6 flex max-w-3xl flex-wrap items-center gap-3">
        <Link to="/bem-estar" className="font-bold underline decoration-2 underline-offset-4">
          ← {t('naoDormir.voltar')}
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="ml-auto min-h-11 rounded-full border-2 border-[#1c1c1c] bg-[#1c1c1c] px-5 font-bold text-white"
        >
          {t('resumo.imprimir')}
        </button>
      </div>

      <main className="mx-auto flex max-w-3xl flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 ref={titulo} tabIndex={-1} className="text-3xl font-bold outline-none">
            {t('resumo.tituloPagina')}
          </h1>
          <p>
            {t('resumo.periodoTexto', { de: longo(inicio), ate: longo(hoje) })}
            {perfil?.nome && ` · ${perfil.nome}`}
          </p>
          <p className="text-sm">{t('resumo.geradoEm', { data: longo(hoje) })}</p>
        </header>

        {!pronto ? null : (
          <>
            {inclui('checkins') && ck && (
              <Parte titulo={t('resumo.partes.checkins')}>
                {ck.total ? (
                  <>
                    <p>
                      {t('resumo.checkinsTexto', {
                        total: ck.total,
                        dias: ck.dias,
                        ansiedade: n(ck.medias.ansiedade),
                        irritacao: n(ck.medias.irritacao),
                        energia: n(ck.medias.energia),
                      })}{' '}
                      {t('resumo.diasAltos', { count: ck.diasAltos })}
                    </p>
                    <Tabela
                      titulo={t('resumo.partes.checkins')}
                      colunas={[t('resumo.colDia'), t('checkin.medidas.ansiedade'), t('checkin.medidas.irritacao'), t('checkin.medidas.energia'), t('resumo.colSinais')]}
                      linhas={ck.porDia.map((d) => [curto(d.dia), d.ansiedade, d.irritacao, n(d.energia), d.sinais.join(', ') || '–'])}
                    />
                    <p className="text-xs">{t('resumo.checkinsNota')}</p>
                  </>
                ) : (
                  <p>{t('resumo.nada')}</p>
                )}
              </Parte>
            )}

            {inclui('sintomas') && si && (
              <Parte titulo={t('resumo.partes.sintomas')}>
                {si.registros ? (
                  <>
                    <p>{t('resumo.sintomasTexto', { registros: si.registros, dias: si.dias })}</p>
                    <Tabela
                      titulo={t('resumo.partes.sintomas')}
                      colunas={[t('sintomas.colSintoma'), t('hobbies.colVezes'), t('resumo.colMedia'), t('resumo.colMaior')]}
                      linhas={si.porSintoma.map((s) => [s.nome, s.vezes, n(s.media), s.maior])}
                    />
                    {si.porques.length > 0 && (
                      <p>
                        <strong>{t('sintomas.porquesFrequentes')}:</strong> {si.porques.map((p) => `${p.nome} (${p.vezes})`).join(', ')}
                      </p>
                    )}
                    {si.ajudou.length > 0 && (
                      <p>
                        <strong>{t('sintomas.ajudouFrequente')}:</strong> {si.ajudou.map((p) => `${p.nome} (${p.vezes})`).join(', ')}
                      </p>
                    )}
                    {si.efeitoRemedio.length > 0 && (
                      <>
                        <p className="font-bold">{t('resumo.efeitoRemedio')}</p>
                        <ul className="list-disc pl-5">
                          {si.efeitoRemedio.map((s) => (
                            <li key={s.id}>
                              {curto(s.dia)}: {s.sintoma} ({s.intensidade}/10){s.porqueTexto && ` · “${s.porqueTexto}”`}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </>
                ) : (
                  <p>{t('resumo.nada')}</p>
                )}
              </Parte>
            )}

            {inclui('sono') && (
              <Parte titulo={t('resumo.partes.sono')}>
                {config.sono?.acordarAs && <p>{t('resumo.acordarFixo', { hora: config.sono.acordarAs })}</p>}
                {so ? (
                  <>
                    <p>
                      {t('resumo.sonoTexto', {
                        noites: so.noites,
                        sono: hm(so.sonoMedioMin),
                        qualidade: n(so.qualidadeMedia),
                        dificeis: noites.filter(noiteDificil).length,
                      })}
                    </p>
                    <Tabela
                      titulo={t('resumo.partes.sono')}
                      colunas={[t('sono.colNoite'), t('sono.deitei'), t('sono.levantei'), t('sono.colSono'), t('sono.colDemora'), t('resumo.colAcordou'), t('sono.colQualidade')]}
                      linhas={noites.map((s) => [
                        curto(s.noite),
                        s.deitou,
                        s.levantou,
                        hm(minutosDeSono(s)),
                        t(`sono.demoras.${s.demora}`),
                        s.despertares === 3 ? t('sono.tresOuMais') : s.despertares,
                        t(`sono.qualidades.${s.qualidade}`),
                      ])}
                    />
                  </>
                ) : (
                  <p>{t('resumo.nada')}</p>
                )}
              </Parte>
            )}

            {inclui('remedios') && (
              <Parte titulo={t('resumo.partes.remedios')}>
                {rd.length ? (
                  <ul className="flex flex-col gap-1">
                    {rd.map((r) => (
                      <li key={r.remedio.id}>
                        <strong>{r.remedio.nome}</strong> ({r.remedio.horarios.join(', ')}
                        {r.remedio.efeito && ` · ${t('resumo.efeito', { de: r.remedio.efeito.de, ate: r.remedio.efeito.ate })}`}):{' '}
                        {t('resumo.doses', { tomadas: r.tomadas, previstas: r.previstas, puladas: r.puladas, semResposta: r.semResposta })}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>{t('resumo.semRemedios')}</p>
                )}
                {notas.length > 0 && (
                  <>
                    <p className="font-bold">{t('comoEstou.titulo')}</p>
                    <ul className="list-disc pl-5">
                      {[...notas].reverse().map((nt) => (
                        <li key={nt.id}>
                          {curto(nt.dia)} · {nomeRemedio(nt.remedioId)}
                          {ASPECTOS.filter((a) => nt.aspectos[a]).length > 0 &&
                            `: ${ASPECTOS.filter((a) => nt.aspectos[a])
                              .map((a) => `${t(`comoEstou.aspectos.${a}`).toLowerCase()} ${t(`comoEstou.mudancas.${nt.aspectos[a]}`).toLowerCase()}`)
                              .join(', ')}`}
                          {nt.nota && ` · “${nt.nota}”`}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </Parte>
            )}

            {inclui('hobbies') && (
              <Parte titulo={t('resumo.partes.hobbies')}>
                {hobbies.hobbies.filter((h) => !h.arquivadoEm).length ? (
                  <ul className="flex flex-col gap-1">
                    {hobbies.hobbies
                      .filter((h) => !h.arquivadoEm)
                      .map((h) => {
                        const vezes = hobbies.vezes.filter((v) => v.hobbyId === h.id)
                        const s = situacao(h, vezes, hoje, diaLocal(new Date(h.criadoEm)))
                        const noPeriodo = vezes.filter((v) => v.dia >= inicio).length
                        return (
                          <li key={h.id}>
                            <strong>{h.nome}</strong>: {t('resumo.hobbyVezes', { count: noPeriodo })}
                            {s.tipo === 'deLado' && ` · ${t('hobbies.deLadoHa', { count: s.dias }).toLowerCase()}`}
                            {s.tipo === 'deLado' && s.motivo && ` (${[...s.motivo.etiquetas, s.motivo.texto].filter(Boolean).join(', ')})`}
                            {s.tipo === 'pausado' && ` · ${t('resumo.hobbyPausado')}`}
                          </li>
                        )
                      })}
                  </ul>
                ) : (
                  <p>{t('resumo.nada')}</p>
                )}
              </Parte>
            )}

            {inclui('padroes') && (
              <Parte titulo={t('padroes.titulo')}>
                {lista.length ? (
                  <ul className="list-disc pl-5">
                    {lista.map((p) => (
                      <li key={p.tipo}>
                        <TextoPadrao p={p} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>{t('padroes.nenhum')}</p>
                )}
                <p className="text-xs">{t('padroes.aviso')}</p>
              </Parte>
            )}

            {config.perguntasConsulta?.trim() && (
              <Parte titulo={t('resumo.perguntas')}>
                <p className="whitespace-pre-line">{config.perguntasConsulta}</p>
              </Parte>
            )}

            <footer className="border-t-2 border-[#1c1c1c] pt-2 text-xs">{t('resumo.rodape')}</footer>
          </>
        )}
      </main>
    </div>
  )
}
