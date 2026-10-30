// Controles de aparência: modo, tema, estampa, modo calmo, animações, fonte e tamanho.

import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { ESTAMPAS, type Estampa, type Preferencias } from '../preferencias'

export const NOMES_ESTAMPAS: Record<Estampa, [pt: string, en: string]> = {
  bolinhas: ['Bolinhas', 'Polka dots'],
  xadrez: ['Xadrez', 'Gingham'],
  listras: ['Listras à mão', 'Hand-drawn stripes'],
  coracoes: ['Coraçõezinhos', 'Little hearts'],
  cerejas: ['Cerejas', 'Cherries'],
  estrelas: ['Estrelinhas', 'Little stars'],
  flores: ['Flores retrô', 'Retro flowers'],
  ondas: ['Ondinhas', 'Little waves'],
  caderno: ['Pauta de caderno', 'Notebook lines'],
  confete: ['Confete', 'Confetti'],
  oncinha: ['Oncinha', 'Leopard'],
  patinhas: ['Patinhas', 'Paw prints'],
  rabiscos: ['Rabiscos', 'Doodles'],
  'xadrez-mao': ['Xadrez à mão', 'Hand-painted check'],
}

export function Opcoes<T extends string>({
  legenda,
  dica,
  valor,
  opcoes,
  mudar,
}: {
  legenda: string
  dica?: string
  valor: T
  opcoes: ReadonlyArray<readonly [T, string]>
  mudar: (v: T) => void
}) {
  const nome = useId()
  return (
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="rotulo mb-1.5 w-full">{legenda}</legend>
      {dica && <p className="-mt-1 mb-1 w-full text-sm">{dica}</p>}
      {opcoes.map(([v, rotulo]) => (
        <label
          key={v}
          className={`cursor-pointer rounded-full border-2 border-linha px-3.5 py-1.5 text-sm font-bold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 ${
            valor === v ? 'bg-botao text-botao-texto' : 'bg-papel'
          }`}
        >
          <input type="radio" name={nome} className="so-leitor" checked={valor === v} onChange={() => mudar(v)} />
          {valor === v && <span aria-hidden="true">✓ </span>}
          {rotulo}
        </label>
      ))}
    </fieldset>
  )
}

export function PainelAparencia({ prefs, mudar }: { prefs: Preferencias; mudar: (p: Partial<Preferencias>) => void }) {
  const { t, i18n } = useTranslation()
  const ingles = i18n.language === 'en'
  return (
    <div className="cartao grid gap-5 bg-papel p-5 md:grid-cols-2">
      <Opcoes
        legenda={t('ajustes.modo')}
        valor={prefs.modo}
        opcoes={[
          ['auto', t('ajustes.modoAuto')],
          ['claro', t('ajustes.modoClaro')],
          ['escuro', t('ajustes.modoEscuro')],
        ]}
        mudar={(modo) => mudar({ modo })}
      />
      <Opcoes
        legenda={t('ajustes.tema')}
        valor={prefs.tema}
        opcoes={[
          ['creme', t('ajustes.temaCreme')],
          ['cereja', t('ajustes.temaCereja')],
          ['piscina', t('ajustes.temaPiscina')],
          ['pessego', t('ajustes.temaPessego')],
          ['indigo', t('ajustes.temaIndigo')],
        ]}
        mudar={(tema) => mudar({ tema })}
      />
      <Opcoes
        legenda={t('ajustes.decoracao')}
        dica={t('ajustes.decoracaoDica')}
        valor={prefs.decoracao}
        opcoes={[
          ['doce', t('ajustes.decoracaoDoce')],
          ['neutra', t('ajustes.decoracaoNeutra')],
        ]}
        mudar={(decoracao) => mudar({ decoracao })}
      />
      <div className="md:col-span-2">
        <Opcoes
          legenda={t('ajustes.estampa')}
          valor={prefs.estampa}
          opcoes={ESTAMPAS.map((e) => [e, NOMES_ESTAMPAS[e][ingles ? 1 : 0]] as const)}
          mudar={(estampa) => mudar({ estampa })}
        />
      </div>
      <Opcoes
        legenda={t('ajustes.calmo')}
        dica={t('ajustes.calmoDica')}
        valor={prefs.calmo ? 'sim' : 'nao'}
        opcoes={[
          ['nao', t('ajustes.desligado')],
          ['sim', t('ajustes.ligado')],
        ]}
        mudar={(v) => mudar({ calmo: v === 'sim' })}
      />
      <Opcoes
        legenda={t('ajustes.animacoes')}
        valor={prefs.animacoes ? 'sim' : 'nao'}
        opcoes={[
          ['sim', t('ajustes.ligadas')],
          ['nao', t('ajustes.desligadas')],
        ]}
        mudar={(v) => mudar({ animacoes: v === 'sim' })}
      />
      <Opcoes
        legenda={t('ajustes.fonte')}
        valor={prefs.fonte}
        opcoes={[
          ['padrao', t('ajustes.fontePadrao')],
          ['legivel', t('ajustes.fonteLegivel')],
        ]}
        mudar={(fonte) => mudar({ fonte })}
      />
      <Opcoes
        legenda={t('ajustes.tamanho')}
        valor={prefs.tamanho}
        opcoes={[
          ['normal', 'A'],
          ['grande', 'A+'],
          ['maior', 'A++'],
          ['enorme', 'A+++'],
        ]}
        mudar={(tamanho) => mudar({ tamanho })}
      />
    </div>
  )
}
