// Caixa de entrada: tudo o que foi despejado na captura rápida, esperando uma decisão.

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Adesivo } from '../componentes/Adesivo'
import { mostrarAviso } from '../componentes/Avisos'
import { Botao } from '../componentes/Botao'
import { abrirCaptura, ATALHO_CAPTURA } from '../componentes/Captura'
import { EditorEvento } from '../componentes/EditorEvento'
import { EditorTarefa } from '../componentes/EditorTarefa'
import { novoEvento } from '../dados/eventos'
import type { ItemCaixa } from '../dados/banco'
import { desfazerResolucao, novaTarefa, resolverItem, useCaixaAberta } from '../dados/tarefas'

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

export function Caixa() {
  const { t, i18n } = useTranslation()
  const itens = useCaixaAberta()
  const [virando, setVirando] = useState<ItemCaixa | null>(null)
  const [virandoEvento, setVirandoEvento] = useState<ItemCaixa | null>(null)
  if (!itens) return null

  async function resolver(item: ItemCaixa, destino: 'feito' | 'lixo') {
    await resolverItem(item.id, destino)
    mostrarAviso(destino === 'lixo' ? t('caixa.foiLixo') : t('caixa.resolvido'), () => desfazerResolucao(item.id))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 tabIndex={-1} className="flex flex-1 items-center gap-3 text-4xl font-semibold outline-none sm:text-5xl">
          <Adesivo nome="envelope" tamanho={56} />
          {t('caixa.titulo')}
        </h1>
        <Botao onClick={abrirCaptura} atalho={ATALHO_CAPTURA} icone={<span aria-hidden="true">+</span>}>
          {t('captura.botao')}
        </Botao>
      </div>
      <p className="max-w-prose">{t('caixa.texto')}</p>

      {itens.length === 0 ? (
        <div className="cartao flex flex-col items-center gap-3 bg-papel p-8 text-center">
          <div aria-hidden="true" className="decor estampa estampa-atual h-6 w-full rounded-full border-2 border-linha bg-papel" />
          <Adesivo nome="sapinho" tamanho={72} />
          <p className="text-2xl font-semibold">{t('caixa.vazia')}</p>
          <p className="max-w-prose text-sm">{t('caixa.vaziaDica')}</p>
        </div>
      ) : (
        <>
          <p className="rotulo" aria-live="polite">
            {t('caixa.contagem', { count: itens.length })}
          </p>
          <ul className="flex flex-col gap-3">
            {itens.map((item) => (
              <li key={item.id} className="cartao flex flex-col gap-3 bg-papel p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
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
          <p className="text-sm text-tinta-suave">{t('caixa.emBreve')}</p>
        </>
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
    </div>
  )
}
