// Janelinha flutuante (o "widget" do Mac).
// Chrome e Edge: Document Picture-in-Picture, uma janela que fica por cima de todas as outras.
// Safari e outros: abre o app em #/mini numa janela pequena.

import { createElement } from 'react'
import { createRoot } from 'react-dom/client'

type DocumentPiP = { requestWindow: (opcoes: { width: number; height: number }) => Promise<Window> }

export function temJanelaPorCima(): boolean {
  return 'documentPictureInPicture' in window
}

/** Copia estilos, fontes e tema da página para a janelinha. */
function copiarAparencia(destino: Document) {
  for (const el of document.querySelectorAll<HTMLLinkElement | HTMLStyleElement>('link[rel="stylesheet"], style')) {
    if (el instanceof HTMLLinkElement) {
      const link = destino.createElement('link')
      link.rel = 'stylesheet'
      link.href = el.href // endereço completo: funciona dentro da janelinha
      destino.head.append(link)
    } else {
      const estilo = destino.createElement('style')
      estilo.textContent = el.textContent
      destino.head.append(estilo)
    }
  }
  const raiz = document.documentElement
  Object.assign(destino.documentElement.dataset, raiz.dataset)
  destino.documentElement.lang = raiz.lang
}

export async function abrirJanelinha() {
  if (temJanelaPorCima()) {
    const pip = (window as unknown as { documentPictureInPicture: DocumentPiP }).documentPictureInPicture
    const janela = await pip.requestWindow({ width: 360, height: 480 })
    copiarAparencia(janela.document)
    // o tema muda na página principal? a janelinha acompanha
    const observador = new MutationObserver(() => Object.assign(janela.document.documentElement.dataset, document.documentElement.dataset))
    observador.observe(document.documentElement, { attributes: true })
    janela.addEventListener('pagehide', () => observador.disconnect())
    const alvo = janela.document.createElement('div')
    janela.document.body.append(alvo)
    const { Mini } = await import('./paginas/Mini')
    createRoot(alvo).render(createElement(Mini, { janelaPorCima: true }))
    return
  }
  const endereco = new URL('#/mini', location.href).href
  window.open(endereco, 'caderninho-mini', 'popup,width=380,height=560')
}
