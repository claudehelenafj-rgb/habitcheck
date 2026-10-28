// Moldura do app: menu lateral (computador e tablet), barra de baixo (celular),
// link "pular para o conteúdo", atalhos de teclado e avisos (sem internet, versão nova).

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { atualizarPerfil, usePerfil, type Perfil } from '../dados/perfil'
import { diaLocal, type Dia } from '../logica/datas'
import { TELA_AJUSTES, TELAS_AREAS, TELAS_BARRA_CELULAR, TELAS_PRINCIPAIS, type Tela } from '../rotas'
import { Adesivo } from './Adesivo'
import { AvisoAtualizacao } from './AvisoAtualizacao'
import { Avisos } from './Avisos'
import { BannerLembrete } from './BannerLembrete'
import { useLembretes } from '../lembretes'
import { ATALHO_CAPTURA, Captura } from './Captura'
import { Micangas } from './Papelaria'

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="ml-auto hidden h-6 [@media(pointer:fine)]:grid md:grid min-w-6 place-items-center rounded-md border-2 border-linha/40 px-1 font-texto text-xs font-bold uppercase">
      {children}
    </kbd>
  )
}

function ItemMenu({ tela, aoClicar }: { tela: Tela; aoClicar?: () => void }) {
  const { t } = useTranslation()
  return (
    <li>
      <NavLink
        to={tela.caminho}
        onClick={aoClicar}
        className={({ isActive }) =>
          `flex min-h-11 items-center gap-3 rounded-full border-2 px-3 py-1.5 font-bold transition-colors ${
            isActive ? 'border-linha bg-destaque-claro shadow-[2px_2px_0_var(--linha)]' : 'border-transparent hover:border-linha/30'
          }`
        }
      >
        <Adesivo nome={tela.adesivo} tamanho={28} />
        <span>{t(`nav.${tela.id}`)}</span>
        <Kbd>{tela.atalho}</Kbd>
      </NavLink>
    </li>
  )
}

/** O que as telas dentro da moldura recebem (via useOutletContext). */
export type ContextoMoldura = {
  perfil: Perfil
  /** última visita antes desta abertura do app (para o "que bom te ver") */
  visitaAnterior: Dia | undefined
}

function MenuLateral({ areas }: { areas: Tela[] }) {
  const { t } = useTranslation()
  return (
    <nav aria-label={t('app.menu')} className="flex h-full flex-col gap-4 overflow-y-auto px-3 py-5">
      <NavLink to="/hoje" className="px-2" aria-label={t('app.nome')}>
        <Micangas texto="Caderninho" tamanho={18} quebrar={false} />
      </NavLink>
      <ul className="flex flex-col gap-1">
        {TELAS_PRINCIPAIS.map((tela) => (
          <ItemMenu key={tela.id} tela={tela} />
        ))}
      </ul>
      <div>
        <p className="rotulo mb-1 px-3">{t('nav.areas')}</p>
        <ul className="flex flex-col gap-1">
          {areas.map((tela) => (
            <ItemMenu key={tela.id} tela={tela} />
          ))}
        </ul>
        <Link to="/ajustes#areas" className="mt-1 ml-3 inline-block text-sm font-bold underline decoration-2 underline-offset-4">
          {t('nav.maisAreas')}
        </Link>
      </div>
      <ul className="mt-auto flex flex-col gap-1">
        <ItemMenu tela={TELA_AJUSTES} />
      </ul>
    </nav>
  )
}

/** Barra de baixo para telas estreitas, com "Mais" abrindo o resto do menu. */
function BarraCelular({ telas }: { telas: Tela[] }) {
  const { t } = useTranslation()
  const [aberto, setAberto] = useState(false)
  const principais = telas.filter((tela) => TELAS_BARRA_CELULAR.includes(tela.id))
  const resto = telas.filter((tela) => !TELAS_BARRA_CELULAR.includes(tela.id))
  return (
    <>
      {aberto && (
        <div className="fixed inset-x-0 bottom-0 z-30 max-h-[70vh] overflow-y-auto rounded-t-[2rem] border-t-2 border-linha bg-papel px-4 pt-4 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] shadow-[0_-4px_0_var(--linha)]">
          <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {resto.map((tela) => (
              <ItemMenu key={tela.id} tela={tela} aoClicar={() => setAberto(false)} />
            ))}
          </ul>
        </div>
      )}
      <nav
        aria-label={t('app.menu')}
        className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-linha bg-papel px-2 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))]"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {principais.map((tela) => (
            <li key={tela.id}>
              <NavLink
                to={tela.caminho}
                onClick={() => setAberto(false)}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 rounded-2xl py-1 text-xs font-bold ${isActive ? 'bg-destaque-claro' : ''}`
                }
              >
                <Adesivo nome={tela.adesivo} tamanho={26} />
                {t(`nav.${tela.id}`)}
              </NavLink>
            </li>
          ))}
          <li>
            <button
              type="button"
              aria-expanded={aberto}
              onClick={() => setAberto((a) => !a)}
              className={`flex w-full flex-col items-center gap-0.5 rounded-2xl py-1 text-xs font-bold ${aberto ? 'bg-destaque-claro' : ''}`}
            >
              <Adesivo nome="flor" tamanho={26} />
              {t('nav.mais')}
            </button>
          </li>
        </ul>
      </nav>
    </>
  )
}

function ListaAtalhos({ telas, fechar }: { telas: Tela[]; fechar: () => void }) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    ref.current?.showModal()
  }, [])
  return (
    <dialog
      ref={ref}
      onClose={fechar}
      aria-labelledby="titulo-atalhos"
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-[1.75rem] border-2 border-linha bg-papel p-6 text-tinta shadow-[4px_4px_0_var(--linha)] backdrop:bg-chocolate/40"
    >
      <h2 id="titulo-atalhos" className="mb-1 text-2xl font-semibold">
        {t('atalhos.titulo')}
      </h2>
      <p className="mb-4 text-sm">{t('atalhos.dica')}</p>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {telas.map((tela) => (
          <li key={tela.id} className="flex items-center gap-2">
            <Kbd>{tela.atalho}</Kbd>
            <span className="mr-auto">{t('atalhos.ir', { tela: t(`nav.${tela.id}`) })}</span>
          </li>
        ))}
        <li className="flex items-center gap-2">
          <Kbd>{ATALHO_CAPTURA}</Kbd>
          <span className="mr-auto">{t('captura.campo')}</span>
        </li>
        <li className="flex items-center gap-2">
          <Kbd>?</Kbd>
          <span className="mr-auto">{t('atalhos.lista')}</span>
        </li>
      </ul>
      <form method="dialog" className="mt-5 flex justify-end">
        <button className="min-h-11 rounded-full border-2 border-botao bg-botao px-5 font-bold text-botao-texto">
          {t('atalhos.fechar')}
        </button>
      </form>
    </dialog>
  )
}

function escrevendo(alvo: EventTarget | null): boolean {
  const el = alvo as HTMLElement | null
  return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))
}

function useAtalhos(telas: Tela[], abrirLista: () => void) {
  const navegar = useNavigate()
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || escrevendo(e.target) || document.querySelector('dialog[open]')) return
      if (e.key === '?') {
        e.preventDefault()
        abrirLista()
        return
      }
      const tela = telas.find((x) => x.atalho === e.key.toLowerCase())
      if (tela) {
        e.preventDefault()
        navegar(tela.caminho)
      }
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [navegar, telas, abrirLista])
}

function useOnline() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return online
}

/**
 * Guarda a última visita de antes desta abertura e marca hoje como visitado.
 * Assim a tela Hoje sabe se a pessoa ficou uns dias sem abrir o app.
 */
function useVisitaAnterior(perfil: Perfil | null | undefined) {
  const [anterior, setAnterior] = useState<{ dia: Dia | undefined } | null>(null)
  useEffect(() => {
    if (!perfil || anterior) return
    setAnterior({ dia: perfil.ultimaVisita })
    const hoje = diaLocal()
    if (perfil.ultimaVisita !== hoje) atualizarPerfil({ ultimaVisita: hoje })
  }, [perfil, anterior])
  return anterior
}

export function Moldura() {
  const perfil = usePerfil()
  const anterior = useVisitaAnterior(perfil)
  // carregando: não desenha nada por um instante; primeiro uso: vai para as boas-vindas
  if (perfil === null) return <Navigate to="/boas-vindas" replace />
  if (!perfil || !anterior) return null
  return <MolduraComPerfil perfil={perfil} visitaAnterior={anterior.dia} />
}

function MolduraComPerfil({ perfil, visitaAnterior }: ContextoMoldura) {
  const { t } = useTranslation()
  const [atalhosAbertos, setAtalhosAbertos] = useState(false)
  const online = useOnline()
  const local = useLocation()
  const principal = useRef<HTMLElement>(null)
  const areas = useMemo(() => TELAS_AREAS.filter((tela) => tela.area && perfil.areasAtivas.includes(tela.area)), [perfil.areasAtivas])
  const telas = useMemo(() => [...TELAS_PRINCIPAIS, ...areas, TELA_AJUSTES], [areas])
  const abrirAtalhos = useCallback(() => setAtalhosAbertos(true), [])
  useAtalhos(telas, abrirAtalhos)
  useLembretes(t('remedios.lembrete'))

  // Ao trocar de tela, o foco vai para o título da nova tela (bom para leitor de tela e teclado).
  const primeiraVez = useRef(true)
  useEffect(() => {
    if (primeiraVez.current) {
      primeiraVez.current = false
      return
    }
    principal.current?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: !!local.hash })
  }, [local.pathname, local.hash])

  return (
    <div className="min-h-screen md:grid md:grid-cols-[15rem_1fr]">
      <a
        href="#conteudo"
        onClick={(e) => {
          e.preventDefault()
          principal.current?.querySelector<HTMLElement>('h1')?.focus()
        }}
        className="fixed top-2 left-2 z-50 -translate-y-24 rounded-full border-2 border-linha bg-papel px-4 py-2 font-bold focus:translate-y-0"
      >
        {t('app.pularParaConteudo')}
      </a>
      <aside className="sticky top-0 hidden h-screen border-r-2 border-linha/15 md:block">
        <MenuLateral areas={areas} />
      </aside>
      <div className="flex min-w-0 flex-col">
        {!online && (
          <p role="status" className="border-b-2 border-linha bg-manteiga px-4 py-2 text-center text-sm font-semibold">
            {t('app.offline')}
          </p>
        )}
        <AvisoAtualizacao />
        <BannerLembrete />
        <main id="conteudo" ref={principal} className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-32 sm:px-8">
          <Outlet context={{ perfil, visitaAnterior } satisfies ContextoMoldura} />
        </main>
        <footer className="px-4 pb-28 text-center text-xs text-tinta-suave md:pr-56 md:pb-8">
          {t('app.aviso')}{' '}
          <button type="button" onClick={() => setAtalhosAbertos(true)} className="ml-1 underline underline-offset-2">
            {t('atalhos.abrir')} (?)
          </button>
        </footer>
      </div>
      <div className="md:hidden">
        <BarraCelular telas={telas} />
      </div>
      {atalhosAbertos && <ListaAtalhos telas={telas} fechar={() => setAtalhosAbertos(false)} />}
      <Captura />
      <Avisos />
    </div>
  )
}
