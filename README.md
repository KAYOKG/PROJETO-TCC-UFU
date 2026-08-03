# Análise Comportamental com Machine Learning

**Trabalho de Conclusão de Curso - Bacharelado em Sistemas de Informação**
Universidade Federal de Uberlândia (UFU), Campus Monte Carmelo, MG

**Autor:** Kayo Galdino Gomes Rocha

Tecnologias: Node.js, React, TypeScript, TensorFlow.js, MUI, SQLite

---

## Sobre o Projeto

Este projeto detecta comportamentos suspeitos em um ERP de corretagem de café usando aprendizado de máquina. O sistema coleta logs das atividades dos usuários em tempo real, extrai features comportamentais e classifica cada ação como normal ou suspeita por meio de uma rede neural treinada com TensorFlow.js.

### Problema

ERPs corporativos são alvos frequentes de atividades indevidas, do vazamento de dados ao comprometimento de contas. As abordagens tradicionais, baseadas em regras estáticas, têm dificuldade para detectar padrões sutis e não se adaptam a novos vetores de ataque.

### Hipótese

A classificação supervisionada com TensorFlow.js supera as regras estáticas na detecção de anomalias comportamentais em logs de sistemas ERP.

### Resultados

A tabela abaixo compara o modelo de ML com o baseline de regras estáticas no conjunto de teste de 1.500 amostras.

| Métrica   | Modelo ML | Regras Estáticas | Diferença    |
| --------- | --------- | ---------------- | ------------ |
| Accuracy  | 99,67%    | 83,93%           | +15,74 p.p.  |
| Precision | 99,87%    | 95,69%           | +4,18 p.p.   |
| Recall    | 99,48%    | 71,98%           | +27,50 p.p.  |
| F1-Score  | 99,68%    | 82,16%           | +17,52 p.p.  |
| AUC-ROC   | 0,9999    | —                | —            |

As métricas foram obtidas com dataset sintético. Os perfis de comportamento têm padrões bem definidos e separáveis por design, então comportamentos reais, que tendem a se sobrepor de forma mais sutil, produziriam métricas menores. Essa ressalva está detalhada na seção de [Limitações](#limitações).

---

## Arquitetura do Sistema

### Visão Geral

O frontend, em React com Vite, faz a inferência em tempo real no navegador. O backend, em Express com Node.js, cuida do treinamento e da API REST. O modelo treinado é servido pelo backend e carregado uma única vez pelo frontend.

```
graph TB
    subgraph Frontend["Frontend (React + Vite)"]
        UI[Interface MUI]
        Zustand[Zustand Store]
        TFInfer["TensorFlow.js (Inferência)"]
        Recharts[Recharts]
    end

    subgraph Backend["Backend (Express + Node.js)"]
        API[API REST]
        SQLite[(SQLite via sql.js)]
        TFTrain["TensorFlow.js (Treinamento)"]
    end

    UI --> Zustand
    Zustand --> TFInfer
    Zustand -->|POST /api/logs| API
    UI -->|GET /api/model/*| API
    UI --> Recharts
    API --> SQLite
    TFTrain --> SQLite
    API -->|model.json + weights.bin| TFInfer
```

### Decisões Arquiteturais

| Decisão                            | Justificativa                                                                                                  |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| TensorFlow.js no backend (treino)  | Treina o modelo em ambiente Node.js com acesso ao dataset completo, sem expor os dados ao navegador.           |
| TensorFlow.js no frontend (inferência) | Classifica em tempo real no navegador, sem latência de rede. O modelo é carregado uma única vez.           |
| SQLite via sql.js                  | Banco embutido em JavaScript puro, sem compilação nativa, o que facilita a portabilidade do projeto acadêmico. |
| Dataset sintético                  | Não há dados reais de ameaças em ERPs disponíveis publicamente. A geração sintética com perfis controlados permite validar a hipótese de forma reprodutível. |

### Pipeline de Machine Learning

```
flowchart LR
    A["Coleta de Logs"] --> B["Feature Engineering (30 features)"]
    B --> C["Treinamento (TF.js Backend)"]
    C --> D["Modelo Treinado (model.json + weights.bin)"]
    D --> E["Inferência em tempo real (TF.js Frontend)"]
    E --> F["Dashboard ML"]
```

### Features (30 no total)

As features se dividem em três categorias: ambiente, comportamento e contexto.

#### Ambiente (9 features)

| Feature                | Descrição                                             |
| ---------------------- | ----------------------------------------------------- |
| `hourOfDay`            | Hora do dia da ação (0 a 23).                         |
| `dayOfWeek`            | Dia da semana (0 = domingo, 6 = sábado).              |
| `accessLevelEncoded`   | Nível de acesso codificado (guest = 1, user = 2, admin = 3). |
| `networkLatency`       | Latência da rede em milissegundos.                    |
| `geoDistanceFromUsual` | Distância geográfica do local habitual, em km.        |
| `ipChangeFlag`         | Indicador de mudança de endereço IP.                  |
| `loginAttempts`        | Número de tentativas de login na sessão.              |
| `inactivitySeconds`    | Tempo de inatividade em segundos.                     |
| `isNewDevice`          | Indicador de dispositivo nunca visto antes.           |

#### Comportamento (8 features)

| Feature                    | Descrição                                                  |
| -------------------------- | ---------------------------------------------------------- |
| `actionFrequency`          | Quantidade de ações na janela temporal (últimas 50 ações). |
| `actionVariety`            | Diversidade de tipos de ação distintos.                    |
| `actionSequenceEntropy`    | Entropia de Shannon da sequência de ações.                 |
| `moduleAccessCount`        | Número de módulos distintos acessados.                     |
| `sensitiveDataAccessCount` | Acessos a módulos sensíveis (Contratos e Gestão).          |
| `errorRate`                | Proporção de operações com erro.                           |
| `avgTimeBetweenActions`    | Tempo médio entre ações consecutivas, em segundos.         |
| `burstScore`               | Quantidade de ações no último minuto (indicador de rajada).|

#### Contexto (13 features)

| Feature                                            | Descrição                                         |
| -------------------------------------------------- | ------------------------------------------------- |
| `actionTypeCreate/Read/Update/Delete/Login/Config` | One-hot do tipo de ação (6 dimensões).            |
| `moduleClientes/Empresa/Contratos/Gestao/Sistema`  | One-hot do módulo acessado (5 dimensões).         |
| `resultEncoded`                                    | Resultado da operação (1 = sucesso, 0 = erro).    |
| `sessionDurationMinutes`                           | Duração da sessão atual em minutos.               |

---

## Tecnologias

| Tecnologia          | Versão | Propósito                                                   |
| ------------------- | ------ | ----------------------------------------------------------- |
| React               | 18.3   | Interface do usuário (SPA).                                 |
| TypeScript          | 5.5    | Tipagem estática em todo o projeto.                         |
| Vite                | 5.4    | Bundler e servidor de desenvolvimento.                      |
| Zustand             | 4.5    | Gerenciamento de estado.                                    |
| MUI (Material UI)   | 7.3    | Biblioteca de componentes de interface.                     |
| MUI X DataGrid      | 8.27   | Tabela com filtros, ordenação e exportação CSV.             |
| Recharts            | 3.7    | Gráficos (curva de aprendizado, anomalias).                 |
| TensorFlow.js       | 4.22   | Treinamento no backend e inferência no frontend.            |
| Express             | 4.21   | Servidor HTTP e API REST.                                   |
| SQLite (sql.js)     | 1.11   | Banco de dados embutido (logs, métricas, alertas).          |
| Node.js             | 18+    | Runtime do servidor.                                        |
| jsPDF               | 2.5    | Geração de contratos em PDF.                                |

---

## Pré-requisitos

- Node.js v18 ou superior ([download](https://nodejs.org/))
- npm v9 ou superior (incluso no Node.js)
- Git ([download](https://git-scm.com/))

### Portas

| Porta  | Serviço                    |
| ------ | -------------------------- |
| `3001` | Backend (Express API)      |
| `5173` | Frontend (Vite)            |

### Variáveis de ambiente

| Variável        | Onde     | Descrição                                        | Padrão                      |
| --------------- | -------- | ------------------------------------------------ | --------------------------- |
| `VITE_API_BASE` | Frontend | URL base da API (usada em `src/services/api.ts`).| `http://localhost:3001/api` |
| `PORT`          | Backend  | Porta do servidor Express.                       | `3001`                      |

---

## Como Executar

### 1. Clonar o repositório

```bash
git clone https://github.com/KAYOKG/PROJETO-TCC-UFU
cd PROJETO-TCC-UFU
```

### 2. Instalar as dependências do backend

```bash
cd server
npm install
```

### 3. Gerar o dataset sintético

```bash
npm run generate-dataset
```

Esse comando gera 10.000 amostras rotuladas, divididas igualmente entre as classes normal e suspeita, com cerca de 1.250 amostras por perfil. São oito perfis de usuário:

Perfis normais:

- **Normal Office Worker:** funcionário comum, horário comercial, volume moderado de ações.
- **Normal Manager:** gerente com acesso admin, mais módulos, jornada estendida.
- **Normal Analyst:** analista de cotações e relatórios, muitas leituras, sessões longas.
- **Normal Intern:** estagiário, poucas ações por sessão, acesso restrito, erros de validação por inexperiência.

Perfis suspeitos:

- **Data Exfiltration:** alta frequência de leituras, horário noturno, foco em dados sensíveis.
- **Privilege Escalation:** nível guest tentando acessar módulos restritos, alta taxa de erro.
- **Account Compromise:** variação de IP, dispositivo e geolocalização, padrão errático.
- **Insider Threat:** admin acessando dados fora do horário, foco em contratos.

As 30 features são extraídas de cada log e normalizadas com Min-Max. O dataset é salvo em `server/data/synthetic/dataset.json` e as estatísticas de normalização vão para o banco.

### 4. Treinar o modelo

```bash
npm run train
```

O dataset é dividido em 70% treino, 15% validação e 15% teste. A rede neural densa é treinada por 50 épocas com batch size de 64, avaliada no conjunto de teste e comparada com o baseline de regras. O treinamento leva de 30 a 60 segundos, dependendo do hardware.

Arquivos gerados em `server/data/trained/`:

| Arquivo                 | Descrição                                       |
| ----------------------- | ----------------------------------------------- |
| `model.json`            | Topologia da rede neural (formato TF.js).       |
| `weights.bin`           | Pesos treinados em binário.                     |
| `learning_curve.json`   | Loss e acurácia por época (treino e validação). |
| `confusion_matrix.json` | Matrizes de confusão do ML e do baseline.       |
| `feature_stats.json`    | Estatísticas de normalização das features.      |

### 5. Iniciar o backend

```bash
npm run dev
```

O servidor Express sobe na porta 3001 e oferece a API REST de logs, alertas e modelo, serve o modelo treinado para o frontend e mantém o banco SQLite em `server/data/raa.db`. Se a porta estiver ocupada, use `npx kill-port 3001`.

### 6. Iniciar o frontend (em outro terminal)

```bash
cd ..
npm install
npm run dev
```

O Vite sobe na porta 5173 com hot module replacement.

### 7. Acessar o sistema

Abra `http://localhost:5173` no navegador. Os módulos disponíveis são:

| Módulo                | Descrição                                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------------------------- |
| Clientes              | CRUD de clientes da corretora.                                                                                  |
| Empresa               | Cadastro e atualização dos dados da empresa.                                                                    |
| Contratos             | Geração de contratos de compra e venda de café, com exportação em PDF.                                          |
| Gestão de Contratos   | Acompanhamento de status e gerenciamento dos contratos ativos.                                                 |
| Logs do Sistema       | DataGrid com todos os logs, filtros, busca e exportação CSV.                                                    |
| Dashboard ML          | Métricas, alertas, scores de risco, gráficos e análise de overfitting.                                         |
| Gestão de Incidentes  | (SuperAdmin) Usuários em risco, histórico de incidentes, resolução (ameaça ou legítimo) e retreinamento do modelo. |

Cada ação no ERP gera logs automaticamente, e o modelo classifica cada uma em tempo real. Quando detecta comportamento suspeito, o sistema exibe um alerta no Dashboard.

---

## API

Base URL: `http://localhost:3001/api` (ou o valor de `VITE_API_BASE` no frontend).

### Logs

| Método | Rota          | Descrição                                                                                                                |
| ------ | ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `POST` | `/logs`       | Persiste um log de atividade.                                                                                            |
| `POST` | `/logs/batch` | Persiste vários logs em lote (máximo 100 itens; retorna `400` se exceder).                                              |
| `GET`  | `/logs`       | Lista logs com paginação e filtros (`userId`, `startDate`, `endDate`, `limit`, `offset`). O `limit` é limitado a 500.   |
| `GET`  | `/logs/stats` | Estatísticas agregadas: total de logs, usuários únicos, distribuição por ação e módulo, taxa de erro.                   |

### Alertas

| Método | Rota              | Descrição                                                                     |
| ------ | ----------------- | ----------------------------------------------------------------------------- |
| `GET`  | `/alerts`         | Lista alertas de risco com filtros (`userId`, `minScore`, `limit`, `offset`). |
| `GET`  | `/alerts/summary` | Resumo: riscos por usuário, alertas por tipo, ML versus regras.               |

### Modelo ML

| Método | Rota                      | Descrição                                                                 |
| ------ | ------------------------- | ------------------------------------------------------------------------- |
| `GET`  | `/model/latest`           | Serve o `model.json` do modelo treinado.                                  |
| `GET`  | `/model/metrics`          | Métricas de treinamento armazenadas no banco.                             |
| `GET`  | `/model/feature-stats`    | Estatísticas de normalização das features.                                |
| `GET`  | `/model/learning-curve`   | Dados da curva de aprendizado (loss e acurácia por época).                |
| `GET`  | `/model/confusion-matrix` | Matrizes de confusão do ML e do baseline.                                 |
| `GET`  | `/model/:filename`        | Serve arquivos de pesos (`.bin`), com rota protegida contra path traversal.|

### Incidentes, bloqueios e usuários

| Método | Rota                                        | Descrição                                                                                            |
| ------ | ------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `POST` | `/incidents`                                | Cria incidente e bloqueia o usuário por 3 minutos (exceto SuperAdmin).                               |
| `GET`  | `/incidents`                                | Lista incidentes (query `status`: pending, confirmed_threat, cleared).                               |
| `PUT`  | `/incidents/:id/resolve`                    | Resolve incidente (`decision`: confirm_threat ou clear; força logout em caso de ameaça).             |
| `GET`  | `/user-blocks/:userId`                      | Status de bloqueio; retorna `confirmed_threat` quando a sessão foi invalidada pelo admin.            |
| `POST` | `/user-blocks/:userId/unblock`              | Desbloqueio manual.                                                                                  |
| `POST` | `/users/predictions`                        | Registra predição de risco enviada pelo frontend após cada classificação.                            |
| `GET`  | `/users/risk-levels`                        | Lista usuários com score de risco, status e bloqueio ativo.                                          |
| `GET`  | `/users/:userId/session-status`             | Indica se a sessão ainda é válida (`valid: true/false`); usado no force-logout.                      |
| `POST` | `/users/:userId/force-logout`               | Invalida a sessão quando o admin confirma uma ameaça.                                                |
| `POST` | `/users/:userId/clear-session-invalidation` | Limpa a invalidação após o login.                                                                    |
| `GET`  | `/ml/feedback-stats`                        | Contagem de feedbacks para retreinamento.                                                            |
| `GET`  | `/ml/feedback-list`                         | Lista de feedbacks com incidente e decisão.                                                          |
| `POST` | `/ml/retrain`                               | Retreina o modelo com o dataset sintético somado aos feedbacks.                                      |

---

## Estrutura de Diretórios

```
PROJETO-TCC-UFU/
├── src/                                   # Frontend (React)
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── RiskDashboard.tsx          # Painel principal do dashboard ML
│   │   │   ├── MetricsPanel.tsx           # Métricas comparativas ML vs. regras
│   │   │   ├── AlertsPanel.tsx            # Alertas de risco em tempo real
│   │   │   ├── UserRiskScore.tsx          # Score de risco por usuário
│   │   │   ├── AnomalyChart.tsx           # Gráfico de risco ao longo do tempo
│   │   │   ├── FeatureImportance.tsx      # Importância relativa das features
│   │   │   ├── LearningCurveChart.tsx     # Curva de aprendizado e diagnóstico de overfitting
│   │   │   └── ConfusionMatrixChart.tsx   # Matriz de confusão visual
│   │   ├── forms/
│   │   │   ├── ClientForm.tsx             # Cadastro de clientes
│   │   │   ├── CompanyForm.tsx            # Dados da empresa
│   │   │   └── ContractForm.tsx           # Geração de contratos
│   │   ├── modals/
│   │   │   ├── ClientModal.tsx            # Visualização e edição de cliente
│   │   │   ├── ContractModal.tsx          # Detalhes do contrato
│   │   │   └── DeleteConfirmationModal.tsx# Confirmação de exclusão
│   │   ├── shared/
│   │   │   └── AddressFields.tsx          # Campos reutilizáveis de endereço
│   │   ├── admin/
│   │   │   └── AdminIncidentPanel.tsx     # Gestão de incidentes (SuperAdmin)
│   │   ├── Layout.tsx                     # AppBar e Drawer lateral
│   │   ├── BlockedScreen.tsx             # Tela de sessão suspensa
│   │   ├── SystemLogs.tsx                 # Tabela de logs com DataGrid
│   │   ├── ClientList.tsx                 # Lista de clientes com busca
│   │   ├── ContractManagement.tsx         # Gestão de contratos
│   │   ├── ContractPreview.tsx            # Visualização e exportação PDF
│   │   └── GeolocationProvider.tsx        # Geolocalização e IP
│   ├── ml/
│   │   ├── modelLoader.ts                # Carregamento do modelo TF.js no navegador
│   │   ├── inferenceEngine.ts            # Classificação em tempo real e regras estáticas
│   │   └── featureEngineering.ts         # Extração de features para inferência
│   ├── store/
│   │   ├── useLogStore.ts                # Logs e sessão
│   │   ├── useMLStore.ts                 # Predições e alertas ML
│   │   ├── useAuthStore.ts               # Autenticação
│   │   ├── useBlockStore.ts              # Estado de bloqueio
│   │   └── useApiErrorStore.ts           # Contador de erros de API
│   ├── services/
│   │   └── api.ts                         # Comunicação com a API
│   ├── types/
│   │   └── index.ts                       # Tipos TypeScript compartilhados
│   ├── App.tsx                            # Componente raiz
│   ├── main.tsx                           # Entry point
│   ├── theme.ts                           # Tema MUI customizado
│   └── index.css
│
├── server/                                # Backend (Express + Node.js)
│   ├── src/
│   │   ├── db/
│   │   │   ├── connection.ts              # Conexão sql.js
│   │   │   ├── helpers.ts                # queryToObjects, reutilizado pelas rotas
│   │   │   └── schema.ts                 # DDL das tabelas
│   │   ├── ml/
│   │   │   ├── datasetGenerator.ts        # Gerador de dataset sintético (8 perfis)
│   │   │   ├── featureEngineering.ts      # Extração e normalização de features
│   │   │   ├── evaluator.ts              # Avaliação do modelo e baseline de regras
│   │   │   ├── trainer.ts                # Treinamento da rede neural
│   │   │   └── hyperparamSearch.ts       # Busca de hiperparâmetros com k-fold CV
│   │   ├── routes/
│   │   │   ├── logs.ts
│   │   │   ├── alerts.ts
│   │   │   ├── incidents.ts
│   │   │   ├── userBlocks.ts
│   │   │   ├── users.ts
│   │   │   ├── ml.ts
│   │   │   └── model.ts
│   │   ├── index.ts                       # Entry point do servidor
│   │   └── sql.js.d.ts
│   ├── data/
│   │   ├── synthetic/
│   │   │   └── dataset.json              # Dataset gerado (10.000 amostras)
│   │   └── trained/
│   │       ├── model.json
│   │       ├── weights.bin
│   │       ├── learning_curve.json
│   │       ├── confusion_matrix.json
│   │       └── feature_stats.json
│   ├── package.json
│   └── tsconfig.json
│
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
└── README.md
```

---

## O Modelo de Machine Learning

### Arquitetura da Rede Neural

```
Input Layer            (30 features)
Dense(64, ReLU)        + L2(0.001)
BatchNormalization
Dropout(0.3)
Dense(32, ReLU)        + L2(0.001)
BatchNormalization
Dropout(0.2)
Dense(16, ReLU)
Dense(1, Sigmoid)      -> P(suspeito)

Parâmetros treináveis: 4.993
```

### Configuração de Treinamento

| Parâmetro         | Valor                                                     |
| ----------------- | --------------------------------------------------------- |
| Otimizador        | Adam (learning rate = 0,0005)                              |
| Função de perda   | Binary Crossentropy                                       |
| Épocas            | 50                                                        |
| Batch size        | 64                                                        |
| Regularização     | L2 (λ = 0,001), Dropout (0,3 e 0,2), Batch Normalization  |
| Divisão do dataset| 70% treino, 15% validação, 15% teste                      |
| Dataset           | 10.000 amostras (50% normal, 50% suspeito, 8 perfis)      |

### Busca de Hiperparâmetros

O comando `npm run hyperparam-search` roda uma busca com validação cruzada de 5 folds, testando combinações de número de unidades por camada, taxa de dropout, learning rate e fator de regularização L2. A melhor configuração é escolhida pelo F1-Score médio entre os folds.

### Baseline de Regras Estáticas

O baseline implementa oito heurísticas de segurança. Uma ação é classificada como suspeita quando duas ou mais regras são ativadas ao mesmo tempo.

| #  | Regra                              | Critério                          |
| -- | ---------------------------------- | --------------------------------- |
| 1  | Alta frequência de ações           | mais de 50 ações na janela        |
| 2  | Acesso fora do horário comercial   | das 22h às 6h                     |
| 3  | Múltiplas tentativas de login      | mais de 3 tentativas              |
| 4  | Mudança de endereço IP             | IP diferente do habitual          |
| 5  | Alta taxa de erros                 | mais de 20% das operações         |
| 6  | Rajada de atividade                | mais de 5 ações em 1 minuto       |
| 7  | Acesso excessivo a dados sensíveis | mais de 20 acessos a módulos restritos |
| 8  | Distância geográfica anômala       | mais de 100 km do local habitual  |

### Limitações

Os perfis do dataset sintético têm padrões bem definidos e separáveis por design, o que facilita a classificação e produz métricas otimistas. Em um ambiente real, comportamentos legítimos e maliciosos se sobrepõem de forma mais sutil, e as métricas tendem a ser menores. Os números deste projeto devem ser lidos como indicadores do potencial da abordagem, não como estimativa de desempenho em produção. Essa ressalva é parte da seção de limitações da monografia.

---

## Dashboard ML

O dashboard tem sete painéis para monitoramento e análise:

| Painel               | Descrição                                                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| MetricsPanel         | Cards com Accuracy, Precision, Recall, F1-Score e AUC-ROC; comparativo ML versus regras com a melhoria percentual.         |
| AlertsPanel          | Alertas em tempo real com score de risco, tipo (ML ou regra), usuário e timestamp.                                         |
| UserRiskScore        | Ranking de usuários por score de risco, com barras coloridas.                                                              |
| ConfusionMatrixChart | Matrizes de confusão 2x2 lado a lado (ML e regras), com heatmap, valores absolutos e percentuais.                          |
| LearningCurveChart   | Loss e acurácia por época (treino versus validação) com diagnóstico automático de overfitting.                            |
| AnomalyChart         | Gráfico de área com o score de risco médio e máximo ao longo do tempo.                                                     |
| FeatureImportance    | Barras horizontais com as 15 features mais discriminantes entre comportamento normal e suspeito.                           |

O botão "Simular Ações Suspeitas" (disponível para SuperAdmin) dispara 20 ações em sequência para um usuário-alvo, misturando ações sensíveis e normais em ordem aleatória. Cada log usa uma sessão simulada com duração, tentativas de login e inatividade variadas, de modo que os vetores de features sejam diferentes e os gráficos reflitam a simulação. O limiar de decisão definido no slider controla a classificação: quanto menor o limiar, mais ações são marcadas como suspeitas.

---

## Robustez e melhorias de UX

Esta seção reúne ajustes aplicados após uma auditoria do código, voltados à estabilidade nas demonstrações e à consistência entre treino e inferência.

### Backend

- **Limites da API.** O `POST /logs/batch` aceita no máximo 100 itens e retorna `400` se exceder. O `GET /logs` limita o `limit` a 500 por requisição.
- **Helpers compartilhados.** A função `queryToObjects` foi extraída para `server/src/db/helpers.ts` e é usada pelas rotas de incidents, users, userBlocks, alerts, ml e model.
- **Status `confirmed_threat`.** A rota `GET /user-blocks/:userId` verifica se a sessão do usuário foi invalidada pelo admin e, nesse caso, retorna `confirmed_threat` para o frontend exibir a mensagem certa antes do redirecionamento.
- **Parâmetros de log.** Os valores enviados em `POST /logs` e `/logs/batch` são normalizados com `toBindable()` antes do bind no SQLite, aceitando apenas string, número ou null. Isso evita o erro "Wrong API use" quando o frontend envia objetos aninhados, como uma data não serializada.

### Frontend

- **Concorrência em `analyzeLog`.** Um mutex por `userId` no `useMLStore` evita análises simultâneas. Logs que chegam durante uma análise entram em uma fila e são processados em sequência, de modo que todas as predições cheguem aos gráficos.
- **Simulação com sessão variada.** O `addLog` aceita o parâmetro opcional `options.overrideSession`. Na simulação do dashboard, cada log recebe uma sessão simulada para gerar vetores de features distintos e refletir o efeito do limiar de decisão.
- **Sessão em erro de rede.** O `getSessionStatus` passou a retornar `valid: false` em caso de falha de rede ou resposta não-ok, antes assumida como válida. Isso garante o force-logout quando o backend está indisponível.
- **Fluxo `confirmed_threat`.** Quando o admin confirma uma ameaça, o usuário vê a mensagem "Seu acesso foi suspenso pelo administrador" por 4 segundos antes de ser redirecionado ao login.
- **Erros de API.** Um contador de erros consecutivos é incrementado em falhas de `persistLog`, `reportPrediction` e `createIncident`. A partir de cinco erros seguidos, o AppBar exibe o alerta "Problemas de comunicação com o servidor". Qualquer sucesso zera o contador.
- **Login com loading.** O botão de login exibe um indicador de progresso e o texto "Entrando..." durante o envio, e fica desabilitado para evitar cliques duplicados.
- **Feature engineering alinhado.** As funções `classifyAction` e `classifyModule` do frontend foram sincronizadas com as do backend, de modo que as mesmas strings gerem os mesmos códigos. Isso evita divergência entre treino e inferência.
- **API base configurável.** A URL da API no frontend vem da variável `VITE_API_BASE`, com fallback para `http://localhost:3001/api`.
- **Logs de desenvolvimento.** As chamadas a `console.log` e `console.warn` no frontend só aparecem quando `import.meta.env.DEV` é verdadeiro.

---

## Referências

1. Du, M., Li, F., Zheng, G., & Srikumar, V. (2017). *DeepLog: Anomaly Detection and Diagnosis from System Logs through Deep Learning*. ACM CCS 2017.
2. Berlin, K., Slater, D., & Saxe, J. (2015). *Malicious Behavior Detection using Windows Audit Logs*. ACM AISec Workshop.
3. Ranjan, R. & Kumar, S. S. (2022). *User Behaviour Analysis using Data Analytics and Machine Learning to Identify Malicious User versus Legitimate User*. High-Confidence Computing, 2(1).
4. Jiang, W., Tian, Y., Liu, W., & Liu, W. (2018). *An Insider Threat Detection Method Based on User Behavior Analysis*. IFIP IIP 2018.
5. Bolt, A., de Leoni, M., & van der Aalst, W. M. P. (2018). *Process Variant Comparison: Using Event Logs to Detect Differences in Behavior and Business Rules*. Information Systems, 74.
6. Danziger, M. & Henriques, M. A. A. (2017). *Uma Análise do uso de Machine Learning contra a Segurança da Informação*. XVII SBSeg.

---

## Licença

Distribuído sob a licença MIT.

```
MIT License

Copyright (c) 2025 Kayo Galdino Gomes Rocha

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Créditos

Universidade Federal de Uberlândia (UFU), Faculdade de Computação, Campus Monte Carmelo. Desenvolvido como Trabalho de Conclusão de Curso do Bacharelado em Sistemas de Informação.
