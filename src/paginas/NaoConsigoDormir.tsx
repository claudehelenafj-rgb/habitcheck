// "Não consigo dormir": a tela mais calma do app. Escura em qualquer tema, sem animação e sem relógio
// (olhar a hora piora). Traz a regra dos ~20 minutos da terapia para insônia, uma respiração lenta
// escrita (sem nada se mexendo) e um lugar para tirar a preocupação da cabeça até amanhã.

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { capturar } from '../dados/tarefas'

// Cores fixas, baixas e quentes: não dependem do tema nem do modo claro.
const FUNDO = '#120e16'
const TEXTO = '#b3a8bf' // 8,3:1 sobre o fundo: legível sem acender a tela

export function NaoConsigoDormir() {
  const { t } = useTranslation()
  const titulo = useRef<HTMLHeadingElement>(null)
  const [texto, setTexto] = useState('')
  const [guardado, setGuardado] = useState(false)

  useEffect(() => {
    titulo.current?.focus()
    const meta = document.querySelector('meta[name="theme-color"]')
    const antes = meta?.getAttribute('content')
    meta?.setAttribute('content', FUNDO)
    document.documentElement.dataset.telaNoite = 'sim'
    return () => {
      if (antes) meta?.setAttribute('content', antes)
      delete document.documentElement.dataset.telaNoite
    }
  }, [])

  return (
    <div className="min-h-screen px-5 py-10" style={{ background: FUNDO, color: TEXTO }}>
      <main className="mx-auto flex max-w-xl flex-col gap-8 text-lg leading-relaxed">
        <h1 ref={titulo} tabIndex={-1} className="text-3xl font-semibold outline-none">
          {t('naoDormir.titulo')}
        </h1>
        <p>{t('naoDormir.intro')}</p>
        <ol className="flex list-decimal flex-col gap-3 pl-6">
          <li>{t('naoDormir.passo1')}</li>
          <li>{t('naoDormir.passo2')}</li>
          <li>{t('naoDormir.passo3')}</li>
          <li>{t('naoDormir.passo4')}</li>
        </ol>

        <section aria-labelledby="titulo-respirar" className="flex flex-col gap-2">
          <h2 id="titulo-respirar" className="text-xl font-semibold">
            {t('naoDormir.respirarTitulo')}
          </h2>
          <p>{t('naoDormir.respirar')}</p>
        </section>

        <section aria-labelledby="titulo-cabeca" className="flex flex-col gap-3">
          <h2 id="titulo-cabeca" className="text-xl font-semibold">
            {t('naoDormir.cabecaTitulo')}
          </h2>
          {guardado ? (
            <p role="status">{t('naoDormir.guardado')}</p>
          ) : (
            <form
              className="flex flex-col gap-3"
              onSubmit={async (e) => {
                e.preventDefault()
                if (!texto.trim()) return
                await capturar([texto.trim()])
                setGuardado(true)
              }}
            >
              <label className="flex flex-col gap-1">
                <span>{t('naoDormir.cabecaTexto')}</span>
                <textarea
                  rows={3}
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  className="rounded-2xl border-2 px-4 py-2 text-base"
                  style={{ background: '#1b1621', borderColor: '#7d7189', color: TEXTO }}
                />
              </label>
              <button
                type="submit"
                disabled={!texto.trim()}
                className="min-h-11 self-start rounded-full border-2 px-5 font-bold disabled:opacity-50"
                style={{ borderColor: TEXTO, color: TEXTO }}
              >
                {t('naoDormir.guardar')}
              </button>
            </form>
          )}
        </section>

        <Link to="/bem-estar" className="self-start font-bold underline decoration-2 underline-offset-4">
          ← {t('naoDormir.voltar')}
        </Link>
      </main>
    </div>
  )
}
