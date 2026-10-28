// Página do guia de estilo: mostra todas as peças visuais para aprovação.
// Os dados aqui são fictícios, só para demonstrar.

import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Adesivo, NOMES_ADESIVOS, type NomeAdesivo } from '../componentes/Adesivo'
import { Botao } from '../componentes/Botao'
import { AdesivoSolto, AnelProgresso, Anotacao, FotoComFita, Letreiro, TimerVisual } from '../componentes/Enfeites'
import { GradeSemanal, type Dia } from '../componentes/GradeSemanal'
import { CartaoNumero, ColunasSemanais, MapaDeCalor, type DiaMapa } from '../componentes/Graficos'
import { EstrelaGiz, FolhaCaderno, Micangas } from '../componentes/Papelaria'
import { Selo } from '../componentes/Selo'
import { AREAS, AREAS_PRINCIPAIS } from '../design/areas'
import { NOMES_ESTAMPAS, PainelAparencia } from '../componentes/PainelAparencia'
import { ESTAMPAS, usePreferencias } from '../preferencias'

const PALETA = [
  { nome: 'creme', hex: '#FBF6EE', tipo: 'base' },
  { nome: 'chocolate', hex: '#422F0E', tipo: 'base' },
  { nome: 'lavanda', hex: '#F9D4F8', tipo: 'claro' },
  { nome: 'azul-névoa', hex: '#AECFD0', tipo: 'claro' },
  { nome: 'pêssego', hex: '#FFD094', tipo: 'claro' },
  { nome: 'manteiga', hex: '#F7E9B2', tipo: 'claro' },
  { nome: 'menta', hex: '#DDF2B8', tipo: 'claro' },
  { nome: 'morango-claro', hex: '#FCC4C0', tipo: 'claro' },
  { nome: 'rosa', hex: '#EA5E86', tipo: 'forte' },
  { nome: 'tomate', hex: '#EF6545', tipo: 'forte' },
  { nome: 'laranja', hex: '#F49625', tipo: 'forte' },
  { nome: 'verde-piscina', hex: '#037F71', tipo: 'forte' },
  { nome: 'verde-água', hex: '#57B1A8', tipo: 'forte' },
]

const NOMES_ADESIVO: Record<NomeAdesivo, string> = {
  pilula: 'Pílula',
  calendario: 'Calendário',
  prancheta: 'Prancheta',
  haltere: 'Haltere',
  livro: 'Livro',
  vassoura: 'Vassoura',
  prato: 'Prato',
  copo: 'Copo d’água',
  estrela: 'Estrela',
  coracao: 'Coração',
  cereja: 'Cereja',
  envelope: 'Envelope',
  sol: 'Sol',
  lua: 'Lua',
  sapinho: 'Sapinho',
  flor: 'Flor',
  balao: 'Balão',
  explosao: 'Explosão',
  interrogacao: 'Interrogação',
  exclamacao: 'Exclamação',
  lista: 'Lista',
  cofrinho: 'Cofrinho',
  engrenagem: 'Engrenagem',
}

const SEMANA: Dia[] = [
  { rotulo: 'SEG', nomeCompleto: 'Segunda', numero: 26, estado: 'feito' },
  { rotulo: 'TER', nomeCompleto: 'Terça', numero: 27, estado: 'vazio' },
  { rotulo: 'QUA', nomeCompleto: 'Quarta', numero: 28, estado: 'minimo', hoje: true },
  { rotulo: 'QUI', nomeCompleto: 'Quinta', numero: 29, estado: 'futuro' },
  { rotulo: 'SEX', nomeCompleto: 'Sexta', numero: 30, estado: 'futuro' },
  { rotulo: 'SÁB', nomeCompleto: 'Sábado', numero: 31, estado: 'futuro' },
  { rotulo: 'DOM', nomeCompleto: 'Domingo', numero: 1, estado: 'futuro' },
]

const SEMANA_REMEDIO: Dia[] = SEMANA.map((d, i) => ({ ...d, estado: i < 2 ? 'feito' : i === 2 ? 'feito' : 'futuro' }))

const FOCO_OUTUBRO: DiaMapa[] = Array.from({ length: 31 }, (_, i) => {
  const dia = i + 1
  const valor = [0, 25, 40, 0, 10, 55, 30, 0, 15, 45, 20, 0, 35, 50][(dia * 5) % 14]
  return { dia, valor: dia > 28 ? 0 : valor, hoje: dia === 28, futuro: dia > 28 }
})

const SEMANAS_OBJETIVO = [
  { rotulo: '7/9', descricao: 'semana de 7 de setembro', valor: 2 },
  { rotulo: '14/9', descricao: 'semana de 14 de setembro', valor: 3 },
  { rotulo: '21/9', descricao: 'semana de 21 de setembro', valor: 1 },
  { rotulo: '28/9', descricao: 'semana de 28 de setembro', valor: 4 },
  { rotulo: '5/10', descricao: 'semana de 5 de outubro', valor: 3 },
  { rotulo: '12/10', descricao: 'semana de 12 de outubro', valor: 5 },
  { rotulo: '19/10', descricao: 'semana de 19 de outubro', valor: 4 },
  { rotulo: '26/10', descricao: 'esta semana', valor: 3 },
]

function Secao({ id, rotulo, titulo, children, estampa }: { id: string; rotulo: string; titulo: string; children: ReactNode; estampa?: boolean }) {
  return (
    <section aria-labelledby={id} className="relative px-4 py-8 sm:px-8">
      {estampa && (
        <div aria-hidden="true" className="decor estampa estampa-atual mb-5 h-8 rounded-full border-2 border-linha bg-papel" />
      )}
      <p className="rotulo mb-1">{rotulo}</p>
      <h2 id={id} className="mb-6 text-3xl font-semibold sm:text-4xl">
        {titulo}
      </h2>
      {children}
    </section>
  )
}

function CartaoAgora() {
  const [restante, setRestante] = useState(1)
  const [rodando, setRodando] = useState(false)
  useEffect(() => {
    if (!rodando) return
    const id = setInterval(() => setRestante((r) => Math.max(0, r - 1 / 60)), 1000)
    return () => clearInterval(id)
  }, [rodando])
  const minutos = Math.ceil(restante * 25)
  return (
    <article className="cartao flex flex-col items-center gap-5 bg-papel p-6 text-center sm:flex-row sm:text-left">
      <TimerVisual fracaoRestante={restante} rotulo={`${minutos} min`} />
      <div className="flex flex-1 flex-col gap-3">
        <p className="rotulo">Agora · Faculdade</p>
        <h3 className="text-3xl leading-tight font-semibold">Abrir o resumo da aula 3</h3>
        <p className="text-lg">
          <span className="font-destaque text-2xl italic">pronto quando:</span> li a primeira página
        </p>
        <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
          <Botao grande icone={<span aria-hidden="true">✓</span>}>
            Concluir
          </Botao>
          <Botao variante="secundario" tom="bg-lavanda" onClick={() => setRodando((r) => !r)}>
            {rodando ? 'Pausar timer' : 'Iniciar timer (demo de 1 min)'}
          </Botao>
        </div>
      </div>
    </article>
  )
}

function DemoColar() {
  const [vezes, setVezes] = useState(0)
  return (
    <div className="flex items-center gap-4">
      <Botao variante="secundario" tom="bg-manteiga" onClick={() => setVezes((v) => v + 1)}>
        Colar um adesivo
      </Botao>
      <span className="grid h-16 w-16 place-items-center rounded-2xl border-2 border-dashed border-linha/40">
        {vezes > 0 && (
          <span key={vezes} className="colando">
            <Adesivo nome={(['estrela', 'coracao', 'flor', 'sapinho'] as const)[vezes % 4]} tamanho={52} rotulo="adesivo ganho" />
          </span>
        )}
      </span>
    </div>
  )
}

export function GuiaDeEstilo() {
  const [prefs, mudar] = usePreferencias()

  return (
    <div className="min-h-screen pb-24">
      {/* Topo: folha destacável */}
      <header className="estampa estampa-atual relative overflow-hidden bg-destaque-claro">
        <div className="folha-destacavel mx-auto max-w-6xl bg-papel px-5 pb-8 sm:px-10">
          <Link to="/ajustes" className="mb-4 inline-block font-bold underline decoration-2 underline-offset-4">
            ← Voltar para os Ajustes
          </Link>
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="so-leitor">Caderninho: guia de estilo</h1>
            <Micangas texto="Caderninho" tamanho={44} />
            <Adesivo nome="estrela" tamanho={52} decorativo className="-rotate-12" />
          </div>
          <p className="mt-4 max-w-2xl text-lg">
            Guia de estilo, etapa 1. Aqui estão as cores, fontes, adesivos, estampas e peças do app para você aprovar
            antes de eu construir as telas.{' '}
            <span className="font-destaque text-2xl italic">Use os ajustes abaixo para testar.</span>
          </p>
        </div>
      </header>
      <Letreiro frases={['Um passo de cada vez', 'Voltar já é vitória', 'Feito é melhor que perfeito', 'Que bom te ver hoje']} />

      <main className="mx-auto flex max-w-6xl flex-col gap-4 px-4 pt-8 sm:px-6">
        <Secao id="ajustes" rotulo="Experimente" titulo="Ajustes de aparência">
          <PainelAparencia prefs={prefs} mudar={mudar} />
        </Secao>

        <Secao id="cores" rotulo="Paleta" titulo="Cores">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {PALETA.map((c) => (
              <li key={c.nome} className="cartao overflow-hidden bg-papel">
                <span className="block h-16 border-b-2 border-linha" style={{ background: c.hex }} />
                <span className="block px-3 py-2 text-sm">
                  <strong className="block">{c.nome}</strong>
                  {c.hex} · {c.tipo}
                </span>
              </li>
            ))}
          </ul>
          <h3 className="mt-8 mb-3 text-2xl font-semibold">Cor de cada área</h3>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {AREAS_PRINCIPAIS.concat(AREAS.base).map((a) => (
              <li key={a.id} className={`cartao flex items-center gap-3 p-4 ${a.claro}`}>
                <Adesivo nome={a.adesivo} tamanho={48} />
                <span className="flex-1 text-lg font-bold">{a.nome}</span>
                <span className={`h-6 w-6 rounded-full border-2 border-linha ${a.forte}`} aria-hidden="true" />
              </li>
            ))}
          </ul>
          <p className="mt-4 max-w-3xl text-sm">
            Contraste conferido automaticamente (WCAG AA) nos modos claro e escuro. Rosa e tomate ganharam uma versão um
            pouco mais clara quando levam texto, porque a original não passava. Toda área tem adesivo e nome, nunca só cor.
          </p>
        </Secao>

        <Secao id="fontes" rotulo="Tipografia" titulo="Fontes">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="cartao bg-papel p-6">
              <p className="rotulo mb-2">Títulos · Fraunces</p>
              <p className="font-titulo text-5xl font-semibold">Bom dia! Hoje tem 3 tarefas A</p>
              <p className="rotulo mt-6 mb-2">Destaques · Instrument Serif itálico</p>
              <p className="font-destaque text-4xl italic">só o primeiro passo</p>
            </div>
            <div className="cartao bg-papel p-6">
              <p className="rotulo mb-2">Texto e números · DM Sans</p>
              <p className="text-lg">Tomar o remédio e marcar no app. Consulta às 14h, sair de casa às 13h10.</p>
              <p className="rotulo mt-6 mb-2">Anotações à mão · Caveat (só detalhes curtos)</p>
              <p className="font-mao text-3xl font-semibold">comece por aqui!</p>
              <p className="rotulo mt-6 mb-2">Rótulo pequeno em caixa alta</p>
              <p className="rotulo">Esta semana</p>
              <p className="rotulo mt-6 mb-2">Miçangas de letrinhas (palavras curtas)</p>
              <Micangas texto="Hoje" tamanho={34} />
            </div>
          </div>
        </Secao>

        <Secao id="botoes" rotulo="Ações" titulo="Botões em pílula">
          <div className="flex flex-wrap items-center gap-3">
            <Botao grande icone={<span aria-hidden="true">✓</span>}>
              Tomei
            </Botao>
            <Botao variante="secundario" tom="bg-pessego">
              Adiar 10 min
            </Botao>
            <Botao variante="secundario" tom="bg-azul-nevoa">
              Pular
            </Botao>
            <Botao variante="contorno" atalho="⌘K">
              Anotar rápido
            </Botao>
            <Botao variante="secundario" tom="bg-menta" icone={<span aria-hidden="true">+</span>}>
              Novo hábito
            </Botao>
          </div>
        </Secao>

        <Secao id="adesivos" rotulo="Recompensas e ícones" titulo="Adesivos de papel recortado">
          <ul className="grid grid-cols-3 gap-4 sm:grid-cols-5 lg:grid-cols-10">
            {NOMES_ADESIVOS.map((n) => (
              <li key={n} className="flex flex-col items-center gap-2 text-center text-sm font-semibold">
                <Adesivo nome={n} tamanho={64} />
                {NOMES_ADESIVO[n]}
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <DemoColar />
          </div>
        </Secao>

        <Secao id="estampas" rotulo="Embalagem trocável" titulo="Estampas">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {ESTAMPAS.map((e) => (
              <li key={e}>
                <button
                  type="button"
                  onClick={() => mudar({ estampa: e })}
                  aria-pressed={prefs.estampa === e}
                  className={`cartao estampa estampa-${e} flex h-28 w-full items-end bg-papel p-3 text-left ${
                    prefs.estampa === e ? 'ring-4 ring-linha ring-offset-2 ring-offset-fundo' : ''
                  }`}
                >
                  <span className="rounded-full border-2 border-linha bg-papel px-3 py-0.5 text-sm font-bold">
                    {prefs.estampa === e && '✓ '}
                    {NOMES_ESTAMPAS[e][0]}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 max-w-3xl text-sm">
            A estampa escolhida aparece no topo, nos rituais e na revisão semanal. Nunca fica atrás de texto que você
            precisa ler, e some no modo calmo.
          </p>
        </Secao>

        <Secao id="agora" rotulo="Tela Hoje" titulo="Cartão “Agora” e tempo visível">
          <CartaoAgora />
          <p className="mt-3 max-w-3xl text-sm">
            O cartão “Agora” e o modo foco ficam sempre limpos: só a tarefa, o “pronto quando” e o timer que encolhe.
          </p>
        </Secao>

        <Secao id="semana" rotulo="Consistência sem punição" titulo="Semana, selos e progresso">
          <div className="grid gap-4 lg:grid-cols-2">
            <GradeSemanal titulo="Academia" adesivo="haltere" tom="bg-pessego" dias={SEMANA} />
            <GradeSemanal titulo="Remédio da manhã" adesivo="pilula" tom="bg-morango-claro" dias={SEMANA_REMEDIO} />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-6">
            <Selo forma="flor" cor="rosa" numero="5/7" legenda="dias nesta semana" />
            <Selo forma="onda" cor="laranja" numero="3" legenda="tarefas A" />
            <Selo forma="nuvem" cor="piscina" numero="12" legenda="doses" />
            <div className="flex flex-wrap gap-5">
              <AnelProgresso feitos={2} total={3} nome="Remédios" adesivo="pilula" cor={AREAS.remedios.forteCss} />
              <AnelProgresso feitos={1} total={4} nome="Alimentação" adesivo="prato" cor={AREAS.alimentacao.forteCss} />
              <AnelProgresso feitos={0} total={1} nome="Quarto" adesivo="vassoura" cor={AREAS.quarto.forteCss} />
            </div>
          </div>
          <p className="mt-4 max-w-3xl text-sm">
            Dia sem registro fica com contorno vazio, nunca vermelho. A versão mínima também conta.
          </p>
        </Secao>

        <Secao id="objetivos" rotulo="Novo" titulo="Meus objetivos" estampa>
          <div className="grid items-start gap-8 lg:grid-cols-[1.1fr_1fr]">
            <div className="relative">
              <FolhaCaderno>
                <p className="rotulo leading-8">Meu objetivo</p>
                <label className="block">
                  <span className="so-leitor">Escreva seu objetivo</span>
                  <textarea
                    rows={2}
                    defaultValue="Me formar sem virar noites antes das provas"
                    className="block w-full resize-none bg-transparent font-titulo text-2xl leading-8 font-semibold outline-none"
                  />
                </label>
                <p className="rotulo leading-8">Por que isso importa para mim</p>
                <label className="block">
                  <span className="so-leitor">Por que isso importa</span>
                  <textarea
                    rows={3}
                    defaultValue="Quero aprender de verdade e ter tempo para dormir e ver meus amigos."
                    className="block w-full resize-none bg-transparent text-lg leading-8 outline-none"
                  />
                </label>
                <p className="rotulo leading-8">O que faço por ele</p>
                <ul className="leading-8">
                  <li className="flex items-center gap-2">
                    <Adesivo nome="livro" tamanho={22} /> Sessões de estudo da faculdade
                  </li>
                  <li className="flex items-center gap-2">
                    <Adesivo nome="lua" tamanho={22} /> Ritual da noite
                  </li>
                </ul>
              </FolhaCaderno>
              <EstrelaGiz cor="#F49625" tamanho={64} className="-bottom-6 -left-5" />
              <EstrelaGiz cor="#EA5E86" tamanho={34} className="-top-4 right-10" />
              <EstrelaGiz cor="#F7C948" tamanho={52} className="-top-8 -right-4" />
            </div>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <CartaoNumero rotulo="Dias com ação nesta semana" valor="3" detalhe="de 7 dias" tom="bg-lavanda" />
                <CartaoNumero rotulo="Minutos de foco em outubro" valor="595" detalhe="em 19 sessões" tom="bg-lavanda" />
              </div>
              <ColunasSemanais
                titulo="Dias com ação pelo objetivo"
                subtitulo="Por semana, nas últimas 8 semanas"
                dados={SEMANAS_OBJETIVO}
                maximo={7}
                unidade="dias"
              />
            </div>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.1fr]">
            <MapaDeCalor
              titulo="Minutos de foco por dia"
              subtitulo="Outubro de 2026"
              dias={FOCO_OUTUBRO}
              primeiroDiaSemana={4}
            />
            <div className="cartao bg-papel p-5">
              <h3 className="text-xl font-semibold">Como o objetivo aparece no app</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Você escreve o objetivo e o porquê com suas palavras, na folha de caderno.</li>
                <li>Liga a ele os hábitos, tarefas e sessões de estudo que o fazem andar.</li>
                <li>O ritual da manhã mostra o porquê de um objetivo por dia, para não esquecer.</li>
                <li>Os gráficos mostram só o que você fez. Semana parada não vira barra vermelha.</li>
                <li>Na revisão semanal: “isso ainda é importante pra mim?”</li>
              </ul>
              <p className="mt-3 text-sm">Todos os números desta página são exemplos.</p>
            </div>
          </div>
        </Secao>

        <Secao id="papelaria" rotulo="Detalhes" titulo="Fotos, anotações e adesivos soltos">
          <div className="relative flex flex-wrap items-center gap-10 py-4">
            <FotoComFita etiqueta="Antes" inclinacao={-4}>
              <div className="estampa estampa-xadrez h-full w-full bg-manteiga" />
            </FotoComFita>
            <FotoComFita etiqueta="Depois" inclinacao={3}>
              <div className="h-full w-full bg-menta" />
            </FotoComFita>
            <Anotacao texto="comece por aqui!" />
            <AdesivoSolto nome="cereja" className="top-0 right-4 rotate-12" />
            <AdesivoSolto nome="balao" className="right-28 bottom-0 -rotate-6" />
          </div>
          <p className="max-w-3xl text-sm">
            Fotos de antes e depois são opcionais e ficam só no seu aparelho. Adesivos soltos ficam nas margens, nunca em
            cima de botões ou texto.
          </p>
        </Secao>
      </main>
    </div>
  )
}
