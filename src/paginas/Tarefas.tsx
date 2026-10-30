// Lista de tarefas: A de hoje (até 3), A de outro dia, B, C e o que já foi feito hoje.

import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Adesivo } from '../componentes/Adesivo'
import { Botao } from '../componentes/Botao'
import { CartaoTarefa } from '../componentes/CartaoTarefa'
import { EditorTarefa } from '../componentes/EditorTarefa'
import type { Tarefa } from '../dados/banco'
import { novaTarefa, useTarefas } from '../dados/tarefas'
import { diaLocal } from '../logica/datas'
import { agruparTarefas, cabeTarefaA, LIMITE_TAREFAS_A, tarefasADoDia } from '../logica/tarefas'

function Grupo({ id, titulo, dica, extra, children }: { id: string; titulo: string; dica?: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h2 id={id} className="text-2xl font-semibold">
          {titulo}
        </h2>
        {extra}
        {dica && <p className="w-full text-sm">{dica}</p>}
      </div>
      {children}
    </section>
  )
}

export function Tarefas() {
  const { t } = useTranslation()
  const tarefas = useTarefas()
  const [editando, setEditando] = useState<{ tarefa: Tarefa; nova: boolean } | null>(null)
  if (!tarefas) return null
  const hoje = diaLocal()
  const g = agruparTarefas(tarefas, hoje)
  const usadasA = tarefasADoDia(tarefas, hoje).length
  const cabeA = cabeTarefaA(tarefas, hoje)
  const lista = (itens: Tarefa[], deOutroDia = false) =>
    itens.length ? (
      <ul className="flex flex-col gap-3">
        {itens.map((tarefa) => (
          <li key={tarefa.id}>
            <CartaoTarefa
              tarefa={tarefa}
              editar={() => setEditando({ tarefa, nova: false })}
              deOutroDia={deOutroDia}
              podeTrazerParaHoje={cabeA}
            />
          </li>
        ))}
      </ul>
    ) : null

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 tabIndex={-1} className="flex flex-1 items-center gap-3 text-4xl font-semibold outline-none sm:text-5xl">
          <Adesivo nome="lista" tamanho={56} />
          {t('tarefas.titulo')}
        </h1>
        <Botao onClick={() => setEditando({ tarefa: novaTarefa(), nova: true })} icone={<span aria-hidden="true">+</span>}>
          {t('tarefas.nova')}
        </Botao>
      </div>

      <Grupo
        id="grupo-a"
        titulo={t('tarefas.grupoA')}
        dica={t('tarefas.grupoADica')}
        extra={
          <span className="flex gap-1" role="img" aria-label={`${usadasA} / ${LIMITE_TAREFAS_A}`}>
            {Array.from({ length: LIMITE_TAREFAS_A }, (_, i) => (
              <span key={i} className={`h-4 w-4 rounded-full border-2 border-linha ${i < usadasA ? 'bg-tinta' : ''}`} />
            ))}
          </span>
        }
      >
        {lista(g.a) ?? <p className="cartao bg-papel p-4">{t('tarefas.vazioA')}</p>}
      </Grupo>

      {g.deOutroDia.length > 0 && (
        <Grupo id="grupo-outro" titulo={t('tarefas.grupoOutroDia')}>
          {lista(g.deOutroDia, true)}
        </Grupo>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <Grupo id="grupo-b" titulo={t('tarefas.grupoB')}>
          {lista(g.b) ?? <p className="text-sm">{t('tarefas.vazio')}</p>}
        </Grupo>
        <Grupo id="grupo-c" titulo={t('tarefas.grupoC')}>
          {lista(g.c) ?? <p className="text-sm">{t('tarefas.vazio')}</p>}
        </Grupo>
      </div>

      {g.feitasHoje.length > 0 && (
        <Grupo id="grupo-feitas" titulo={t('tarefas.feitasHoje')}>
          {lista(g.feitasHoje)}
        </Grupo>
      )}

      {editando && <EditorTarefa tarefa={editando.tarefa} nova={editando.nova} fechar={() => setEditando(null)} />}
    </div>
  )
}
