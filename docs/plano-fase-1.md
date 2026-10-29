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
  pauta de caderno, confete e oncinha. Novas (14 no total): patinhas, rabiscos e xadrez à mão. Geradas por `scripts/gerar-estampas.py`.
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

## Adicional: Bem-estar e tema Índigo

Registrado em [`adicional-bem-estar-indigo.md`](adicional-bem-estar-indigo.md). Plano aprovado: I1 (Índigo) e B1–B8 (Bem-estar) vêm antes da etapa 9.
Guia de estilo do Índigo em `#/estilo/indigo`.

## Etapas

| Etapa | O que entra | Situação |
|---|---|---|
| 1 | Guia de estilo (cores, fontes, adesivos, estampas, cartões, gráficos) | Aprovada |
| 2 | Base: navegação, acessibilidade, PT/EN, banco local, exportar/apagar, PWA offline | Pronta |
| 3 | Primeiro uso e plano de 2 semanas | Pronta |
| 4 | Captura rápida, caixa de entrada, tarefas A/B/C com passos | Pronta |
| 5 | Tela Hoje e **janelinha flutuante** (widget) | Pronta |
| 6 | Remédios e sistema de lembretes | Pronta |
| 7 | Consultas e arquivo .ics | Pronta |
| 8 | Calendário semana/mês e **importar calendário** | Pronta |
| I1 | **Tema Índigo**, estampas novas, decoração doce/neutra | Pronta (zebrinha recusada) |
| B1 | **Bem-estar**: base da aba, ativada nos Ajustes (atalho B) | Pronta |
| B2 | **Bem-estar**: check-in de emoções e plano por faixa | Pronta |
| B3 | **Bem-estar**: sintomas com o porquê e visão do mês | Pronta |
| B4 | **Bem-estar**: hobbies (desbote, porquê, pausar, arquivar, agenda, mês) | Pronta |
| B5 | **Bem-estar**: sugestões de atividade e "ajudou?" | Pronta |
| B6 | **Bem-estar**: sono (horários, rotina, diário, "Não consigo dormir") | Pronta |
| B7 | **Bem-estar**: remédio no plano, padrões, "vale conversar com um profissional", resumo para a consulta | Pronta |
| B8 | **Bem-estar**: PIN, avisos discretos, lembretes de check-in, baixar/apagar só o Bem-estar | Pronta |
| 9 | Faculdade: semestre, provas e entregas, planejamento de trás para frente (parte 1) | Pronta |
| 9 | Modo foco, saída do hiperfoco, estudo acompanhado (parte 2) | Pronta |
| 10 | Academia: hábitos com plano se-então, versão mínima e "X de 7 dias" (parte 1) | Pronta |
| 10 | Base de lançamento e treino acompanhado (parte 2) | |
| 11 | Quarto | |
| 12 | Alimentação | |
| 13 | **Dinheiro**: contas a pagar, potes da semana, pausa antes de comprar, cofrinho | |
| 14 | Rituais e revisão semanal (com 5 min de dinheiro) | |
| 15 | **Meus objetivos** com gráficos | |
| 16 | Álbum de adesivos, recompensas e conferência final | |

## Faculdade (etapa 9)

- Configuração do semestre: matérias e várias provas/entregas de uma vez (linhas sem matéria ou data ficam de fora).
- Lembretes automáticos 14 e 3 dias antes, uma vez no dia, a partir das 9h, só com a área Faculdade ligada
  (respeitam os avisos discretos). Provas e entregas aparecem no calendário e, no dia, na linha do dia da tela Hoje.
- Planejamento de trás para frente: o conteúdo (um assunto por linha) vira sessões de 25, 35 ou 45 min espalhadas
  do início até a véspera; a véspera fica para a revisão geral (se houver pelo menos 2 dias); com mais assuntos do
  que vagas, junta assuntos na mesma sessão. Cada sessão vira uma tarefa da Faculdade no dia, com o primeiro passo
  ("Abrir o material de…") e o "pronto quando"; entra como A se couber no limite de 3 do dia, senão como B.
  Apagar a prova leva junto as sessões ainda não feitas (com desfazer).
- "Estudar agora" no topo da Faculdade: as sessões de hoje (e as que ficaram para trás), cada uma com o modo foco.
- Modo foco (`#/foco`, fora da moldura, sem menu): escolher a tarefa (ou "outra coisa"), primeiro passo físico,
  "pronto quando", quanto acha que vai levar e bloco de 25, 35 ou 45 min. Opções lembradas: mexer o corpo 5 min
  antes (com timer), abrir em tela cheia e sino suave. Durante: o passo grande, o timer visual, "tirar da cabeça"
  (vai para a caixa de entrada) e a tela fica acesa. O tempo vem do início de cada fase: recarregar ou trocar de tela
  não perde nada, e uma faixa nas outras telas mostra quanto falta.
- Saída do hiperfoco: no fim do bloco, sino e (com o app escondido) aviso do sistema, uma vez por fase; atividade-ponte
  (água, alongar, guardar o material), "onde parei", pausa de verdade (5 min; 10 depois de 45), "mais 5 min" no máximo
  2 vezes seguidas, ou terminar. O tempo do alarme e das pausas não conta como foco.
- Fim: "achei × levou" em barras (a de "levou" listrada), sem julgamento; com 3 sessões ou mais, o fator do
  histórico (mediana das últimas 10) e, na preparação, a sugestão de quanto reservar. A sessão é guardada, os minutos
  somam na tarefa, dá para concluir a tarefa ali, e o "onde parei" vira o próximo passo dela.
- Entradas: "Estudar agora", cartão "Agora" da tela Hoje e cada cartão de tarefa (volta para a tela de onde saiu).
- Estudo acompanhado: combinados com onde, dias da semana e hora, aviso 10 min antes (uma vez por encontro, só com a
  Faculdade ligada, respeita os avisos discretos), o próximo encontro à vista e o aviso de que a pesquisa ainda é inicial.

## Academia (etapa 10)

- Hábitos com plano se-então ("Se eu chegar da faculdade, então troco de roupa antes de sentar") e versão mínima,
  que também conta como feito. Modelos prontos e editáveis (ir à academia, caminhada, alongar) ou do zero.
- Dias combinados (a meta vem dos dias) ou "qualquer dia" com quantas vezes por semana; parte do dia opcional
  (manhã, tarde, noite) para o cartão "Agora" e a linha do dia.
- Registro: "Fiz!" ou "Fiz a versão mínima", com desfazer. Um registro por dia. Na grade da semana (segunda a
  domingo, "X de 7 dias") dá para tocar num dia esquecido (feito → mínima → nada); dia sem registro tem só contorno,
  nunca cor de erro; dia não combinado fica com um pontinho e, se fizer, conta.
- Meta da semana sem cobrança: "Nesta semana: 2 de 3" ou "Meta da semana feita!".
- Tela Hoje: hábito pendente do bloco atual (ou sem bloco) entra no "Agora" depois das tarefas A; os hábitos de hoje
  aparecem na linha do dia (com ✓ e "mín.") e no anel de progresso da Academia. Só das áreas ligadas.
- Lembrete opcional no horário escolhido, com o plano escrito ("Ir à academia: Se…, então…"), uma vez por dia e só se
  ainda não fez (respeita os avisos discretos).
- Arquivar sem culpa (não apaga, dá para trazer de volta); apagar com desfazer. Na caixa de entrada, "Virar hábito".
- A grade da semana agora fala português e inglês; nos remédios, dia sem dose aparece como "não estava combinado"
  e o meio-termo como "só parte das doses".

## Lógica com testes automáticos

Horários de lembretes (adiar, repetir, silêncio), recorrências, vencimento de contas (ex.: dia 31 em mês de 30 dias),
saldo dos potes e virada da semana, espera de 48 h da lista de desejos, progresso do cofrinho, planejamento reverso (prova → sessões; consulta → alarmes),
avisos do semestre, fases do modo foco e "achei × levou", aviso do estudo acompanhado, estoque de remédio, "X de 7 dias", limite de 3 tarefas A, escolha do cartão "Agora",
importação de .ics sem duplicar, e o contraste de todas as cores usadas.
