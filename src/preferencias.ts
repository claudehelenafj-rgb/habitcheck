// Preferências de aparência e idioma.
// A fonte da verdade é o banco local (tabela configuracoes). Uma cópia fica no localStorage
// só para o app abrir já com o tema certo, sem piscar, antes de o banco responder.

import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useEffect, useMemo } from 'react'
import { banco } from './dados/banco'
import { mudarIdioma, type Idioma } from './i18n'

export const ESTAMPAS = [
  'bolinhas',
  'xadrez',
  'listras',
  'coracoes',
  'cerejas',
  'estrelas',
  'flores',
  'ondas',
  'caderno',
  'confete',
  'oncinha',
  'patinhas',
  'rabiscos',
  'xadrez-mao',
] as const
export type Estampa = (typeof ESTAMPAS)[number]

export type Preferencias = {
  modo: 'auto' | 'claro' | 'escuro'
  tema: 'creme' | 'cereja' | 'piscina' | 'pessego' | 'indigo'
  decoracao: 'doce' | 'neutra'
  estampa: Estampa
  calmo: boolean
  animacoes: boolean
  fonte: 'padrao' | 'legivel'
  tamanho: 'normal' | 'grande' | 'maior' | 'enorme'
  idioma: Idioma
}

export const PADRAO: Preferencias = {
  modo: 'auto',
  tema: 'creme',
  decoracao: 'doce',
  estampa: 'bolinhas',
  calmo: false,
  animacoes: true,
  fonte: 'padrao',
  tamanho: 'normal',
  idioma: 'pt-BR',
}

const CHAVE_ESPELHO = 'caderninho:preferencias'
const CHAVE_BANCO = 'preferencias'

/** Lê a cópia rápida do localStorage (pode não existir, por exemplo numa janela anônima). */
export function carregar(): Preferencias {
  try {
    const salvo = localStorage.getItem(CHAVE_ESPELHO)
    return salvo ? { ...PADRAO, ...JSON.parse(salvo) } : PADRAO
  } catch {
    return PADRAO
  }
}

function espelhar(p: Preferencias) {
  try {
    localStorage.setItem(CHAVE_ESPELHO, JSON.stringify(p))
  } catch {
    // sem armazenamento rápido: o app só pode piscar um instante ao abrir
  }
}

export function aplicar(p: Preferencias) {
  const raiz = document.documentElement
  // No modo automático, respeita o tema escolhido pela página que hospeda o app (data-theme), se houver.
  const temaHospedeiro = raiz.getAttribute('data-theme')
  const sistemaEscuro = temaHospedeiro ? temaHospedeiro === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches
  const escuro = p.modo === 'escuro' || (p.modo === 'auto' && sistemaEscuro)
  raiz.dataset.modo = escuro ? 'escuro' : 'claro'
  raiz.dataset.tema = p.tema
  raiz.dataset.decoracao = p.decoracao
  raiz.dataset.estampa = p.estampa
  raiz.dataset.calmo = p.calmo ? 'sim' : 'nao'
  raiz.dataset.animacoes = p.animacoes ? 'sim' : 'nao'
  raiz.dataset.fonte = p.fonte
  raiz.dataset.tamanho = p.tamanho
  const corBarra = p.tema === 'indigo' ? (escuro ? '#1E2350' : '#F3F2EE') : escuro ? '#521429' : '#FBF6EE'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', corBarra)
}

/** Preferências atuais e uma função para mudar algumas delas. */
export function usePreferencias(): [Preferencias, (mudanca: Partial<Preferencias>) => void] {
  // null = banco respondeu e não há nada salvo; undefined = ainda carregando
  const salvo = useLiveQuery(async () => (await banco.configuracoes.get(CHAVE_BANCO)) ?? null, [])
  const prefs = useMemo<Preferencias>(() => {
    if (salvo === undefined) return carregar()
    return { ...PADRAO, ...((salvo?.valor as Partial<Preferencias>) ?? {}) }
  }, [salvo])

  const mudar = useCallback(
    (mudanca: Partial<Preferencias>) => {
      const novas = { ...prefs, ...mudanca }
      aplicar(novas)
      espelhar(novas)
      banco.configuracoes.put({ chave: CHAVE_BANCO, valor: novas })
    },
    [prefs],
  )
  return [prefs, mudar]
}

/** Aplica as preferências na página e devolve as atuais. Usar uma vez só, na raiz do app. */
export function useAplicarPreferencias(): Preferencias {
  const [prefs] = usePreferencias()
  useEffect(() => {
    aplicar(prefs)
    espelhar(prefs)
    mudarIdioma(prefs.idioma)
    if (prefs.modo !== 'auto') return
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const ouvir = () => aplicar(prefs)
    mq.addEventListener('change', ouvir)
    return () => mq.removeEventListener('change', ouvir)
  }, [prefs])
  return prefs
}
