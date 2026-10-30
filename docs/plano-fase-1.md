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
| 10 | Base de lançamento, treino acompanhado e movimento antes do foco (parte 2) | Pronta |
| 11 | Quarto: zonas, reset de 10 minutos e o reset como hábito (parte 1) | Pronta |
| 11 | Um lugar para cada coisa e fotos de antes e depois (parte 2) | Pronta |
| 12 | Alimentação: bolinhas das refeições e da água, horários e lembretes (parte 1) | Pronta |
| 12 | Comidas fáceis, "não sei o que comer" e lista de compras (parte 2) | Pronta |
| 13 | **Dinheiro**: contas a pagar (parte 1) | Pronta |
| 13 | **Dinheiro**: potes da semana e gasto rápido pelo ⌘K (parte 2) | Pronta |
| 13 | **Dinheiro**: pausa antes de comprar e cofrinho (parte 3) | Pronta |
| 14 | **Rituais** da manhã e da noite, guiados, com check-in e rotina de desacelerar (parte 1) | Pronta |
| 14 | Revisão semanal (com 5 min de dinheiro e os hobbies) (parte 2) | |
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
- Base de lançamento: o que deixar pronto na véspera (os modelos já trazem mochila, garrafa, fone), marcado item a
  item para o próximo dia do hábito (hoje, se ainda não fez e é de dia; a partir das 18h, o próximo dia combinado).
  Preparo de outro dia não vale. No bloco da noite da tela Hoje, "Base para amanhã" leva à Academia.
- Treino acompanhado: "com quem" no cartão e "Combinei com…" no preparo.
- Aviso na véspera (opcional, no horário escolhido): "Amanhã: Ir à academia — Deixar pronto: mochila, garrafa, fone.
  Combinar com…". Só se amanhã é dia combinado e ainda falta algo; uma vez por dia.
- Modo foco: mexer o corpo antes por 5, 15 ou 20 min (escolha lembrada); durante o movimento, "Conta para a
  Academia?" marca como feito um hábito da Academia que ainda falta hoje.
- A grade da semana agora fala português e inglês; nos remédios, dia sem dose aparece como "não estava combinado"
  e o meio-termo como "só parte das doses".

## Quarto (etapa 11)

- Zonas prontas e editáveis (mesa, cama, chão, roupas), cada uma com a lista do que fazer nela. Criadas uma vez só
  na primeira visita; apagadas, não voltam (apagar tem desfazer). Dá para renomear, acrescentar e tirar itens e criar zonas.
- Reset de 5, 10 ou 15 minutos numa zona por vez. A zona sugerida é a que nunca teve reset (na ordem) ou a que está
  há mais tempo sem; cada zona mostra "hoje", "há 3 dias" ou "ainda sem reset".
- Tela do reset (`#/quarto/reset`, sem menu): timer grande para ver de longe, a lista da zona em botões grandes e a tela
  acesa. O tempo vem do início (recarregar não perde nada). Quando o tempo acaba: sino (segue a escolha do modo foco),
  aviso do sistema com o app escondido, "Pode parar aqui: já conta" e até 2 "mais 5 min" (5 minutos inteiros a partir
  do clique). No fim: "Reset feito!", itens feitos e minutos; guardar ou sair sem guardar.
- Semana de resets ("X de 7 dias"), sem cor de erro.
- O reset como hábito (modelo: "Se eu chegar em casa à noite, então faço o reset de uma zona do quarto", mínima
  "guardar 5 coisas", à noite). Guardar um reset marca como feito o hábito do quarto que ainda falta hoje. No cartão
  "Agora", o hábito do quarto tem o link "Fazer o reset agora".
- Um lugar para cada coisa: "coisa → onde fica", com busca sem acento nem maiúscula (pela coisa ou pelo lugar), em
  ordem alfabética; não repete a mesma coisa; ideias prontas (chave, carteira, carregador…) que somem quando já estão
  na lista; editar e apagar com desfazer.
- Fotos de antes e depois (opcionais): tiradas na tela do reset (câmera no iPad e no celular, arquivo no computador),
  reduzidas no próprio aparelho (lado maior até 1024 px, JPEG) e guardadas só nele, como texto (entram no backup).
  Trocar a foto apaga a anterior; sair sem guardar apaga as fotos daquele reset. Em "Antes e depois", as fotos coladas
  com fita, com zona e data, e "Apagar estas fotos" com desfazer.
- Hábitos agora servem a mais de uma área: anel de cada área na tela Hoje, aviso que abre a tela da área, arquivados
  em cada tela, e "Virar hábito" na caixa de entrada pergunta a área quando há mais de uma ligada.

## Alimentação (etapa 12)

- Regularidade, não restrição: sem calorias, peso ou comida certa ou errada.
- Bolinhas das refeições de hoje (café da manhã, almoço, lanche, jantar): tocar marca, tocar de novo desmarca.
  Copos de água: tocar no copo 3 enche até ele; tocar no último cheio esvazia esse.
- Horários e lembretes: cada refeição pode ser desligada, renomeada e ter horário; lembrete opcional na hora
  ("Hora de comer: Almoço — Comer alguma coisa, mesmo sem fome, e marcar no app"), uma vez por dia e só se ainda não
  marcou (respeita os avisos discretos). Quantos copos acompanhar (3 a 15).
- Semana: dia com todas as refeições, com algumas ("2/4") ou sem registro (contorno vazio, nunca erro).
- Tela Hoje: a refeição entra no "Agora" na hora dela (até 1 hora depois, depois sai sem cobrança), antes das tarefas
  A e depois de remédio, transição e compromisso; "Comi" marca ali mesmo. Refeições na linha do dia, no bloco do
  horário, e no anel da Alimentação. Só com a área ligada.
- "Não sei o que comer" (também pelo link do cartão "Agora", que abre direto nas ideias com o foco no título): a
  refeição mais perto de agora já vem escolhida; até 3 ideias da lista de comidas fáceis que servem para ela, em ordem
  alfabética, e "outras ideias" passa para as próximas.
- Comidas fáceis: o que a pessoa já sabe preparar ou compra pronto, para quais refeições serve e os ingredientes.
  "Começar com algumas ideias" (editáveis), editar, apagar com desfazer e "pôr os ingredientes na lista de compras"
  (sem repetir o que já está nela).
- Lista de compras: vários itens de uma vez (separados por vírgula), sem repetir; tocar marca comprado (vai para o fim,
  riscado); "tirar os comprados" com desfazer.
- A moldura não tira mais o foco de um título que a própria tela já focou (links para uma seção).

## Dinheiro (etapa 13)

- Contas a pagar: nome, valor (opcional, lido do jeito que a pessoa escrever: "129,9", "1.500", "R$ 35,90"),
  todo mês (dia 1 a 31; em mês mais curto, vence no último dia) ou uma vez só (com data), avisar 0 a 7 dias antes e
  a ação escrita do lembrete ("pagar no app do banco e marcar aqui"; sem ação, "Pagar e marcar aqui no app.").
- Uma conta só vence nos meses em que já existia no dia do vencimento (cadastrar no dia 15 não cobra o dia 10).
  O mês passado não pago aparece como "venceu · ainda dá para pagar" (só ele, nunca uma fila), sem cor de alerta.
- Lista da mais urgente para a mais longe, com "Paguei" (desfazer), as pagas do mês recolhidas (desmarcar) e um resumo
  neutro: "Em outubro: 1 de 3 contas pagas · R$ 129,90 de R$ 2.129,90".
- Lembrete a partir das 9h, no dia de avisar e no dia do vencimento, só se não foi paga (respeita os avisos discretos).
- Vencimentos no calendário; na tela Hoje, a conta que vence hoje ou que venceu aparece no topo da linha do dia.
  Só com a área ligada.
- Potes da semana: quanto dá para gastar de segunda a domingo em cada pote; a barra esvazia com os gastos (os números
  dizem o mesmo em texto) e na segunda o pote começa cheio de novo. Passar do combinado: "R$ 15,00 além do combinado",
  barra vazia, sem cor de alerta. Ideias de nome (Mercado, Comida fora, Transporte, Lazer); editar, apagar com desfazer
  (os gastos ficam sem pote).
- Gasto: pelo formulário ou pelo ⌘K, com a área ligada: linha que começa com um valor ("35 ifood", "R$ 12 uber") vira
  gasto; cai no pote pelo nome ou pelas palavras do pote; "Não era gasto" desfaz e manda a linha para a caixa.
  Gastos da semana com o pote de cada um (sem pote: a lista vem aberta para escolher), apagar com desfazer.
- Pausa antes de comprar: a vontade vai para a lista de desejos (com valor opcional) e espera 48 h ("pode decidir
  ter, 13 de out, 10:00 · faltam 48 horas"). Depois: "Ainda quer?" (sim, vou comprar / não quero mais), com desfazer;
  aviso do sistema uma vez quando a espera acaba (das 9h às 21h, até 3 dias depois). "Este mês, R$ 250,00 ficou com
  você" soma o que a pessoa decidiu não comprar.
- Cofrinho: nome e meta; guardar e tirar (com desfazer); o total grande, a barra e "faltam R$ X" ou "Meta alcançada!";
  gráfico de colunas do que entrou por mês nos últimos 6 meses (um tom, valor só na última coluna, dica no hover e no
  foco, "Ver como tabela" em reais). O campo `objetivoId` fica pronto para ligar o cofrinho a um objetivo (etapa 15).
- O gráfico de colunas aceita valores formatados (reais) e o "Ver como tabela" fala português e inglês.

## Rituais (etapa 14)

- Tela Rituais (atalho R): estampa no alto, letreiro com frases curtas, os dois rituais com os passos de cada um,
  "é a hora deste" (manhã das 5h às 15h; noite depois), a semana em adesivos de cada um e os lembretes.
- Cada ritual é guiado, um passo por vez, com o timer visual de 5 minutos. Passou dos 5 minutos: "tudo bem passar",
  e dá para pedir mais 5. Sair no meio guarda o passo ("Continuar no passo 3 de 4"); dá para pular para qualquer
  passo pela barrinha de cima. No fim, "Pronto!" com a hora e "Fazer de novo".
- Manhã: como você está (check-in curto, só com o Bem-estar e o check-in ligados, atrás do PIN); ver o dia
  (consultas com a hora de se arrumar, eventos, provas e entregas, contas do dia, hábitos de hoje); escolher até 3
  tarefas A (primeiro as A que ficaram de outro dia, depois as A sem dia, as B e as C; escolher o bloco; tirar de
  hoje vira B; "outra coisa para hoje"); remédios e consultas (doses de hoje com "tomei"; consultas dos próximos
  7 dias e as que já está na hora de marcar), só com essas áreas ligadas.
- Noite: marcar o que fez (tarefas do dia, hábitos com "fiz" e "fiz o mínimo", doses sem resposta); passar
  pendências (para amanhã, se couber no limite de 3 A, ou virar B); esvaziar a caixa de entrada (as mesmas decisões
  da tela da caixa); preparar amanhã (o que está marcado, as A de amanhã e a base de lançamento dos hábitos);
  desacelerar (a rotina do sono e a hora de acordar, só com o Bem-estar e o sono ligados, atrás do PIN).
- A noite vai até as 5h: o ritual feito à 1h conta para o dia anterior.
- Lembrete opcional de cada ritual num horário fixo: toca uma vez, até 30 min depois, só se o ritual ainda não foi
  feito (respeita os avisos discretos). Na tela Hoje, "Ritual da manhã · 5 min" e "Ritual da noite · 5 min" ficam
  nos blocos da manhã e da noite, com ✓ quando feitos. O cartão do plano de 2 semanas abre os rituais nos dias 3 a 6.
- Ao mudar uma tarefa de lista, o foco do teclado vai para a próxima, e não para o começo da página.

## Lógica com testes automáticos

Horários de lembretes (adiar, repetir, silêncio), recorrências, vencimento de contas (ex.: dia 31 em mês de 30 dias),
saldo dos potes e virada da semana, espera de 48 h da lista de desejos, progresso do cofrinho, planejamento reverso (prova → sessões; consulta → alarmes),
avisos do semestre, fases do modo foco e "achei × levou", aviso do estudo acompanhado, hábitos (semana, pendente hoje, véspera), reset do quarto, refeições e água, ideias de comida e lista de compras, contas, potes e gasto rápido, pausa de 48 h, cofrinho, estoque de remédio, "X de 7 dias", limite de 3 tarefas A, escolha do cartão "Agora",
importação de .ics sem duplicar, passos e dia dos rituais (a noite até as 5h), escolha das tarefas A e pendências da noite,
agenda do dia, e o contraste de todas as cores usadas.
