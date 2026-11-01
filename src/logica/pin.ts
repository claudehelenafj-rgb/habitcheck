// PIN da aba Bem-estar. Guarda só um resumo do PIN (PBKDF2 com sal), nunca os números.
// Protege contra olhares curiosos de quem pega o aparelho; não criptografa os dados guardados.

export type PinSalvo = { sal: string; hash: string }

export const ITERACOES = 100_000
export const TENTATIVAS_ANTES_DE_ESPERAR = 5
export const ESPERA_SEGUNDOS = 30

export function pinValido(pin: string): boolean {
  return /^\d{4,6}$/.test(pin)
}

const hex = (bytes: ArrayBuffer | Uint8Array) => [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('')
const deHex = (texto: string) => new Uint8Array(texto.match(/../g)!.map((h) => parseInt(h, 16)))

async function resumo(pin: string, sal: Uint8Array<ArrayBuffer>): Promise<string> {
  const chave = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: sal, iterations: ITERACOES }, chave, 256)
  return hex(bits)
}

export async function criarPin(pin: string): Promise<PinSalvo> {
  if (!pinValido(pin)) throw new Error('O PIN precisa ter de 4 a 6 números')
  const sal = crypto.getRandomValues(new Uint8Array(16))
  return { sal: hex(sal), hash: await resumo(pin, sal) }
}

export async function conferirPin(pin: string, salvo: PinSalvo): Promise<boolean> {
  if (!pinValido(pin)) return false
  return (await resumo(pin, deHex(salvo.sal))) === salvo.hash
}

/** Segundos que faltam para poder tentar de novo (0 = pode tentar). */
export function esperaRestante(erros: number, ultimoErro: number | undefined, agora: number): number {
  if (erros < TENTATIVAS_ANTES_DE_ESPERAR || ultimoErro === undefined) return 0
  return Math.max(0, Math.ceil(ESPERA_SEGUNDOS - (agora - ultimoErro) / 1000))
}
