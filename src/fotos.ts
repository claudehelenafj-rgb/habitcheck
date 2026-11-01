// Fotos do quarto: reduzidas no próprio aparelho (lado maior até 1024 px, JPEG) antes de guardar,
// para não pesar no banco local nem no backup. Nada sai do aparelho.

import { tamanhoReduzido } from './logica/quarto'

async function carregar(arquivo: File): Promise<CanvasImageSource & { width: number; height: number }> {
  if ('createImageBitmap' in window) return createImageBitmap(arquivo)
  const url = URL.createObjectURL(arquivo)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function reduzirFoto(arquivo: File, max = 1024): Promise<string> {
  const imagem = await carregar(arquivo)
  const { largura, altura } = tamanhoReduzido(imagem.width, imagem.height, max)
  const tela = document.createElement('canvas')
  tela.width = largura
  tela.height = altura
  tela.getContext('2d')!.drawImage(imagem, 0, 0, largura, altura)
  return tela.toDataURL('image/jpeg', 0.75)
}
