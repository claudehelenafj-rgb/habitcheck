// Lê o texto de um PDF no próprio aparelho, com o pdf.js. Ele só é carregado quando a pessoa escolhe um PDF
// e fica guardado com o resto do app, para funcionar sem internet. Nada é enviado para fora.

type PedacoDeTexto = { str: string; transform: number[]; width: number }

/** Pedaços com até esta diferença de altura (em pontos) estão na mesma linha. */
const MESMA_LINHA = 2.5
/** Um espaço maior que este entre dois pedaços (coluna de tabela) vira " — ". */
const ESPACO_DE_COLUNA = 24

/** Linhas de texto do PDF, de cima para baixo e da esquerda para a direita. PDF só com imagem: nenhuma linha. */
export async function linhasDoPdf(dados: ArrayBuffer): Promise<string[]> {
  const [pdfjs, { default: trabalhador }] = await Promise.all([
    import('pdfjs-dist/legacy/build/pdf.mjs'),
    import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'),
  ])
  pdfjs.GlobalWorkerOptions.workerSrc = trabalhador
  // cópia: o pdf.js toma conta dos bytes que recebe
  const tarefa = pdfjs.getDocument({ data: new Uint8Array(dados.slice(0)) })
  const linhas: string[] = []
  try {
    const doc = await tarefa.promise
    for (let i = 1; i <= doc.numPages; i++) {
      const pagina = await doc.getPage(i)
      const pedacos = ((await pagina.getTextContent()).items as PedacoDeTexto[])
        .filter((p) => 'str' in p && p.str.trim())
        .sort((a, b) => b.transform[5] - a.transform[5])
      // agrupa pela altura; dentro da linha, da esquerda para a direita
      const grupos: PedacoDeTexto[][] = []
      for (const p of pedacos) {
        const grupo = grupos.at(-1)
        if (grupo && Math.abs(grupo[0].transform[5] - p.transform[5]) <= MESMA_LINHA) grupo.push(p)
        else grupos.push([p])
      }
      for (const grupo of grupos) {
        grupo.sort((a, b) => a.transform[4] - b.transform[4])
        let texto = ''
        let fim = -Infinity
        for (const p of grupo) {
          const espaco = p.transform[4] - fim
          texto += texto ? (espaco > ESPACO_DE_COLUNA ? ' — ' : espaco > 1 ? ' ' : '') : ''
          texto += p.str
          fim = p.transform[4] + p.width
        }
        linhas.push(texto.replace(/\s+/g, ' ').trim())
      }
    }
  } finally {
    await tarefa.destroy()
  }
  return linhas
}

/** O arquivo como data URL, para guardar no banco local (e entrar no backup). */
export function comoDataUrl(arquivo: Blob): Promise<string> {
  return new Promise((ok, erro) => {
    const leitor = new FileReader()
    leitor.onload = () => ok(leitor.result as string)
    leitor.onerror = () => erro(leitor.error)
    leitor.readAsDataURL(arquivo)
  })
}
