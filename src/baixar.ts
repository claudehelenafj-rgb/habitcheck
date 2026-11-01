/** Entrega um arquivo para a pessoa salvar (backup, .ics...). */
export function baixarArquivo(nome: string, conteudo: string, tipo: string) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }))
  const link = Object.assign(document.createElement('a'), { href: url, download: nome })
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
