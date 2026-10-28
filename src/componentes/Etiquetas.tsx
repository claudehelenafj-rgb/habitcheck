// Escolha de etiquetas (uma ou várias) a partir de uma lista que a pessoa edita:
// acrescentar uma nova, tirar uma da lista. Usado nos sinais do corpo, sintomas, porquês e "o que ajudou".

import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { atualizarBemEstar, useBemEstar, type ListaEtiquetas } from '../dados/bemEstar'
import { etiqueta } from '../logica/sintomas'
import { Botao } from './Botao'

type Props = {
  legenda: string
  /** campo da configuração onde a lista fica guardada */
  lista: ListaEtiquetas
  inicial: string[]
  escolhidos: string[]
  mudar: (escolhidos: string[]) => void
  /** só uma etiqueta por vez (ex.: qual sintoma) */
  uma?: boolean
  /** legenda escondida (quando já há um título visível acima) */
  legendaEscondida?: boolean
}

export function Etiquetas({ legenda, lista, inicial, escolhidos, mudar, uma = false, legendaEscondida = false }: Props) {
  const { t } = useTranslation()
  const config = useBemEstar()
  const idNovo = useId()
  const [editando, setEditando] = useState(false)
  const [novo, setNovo] = useState('')
  const itens = config?.[lista] ?? inicial
  const alternar = (s: string) =>
    mudar(escolhidos.includes(s) ? escolhidos.filter((x) => x !== s) : uma ? [s] : [...escolhidos, s])
  function acrescentar() {
    const s = etiqueta(novo)
    if (!s) return
    if (!itens.includes(s)) atualizarBemEstar({ [lista]: [...itens, s] })
    if (!escolhidos.includes(s)) mudar(uma ? [s] : [...escolhidos, s])
    setNovo('')
  }
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className={legendaEscondida ? 'so-leitor' : 'mb-1 font-bold'}>{legenda}</legend>
      <ul className="flex flex-wrap gap-2">
        {itens.map((s) => (
          <li key={s} className="flex items-center">
            <button
              type="button"
              aria-pressed={escolhidos.includes(s)}
              onClick={() => alternar(s)}
              className={`min-h-9 rounded-full border-2 border-linha px-3 text-sm font-semibold ${
                escolhidos.includes(s) ? 'bg-lilas' : 'bg-papel'
              }`}
            >
              {escolhidos.includes(s) && '✓ '}
              {s}
            </button>
            {editando && (
              <button
                type="button"
                onClick={() => {
                  atualizarBemEstar({ [lista]: itens.filter((x) => x !== s) })
                  mudar(escolhidos.filter((x) => x !== s))
                }}
                aria-label={t('etiquetas.tirar', { nome: s })}
                className="ml-1 grid h-8 w-8 place-items-center rounded-full border-2 border-linha bg-papel font-bold"
              >
                ×
              </button>
            )}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={idNovo} className="so-leitor">
          {t('etiquetas.outra', { legenda })}
        </label>
        <input
          id={idNovo}
          value={novo}
          onChange={(e) => setNovo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              acrescentar()
            }
          }}
          maxLength={40}
          placeholder={t('etiquetas.outraCurta')}
          className="min-h-10 min-w-0 flex-1 basis-40 rounded-full border-2 border-linha bg-papel px-4"
        />
        <Botao variante="contorno" onClick={acrescentar}>
          + {t('etiquetas.acrescentar')}
        </Botao>
        <Botao variante="contorno" onClick={() => setEditando((e) => !e)} aria-pressed={editando}>
          {editando ? t('etiquetas.pronto') : t('etiquetas.editar')}
        </Botao>
      </div>
    </fieldset>
  )
}
