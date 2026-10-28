// Ajustes: aparência, idioma, instalação, dados (backup, restaurar, apagar) e sobre.

import { useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Adesivo, type NomeAdesivo } from '../componentes/Adesivo'
import { Botao } from '../componentes/Botao'
import { Opcoes, PainelAparencia } from '../componentes/PainelAparencia'
import { banco } from '../dados/banco'
import { apagarTudo, BackupInvalido, exportarTudo, importarTudo, lerBackup, nomeArquivoBackup } from '../dados/backup'
import { IDIOMAS } from '../i18n'
import { estaInstalado, instalar, usePodeInstalar } from '../instalacao'
import { usePreferencias } from '../preferencias'

function Bloco({ id, titulo, adesivo, children }: { id: string; titulo: string; adesivo: NomeAdesivo; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="flex items-center gap-2 text-2xl font-semibold">
        <Adesivo nome={adesivo} tamanho={34} />
        {titulo}
      </h2>
      {children}
    </section>
  )
}

type Confirmando = 'importar' | 'apagar' | null
type Mensagem = { tipo: 'ok' | 'erro'; texto: string } | null

function SeusDados() {
  const { t } = useTranslation()
  const [confirmando, setConfirmando] = useState<Confirmando>(null)
  const [mensagem, setMensagem] = useState<Mensagem>(null)
  const [arquivoEscolhido, setArquivoEscolhido] = useState<string | null>(null)
  const seletor = useRef<HTMLInputElement>(null)

  const erro = (e: unknown) =>
    setMensagem({ tipo: 'erro', texto: t('ajustes.erro', { mensagem: e instanceof Error ? e.message : String(e) }) })

  async function baixar() {
    try {
      const backup = await exportarTudo(banco)
      const arquivo = nomeArquivoBackup()
      const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }))
      const link = Object.assign(document.createElement('a'), { href: url, download: arquivo })
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
      setMensagem({ tipo: 'ok', texto: t('ajustes.exportado', { arquivo }) })
    } catch (e) {
      erro(e)
    }
  }

  async function aoEscolherArquivo(arquivo: File | undefined) {
    if (!arquivo) return
    try {
      const texto = await arquivo.text()
      lerBackup(texto) // confere antes de pedir confirmação
      setArquivoEscolhido(texto)
      setConfirmando('importar')
      setMensagem(null)
    } catch (e) {
      erro(e instanceof BackupInvalido ? e : new Error(String(e)))
    } finally {
      if (seletor.current) seletor.current.value = ''
    }
  }

  async function confirmar() {
    try {
      if (confirmando === 'importar' && arquivoEscolhido) {
        await importarTudo(banco, lerBackup(arquivoEscolhido))
        setMensagem({ tipo: 'ok', texto: t('ajustes.importado') })
      } else if (confirmando === 'apagar') {
        await apagarTudo(banco)
        setMensagem({ tipo: 'ok', texto: t('ajustes.apagado') })
      }
    } catch (e) {
      erro(e)
    } finally {
      setConfirmando(null)
      setArquivoEscolhido(null)
    }
  }

  return (
    <div className="cartao flex flex-col gap-4 bg-papel p-5">
      <p className="max-w-prose">{t('ajustes.dadosTexto')}</p>
      <div className="flex flex-wrap gap-2">
        <Botao onClick={baixar} icone={<span aria-hidden="true">↓</span>}>
          {t('ajustes.exportar')}
        </Botao>
        <Botao variante="secundario" tom="bg-azul-nevoa" onClick={() => seletor.current?.click()}>
          {t('ajustes.importar')}
        </Botao>
        <input
          ref={seletor}
          id="arquivo-backup"
          type="file"
          accept="application/json,.json"
          className="so-leitor"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => aoEscolherArquivo(e.target.files?.[0])}
        />
        <Botao variante="secundario" tom="bg-morango-claro" onClick={() => setConfirmando('apagar')}>
          {t('ajustes.apagar')}
        </Botao>
      </div>

      {confirmando && (
        <div role="alertdialog" aria-labelledby="texto-confirmacao" className="cartao flex flex-col gap-3 bg-morango-claro p-4">
          <p id="texto-confirmacao" className="font-semibold">
            {confirmando === 'apagar' ? t('ajustes.apagarAviso') : t('ajustes.importarAviso')}
          </p>
          <div className="flex flex-wrap gap-2">
            <Botao onClick={confirmar} autoFocus>
              {confirmando === 'apagar' ? t('ajustes.apagarSim') : t('ajustes.importarSim')}
            </Botao>
            <Botao variante="contorno" onClick={() => setConfirmando(null)}>
              {t('ajustes.cancelar')}
            </Botao>
          </div>
        </div>
      )}

      <p aria-live="polite" className={`min-h-6 text-sm font-semibold ${mensagem?.tipo === 'erro' ? 'text-tinta' : ''}`}>
        {mensagem && (
          <>
            <span aria-hidden="true">{mensagem.tipo === 'ok' ? '✓ ' : '! '}</span>
            {mensagem.texto}
          </>
        )}
      </p>
    </div>
  )
}

function Instalar() {
  const { t } = useTranslation()
  const podeInstalar = usePodeInstalar()
  if (estaInstalado()) {
    return <p className="cartao bg-menta p-5 font-semibold">✓ {t('ajustes.instalado')}</p>
  }
  return (
    <div className="cartao flex flex-col gap-3 bg-papel p-5">
      <p>{t('ajustes.instalarTexto')}</p>
      {podeInstalar && (
        <Botao className="self-start" onClick={() => instalar()} icone={<span aria-hidden="true">＋</span>}>
          {t('ajustes.instalarBotao')}
        </Botao>
      )}
      <ul className="list-disc space-y-1 pl-5 text-sm">
        <li>{t('ajustes.instalarMacSafari')}</li>
        <li>{t('ajustes.instalarIpad')}</li>
        <li>{t('ajustes.instalarChrome')}</li>
      </ul>
    </div>
  )
}

export function Ajustes() {
  const { t } = useTranslation()
  const [prefs, mudar] = usePreferencias()
  return (
    <div className="flex flex-col gap-10">
      <h1 tabIndex={-1} className="flex items-center gap-3 text-4xl font-semibold outline-none sm:text-5xl">
        <Adesivo nome="engrenagem" tamanho={56} />
        {t('ajustes.titulo')}
      </h1>

      <Bloco id="aparencia" titulo={t('ajustes.aparencia')} adesivo="flor">
        <PainelAparencia prefs={prefs} mudar={mudar} />
      </Bloco>

      <Bloco id="idioma" titulo={t('ajustes.idioma')} adesivo="balao">
        <div className="cartao bg-papel p-5">
          <Opcoes legenda={t('ajustes.idioma')} valor={prefs.idioma} opcoes={IDIOMAS} mudar={(idioma) => mudar({ idioma })} />
        </div>
      </Bloco>

      <Bloco id="instalar" titulo={t('ajustes.instalar')} adesivo="estrela">
        <Instalar />
      </Bloco>

      <Bloco id="dados" titulo={t('ajustes.dados')} adesivo="envelope">
        <SeusDados />
      </Bloco>

      <Bloco id="sobre" titulo={t('ajustes.sobre')} adesivo="coracao">
        <div className="cartao flex flex-col gap-2 bg-papel p-5">
          <p>{t('app.aviso')}</p>
          <p className="text-sm text-tinta-suave">{t('ajustes.versao', { versao: __VERSAO__ })}</p>
          <Link to="/estilo" className="self-start font-bold underline decoration-2 underline-offset-4">
            {t('ajustes.guiaEstilo')}
          </Link>
        </div>
      </Bloco>
    </div>
  )
}
