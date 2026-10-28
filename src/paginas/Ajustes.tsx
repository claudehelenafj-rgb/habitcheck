// Ajustes: aparência, idioma, instalação, dados (backup, restaurar, apagar) e sobre.

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'
import { Adesivo, type NomeAdesivo } from '../componentes/Adesivo'
import { Botao } from '../componentes/Botao'
import { Opcoes, PainelAparencia } from '../componentes/PainelAparencia'
import { banco } from '../dados/banco'
import { apagarTudo, BackupInvalido, exportarTudo, importarTudo, lerBackup, nomeArquivoBackup } from '../dados/backup'
import { IDIOMAS } from '../i18n'
import { estaInstalado, instalar, usePodeInstalar } from '../instalacao'
import { usePreferencias } from '../preferencias'
import { salvarConfigAvisos, useConfigAvisos } from '../dados/remedios'
import { atualizarPerfil, usePerfil } from '../dados/perfil'
import { AREAS_PRINCIPAIS } from '../design/areas'
import { diaLocal } from '../logica/datas'
import { diaDoPlano, DURACAO_PLANO, LIMITE_AREAS_INICIO } from '../logica/planoInicio'

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

function AreasAtivas() {
  const { t } = useTranslation()
  const perfil = usePerfil()
  if (!perfil) return null
  const ativas = perfil.areasAtivas
  const noComeco = diaDoPlano(perfil.inicioPlano, diaLocal()) <= DURACAO_PLANO
  const alternar = (id: (typeof ativas)[number]) =>
    atualizarPerfil({ areasAtivas: ativas.includes(id) ? ativas.filter((a) => a !== id) : [...ativas, id] })
  return (
    <div className="cartao flex flex-col gap-4 bg-papel p-5">
      <p className="max-w-prose">{t('ajustes.areasTexto')}</p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {AREAS_PRINCIPAIS.map((area) => {
          const ativa = ativas.includes(area.id)
          return (
            <li key={area.id}>
              <button
                type="button"
                aria-pressed={ativa}
                onClick={() => alternar(area.id)}
                className={`flex w-full items-center gap-3 rounded-2xl border-2 border-linha p-3 text-left ${ativa ? area.claro : 'bg-papel'}`}
              >
                <Adesivo nome={area.adesivo} tamanho={36} />
                <span className="flex-1 font-bold">{t(`nav.${area.id}`)}</span>
                <span
                  aria-hidden="true"
                  className={`rounded-full border-2 border-linha px-3 py-0.5 text-sm font-bold ${ativa ? 'bg-botao text-botao-texto' : ''}`}
                >
                  {ativa ? `✓ ${t('ajustes.ligado')}` : t('ajustes.desligado')}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      {noComeco && ativas.length > LIMITE_AREAS_INICIO && <p className="text-sm font-semibold">{t('ajustes.areasMuitas')}</p>}
    </div>
  )
}

function Nome() {
  const { t } = useTranslation()
  const perfil = usePerfil()
  if (!perfil) return null
  return (
    <label className="cartao flex flex-col gap-1.5 bg-papel p-5">
      <span className="font-bold">{t('ajustes.nome')}</span>
      <input
        id="nome-ajustes"
        defaultValue={perfil.nome ?? ''}
        maxLength={40}
        autoComplete="given-name"
        onChange={(e) => atualizarPerfil({ nome: e.target.value.trim() || undefined })}
        className="min-h-12 max-w-md rounded-2xl border-2 border-linha bg-papel px-4 text-lg"
      />
      <span className="text-sm text-tinta-suave">{t('ajustes.nomeDica')}</span>
    </label>
  )
}

function Silencio() {
  const { t } = useTranslation()
  const config = useConfigAvisos()
  const s = config.silencio
  const mudar = (m: Partial<typeof s>) => salvarConfigAvisos({ ...config, silencio: { ...s, ...m } })
  return (
    <div className="cartao flex flex-col gap-3 bg-papel p-5">
      <label className="flex items-center gap-2 font-bold">
        <input id="silencio-ativo" type="checkbox" checked={s.ativo} onChange={(e) => mudar({ ativo: e.target.checked })} className="h-5 w-5 accent-[var(--chocolate)]" />
        {t('ajustes.silencio')}
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2">
          {t('ajustes.silencioDe')}
          <input id="silencio-inicio" type="time" value={s.inicio} disabled={!s.ativo} onChange={(e) => e.target.value && mudar({ inicio: e.target.value })} className="min-h-11 rounded-xl border-2 border-linha bg-papel px-3 tabular-nums" />
        </label>
        <label className="flex items-center gap-2">
          {t('ajustes.silencioAte')}
          <input id="silencio-fim" type="time" value={s.fim} disabled={!s.ativo} onChange={(e) => e.target.value && mudar({ fim: e.target.value })} className="min-h-11 rounded-xl border-2 border-linha bg-papel px-3 tabular-nums" />
        </label>
      </div>
      <p className="text-sm">{t('ajustes.silencioDica')}</p>
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
  const { hash } = useLocation()
  // links como /ajustes#areas levam direto para a seção
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' })
  }, [hash])
  return (
    <div className="flex flex-col gap-10">
      <h1 tabIndex={-1} className="flex items-center gap-3 text-4xl font-semibold outline-none sm:text-5xl">
        <Adesivo nome="engrenagem" tamanho={56} />
        {t('ajustes.titulo')}
      </h1>

      <Bloco id="areas" titulo={t('ajustes.areas')} adesivo="cofrinho">
        <AreasAtivas />
      </Bloco>

      <Bloco id="nome" titulo={t('ajustes.nome')} adesivo="sapinho">
        <Nome />
      </Bloco>

      <Bloco id="avisos" titulo={t('ajustes.avisos')} adesivo="lua">
        <Silencio />
      </Bloco>

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
