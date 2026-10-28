// Sintomas com o porquê: registrar em menos de 30 segundos (sintoma, intensidade, por quê)
// e ver o mês em bolinhas. Tudo é observação do que a pessoa anotou, nunca causa.

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { apagarSintoma, restaurarSintoma, salvarSintoma, useSintomasDoMes } from '../dados/sintomas'
import { gradeDoMes, mesmoMes } from '../logica/calendario'
import { somarMeses } from '../logica/consultas'
import { diaLocal, type Dia } from '../logica/datas'
import {
  AJUDOU_INICIAIS,
  DURACOES,
  maiorPorDia,
  nivel,
  PORQUES_INICIAIS,
  resumoDoMes,
  SINTOMAS_INICIAIS,
  type Contagem,
  type Duracao,
  type NivelBolinha,
  type RegistroSintoma,
} from '../logica/sintomas'
import { Adesivo } from './Adesivo'
import { mostrarAviso } from './Avisos'
import { Botao } from './Botao'
import { Termometro } from './CheckinEmocoes'
import { Etiquetas } from './Etiquetas'
import { irParaSugestoes } from './Sugestoes'
import { useBemEstar } from '../dados/bemEstar'

// Tamanho e cor juntos: nunca só a cor diz a intensidade. Nada de vermelho.
const BOLINHA: Record<Exclude<NivelBolinha, 0>, string> = {
  1: 'h-2.5 w-2.5 bg-lilas',
  2: 'h-4 w-4 bg-ameixa/55',
  3: 'h-6 w-6 bg-ameixa',
}

const dataDe = (dia: Dia) => new Date(`${dia}T12:00:00`)

function FormularioSintoma() {
  const { t } = useTranslation()
  const [sintoma, setSintoma] = useState<string[]>([])
  const [intensidade, setIntensidade] = useState<number>()
  const [porques, setPorques] = useState<string[]>([])
  const [porqueTexto, setPorqueTexto] = useState('')
  const [ajudou, setAjudou] = useState<string[]>([])
  const [ajudouTexto, setAjudouTexto] = useState('')
  const [duracao, setDuracao] = useState<Duracao>()
  const [efeitoRemedio, setEfeitoRemedio] = useState(false)
  const [registrou, setRegistrou] = useState(false)
  const config = useBemEstar()
  const faltam = [!sintoma.length && t('sintomas.faltaSintoma'), intensidade === undefined && t('sintomas.faltaIntensidade')].filter(Boolean)

  async function registrar() {
    if (faltam.length || intensidade === undefined) return
    const r = await salvarSintoma({ sintoma: sintoma[0], intensidade, porques, porqueTexto, ajudou, ajudouTexto, duracao, efeitoRemedio })
    setSintoma([])
    setIntensidade(undefined)
    setPorques([])
    setPorqueTexto('')
    setAjudou([])
    setAjudouTexto('')
    setDuracao(undefined)
    setEfeitoRemedio(false)
    setRegistrou(true)
    mostrarAviso(t('sintomas.registrado'), () => apagarSintoma(r.id))
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault()
        registrar()
      }}
    >
      <Etiquetas legenda={t('sintomas.oQue')} lista="listaSintomas" inicial={SINTOMAS_INICIAIS} escolhidos={sintoma} mudar={setSintoma} uma />
      <Termometro
        rotulo={t('sintomas.intensidade')}
        pontas={[t('sintomas.pontaLeve'), t('sintomas.pontaMaximo')]}
        valor={intensidade}
        mudar={setIntensidade}
      />
      <Etiquetas legenda={t('sintomas.porque')} lista="listaPorques" inicial={PORQUES_INICIAIS} escolhidos={porques} mudar={setPorques} />

      <details className="rounded-2xl border-2 border-linha/40 p-3">
        <summary className="cursor-pointer font-bold">{t('sintomas.maisDetalhes')}</summary>
        <div className="mt-3 flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="font-bold">{t('sintomas.porqueTexto')}</span>
            <textarea
              rows={2}
              value={porqueTexto}
              onChange={(e) => setPorqueTexto(e.target.value)}
              maxLength={300}
              className="rounded-2xl border-2 border-linha bg-papel px-4 py-2"
            />
          </label>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 font-bold">{t('sintomas.duracao')}</legend>
            <div className="flex flex-wrap gap-2">
              {DURACOES.map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={duracao === d}
                  onClick={() => setDuracao(duracao === d ? undefined : d)}
                  className={`min-h-9 rounded-full border-2 border-linha px-3 text-sm font-semibold ${duracao === d ? 'bg-lilas' : 'bg-papel'}`}
                >
                  {duracao === d && '✓ '}
                  {t(`sintomas.duracoes.${d}`)}
                </button>
              ))}
            </div>
          </fieldset>
          <Etiquetas legenda={t('sintomas.ajudou')} lista="listaAjudou" inicial={AJUDOU_INICIAIS} escolhidos={ajudou} mudar={setAjudou} />
          <label className="flex flex-col gap-1">
            <span className="font-bold">{t('sintomas.ajudouTexto')}</span>
            <input
              value={ajudouTexto}
              onChange={(e) => setAjudouTexto(e.target.value)}
              maxLength={200}
              className="min-h-11 rounded-full border-2 border-linha bg-papel px-4"
            />
          </label>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={efeitoRemedio}
              onChange={(e) => setEfeitoRemedio(e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0 accent-[var(--forte-ameixa)]"
            />
            <span>
              <span className="block font-bold">{t('sintomas.efeitoRemedio')}</span>
              <span className="block text-sm">{t('sintomas.efeitoRemedioDica')}</span>
            </span>
          </label>
        </div>
      </details>

      <div className="flex flex-wrap items-center gap-3">
        <Botao type="submit" grande disabled={faltam.length > 0}>
          {t('sintomas.registrar')}
        </Botao>
        {faltam.length > 0 && <span className="text-sm">{t('sintomas.falta', { lista: faltam.join(', ') })}</span>}
        {registrou && config?.ferramentas.includes('sugestoes') && (
          <button type="button" onClick={irParaSugestoes} className="font-bold underline decoration-2 underline-offset-4">
            {t('sugestoes.irPara')} ↓
          </button>
        )}
      </div>
    </form>
  )
}

function ItemRegistro({ r }: { r: RegistroSintoma }) {
  const { t, i18n } = useTranslation()
  const hora = new Date(r.quando).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })
  return (
    <li className="flex items-start gap-3 rounded-2xl border-2 border-linha/40 px-3 py-2">
      <span className="font-bold tabular-nums">{hora}</span>
      <span className="flex-1 text-sm">
        <strong className="text-base">
          {r.sintoma} · {r.intensidade}
        </strong>
        {r.duracao && ` · ${t(`sintomas.duracoes.${r.duracao}`)}`}
        {(r.porques.length > 0 || r.porqueTexto) && (
          <span className="block">
            <span className="font-semibold">{t('sintomas.porqueCurto')}</span> {[...r.porques, r.porqueTexto && `“${r.porqueTexto}”`].filter(Boolean).join(', ')}
          </span>
        )}
        {(r.ajudou.length > 0 || r.ajudouTexto) && (
          <span className="block">
            <span className="font-semibold">{t('sintomas.ajudouCurto')}</span> {[...r.ajudou, r.ajudouTexto && `“${r.ajudouTexto}”`].filter(Boolean).join(', ')}
          </span>
        )}
        {r.efeitoRemedio && <span className="mt-1 inline-block rounded-full border-2 border-linha px-2 text-xs font-bold">{t('sintomas.marcaRemedio')}</span>}
      </span>
      <button
        type="button"
        onClick={async () => {
          await apagarSintoma(r.id)
          mostrarAviso(t('sintomas.apagado'), () => restaurarSintoma(r))
        }}
        aria-label={t('sintomas.apagar', { sintoma: r.sintoma, hora })}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-linha bg-papel font-bold"
      >
        ×
      </button>
    </li>
  )
}

function ListaContagem({ titulo, itens, vazio }: { titulo: string; itens: Contagem[]; vazio: string }) {
  const { t } = useTranslation()
  return (
    <div className="rounded-2xl border-2 border-linha/40 p-3">
      <h4 className="rotulo mb-2">{titulo}</h4>
      {itens.length ? (
        <ol className="flex flex-col gap-1">
          {itens.map((i) => (
            <li key={i.nome} className="flex justify-between gap-2">
              <span>{i.nome}</span>
              <span className="font-bold tabular-nums">{t('sintomas.vezes', { count: i.vezes })}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-tinta-suave">{vazio}</p>
      )}
    </div>
  )
}

export function VisaoDoMes() {
  const { t, i18n } = useTranslation()
  const hoje = diaLocal()
  const [mes, setMes] = useState<Dia>(hoje)
  const [escolhido, setEscolhido] = useState<Dia>(hoje)
  const registros = useSintomasDoMes(mes)
  if (!registros) return null
  const maior = maiorPorDia(registros)
  const resumo = resumoDoMes(registros)
  const semanas = gradeDoMes(mes).filter((s) => s.some((d) => mesmoMes(d, mes)))
  const nomeMes = dataDe(mes).toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' })
  const diaLongo = (d: Dia) => dataDe(d).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long' })
  const doEscolhido = registros.filter((r) => r.dia === escolhido)
  const trocarMes = (n: number) => {
    const novo = somarMeses(`${mes.slice(0, 7)}-01`, n)
    setMes(novo)
    setEscolhido(mesmoMes(novo, hoje) ? hoje : novo)
  }

  return (
    <section aria-labelledby="titulo-mes-sintomas" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 id="titulo-mes-sintomas" className="flex-1 text-xl font-semibold first-letter:uppercase">
          {t('sintomas.seuMes', { mes: nomeMes })}
        </h3>
        <Botao variante="contorno" onClick={() => trocarMes(-1)} aria-label={t('sintomas.mesAnterior')}>
          ‹
        </Botao>
        <Botao variante="contorno" onClick={() => trocarMes(1)} aria-label={t('sintomas.mesSeguinte')} disabled={mesmoMes(mes, hoje)}>
          ›
        </Botao>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <div>
          <div className="grid grid-cols-7 gap-1" role="group" aria-label={t('sintomas.calendario', { mes: nomeMes })}>
            {semanas[0].map((d) => (
              <span key={d} aria-hidden="true" className="text-center text-xs font-bold text-tinta-suave">
                {dataDe(d).toLocaleDateString(i18n.language, { weekday: 'narrow' })}
              </span>
            ))}
            {semanas.flat().map((d) => {
              if (!mesmoMes(d, mes)) return <span key={d} aria-hidden="true" />
              const max = maior.get(d)
              const n = nivel(max)
              const qtd = registros.filter((r) => r.dia === d).length
              const futuro = d > hoje
              return (
                <button
                  key={d}
                  type="button"
                  disabled={futuro}
                  aria-pressed={escolhido === d}
                  onClick={() => setEscolhido(d)}
                  aria-label={`${diaLongo(d)}: ${qtd ? t('sintomas.diaComRegistro', { count: qtd, max }) : t('sintomas.diaSem')}${d === hoje ? ` (${t('sintomas.hoje')})` : ''}`}
                  className={`flex aspect-square min-h-10 flex-col items-center justify-center gap-0.5 rounded-xl border-2 text-xs ${
                    escolhido === d ? 'border-linha shadow-[2px_2px_0_var(--linha)]' : futuro ? 'border-dashed border-linha/20 text-tinta-suave' : 'border-linha/25'
                  } ${d === hoje ? 'font-bold' : ''}`}
                >
                  <span aria-hidden="true">{Number(d.slice(8))}</span>
                  <span aria-hidden="true" className="grid h-6 place-items-center">
                    {n > 0 && <span className={`block rounded-full border-2 border-linha ${BOLINHA[n as 1 | 2 | 3]}`} />}
                  </span>
                </button>
              )
            })}
          </div>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            {([1, 2, 3] as const).map((n) => (
              <span key={n} className="inline-flex items-center gap-1">
                <span className={`inline-block rounded-full border-2 border-linha ${BOLINHA[n]}`} aria-hidden="true" />
                {t(`sintomas.legenda.${n}`)}
              </span>
            ))}
            <span>{t('sintomas.legenda.0')}</span>
          </p>
          <details className="mt-2 text-sm">
            <summary className="cursor-pointer font-semibold underline decoration-2 underline-offset-4">{t('sintomas.verTabela')}</summary>
            <table className="mt-2 w-full border-collapse">
              <caption className="so-leitor">{t('sintomas.calendario', { mes: nomeMes })}</caption>
              <thead>
                <tr className="border-b-2 border-linha text-left">
                  <th className="py-1 pr-3">{t('sintomas.colDia')}</th>
                  <th className="py-1 pr-3">{t('sintomas.colSintoma')}</th>
                  <th className="py-1">{t('sintomas.colIntensidade')}</th>
                </tr>
              </thead>
              <tbody>
                {[...registros].reverse().map((r) => (
                  <tr key={r.id} className="border-b border-linha/20">
                    <td className="py-1 pr-3 tabular-nums">{Number(r.dia.slice(8))}</td>
                    <td className="py-1 pr-3">{r.sintoma}</td>
                    <td className="py-1 tabular-nums">{r.intensidade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="font-bold" aria-live="polite">
            {diaLongo(escolhido)}
            {escolhido === hoje && ` · ${t('sintomas.hoje')}`}
          </h4>
          {doEscolhido.length ? (
            <ul className="flex flex-col gap-2">
              {doEscolhido.map((r) => (
                <ItemRegistro key={r.id} r={r} />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-tinta-suave">{t('sintomas.nadaNoDia')}</p>
          )}
        </div>
      </div>

      {resumo.registros > 0 && (
        <div className="flex flex-col gap-3">
          <p>
            {t('sintomas.resumo', {
              registros: t('sintomas.nRegistros', { count: resumo.registros }),
              dias: t('sintomas.nDias', { count: resumo.dias }),
            })}
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <ListaContagem titulo={t('sintomas.maisFrequentes')} itens={resumo.sintomas} vazio="" />
            <ListaContagem titulo={t('sintomas.porquesFrequentes')} itens={resumo.porques} vazio={t('sintomas.semPorques')} />
            <ListaContagem titulo={t('sintomas.ajudouFrequente')} itens={resumo.ajudou} vazio={t('sintomas.semAjudou')} />
          </div>
          {resumo.efeitoRemedio > 0 && <p className="text-sm">{t('sintomas.resumoRemedio', { count: resumo.efeitoRemedio })}</p>}
          <p className="text-sm text-tinta-suave">{t('sintomas.soObservacao')}</p>
        </div>
      )}
    </section>
  )
}

export function RegistroSintomas() {
  const { t } = useTranslation()
  return (
    <section aria-labelledby="titulo-sintomas" className="cartao flex flex-col gap-6 bg-papel p-3 sm:p-6">
      <div className="flex items-center gap-3">
        <Adesivo nome="interrogacao" tamanho={44} />
        <h2 id="titulo-sintomas" className="flex-1 text-2xl font-semibold">
          {t('bemEstar.ferramentas.sintomas.nome')}
        </h2>
      </div>
      <FormularioSintoma />
      <hr className="border-t-2 border-linha/20" />
      <VisaoDoMes />
    </section>
  )
}
