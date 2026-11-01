// Cartão de um hábito: o plano se-então à vista, "Fiz" e "Fiz a versão mínima" para hoje,
// a semana em adesivos (tocar num dia marca o que esqueceu de registrar) e a meta sem cobrança.

import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { apagarHabito, arquivarHabito, marcarHabito, marcarPreparo, restaurarHabito } from '../dados/habitos'
import { AREAS } from '../design/areas'
import { diaLocal, somarDias, type Dia } from '../logica/datas'
import {
  combinadoNoDia,
  diaDoPreparo,
  estadoDoDia,
  metaFeita,
  preparoCompleto,
  preparoDoDia,
  proximoNivel,
  temPreparo,
  vezesNaSemana,
  type Habito,
  type NivelHabito,
  type RegistroHabito,
} from '../logica/habitos'
import { diasDaSemana } from '../logica/remedios'
import { Adesivo } from './Adesivo'
import { mostrarAviso } from './Avisos'
import { Botao } from './Botao'
import { GradeSemanal, type Dia as DiaGrade } from './GradeSemanal'

/** Título e texto do aviso da véspera (também usados pela moldura). */
export function textosVespera(t: TFunction, h: Pick<Habito, 'titulo' | 'base' | 'companhia'>): [string, string] {
  const partes = [
    h.base?.length ? t('academia.vesperaBase', { itens: h.base.join(', ') }) : '',
    h.companhia ? t('academia.vesperaCombinar', { quem: h.companhia }) : '',
  ]
  return [t('academia.vesperaTitulo', { titulo: h.titulo }), partes.filter(Boolean).join(' ')]
}

/** Base de lançamento: o que deixar pronto (e o "combinei com…") para o próximo dia do hábito. */
export function BaseDeLancamento({ habito, registros }: { habito: Habito; registros: RegistroHabito[] }) {
  const { t, i18n } = useTranslation()
  const agora = new Date()
  const dia = diaDoPreparo(habito, registros, agora)
  if (!dia || !temPreparo(habito)) return null
  const hoje = diaLocal(agora)
  const preparo = preparoDoDia(habito, dia)
  const quando =
    dia === hoje
      ? t('academia.paraHoje')
      : dia === somarDias(hoje, 1)
        ? t('academia.paraAmanha')
        : t('academia.paraDia', { dia: new Date(`${dia}T12:00:00`).toLocaleDateString(i18n.language, { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '') })
  const chip = (marcado: boolean) =>
    `flex min-h-11 items-center gap-1.5 rounded-full border-2 border-linha px-4 text-sm font-bold ${marcado ? 'bg-menta' : 'bg-papel'}`
  return (
    <section aria-label={`${t('academia.baseTitulo')} · ${quando}`} className="flex flex-col gap-2 rounded-2xl border-2 border-dashed border-linha/60 bg-papel/60 p-4">
      <h4 className="font-bold">
        {t('academia.baseTitulo')} · {quando}
      </h4>
      <ul className="flex flex-wrap gap-2">
        {(habito.base ?? []).map((item) => {
          const marcado = preparo.itens.includes(item)
          return (
            <li key={item}>
              <button type="button" aria-pressed={marcado} onClick={() => marcarPreparo(habito.id, dia, item)} className={chip(marcado)}>
                <span aria-hidden="true">{marcado ? '✓' : '○'}</span>
                {item}
              </button>
            </li>
          )
        })}
        {habito.companhia && (
          <li>
            <button type="button" aria-pressed={!!preparo.combinado} onClick={() => marcarPreparo(habito.id, dia, { combinado: true })} className={chip(!!preparo.combinado)}>
              <span aria-hidden="true">{preparo.combinado ? '✓' : '○'}</span>
              {t('academia.combinei', { quem: habito.companhia })}
            </button>
          </li>
        )}
      </ul>
      <p className="text-sm" role="status">
        {preparoCompleto(habito, dia) ? `✓ ${t('academia.tudoPronto')}` : t('academia.baseDica')}
      </p>
    </section>
  )
}

/** "Se eu chegar da faculdade, então troco de roupa antes de sentar." */
export function PlanoSeEntao({ habito, className = '' }: { habito: Pick<Habito, 'se' | 'entao'>; className?: string }) {
  const { t } = useTranslation()
  return (
    <p className={className}>
      <span className="font-destaque text-2xl italic">{t('editorHabito.se')}</span> {habito.se},{' '}
      <span className="font-destaque text-2xl italic">{t('editorHabito.entao')}</span> {habito.entao}.
    </p>
  )
}

/** Botões de hoje: marcar feito ou a versão mínima; com registro, mostra o que foi e deixa desfazer. */
export function BotoesHabito({ habito, registro, hoje, grande = false }: { habito: Habito; registro?: RegistroHabito; hoje: Dia; grande?: boolean }) {
  const { t } = useTranslation()
  const marcar = async (nivel: NivelHabito) => {
    await marcarHabito(habito.id, hoje, nivel)
    mostrarAviso(t(nivel === 'completo' ? 'academia.marcado' : 'academia.marcadoMinima', { titulo: habito.titulo }), () => marcarHabito(habito.id, hoje, undefined))
  }
  if (registro) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <p className="flex items-center gap-2 text-lg font-semibold" role="status">
          <Adesivo nome={habito.adesivo} tamanho={34} />
          {registro.nivel === 'completo' ? t('academia.hojeFeito') : t('academia.hojeMinima')}
        </p>
        <button type="button" onClick={() => marcarHabito(habito.id, hoje, undefined)} className="text-sm font-bold underline decoration-2 underline-offset-4">
          {t('academia.desmarcar')}
        </button>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Botao grande={grande} onClick={() => marcar('completo')} icone={<span aria-hidden="true">✓</span>}>
          {t('academia.fiz')}
        </Botao>
        {habito.minima && (
          <Botao grande={grande} variante="secundario" tom="bg-pessego" onClick={() => marcar('minimo')}>
            {t('academia.fizMinima')}
          </Botao>
        )}
      </div>
      {habito.minima && <p className="text-sm">{t('academia.minimaE', { minima: habito.minima })}</p>}
    </div>
  )
}

export function CartaoHabito({ habito, registros, hoje, editar }: { habito: Habito; registros: RegistroHabito[]; hoje: Dia; editar: () => void }) {
  const { t, i18n } = useTranslation()
  const doHabito = registros.filter((r) => r.habitoId === habito.id)
  const registroHoje = doHabito.find((r) => r.dia === hoje)
  const naSemana = vezesNaSemana(doHabito, hoje)
  const area = habito.area ? AREAS[habito.area] : AREAS.academia
  const nomeDia = (d: number) => new Date(2026, 10, 1 + d).toLocaleDateString(i18n.language, { weekday: 'short' }).replace('.', '')

  const dias: DiaGrade[] = diasDaSemana(hoje).map((dia) => {
    const data = new Date(`${dia}T12:00:00`)
    const atual = doHabito.find((r) => r.dia === dia)?.nivel
    return {
      rotulo: data.toLocaleDateString(i18n.language, { weekday: 'short' }).replace('.', '').toUpperCase(),
      nomeCompleto: data.toLocaleDateString(i18n.language, { weekday: 'long' }),
      numero: data.getDate(),
      estado: estadoDoDia(habito, doHabito, dia, hoje),
      hoje: dia === hoje,
      // dias que já chegaram: tocar marca (feito → mínima → nada)
      aoTocar: dia <= hoje ? () => marcarHabito(habito.id, dia, proximoNivel(atual)) : undefined,
    }
  })

  return (
    <article aria-labelledby={`habito-${habito.id}`} className="flex flex-col gap-3">
      <div className={`cartao flex flex-col gap-4 p-5 ${area.claro}`}>
        <div className="flex flex-wrap items-start gap-3">
          <Adesivo nome={habito.adesivo} tamanho={48} />
          <div className="min-w-0 flex-1">
            <h3 id={`habito-${habito.id}`} className="text-2xl font-semibold break-words">
              {habito.titulo}
            </h3>
            <p className="flex flex-wrap gap-1.5 pt-1 text-sm font-bold">
              <span className="rounded-full border-2 border-linha/40 bg-papel px-2">
                {habito.dias.length
                  ? [...habito.dias].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map(nomeDia).join(', ')
                  : t('academia.vezesSemana', { count: habito.meta })}
              </span>
              {habito.bloco && <span className="rounded-full border-2 border-linha/40 bg-papel px-2">{t(`hoje.blocos.${habito.bloco}`)}</span>}
              {habito.lembrete && <span className="rounded-full border-2 border-linha/40 bg-papel px-2 tabular-nums">{t('academia.lembreteAs', { hora: habito.lembrete })}</span>}
              {habito.companhia && <span className="rounded-full border-2 border-linha/40 bg-papel px-2">{t('academia.com', { quem: habito.companhia })}</span>}
            </p>
          </div>
          <button type="button" onClick={editar} className="text-sm font-bold underline decoration-2 underline-offset-4">
            {t('academia.editar')}
          </button>
        </div>
        <PlanoSeEntao habito={habito} className="rounded-2xl bg-papel px-4 py-3 text-lg" />
        {!registroHoje && habito.dias.length > 0 && !combinadoNoDia(habito, hoje) && <p className="text-sm">{t('academia.naoCombinadoHoje')}</p>}
        <BotoesHabito habito={habito} registro={registroHoje} hoje={hoje} />
        <BaseDeLancamento habito={habito} registros={doHabito} />
      </div>
      <GradeSemanal titulo={t('academia.estaSemana')} adesivo={habito.adesivo} tom="bg-papel" dias={dias} />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1 text-sm">
        <p className="font-semibold">
          {metaFeita(habito, doHabito, hoje) ? `✓ ${t('academia.metaFeita')}` : t('academia.naSemana', { feitos: naSemana, meta: habito.meta })}
        </p>
        <span className="text-tinta-suave">{t('academia.tocarDia')}</span>
        <button
          type="button"
          onClick={async () => {
            await arquivarHabito(habito.id, true)
            mostrarAviso(t('academia.arquivado', { titulo: habito.titulo }), () => arquivarHabito(habito.id, false))
          }}
          className="ml-auto font-bold underline decoration-2 underline-offset-4"
        >
          {t('academia.arquivar')}
        </button>
      </div>
    </article>
  )
}

/** Hábitos arquivados (recolhidos): trazer de volta ou apagar, com desfazer. */
export function HabitosArquivados({ habitos }: { habitos: Habito[] }) {
  const { t } = useTranslation()
  if (!habitos.length) return null
  return (
    <details className="rounded-[1.5rem] border-2 border-linha/40 p-4">
      <summary className="cursor-pointer font-bold">{t('academia.arquivados', { count: habitos.length })}</summary>
      <p className="mt-2 text-sm">{t('academia.arquivadosDica')}</p>
      <ul className="mt-3 flex flex-col gap-2">
        {habitos.map((h) => (
          <li key={h.id} className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-linha/30 px-3 py-2">
            <Adesivo nome={h.adesivo} tamanho={28} />
            <span className="min-w-0 flex-1 font-semibold break-words">{h.titulo}</span>
            <Botao variante="secundario" tom={AREAS[h.area ?? 'academia'].claro} className="min-h-10 px-4 text-sm" onClick={() => arquivarHabito(h.id, false)}>
              {t('academia.trazerDeVolta')}
            </Botao>
            <Botao
              variante="contorno"
              className="min-h-10 px-4 text-sm"
              onClick={async () => {
                const apagado = await apagarHabito(h.id)
                mostrarAviso(t('editorHabito.apagado', { titulo: h.titulo }), () => restaurarHabito(apagado))
              }}
            >
              {t('editorHabito.apagar')}
            </Botao>
          </li>
        ))}
      </ul>
    </details>
  )
}
