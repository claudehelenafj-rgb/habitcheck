# Caderninho: plano da Fase 1

App de hábitos e rotina visual para pessoas com TDAH (e TDAH + autismo).
Base: guia "Estratégias de organização para pessoas com TDAH e Autismo" (PubMed e SciELO, out/2026).

## Decisões já tomadas

| Assunto | Decisão |
|---|---|
| Nome | **Caderninho** |
| Plataforma | App web instalável (PWA), local-first, offline |
| Tecnologia | React 19, TypeScript, Vite 8, Tailwind 4, Dexie 4 (banco local), vite-plugin-pwa, Vitest |
| Títulos | Fraunces (variável, eixo "soft") |
| Destaques | Instrument Serif itálico |
| Texto | DM Sans |
| Anotações à mão | Caveat (só detalhes curtos) |
| Fonte legível (opção) | Atkinson Hyperlegible Next |
| Fontes | Guardadas dentro do app (offline, sem chamar o Google) |
| "Por que isso funciona?" | **Removido** a pedido. As estratégias do guia continuam guiando o design, sem botão de explicação |
| Academia | Entra na Fase 1 |
| Opcionais (energia, aviso de mudança, previsível/novidade) | Fase 3 |

## Estilo visual (referências)

- Adesivos de papel recortado: formas facetadas em duas camadas, borda branca, textura de papel.
- Carinhas fofas (olhos, sorriso, bochechas) em alguns adesivos.
- Miçangas de letrinhas para palavras curtas ("HOJE", o nome do app).
- Folha de caderno com furos, margem vermelha, pauta azul, fita adesiva e estrelinhas de giz de cera.
- Estampas trocáveis: bolinhas, xadrez, listras, coraçõezinhos, cerejas, estrelinhas, florzinhas, ondinhas e pauta de caderno.
- Tudo desenhado do zero; nada copiado das referências.

## Novidades pedidas depois do plano

### Meus objetivos
- A pessoa escreve o objetivo final e "por que isso importa para mim" numa folha de caderno.
- Liga ao objetivo os hábitos, tarefas e sessões de estudo que o fazem andar.
- O ritual da manhã mostra o porquê de um objetivo por dia; a revisão semanal pergunta "isso ainda é importante pra mim?".
- Painel com números e gráficos do que foi feito: dias com ação por semana (colunas), minutos de foco por dia (mapa de calor do mês), totais do mês.
- Gráficos só mostram o que foi feito. Semana parada não vira barra vermelha; dia sem registro fica neutro.
- Sempre há "Ver como tabela" com os mesmos números.

### Importar calendário (Apple e Google)
- **Fase 1:** botão "Importar calendário" que lê um arquivo `.ics`.
  - Apple Calendar: Arquivo → Exportar → Exportar…
  - Google Agenda: Configurações → Importar e exportar → Exportar (vem um .zip com os .ics).
  - Importar de novo atualiza o que mudou (pelo identificador de cada evento), sem duplicar.
  - Eventos importados ficam marcados com a origem ("veio da Apple", "veio do Google").
- **Fase 2:** assinar o link do calendário (atualiza sozinho). Precisa de servidor, porque o navegador não consegue buscar esses links diretamente.

## Etapas

| Etapa | O que entra | Situação |
|---|---|---|
| 1 | Guia de estilo (cores, fontes, adesivos, estampas, cartões, gráficos) | Aguardando aprovação |
| 2 | Base: navegação, acessibilidade, PT/EN, banco local, exportar/apagar, PWA offline | |
| 3 | Primeiro uso e plano de 2 semanas | |
| 4 | Captura rápida, caixa de entrada, tarefas A/B/C com passos | |
| 5 | Tela Hoje | |
| 6 | Remédios e sistema de lembretes | |
| 7 | Consultas e arquivo .ics | |
| 8 | Calendário semana/mês e **importar calendário** | |
| 9 | Faculdade, modo foco, saída do hiperfoco | |
| 10 | Academia | |
| 11 | Quarto | |
| 12 | Alimentação | |
| 13 | Rituais e revisão semanal | |
| 14 | **Meus objetivos** com gráficos | |
| 15 | Álbum de adesivos, recompensas e conferência final | |

## Lógica com testes automáticos

Horários de lembretes (adiar, repetir, silêncio), recorrências, planejamento reverso (prova → sessões; consulta → alarmes),
avisos do semestre, estoque de remédio, "X de 7 dias", limite de 3 tarefas A, escolha do cartão "Agora",
importação de .ics sem duplicar, e o contraste de todas as cores usadas.
