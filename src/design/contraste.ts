// Cálculo de contraste WCAG 2.x entre duas cores hexadecimais.

function canal(valor: number): number {
  const c = valor / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

export function luminancia(hex: string): number {
  const limpo = hex.replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(limpo)) throw new Error(`Cor inválida: ${hex}`)
  const [r, g, b] = [0, 2, 4].map((i) => canal(parseInt(limpo.slice(i, i + 2), 16)))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contraste(a: string, b: string): number {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x)
  return (claro + 0.05) / (escuro + 0.05)
}

// Mínimos WCAG AA
export const MINIMO_TEXTO = 4.5
export const MINIMO_TEXTO_GRANDE = 3
export const MINIMO_ICONE = 3
