// Leitor mínimo de .zip (o Google Agenda exporta os calendários num .zip de arquivos .ics).
// Usa o descompressor do próprio navegador; não precisa de biblioteca.

export type ArquivoZip = { nome: string; conteudo: Uint8Array }

async function inflar(dados: Uint8Array): Promise<Uint8Array> {
  const fluxo = new Blob([dados as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(fluxo).arrayBuffer())
}

export function ehZip(dados: Uint8Array): boolean {
  return dados.length > 4 && dados[0] === 0x50 && dados[1] === 0x4b && dados[2] === 0x03 && dados[3] === 0x04
}

/** Lê os arquivos do .zip pelo diretório central (funciona também com zips que usam "data descriptor"). */
export async function lerZip(dados: Uint8Array): Promise<ArquivoZip[]> {
  const v = new DataView(dados.buffer, dados.byteOffset, dados.byteLength)
  let fimDir = -1
  for (let i = dados.length - 22; i >= Math.max(0, dados.length - 66_000); i--) {
    if (v.getUint32(i, true) === 0x06054b50) {
      fimDir = i
      break
    }
  }
  if (fimDir < 0) throw new Error('Arquivo .zip inválido.')
  const total = v.getUint16(fimDir + 10, true)
  let p = v.getUint32(fimDir + 16, true)
  const arquivos: ArquivoZip[] = []
  const texto = new TextDecoder()
  for (let n = 0; n < total; n++) {
    if (v.getUint32(p, true) !== 0x02014b50) throw new Error('Arquivo .zip inválido.')
    const metodo = v.getUint16(p + 10, true)
    const tamanhoComprimido = v.getUint32(p + 20, true)
    const tamNome = v.getUint16(p + 28, true)
    const tamExtra = v.getUint16(p + 30, true)
    const tamComentario = v.getUint16(p + 32, true)
    const deslocLocal = v.getUint32(p + 42, true)
    const nome = texto.decode(dados.subarray(p + 46, p + 46 + tamNome))
    p += 46 + tamNome + tamExtra + tamComentario
    if (nome.endsWith('/')) continue
    const inicioDados = deslocLocal + 30 + v.getUint16(deslocLocal + 26, true) + v.getUint16(deslocLocal + 28, true)
    const bruto = dados.subarray(inicioDados, inicioDados + tamanhoComprimido)
    if (metodo === 0) arquivos.push({ nome, conteudo: bruto })
    else if (metodo === 8) arquivos.push({ nome, conteudo: await inflar(bruto) })
  }
  return arquivos
}
