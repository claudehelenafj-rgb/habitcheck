// Fotos de antes e depois do quarto: botão para tirar ou escolher a foto e a foto colada com fita.

import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFoto } from '../dados/quarto'
import { reduzirFoto } from '../fotos'
import { Botao } from './Botao'
import { FotoComFita } from './Enfeites'

/** Abre a câmera (no iPad e no celular) ou a escolha de arquivo; entrega a foto já reduzida. */
export function EscolherFoto({ rotulo, aoEscolher }: { rotulo: string; aoEscolher: (dataUrl: string) => Promise<void> | void }) {
  const { t } = useTranslation()
  const ref = useRef<HTMLInputElement>(null)
  const [erro, setErro] = useState(false)
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={async (e) => {
          const arquivo = e.target.files?.[0]
          e.target.value = ''
          if (!arquivo) return
          try {
            setErro(false)
            await aoEscolher(await reduzirFoto(arquivo))
          } catch {
            setErro(true)
          }
        }}
      />
      <Botao variante="contorno" className="min-h-10 px-4 text-sm" onClick={() => ref.current?.click()}>
        {rotulo}
      </Botao>
      {erro && <p role="alert" className="text-sm font-semibold">{t('quarto.fotoErro')}</p>}
    </>
  )
}

/** Foto guardada, colada com fita e etiqueta ("Antes", "Depois"). */
export function FotoGuardada({ id, etiqueta, descricao, inclinacao }: { id: string; etiqueta: string; descricao: string; inclinacao: number }) {
  const foto = useFoto(id)
  if (!foto) return null
  return (
    <FotoComFita etiqueta={etiqueta} inclinacao={inclinacao}>
      <img src={foto.dataUrl} alt={descricao} className="h-full w-full object-cover" />
    </FotoComFita>
  )
}
