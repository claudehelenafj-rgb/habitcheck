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
- Estampas trocáveis (11): bolinhas, xadrez, listras à mão, coraçõezinhos, cerejas, estrelinhas, flores retrô, ondinhas,
  pauta de caderno, confete e oncinha. Geradas por `scripts/gerar-estampas.py`.
- Modo escuro **cereja**: fundo cereja escuro, texto creme; cartões das áreas continuam nos tons claros, com texto chocolate.
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

### Dinheiro (planejamento financeiro)
Área nova, cor menta + verde-piscina, adesivo de cofrinho. Nada se conecta ao banco; tudo fica no aparelho;
sem conselho de investimento. O guia científico não trata de finanças: os recursos usam as estratégias gerais
(lembrete com a ação escrita, deixar à vista, revisão semanal).

Na Fase 1:
1. **Contas a pagar:** vencimento, valor, repetição mensal; lembrete com a ação ("pagar a conta de luz no app do
   banco e marcar aqui") alguns dias antes e no dia; vencimentos aparecem no calendário.
2. **Potes da semana:** quanto posso gastar em cada pote (mercado, lazer, transporte...); a barra esvazia conforme
   os gastos; gasto rápido pelo Cmd+K ("35 ifood").
3. **Pausa antes de comprar:** a compra por impulso vai para uma lista de desejos e espera 48 h; depois, "ainda quero?".
4. **Cofrinho:** meta de economia ligada a um objetivo, com gráfico do que já foi guardado.
5. **Dinheiro na revisão semanal:** 5 minutos para contas, potes e cofrinho.

Depois: assinaturas (aviso antes de renovar).

Valores guardados em centavos (números inteiros, sem erro de arredondamento) e mostrados em reais.

### Widget no Mac
- Widget nativo do macOS (Central de Widgets) só existe para apps nativos em Swift; um app web não consegue criar.
- **Fase 1 (etapa 5):** "Janelinha flutuante" com o cartão Agora, timer e remédios do dia.
  - Chrome e Edge: fica sempre por cima das outras janelas (Document Picture-in-Picture).
  - Safari: app instalado no Dock abre em modo compacto, numa janela pequena.
- **Fase 3 (opcional):** widget nativo de verdade, com um pequeno app para Mac.

## Etapas

| Etapa | O que entra | Situação |
|---|---|---|
| 1 | Guia de estilo (cores, fontes, adesivos, estampas, cartões, gráficos) | Aprovada |
| 2 | Base: navegação, acessibilidade, PT/EN, banco local, exportar/apagar, PWA offline | Pronta |
| 3 | Primeiro uso e plano de 2 semanas | Pronta |
| 4 | Captura rápida, caixa de entrada, tarefas A/B/C com passos | Pronta |
| 5 | Tela Hoje e **janelinha flutuante** (widget) | Pronta |
| 6 | Remédios e sistema de lembretes | Pronta |
| 7 | Consultas e arquivo .ics | |
| 8 | Calendário semana/mês e **importar calendário** | |
| 9 | Faculdade, modo foco, saída do hiperfoco | |
| 10 | Academia | |
| 11 | Quarto | |
| 12 | Alimentação | |
| 13 | **Dinheiro**: contas a pagar, potes da semana, pausa antes de comprar, cofrinho | |
| 14 | Rituais e revisão semanal (com 5 min de dinheiro) | |
| 15 | **Meus objetivos** com gráficos | |
| 16 | Álbum de adesivos, recompensas e conferência final | |

## Lógica com testes automáticos

Horários de lembretes (adiar, repetir, silêncio), recorrências, vencimento de contas (ex.: dia 31 em mês de 30 dias),
saldo dos potes e virada da semana, espera de 48 h da lista de desejos, progresso do cofrinho, planejamento reverso (prova → sessões; consulta → alarmes),
avisos do semestre, estoque de remédio, "X de 7 dias", limite de 3 tarefas A, escolha do cartão "Agora",
importação de .ics sem duplicar, e o contraste de todas as cores usadas.
