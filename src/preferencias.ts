// Preferências visuais. Por enquanto ficam no navegador (localStorage);
// na etapa 2 passam para o banco local junto com o resto dos dados.

export type Preferencias = {
  modo: 'auto' | 'claro' | 'escuro'
  tema: 'creme' | 'cereja' | 'piscina' | 'pessego'
  estampa: Estampa
  calmo: boolean
  animacoes: boolean
  fonte: 'padrao' | 'legivel'
  tamanho: 'normal' | 'grande' | 'maior' | 'enorme'
}

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
] as const
export type Estampa = (typeof ESTAMPAS)[number]

export const PADRAO: Preferencias = {
  modo: 'auto',
  tema: 'creme',
  estampa: 'bolinhas',
  calmo: false,
  animacoes: true,
  fonte: 'padrao',
  tamanho: 'normal',
}

const CHAVE = 'caderninho:preferencias'

export function carregar(): Preferencias {
  try {
    const salvo = localStorage.getItem(CHAVE)
    return salvo ? { ...PADRAO, ...JSON.parse(salvo) } : PADRAO
  } catch {
    return PADRAO
  }
}

export function salvar(p: Preferencias) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(p))
  } catch {
    // sem armazenamento (janela anônima etc.): segue só nesta visita
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
  raiz.dataset.estampa = p.estampa
  raiz.dataset.calmo = p.calmo ? 'sim' : 'nao'
  raiz.dataset.animacoes = p.animacoes ? 'sim' : 'nao'
  raiz.dataset.fonte = p.fonte
  raiz.dataset.tamanho = p.tamanho
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', escuro ? '#422F0E' : '#FBF6EE')
}
