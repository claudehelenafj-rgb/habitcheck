// Guia de estilo do tema Índigo, das estampas novas, da decoração neutra e das cores do Bem-estar.
// Serve para aprovar o visual antes de o tema entrar nos Ajustes. Os dados aqui são fictícios.

import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Adesivo, DecoracaoNeutra, type NomeAdesivo } from '../componentes/Adesivo'
import { Botao } from '../componentes/Botao'
import { TimerVisual } from '../componentes/Enfeites'
import { MapaDeCalor, type DiaMapa } from '../componentes/Graficos'
import { Micangas } from '../componentes/Papelaria'
import { Selo } from '../componentes/Selo'
import { AREAS_PRINCIPAIS } from '../design/areas'
import { contraste } from '../design/contraste'

const PALETA_INDIGO = [
  { nome: 'papel-gelo', hex: '#F3F2EE', uso: 'fundo' },
  { nome: 'índigo-noite', hex: '#1E2350', uso: 'texto e contornos' },
  { nome: 'índigo', hex: '#3949A3', uso: 'botão principal e destaques' },
  { nome: 'azul-lavanda', hex: '#D9DDF5', uso: 'fundos claros' },
  { nome: 'azul-névoa', hex: '#AECFD0', uso: 'fundos claros' },
  { nome: 'mostarda', hex: '#E3A73B', uso: 'acentos, sempre com contorno' },
]

// [uso, combinação, cor 1, cor 2, mínimo WCAG AA: 4,5 para texto, 3 para ícone e contorno]
const CONTRASTES: Array<[string, string, string, string, number]> = [
  ['Texto', 'índigo-noite sobre papel-gelo', '#1E2350', '#F3F2EE', 4.5],
  ['Botão', 'papel-gelo sobre índigo', '#F3F2EE', '#3949A3', 4.5],
  ['Cartão claro', 'índigo-noite sobre azul-lavanda', '#1E2350', '#D9DDF5', 4.5],
  ['Texto no escuro', 'papel-gelo sobre índigo-noite', '#F3F2EE', '#1E2350', 4.5],
  ['Botão no escuro', 'índigo-noite sobre papel-gelo', '#1E2350', '#F3F2EE', 4.5],
  ['Mostarda solta', 'mostarda sobre papel-gelo', '#E3A73B', '#F3F2EE', 3],
  ['Mostarda com contorno', 'contorno índigo-noite na mostarda', '#1E2350', '#E3A73B', 3],
]

const ESTAMPAS_NOVAS = [
  { id: 'patinhas', nome: 'Patinhas' },
  { id: 'rabiscos', nome: 'Rabiscos' },
  { id: 'xadrez-mao', nome: 'Xadrez à mão' },
]

const DOCE: NomeAdesivo[] = ['coracao', 'cereja', 'flor', 'sapinho', 'balao', 'explosao']
const NEUTRA: NomeAdesivo[] = ['estrela', 'raio', 'planeta', 'onda', 'montanha', 'folha']
const BEM_ESTAR: Array<[NomeAdesivo, string]> = [
  ['cerebro', 'Cerebrinho meditando'],
  ['nuvem', 'Nuvem'],
  ['xicara', 'Xícara'],
  ['maoCoracao', 'Mão no coração'],
  ['folha', 'Folha'],
  ['lua', 'Lua'],
]

const FOCO: DiaMapa[] = Array.from({ length: 28 }, (_, i) => ({
  dia: i + 1,
  valor: [0, 25, 40, 0, 10, 55, 30, 0, 15, 45, 20, 0, 35, 50][(i * 5) % 14],
  hoje: i === 27,
}))

const numero = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })

function Secao({ id, rotulo, titulo, children }: { id: string; rotulo: string; titulo: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="px-4 py-8 sm:px-8">
      <p className="rotulo mb-1">{rotulo}</p>
      <h2 id={id} className="mb-6 text-3xl font-semibold sm:text-4xl">
        {titulo}
      </h2>
      {children}
    </section>
  )
}

/** Um pedaço do app desenhado com o tema Índigo, no modo claro ou escuro. */
function PreviaIndigo({ escuro }: { escuro?: boolean }) {
  return (
    <div
      data-tema="indigo"
      data-modo={escuro ? 'escuro' : undefined}
      className="cartao overflow-hidden bg-fundo text-tinta"
    >
      <div aria-hidden="true" className="estampa estampa-rabiscos h-10 border-b-2 border-linha bg-destaque-claro" />
      <div className="flex flex-col gap-4 p-5">
        <p className="rotulo">{escuro ? 'Índigo · modo escuro' : 'Índigo · modo claro'}</p>
        <div className="flex flex-wrap items-center gap-3">
          <Micangas texto="Hoje" tamanho={26} />
          <span className="font-mao text-2xl">quarta, 28</span>
        </div>
        <h3 className="text-3xl leading-tight font-semibold">Boa tarde, Ana</h3>

        <article className="cartao flex flex-col items-center gap-4 bg-papel p-4 text-center sm:flex-row sm:text-left">
          <TimerVisual fracaoRestante={0.6} rotulo="15 min" />
          <div className="flex flex-1 flex-col gap-2">
            <p className="rotulo">Agora · Faculdade</p>
            <p className="text-xl leading-tight font-semibold">Abrir o resumo da aula 3</p>
            <p className="text-tinta-suave">
              <span className="font-destaque text-xl italic">pronto quando:</span> li a primeira página
            </p>
            <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
              <Botao icone={<span aria-hidden="true">✓</span>}>Concluir</Botao>
              <Botao variante="secundario" tom="bg-azul-nevoa">
                Adiar
              </Botao>
            </div>
          </div>
        </article>

        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {AREAS_PRINCIPAIS.map((a) => (
            <li key={a.id} className={`cartao flex items-center gap-2 px-3 py-2 ${a.claro}`}>
              <Adesivo nome={a.adesivo} tamanho={32} />
              <span className="flex-1 font-bold">{a.nome}</span>
              <span className={`h-4 w-4 rounded-full border-2 border-linha ${a.forte}`} aria-hidden="true" />
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center gap-4">
          <Selo forma="flor" cor="indigo" numero="5/7" legenda="dias nesta semana" tamanho={100} />
          <Selo forma="nuvem" cor="mostarda" numero="3" legenda="tarefas A" tamanho={100} />
          <div className="flex flex-wrap gap-1" aria-hidden="true">
            {NEUTRA.slice(0, 4).map((n) => (
              <Adesivo key={n} nome={n} tamanho={36} />
            ))}
          </div>
        </div>

        <MapaDeCalor titulo="Minutos de foco por dia" subtitulo="Exemplo" dias={FOCO} primeiroDiaSemana={4} />
      </div>
    </div>
  )
}

export function GuiaIndigo() {
  return (
    <div className="min-h-screen pb-24">
      <header className="estampa estampa-xadrez-mao bg-destaque-claro">
        <div className="folha-destacavel mx-auto max-w-6xl bg-papel px-5 pb-8 sm:px-10">
          <Link to="/estilo" className="mb-4 inline-block font-bold underline decoration-2 underline-offset-4">
            ← Voltar para o guia de estilo
          </Link>
          <h1 className="text-4xl font-semibold sm:text-5xl">Tema Índigo e Bem-estar</h1>
          <p className="mt-4 max-w-2xl text-lg">
            Aprovado. O tema Índigo e a decoração neutra ficam em Ajustes → Aparência, e o tema também aparece no
            primeiro uso. As cores das áreas não mudam em nenhum tema.
          </p>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-4 px-4 pt-8 sm:px-6">
        <Secao id="previa" rotulo="Lado a lado" titulo="O app no tema Índigo">
          <div className="grid gap-6 lg:grid-cols-2">
            <PreviaIndigo />
            <PreviaIndigo escuro />
          </div>
          <p className="mt-4 max-w-3xl text-sm">
            Tudo que era chocolate vira índigo-noite: texto, contornos e sombras. O botão principal fica índigo. No modo
            escuro, o fundo é índigo-noite e os cartões das áreas viram papéis coloridos, com texto escuro dentro.
          </p>
        </Secao>

        <Secao id="paleta" rotulo="Paleta" titulo="Cores do Índigo">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {PALETA_INDIGO.map((c) => (
              <li key={c.nome} className="cartao overflow-hidden bg-papel">
                <span className="block h-16 border-b-2 border-linha" style={{ background: c.hex }} />
                <span className="block px-3 py-2 text-sm">
                  <strong className="block">{c.nome}</strong>
                  {c.hex} · {c.uso}
                </span>
              </li>
            ))}
          </ul>
          <h3 className="mt-8 mb-3 text-2xl font-semibold">Contraste conferido</h3>
          <div className="cartao overflow-x-auto bg-papel">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-linha">
                  <th className="p-3">Uso</th>
                  <th className="p-3">Combinação</th>
                  <th className="p-3">Contraste</th>
                  <th className="p-3">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {CONTRASTES.map(([uso, descricao, a, b, minimo]) => {
                  const valor = contraste(a, b)
                  const passa = valor >= minimo
                  return (
                    <tr key={uso} className="border-b border-linha/30 last:border-0">
                      <td className="p-3 font-bold">{uso}</td>
                      <td className="p-3">
                        <span className="mr-2 inline-flex items-center gap-1 align-middle" aria-hidden="true">
                          <span className="h-4 w-4 rounded-full border border-linha" style={{ background: a }} />
                          <span className="h-4 w-4 rounded-full border border-linha" style={{ background: b }} />
                        </span>
                        {descricao}
                      </td>
                      <td className="p-3 tabular-nums">{numero(valor)}:1</td>
                      <td className="p-3">
                        {passa ? '✓ passa' : '✗ não passa: só entra com contorno'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Secao>

        <Secao id="estampas" rotulo="Novas" titulo="Estampas novas">
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {ESTAMPAS_NOVAS.map((e) => (
              <li key={e.id} className={`cartao estampa estampa-${e.id} flex h-36 items-end bg-papel p-3`}>
                <span className="rounded-full border-2 border-linha bg-papel px-3 py-0.5 text-sm font-bold">{e.nome}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 max-w-3xl text-sm">
            Desenhadas do zero a partir das suas referências. Elas ficam disponíveis em qualquer tema; rabiscos e xadrez
            à mão combinam mais com o Índigo.
          </p>
        </Secao>

        <Secao id="decoracao" rotulo="Opção separada" titulo="Decoração: doce ou neutra">
          <div className="grid gap-4 lg:grid-cols-2">
            <DecoracaoNeutra value={false}>
            <div className="cartao com-rosto bg-papel p-5">
              <h3 className="text-xl font-semibold">Doce</h3>
              <p className="mb-3 text-sm">Adesivos com carinha, corações e cerejas.</p>
              <ul className="flex flex-wrap gap-3" aria-label="Adesivos doces">
                {DOCE.map((n) => (
                  <li key={n}>
                    <Adesivo nome={n} tamanho={52} />
                  </li>
                ))}
                <li>
                  <Adesivo nome="pilula" tamanho={52} />
                </li>
              </ul>
            </div>
            </DecoracaoNeutra>
            <div className="cartao sem-rosto bg-papel p-5">
              <h3 className="text-xl font-semibold">Neutra</h3>
              <p className="mb-3 text-sm">
                Estrela, raio, planeta, onda, montanha e folha no lugar dos enfeites, e os ícones sem carinha.
              </p>
              <ul className="flex flex-wrap gap-3" aria-label="Adesivos neutros">
                {NEUTRA.map((n) => (
                  <li key={n}>
                    <Adesivo nome={n} tamanho={52} />
                  </li>
                ))}
                <li>
                  <Adesivo nome="pilula" tamanho={52} />
                </li>
              </ul>
            </div>
          </div>
          <p className="mt-3 max-w-3xl text-sm">
            A decoração é independente do tema: dá para usar Índigo com decoração doce, ou o tema creme com a neutra.
          </p>
        </Secao>

        <Secao id="bem-estar" rotulo="Aba nova" titulo="Bem-estar: adesivos e cores">
          <ul className="grid grid-cols-3 gap-4 sm:grid-cols-6">
            {BEM_ESTAR.map(([n, nome]) => (
              <li key={n} className="flex flex-col items-center gap-2 text-center text-sm font-semibold">
                <Adesivo nome={n} tamanho={64} />
                {nome}
              </li>
            ))}
          </ul>
          <h3 className="mt-8 mb-3 text-2xl font-semibold">Ameixa e lilás-névoa ao lado da Faculdade</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="cartao flex items-center gap-3 bg-lilas p-4">
              <Adesivo nome="cerebro" tamanho={48} />
              <span className="flex-1 text-lg font-bold">Bem-estar</span>
              <span className="h-6 w-6 rounded-full border-2 border-linha bg-ameixa" aria-hidden="true" />
            </div>
            <div className="cartao flex items-center gap-3 bg-lavanda p-4">
              <Adesivo nome="livro" tamanho={48} />
              <span className="flex-1 text-lg font-bold">Faculdade</span>
              <span className="h-6 w-6 rounded-full border-2 border-linha bg-rosa" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Selo forma="nuvem" cor="ameixa" numero="4" legenda="check-ins" tamanho={100} />
            <p className="max-w-xl text-sm">
              O lilás-névoa é quase tão claro quanto a lavanda da Faculdade, mas puxa para o azul. O que separa as duas
              áreas de verdade é o adesivo, o nome e a cor forte (ameixa × rosa). No modo escuro, a ameixa fica mais
              clara para continuar visível.
            </p>
          </div>
        </Secao>
      </main>
    </div>
  )
}
