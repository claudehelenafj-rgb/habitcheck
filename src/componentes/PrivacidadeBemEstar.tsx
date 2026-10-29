// Privacidade do Bem-estar: PIN, avisos discretos, exportar e apagar só os dados do Bem-estar.

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { baixarArquivo } from '../baixar'
import { banco } from '../dados/banco'
import { apagarBemEstar, exportarTudo, importarTudo, nomeArquivoBackup } from '../dados/backup'
import { definirPin, pinConfere, tirarPin, usePinConfigurado } from '../dados/pin'
import { pinValido } from '../logica/pin'
import { bloquear, desbloquear } from '../trava'
import { AvisosDiscretos } from './AvisosDiscretos'
import { mostrarAviso } from './Avisos'
import { Botao } from './Botao'

const campoPin = 'min-h-11 w-36 rounded-full border-2 border-linha bg-papel px-4 text-center tracking-[0.3em]'
const soNumeros = (v: string) => v.replace(/\D/g, '').slice(0, 6)

type Modo = null | 'criar' | 'trocar' | 'tirar'

function GerenciarPin() {
  const { t } = useTranslation()
  const temPin = usePinConfigurado()
  const [modo, setModo] = useState<Modo>(null)
  const [atual, setAtual] = useState('')
  const [novo, setNovo] = useState('')
  const [repetir, setRepetir] = useState('')
  const [erro, setErro] = useState('')
  const fechar = () => {
    setModo(null)
    setAtual('')
    setNovo('')
    setRepetir('')
    setErro('')
  }

  async function salvar() {
    if (modo !== 'criar' && !(await pinConfere(atual))) return setErro(t('pin.errado'))
    if (modo === 'tirar') {
      await tirarPin()
      fechar()
      return mostrarAviso(t('pin.tirado'))
    }
    if (!pinValido(novo)) return setErro(t('pin.formato'))
    if (novo !== repetir) return setErro(t('pin.naoBate'))
    // quem acabou de criar ou trocar o PIN continua dentro (senão a aba trancaria na mesma hora)
    desbloquear()
    await definirPin(novo)
    fechar()
    mostrarAviso(t(modo === 'criar' ? 'pin.criado' : 'pin.trocado'))
  }

  if (temPin === undefined) return null
  return (
    <div className="flex flex-col gap-3">
      <p className="font-bold">{temPin ? `✓ ${t('pin.ativo')}` : t('pin.semPin')}</p>
      {modo === null ? (
        <div className="flex flex-wrap gap-2">
          {temPin ? (
            <>
              <Botao onClick={bloquear}>{t('pin.bloquearAgora')}</Botao>
              <Botao variante="contorno" onClick={() => setModo('trocar')}>
                {t('pin.trocar')}
              </Botao>
              <Botao variante="contorno" onClick={() => setModo('tirar')}>
                {t('pin.tirar')}
              </Botao>
            </>
          ) : (
            <Botao onClick={() => setModo('criar')}>{t('pin.criar')}</Botao>
          )}
        </div>
      ) : (
        <form
          className="flex flex-col gap-3 rounded-2xl border-2 border-linha/40 p-3"
          onSubmit={(e) => {
            e.preventDefault()
            salvar()
          }}
        >
          <div className="flex flex-wrap gap-3">
            {modo !== 'criar' && (
              <label className="flex flex-col gap-1">
                <span className="text-sm font-bold">{t('pin.atual')}</span>
                <input type="password" inputMode="numeric" autoComplete="off" value={atual} onChange={(e) => setAtual(soNumeros(e.target.value))} className={campoPin} />
              </label>
            )}
            {modo !== 'tirar' && (
              <>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-bold">{t('pin.novo')}</span>
                  <input type="password" inputMode="numeric" autoComplete="new-password" value={novo} onChange={(e) => setNovo(soNumeros(e.target.value))} className={campoPin} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-bold">{t('pin.repetir')}</span>
                  <input type="password" inputMode="numeric" autoComplete="new-password" value={repetir} onChange={(e) => setRepetir(soNumeros(e.target.value))} className={campoPin} />
                </label>
              </>
            )}
          </div>
          <p aria-live="polite" className="min-h-6 font-semibold">
            {erro}
          </p>
          <div className="flex flex-wrap gap-2">
            <Botao type="submit">{modo === 'tirar' ? t('pin.tirar') : t('pin.salvar')}</Botao>
            <Botao variante="contorno" onClick={fechar}>
              {t('ajustes.cancelar')}
            </Botao>
          </div>
        </form>
      )}
      <p className="text-sm text-tinta-suave">{t('pin.honesto')}</p>
    </div>
  )
}

function DadosDoBemEstar() {
  const { t } = useTranslation()
  const [apagando, setApagando] = useState(false)
  const [mensagem, setMensagem] = useState('')

  async function exportar() {
    const arquivo = nomeArquivoBackup(new Date(), 'bemEstar')
    baixarArquivo(arquivo, JSON.stringify(await exportarTudo(banco, new Date(), 'bemEstar'), null, 2), 'application/json')
    setMensagem(t('privacidade.exportado', { arquivo }))
  }

  async function apagar() {
    const copia = await exportarTudo(banco, new Date(), 'bemEstar')
    await apagarBemEstar(banco)
    setApagando(false)
    mostrarAviso(t('privacidade.apagado'), () => importarTudo(banco, copia))
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm">{t('privacidade.dadosTexto')}</p>
      <div className="flex flex-wrap gap-2">
        <Botao variante="secundario" tom="bg-azul-nevoa" onClick={exportar} icone={<span aria-hidden="true">↓</span>}>
          {t('privacidade.exportar')}
        </Botao>
        <Botao variante="secundario" tom="bg-morango-claro" onClick={() => setApagando(true)}>
          {t('privacidade.apagar')}
        </Botao>
      </div>
      {apagando && (
        <div role="alertdialog" aria-labelledby="texto-apagar-bem-estar" className="flex flex-col gap-3 rounded-2xl border-2 border-linha bg-morango-claro p-4">
          <p id="texto-apagar-bem-estar" className="font-semibold">
            {t('privacidade.apagarAviso')}
          </p>
          <div className="flex flex-wrap gap-2">
            <Botao onClick={apagar} autoFocus>
              {t('privacidade.apagarSim')}
            </Botao>
            <Botao variante="contorno" onClick={() => setApagando(false)}>
              {t('ajustes.cancelar')}
            </Botao>
          </div>
        </div>
      )}
      <p aria-live="polite" className="min-h-6 text-sm font-semibold">
        {mensagem && `✓ ${mensagem}`}
      </p>
      <p className="text-sm text-tinta-suave">{t('privacidade.restaurar')}</p>
    </div>
  )
}

export function PrivacidadeBemEstar() {
  const { t } = useTranslation()
  return (
    <section aria-labelledby="titulo-privacidade" className="cartao flex flex-col gap-5 bg-papel p-4 sm:p-6">
      <h2 id="titulo-privacidade" className="text-2xl font-semibold">
        {t('privacidade.titulo')}
      </h2>
      <p className="text-sm">{t('privacidade.soAqui')}</p>
      <section aria-labelledby="titulo-pin-config" className="flex flex-col gap-2">
        <h3 id="titulo-pin-config" className="text-lg font-bold">
          {t('pin.tituloConfig')}
        </h3>
        <GerenciarPin />
      </section>
      <hr className="border-t-2 border-linha/20" />
      <AvisosDiscretos />
      <hr className="border-t-2 border-linha/20" />
      <section aria-labelledby="titulo-dados-bem-estar" className="flex flex-col gap-2">
        <h3 id="titulo-dados-bem-estar" className="text-lg font-bold">
          {t('privacidade.dadosTitulo')}
        </h3>
        <DadosDoBemEstar />
      </section>
    </section>
  )
}
