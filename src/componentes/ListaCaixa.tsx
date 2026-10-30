// Itens abertos da caixa de entrada, cada um com as decisões: virar tarefa, evento ou hábito, já resolvi, lixo.
// Usada na tela da caixa e no ritual da noite.

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ItemCaixa } from '../dados/banco'
import { novoEvento } from '../dados/eventos'
import { novoHabito } from '../dados/habitos'
import { desfazerResolucao, novaTarefa, resolverItem } from '../dados/tarefas'
import { AREAS, type IdArea } from '../design/areas'
import { mostrarAviso } from './Avisos'
import { Botao } from './Botao'
import { EditorEvento } from './EditorEvento'
import { EditorHabito } from './EditorHabito'
import { EditorTarefa } from './EditorTarefa'

function tempoRelativo(iso: string, idioma: string): string {
  const segundos = (new Date(iso).getTime() - Date.now()) / 1000
  const rtf = new Intl.RelativeTimeFormat(idioma, { numeric: 'auto' })
  const passos: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  for (const [unidade, s] of passos) if (Math.abs(segundos) >= s) return rtf.format(Math.round(segundos / s), unidade)
  return rtf.format(0, 'minute')
}

/** `areasHabito`: áreas com hábitos que estão ligadas ("Virar hábito" só aparece com alguma). */
export function ListaCaixa({ itens, areasHabito }: { itens: ItemCaixa[]; areasHabito: IdArea[] }) {
  const { t, i18n } = useTranslation()
  const [virando, setVirando] = useState<ItemCaixa | null>(null)
  const [virandoEvento, setVirandoEvento] = useState<ItemCaixa | null>(null)
  const [virandoHabito, setVirandoHabito] = useState<ItemCaixa | null>(null)

  async function resolver(item: ItemCaixa, destino: 'feito' | 'lixo') {
    await resolverItem(item.id, destino)
    mostrarAviso(destino === 'lixo' ? t('caixa.foiLixo') : t('caixa.resolvido'), () => desfazerResolucao(item.id))
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {itens.map((item) => (
          // o texto ocupa pelo menos 14rem; sem esse espaço (tela estreita ou dentro do ritual), os botões descem
          <li key={item.id} className="cartao flex flex-wrap items-center gap-3 bg-papel p-4">
            <div className="min-w-0 flex-1 basis-56">
              <p className="text-lg font-semibold break-words">{item.texto}</p>
              <p className="text-xs text-tinta-suave">{tempoRelativo(item.criadoEm, i18n.language)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Botao className="min-h-10 px-4 text-sm" onClick={() => setVirando(item)}>
                {t('caixa.virarTarefa')}
              </Botao>
              <Botao variante="secundario" tom="bg-manteiga" className="min-h-10 px-4 text-sm" onClick={() => setVirandoEvento(item)}>
                {t('caixa.virarEvento')}
              </Botao>
              {areasHabito.length > 0 && (
                <Botao variante="secundario" tom="bg-pessego" className="min-h-10 px-4 text-sm" onClick={() => setVirandoHabito(item)}>
                  {t('caixa.virarHabito')}
                </Botao>
              )}
              <Botao variante="secundario" tom="bg-menta" className="min-h-10 px-4 text-sm" onClick={() => resolver(item, 'feito')}>
                ✓ {t('caixa.jaResolvi')}
              </Botao>
              <Botao variante="contorno" className="min-h-10 px-4 text-sm" onClick={() => resolver(item, 'lixo')}>
                {t('caixa.lixo')}
              </Botao>
            </div>
          </li>
        ))}
      </ul>

      {virandoHabito && (
        <EditorHabito
          habito={novoHabito({ area: areasHabito[0], adesivo: AREAS[areasHabito[0]].adesivo, titulo: virandoHabito.texto })}
          novo
          areas={areasHabito}
          fechar={() => setVirandoHabito(null)}
          aoSalvar={async () => {
            await resolverItem(virandoHabito.id, 'habito')
            mostrarAviso(t('caixa.virouHabito'))
          }}
        />
      )}

      {virandoEvento && (
        <EditorEvento
          evento={(() => {
            const amanha9 = new Date()
            amanha9.setDate(amanha9.getDate() + 1)
            amanha9.setHours(9, 0, 0, 0)
            return novoEvento(amanha9, virandoEvento.texto)
          })()}
          novo
          fechar={() => setVirandoEvento(null)}
          aoSalvar={async () => {
            await resolverItem(virandoEvento.id, 'evento')
            mostrarAviso(t('editorEvento.virouEvento'))
          }}
        />
      )}

      {virando && (
        <EditorTarefa
          tarefa={novaTarefa(virando.texto)}
          nova
          fechar={() => setVirando(null)}
          aoSalvar={async () => {
            await resolverItem(virando.id, 'tarefa')
            mostrarAviso(t('caixa.virouTarefa'))
          }}
        />
      )}
    </>
  )
}
