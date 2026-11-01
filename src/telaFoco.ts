// Recursos do aparelho para o modo foco: sino suave (feito na hora com Web Audio, sem arquivo de som),
// tela cheia e tela acesa enquanto o tempo corre. Tudo opcional: onde o aparelho não tem, nada quebra.

import { useEffect, useState } from 'react'

let contexto: AudioContext | undefined

/** Chamar num clique (o navegador só libera som depois de um toque da pessoa). */
export function prepararSom() {
  try {
    contexto ??= new AudioContext()
    if (contexto.state === 'suspended') void contexto.resume()
  } catch {
    // sem Web Audio
  }
}

/** Duas notas baixas e curtas, sem susto. */
export function tocarSino() {
  try {
    prepararSom()
    if (!contexto) return
    const agora = contexto.currentTime
    ;[660, 880].forEach((frequencia, i) => {
      const nota = contexto!.createOscillator()
      const volume = contexto!.createGain()
      nota.type = 'sine'
      nota.frequency.value = frequencia
      const inicio = agora + i * 0.35
      volume.gain.setValueAtTime(0, inicio)
      volume.gain.linearRampToValueAtTime(0.16, inicio + 0.02)
      volume.gain.exponentialRampToValueAtTime(0.001, inicio + 1.2)
      nota.connect(volume).connect(contexto!.destination)
      nota.start(inicio)
      nota.stop(inicio + 1.3)
    })
  } catch {
    // sem som neste aparelho
  }
}

type DocumentoWebkit = Document & { webkitFullscreenEnabled?: boolean; webkitFullscreenElement?: Element; webkitExitFullscreen?: () => void }
type ElementoWebkit = HTMLElement & { webkitRequestFullscreen?: () => void }

export function podeTelaCheia(): boolean {
  const d = document as DocumentoWebkit
  return !!(d.fullscreenEnabled || d.webkitFullscreenEnabled)
}

const emTelaCheia = () => !!(document.fullscreenElement || (document as DocumentoWebkit).webkitFullscreenElement)

export async function entrarTelaCheia() {
  const el = document.documentElement as ElementoWebkit
  try {
    if (el.requestFullscreen) await el.requestFullscreen()
    else el.webkitRequestFullscreen?.()
  } catch {
    // recusado: segue na janela normal
  }
}

export function sairTelaCheia() {
  if (!emTelaCheia()) return
  const d = document as DocumentoWebkit
  if (d.exitFullscreen) d.exitFullscreen().catch(() => {})
  else d.webkitExitFullscreen?.()
}

export function useTelaCheia(): boolean {
  const [ligada, setLigada] = useState(emTelaCheia)
  useEffect(() => {
    const mudou = () => setLigada(emTelaCheia())
    document.addEventListener('fullscreenchange', mudou)
    document.addEventListener('webkitfullscreenchange', mudou)
    return () => {
      document.removeEventListener('fullscreenchange', mudou)
      document.removeEventListener('webkitfullscreenchange', mudou)
    }
  }, [])
  return ligada
}

/** Mantém a tela acesa (o timer visual some se o iPad apagar a tela). Volta a pedir ao voltar para o app. */
export function useTelaAcesa(ativo: boolean) {
  useEffect(() => {
    if (!ativo || !('wakeLock' in navigator)) return
    let trava: WakeLockSentinel | undefined
    let vivo = true
    const pedir = async () => {
      try {
        const nova = await navigator.wakeLock.request('screen')
        if (vivo) trava = nova
        else void nova.release()
      } catch {
        // bateria fraca ou recusado
      }
    }
    const aoVoltar = () => {
      if (document.visibilityState === 'visible') void pedir()
    }
    void pedir()
    document.addEventListener('visibilitychange', aoVoltar)
    return () => {
      vivo = false
      document.removeEventListener('visibilitychange', aoVoltar)
      void trava?.release()
    }
  }, [ativo])
}
