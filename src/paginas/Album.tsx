// Álbum de adesivos: uma página por mês com os adesivos do que foi feito (hábitos, tarefas e rituais), na ordem em
// que chegaram, e os adesivos especiais que chegam com o total. Dia sem adesivo não aparece e não tira nada.

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Adesivo } from '../componentes/Adesivo'
import { Botao } from '../componentes/Botao'
import { Selo } from '../componentes/Selo'
import { useAlbum } from '../dados/album'
import { useAgora } from '../dados/timer'
import { contagemPorTipo, doMes, ESPECIAIS, inclinacao, mesesDoAlbum, proximoEspecial, type AdesivoDoAlbum, type EspeciaisGanhos } from '../logica/album'
import { diaLocal, type Dia } from '../logica/datas'
import { mesDe, type Mes } from '../logica/dinheiro'

const dataDoDia = (dia: Dia) => new Date(`${dia}T12:00:00`)
const dataDoMes = (mes: Mes) => new Date(`${mes}-01T12:00:00`)

function useNomes() {
  const { t, i18n } = useTranslation()
  const dia = (d: Dia) => dataDoDia(d).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long' })
  const titulo = (a: AdesivoDoAlbum) => (a.ritual ? t(`rituais.${a.ritual}`) : a.titulo)
  const rotulo = (a: AdesivoDoAlbum) => t(a.minimo ? 'album.rotuloMinimo' : 'album.rotulo', { titulo: titulo(a), dia: dia(a.dia) })
  return { dia, titulo, rotulo }
}

/** A página de um mês: os adesivos colados um ao lado do outro, cada um um pouco torto. */
function PaginaDoMes({ mes, adesivos, hoje }: { mes: Mes; adesivos: AdesivoDoAlbum[]; hoje: Dia }) {
  const { t, i18n } = useTranslation()
  const nomes = useNomes()
  const conta = contagemPorTipo(adesivos)
  const porDia = new Map<Dia, AdesivoDoAlbum[]>()
  for (const a of adesivos) porDia.set(a.dia, [...(porDia.get(a.dia) ?? []), a])
  return (
    <div className="flex flex-col gap-4">
      <div className="pagina-album relative rounded-[1.25rem] border-2 border-linha bg-papel p-4 shadow-[3px_3px_0_var(--linha)] sm:p-6">
        <span aria-hidden="true" className="decor absolute -top-3 left-6 h-6 w-20 -rotate-3 bg-[var(--rosa-selo)] opacity-80" />
        <span aria-hidden="true" className="decor absolute -top-3 right-6 h-6 w-20 rotate-2 bg-[var(--azul-nevoa)] opacity-80" />
        {adesivos.length === 0 ? (
          <p className="py-10 text-center text-lg font-semibold">{t(mes === mesDe(hoje) ? 'album.paginaVazia' : 'album.paginaVaziaPassada')}</p>
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(4.25rem,1fr))] gap-x-2 gap-y-3" aria-label={t('album.adesivosDe', { mes: dataDoMes(mes).toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' }) })}>
            {adesivos.map((a) => (
              <li key={a.id} title={nomes.rotulo(a)} className="flex flex-col items-center gap-0.5">
                <span className="block" style={{ transform: `rotate(${inclinacao(a.id)}deg)` }}>
                  <Adesivo nome={a.nome} tamanho={52} rotulo={nomes.rotulo(a)} />
                </span>
                <span aria-hidden="true" className="font-mao text-lg leading-none">
                  {dataDoDia(a.dia).getDate()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {adesivos.length > 0 && (
        <>
          <p className="flex flex-wrap gap-2 text-sm font-bold">
            {(['habito', 'tarefa', 'ritual'] as const)
              .filter((tipo) => conta[tipo] > 0)
              .map((tipo) => (
                <span key={tipo} className="rounded-full border-2 border-linha/40 bg-papel px-3 py-1">
                  {t(`album.conta.${tipo}`, { count: conta[tipo] })}
                </span>
              ))}
          </p>
          <details className="cartao bg-papel p-4">
            <summary className="cursor-pointer font-bold">{t('album.verLista')}</summary>
            <ul className="mt-3 flex flex-col gap-3">
              {[...porDia].map(([dia, lista]) => (
                <li key={dia}>
                  <p className="font-bold">{nomes.dia(dia)}</p>
                  <ul className="ml-4 list-disc">
                    {lista.map((a) => (
                      <li key={a.id}>
                        {nomes.titulo(a)}
                        {a.minimo && ` (${t('album.versaoMinima')})`}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </details>
        </>
      )}
    </div>
  )
}

/** Os especiais: os que chegaram (com o dia) e os que ainda vão chegar (surpresa, com o número). */
function Especiais({ ganhos, total }: { ganhos: EspeciaisGanhos; total: number }) {
  const { t } = useTranslation()
  const nomes = useNomes()
  const proximo = proximoEspecial(total, ganhos)
  return (
    <section aria-labelledby="titulo-especiais" className="flex flex-col gap-4">
      <h2 id="titulo-especiais" className="text-2xl font-semibold">
        {t('album.especiaisTitulo')}
      </h2>
      <p className="max-w-prose">{t('album.especiaisDica')}</p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {ESPECIAIS.map((e) => {
          const dia = ganhos[e.nome]
          return (
            <li
              key={e.nome}
              className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-3 text-center ${dia ? 'border-linha bg-papel' : 'border-dashed border-linha/50'}`}
            >
              {dia ? (
                <>
                  <Adesivo nome={e.nome} tamanho={64} />
                  <span className="font-bold">{t(`album.especiais.${e.nome}`)}</span>
                  <span className="text-sm">{t('album.chegouEm', { dia: nomes.dia(dia) })}</span>
                </>
              ) : (
                <>
                  <span aria-hidden="true" className="grid h-16 w-16 place-items-center rounded-full border-2 border-dashed border-linha/60 font-titulo text-2xl font-bold">
                    ?
                  </span>
                  <span className="font-bold">{t('album.surpresa')}</span>
                  <span className="text-sm">{t('album.aos', { count: e.aos })}</span>
                </>
              )}
            </li>
          )
        })}
      </ul>
      <p className="font-semibold" aria-live="polite">
        {proximo ? t('album.faltam', { count: proximo.faltam }) : t('album.todosEspeciais')}
      </p>
    </section>
  )
}

export function Album() {
  const { t, i18n } = useTranslation()
  const album = useAlbum()
  const agora = useAgora(60_000)
  const hoje = diaLocal(agora)
  const [escolhido, setEscolhido] = useState<Mes | null>(null)
  if (!album) return null
  const meses = mesesDoAlbum(album.adesivos, hoje)
  const mes = escolhido && meses.includes(escolhido) ? escolhido : meses[meses.length - 1]
  const i = meses.indexOf(mes)
  const daPagina = doMes(album.adesivos, mes)
  const nomeMes = (m: Mes, ano = true) => dataDoMes(m).toLocaleDateString(i18n.language, ano ? { month: 'long', year: 'numeric' } : { month: 'long' })
  const doMesAtual = doMes(album.adesivos, mesDe(hoje)).length

  return (
    <div className="flex flex-col gap-8">
      <h1 tabIndex={-1} className="flex items-center gap-3 text-4xl font-semibold outline-none sm:text-5xl">
        <Adesivo nome="coracao" tamanho={56} />
        {t('nav.album')}
      </h1>
      <p className="max-w-prose">{t('album.intro')}</p>

      <div className="flex flex-wrap items-center gap-4">
        <Selo forma="flor" cor="rosa" numero={String(album.adesivos.length)} legenda={t('album.noAlbum')} />
        <Selo forma="onda" cor="manteiga" numero={String(doMesAtual)} legenda={t('album.noMes', { mes: nomeMes(mesDe(hoje), false) })} />
      </div>

      <section aria-labelledby="titulo-pagina" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="titulo-pagina" className="mr-auto text-2xl font-semibold first-letter:uppercase">
            {nomeMes(mes)}
          </h2>
          <Botao variante="contorno" disabled={i <= 0} onClick={() => setEscolhido(meses[i - 1])} icone={<span aria-hidden="true">‹</span>}>
            {t('album.mesAnterior')}
          </Botao>
          <Botao variante="contorno" disabled={i >= meses.length - 1} onClick={() => setEscolhido(meses[i + 1])}>
            {t('album.proximoMes')} <span aria-hidden="true">›</span>
          </Botao>
        </div>
        <PaginaDoMes key={mes} mes={mes} adesivos={daPagina} hoje={hoje} />
      </section>

      <Especiais ganhos={album.especiais} total={album.adesivos.length} />
    </div>
  )
}
