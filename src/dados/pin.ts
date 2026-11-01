// PIN da aba Bem-estar, guardado como resumo (ver logica/pin.ts) na tabela configuracoes, chave "bemEstarPin".

import { useLiveQuery } from 'dexie-react-hooks'
import { conferirPin, criarPin, type PinSalvo } from '../logica/pin'
import { banco } from './banco'

const CHAVE = 'bemEstarPin'

async function lerPin(): Promise<PinSalvo | undefined> {
  return (await banco.configuracoes.get(CHAVE))?.valor as PinSalvo | undefined
}

/** true = há PIN; false = não há; undefined = carregando */
export function usePinConfigurado(): boolean | undefined {
  return useLiveQuery(async () => !!(await lerPin()), [])
}

export async function temPin(): Promise<boolean> {
  return !!(await lerPin())
}

export async function definirPin(pin: string) {
  await banco.configuracoes.put({ chave: CHAVE, valor: await criarPin(pin) })
}

export async function tirarPin() {
  await banco.configuracoes.delete(CHAVE)
}

export async function pinConfere(pin: string): Promise<boolean> {
  const salvo = await lerPin()
  return !!salvo && (await conferirPin(pin, salvo))
}
