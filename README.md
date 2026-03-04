# 🛡️ Análise Comportamental com Machine Learning

**TCC — Bacharelado em Sistemas de Informação**
Universidade Federal de Uberlândia (UFU) — Campus Monte Carmelo, MG

**Autor:** Kayo Galdino Gomes Rocha

Node.js
React
TypeScript
TensorFlow.js
MUI
SQLite

---

## 📋 Sobre o Projeto

Sistema de **detecção de comportamentos suspeitos** em um ERP de corretagem de café utilizando **Machine Learning**. O sistema coleta logs de atividades dos usuários em tempo real, extrai features comportamentais e classifica cada ação como normal ou suspeita por meio de uma rede neural treinada com TensorFlow.js.

### Problema

Sistemas corporativos (ERPs) são alvos frequentes de atividades indevidas desde vazamento de dados até comprometimento de contas. Abordagens tradicionais baseadas em regras estáticas são limitadas na capacidade de detectar padrões sutis e adaptar-se a novos vetores de ataque.

### Hipótese

> A classificação supervisionada com TensorFlow.js **supera regras estáticas** na detecção de anomalias comportamentais em logs de sistemas ERP.

### Resultado Alcançado

| Métrica      | Modelo ML  | Regras Estáticas | Melhoria   |
| ------------ | ---------- | ---------------- | ---------- |
| **F1-Score** | **99.37%** | 72.79%           | **+36.5%** |
| Accuracy     | 99.38%     | 84.25%           | +18.0%     |
| Precision    | 99.54%     | 58.56%           | +70.0%     |
| Recall       | 99.21%     | 96.27%           | +3.1%      |
| AUC-ROC      | 0.9998     | —                | —          |

> ⚠️ **Nota:** Métricas obtidas com dataset sintético (ver [Limitações](#limitações)).

---

## 🏗️ Arquitetura do Sistema

### Visão Geral

```mermaid
graph TB
    subgraph Frontend["🖥️ Frontend (React + Vite)"]
        UI[Interface MUI]
        Zustand[Zustand Store]
        TFInfer["TensorFlow.js<br/>(Inferência)"]
        Recharts[Recharts]
    end

    subgraph Backend["⚙️ Backend (Express + Node.js)"]
        API[API REST]
        SQLite[(SQLite via sql.js)]
        TFTrain["TensorFlow.js<br/>(Treinamento)"]
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

| Decisão                               | Justificativa                                                                                                                                            |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TF.js no backend** para treino      | Permite treinar o modelo em ambiente Node.js com acesso ao dataset completo, sem expor dados ao navegador                                                |
| **TF.js no frontend** para inferência | Classificação em tempo real no navegador sem latência de rede, modelo carregado uma única vez                                                            |
| **SQLite (sql.js)**                   | Banco embeddable em puro JavaScript, sem necessidade de compilação nativa — ideal para portabilidade acadêmica                                           |
| **Dataset sintético**                 | Dados reais de ameaças em ERPs não estão disponíveis publicamente; a geração sintética com perfis controlados permite validação reprodutível da hipótese |

### Pipeline de Machine Learning

```mermaid
flowchart LR
    A["📝 Coleta de Logs"] --> B["⚙️ Feature Engineering<br/>(30 features)"]
    B --> C["🏋️ Treinamento<br/>(TF.js Backend)"]
    C --> D["📦 Modelo Treinado<br/>(model.json + weights.bin)"]
    D --> E["🔮 Inferência Real-Time<br/>(TF.js Frontend)"]
    E --> F["📊 Dashboard ML"]
```

### Categorias de Features (30 features)

#### 🌐 Ambiente (9 features)

| Feature                | Descrição                                             |
| ---------------------- | ----------------------------------------------------- |
| `hourOfDay`            | Hora do dia da ação (0-23)                            |
| `dayOfWeek`            | Dia da semana (0=domingo, 6=sábado)                   |
| `accessLevelEncoded`   | Nível de acesso codificado (guest=1, user=2, admin=3) |
| `networkLatency`       | Latência da rede em milissegundos                     |
| `geoDistanceFromUsual` | Distância geográfica do local habitual (km)           |
| `ipChangeFlag`         | Indicador de mudança de endereço IP                   |
| `loginAttempts`        | Número de tentativas de login na sessão               |
| `inactivitySeconds`    | Tempo de inatividade em segundos                      |
| `isNewDevice`          | Indicador de dispositivo nunca visto antes            |

#### 🧠 Comportamento (8 features)

| Feature                    | Descrição                                                  |
| -------------------------- | ---------------------------------------------------------- |
| `actionFrequency`          | Quantidade de ações na janela temporal (últimas 50 ações)  |
| `actionVariety`            | Diversidade de tipos de ações distintas                    |
| `actionSequenceEntropy`    | Entropia de Shannon da sequência de ações                  |
| `moduleAccessCount`        | Número de módulos distintos acessados                      |
| `sensitiveDataAccessCount` | Acessos a módulos sensíveis (Contratos/Gestão)             |
| `errorRate`                | Proporção de operações com erro                            |
| `avgTimeBetweenActions`    | Tempo médio entre ações consecutivas (segundos)            |
| `burstScore`               | Quantidade de ações no último minuto (indicador de rajada) |

#### 📄 Contexto (13 features)

| Feature                                            | Descrição                                         |
| -------------------------------------------------- | ------------------------------------------------- |
| `actionTypeCreate/Read/Update/Delete/Login/Config` | One-hot encoding do tipo de ação (6 dimensões)    |
| `moduleClientes/Empresa/Contratos/Gestao/Sistema`  | One-hot encoding do módulo acessado (5 dimensões) |
| `resultEncoded`                                    | Resultado da operação (1=sucesso, 0=erro)         |
| `sessionDurationMinutes`                           | Duração da sessão atual em minutos                |

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia            | Versão | Propósito                                                  |
| --------------------- | ------ | ---------------------------------------------------------- |
| **React**             | 18.3   | Interface do usuário (SPA)                                 |
| **TypeScript**        | 5.5    | Tipagem estática em todo o projeto                         |
| **Vite**              | 5.4    | Bundler e dev server                                       |
| **Zustand**           | 4.5    | Gerenciamento de estado (stores)                           |
| **MUI (Material UI)** | 7.3    | Biblioteca de componentes UI                               |
| **MUI X DataGrid**    | 8.27   | Tabela avançada com filtros, ordenação e exportação CSV    |
| **Recharts**          | 3.7    | Gráficos customizados (curva de aprendizado, anomalias)    |
| **TensorFlow.js**     | 4.22   | Treinamento (backend) e inferência (frontend) do modelo ML |
| **Express**           | 4.21   | Servidor HTTP e API REST                                   |
| **SQLite (sql.js)**   | 1.11   | Banco de dados embeddable (logs, métricas, alertas)        |
| **Node.js**           | 18+    | Runtime do servidor                                        |
| **jsPDF**             | 2.5    | Geração de contratos em PDF                                |

---

## 📦 Pré-requisitos

- **Node.js** v18 ou superior ([download](https://nodejs.org/))
- **npm** v9 ou superior (incluso no Node.js)
- **Git** ([download](https://git-scm.com/))

### Portas Utilizadas

| Porta  | Serviço                    |
| ------ | -------------------------- |
| `3001` | Backend (Express API)      |
| `5173` | Frontend (Vite dev server) |

### Variáveis de ambiente

| Variável        | Onde     | Descrição                                        | Padrão                      |
| --------------- | -------- | ------------------------------------------------ | --------------------------- |
| `VITE_API_BASE` | Frontend | URL base da API (usada em `src/services/api.ts`) | `http://localhost:3001/api` |
| `PORT`          | Backend  | Porta do servidor Express                        | `3001`                      |

---

## 🚀 Passo a Passo para Rodar

### Etapa 1 — Clonar o repositório

```bash
git clone <url-do-repositorio>
cd PROJETO-TCC-UFU
```

### Etapa 2 — Instalar dependências do backend

```bash
cd server
npm install
```

### Etapa 3 — Gerar o dataset sintético

```bash
npm run generate-dataset
```

**O que acontece:**

- São gerados **10.000 amostras** rotuladas (50% normal, 50% suspeito), ~1.250 por perfil
- **8 perfis de usuário** são simulados:
  - ✅ **Normal Office Worker** — funcionário comum, horário comercial, ações moderadas
  - ✅ **Normal Manager** — gerente com acesso admin, mais módulos, jornada estendida
  - ✅ **Normal Analyst** — analista de cotações/relatórios, muitas leituras, sessões longas
  - ✅ **Normal Intern** — estagiário, poucas ações por sessão, acesso restrito, erros de validação
  - ❌ **Data Exfiltration** — alta frequência, horário noturno, foco em dados sensíveis
  - ❌ **Privilege Escalation** — nível guest tentando acessar módulos restritos, alta taxa de erro
  - ❌ **Account Compromise** — variação de IP/dispositivo/geolocalização, padrão errático
  - ❌ **Insider Threat** — admin acessando dados fora do horário, foco em contratos
- 30 features são extraídas de cada log e normalizadas (min-max)
- O dataset é salvo em `server/data/synthetic/dataset.json`
- Estatísticas das features são salvas no banco de dados

### Etapa 4 — Treinar o modelo de Machine Learning

```bash
npm run train
```

**O que acontece:**

- O dataset é dividido em **70% treino / 15% validação / 15% teste**
- Uma rede neural densa é treinada por **50 epochs** (batch size 64)
- O modelo é avaliado no conjunto de teste e comparado com o baseline de regras
- O treinamento leva aproximadamente **30-60 segundos** dependendo do hardware

**Arquivos gerados em `server/data/trained/`:**

| Arquivo                 | Descrição                                      |
| ----------------------- | ---------------------------------------------- |
| `model.json`            | Topologia da rede neural (formato TF.js)       |
| `weights.bin`           | Pesos treinados em binário                     |
| `learning_curve.json`   | Loss e acurácia por época (treino e validação) |
| `confusion_matrix.json` | Matrizes de confusão do ML e do baseline       |
| `feature_stats.json`    | Estatísticas de normalização das features      |

### Etapa 5 — Iniciar o backend

```bash
npm run dev
```

O servidor Express inicia na porta **3001** com as seguintes capacidades:

- API REST para logs, alertas e modelo ML
- Servir o modelo treinado para o frontend
- Banco de dados SQLite persistido em `server/data/raa.db`

use `npx kill-port 3001` para matar o processo se a porta estiver ocupada.

### Etapa 6 — Iniciar o frontend (segundo terminal)

```bash
cd ..
npm install
npm run dev
```

O Vite inicia na porta **5173** com hot module replacement.

### Etapa 7 — Acessar o sistema

Abra o navegador em **[http://localhost:5173](http://localhost:5173)** e navegue pelos módulos:

| Módulo                   | Descrição                                                                                                      |
| ------------------------ | -------------------------------------------------------------------------------------------------------------- |
| **Clientes**             | CRUD de clientes da corretora (cadastro, edição, exclusão)                                                     |
| **Empresa**              | Cadastro e atualização dos dados da empresa                                                                    |
| **Contratos**            | Geração de contratos de compra/venda de café com exportação PDF                                                |
| **Gestão de Contratos**  | Acompanhamento de status e gerenciamento de contratos ativos                                                   |
| **Logs do Sistema**      | DataGrid com todos os logs, filtros, busca e exportação CSV                                                    |
| **Dashboard ML**         | Métricas, alertas, scores de risco, gráficos e análise de overfitting                                          |
| **Gestão de Incidentes** | (SuperAdmin) Usuários com risco, histórico de incidentes, resolução (ameaça/legítimo), retreinamento do modelo |

> 💡 **Dica:** Cada ação no ERP gera logs automaticamente. O login exibe estado de carregamento ("Entrando...") durante a autenticação. O modelo ML classifica cada ação em tempo real e exibe alertas no Dashboard quando detecta comportamento suspeito.

---

## 🔌 Rotas da API

Base URL: `http://localhost:3001/api` (ou o valor de `VITE_API_BASE` no frontend)

### Logs

| Método | Rota          | Descrição                                                                                                                        |
| ------ | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/logs`       | Persiste um log de atividade                                                                                                     |
| `POST` | `/logs/batch` | Persiste múltiplos logs em lote (**máx. 100 itens**; retorna `400` se exceder)                                                   |
| `GET`  | `/logs`       | Lista logs com paginação e filtros (`userId`, `startDate`, `endDate`, `limit`, `offset`). **`limit` limitado a 500** por request |
| `GET`  | `/logs/stats` | Estatísticas agregadas: total de logs, usuários únicos, distribuição por ação/módulo, taxa de erro                               |

### Alertas

| Método | Rota              | Descrição                                                                    |
| ------ | ----------------- | ---------------------------------------------------------------------------- |
| `GET`  | `/alerts`         | Lista alertas de risco com filtros (`userId`, `minScore`, `limit`, `offset`) |
| `GET`  | `/alerts/summary` | Resumo: riscos por usuário, alertas por tipo, ML vs. Regras                  |

### Modelo ML

| Método | Rota                      | Descrição                                                                |
| ------ | ------------------------- | ------------------------------------------------------------------------ |
| `GET`  | `/model/latest`           | Serve o `model.json` do modelo treinado (formato TF.js)                  |
| `GET`  | `/model/metrics`          | Métricas de treinamento armazenadas no banco                             |
| `GET`  | `/model/feature-stats`    | Estatísticas de normalização das features                                |
| `GET`  | `/model/learning-curve`   | Dados da curva de aprendizado (loss/accuracy por época)                  |
| `GET`  | `/model/confusion-matrix` | Matrizes de confusão do ML e baseline                                    |
| `GET`  | `/model/:filename`        | Serve arquivos de pesos (`.bin`) — rota sanitizada contra path traversal |

### Incidentes, bloqueios e usuários

| Método | Rota                                        | Descrição                                                                                                                |
| ------ | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `POST` | `/incidents`                                | Cria incidente (ML/frontend); bloqueia usuário por 3 min (exceto SuperAdmin)                                             |
| `GET`  | `/incidents`                                | Lista incidentes (query `status`: pending, confirmed_threat, cleared)                                                    |
| `PUT`  | `/incidents/:id/resolve`                    | Resolve incidente (`decision`: confirm_threat \| clear; force-logout se ameaça)                                          |
| `GET`  | `/user-blocks/:userId`                      | Status de bloqueio do usuário; retorna **`status: "confirmed_threat"** se sessão foi invalidada (admin confirmou ameaça) |
| `POST` | `/user-blocks/:userId/unblock`              | Desbloqueio manual                                                                                                       |
| `POST` | `/users/predictions`                        | Registra predição de risco (frontend envia após cada classificação ML)                                                   |
| `GET`  | `/users/risk-levels`                        | Lista usuários com score de risco, status (active/suspended/observation) e bloqueio ativo                                |
| `GET`  | `/users/:userId/session-status`             | Indica se a sessão ainda é válida (`valid: true/false`); usado para force-logout                                         |
| `POST` | `/users/:userId/force-logout`               | Invalida sessão (admin confirma ameaça)                                                                                  |
| `POST` | `/users/:userId/clear-session-invalidation` | Limpa invalidação (após login)                                                                                           |
| `GET`  | `/ml/feedback-stats`                        | Contagem de feedbacks (labels) para retreinamento                                                                        |
| `GET`  | `/ml/feedback-list`                         | Lista de feedbacks com incidente e decisão                                                                               |
| `POST` | `/ml/retrain`                               | Retreina o modelo com dataset sintético + feedbacks                                                                      |

---

## 📂 Estrutura de Diretórios

```
PROJETO-TCC-UFU/
├── src/                              # ── Frontend (React) ──
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── RiskDashboard.tsx      # Painel principal do dashboard ML
│   │   │   ├── MetricsPanel.tsx       # Métricas comparativas ML vs. regras
│   │   │   ├── AlertsPanel.tsx        # Alertas de risco em tempo real
│   │   │   ├── UserRiskScore.tsx      # Score de risco por usuário
│   │   │   ├── AnomalyChart.tsx       # Gráfico de risco ao longo do tempo
│   │   │   ├── FeatureImportance.tsx  # Importância relativa das features
│   │   │   ├── LearningCurveChart.tsx # Curva de aprendizado + diagnóstico de overfitting
│   │   │   └── ConfusionMatrixChart.tsx # Matriz de confusão visual
│   │   ├── forms/
│   │   │   ├── ClientForm.tsx         # Formulário de cadastro de clientes
│   │   │   ├── CompanyForm.tsx        # Formulário de dados da empresa
│   │   │   └── ContractForm.tsx       # Formulário de geração de contratos
│   │   ├── modals/
│   │   │   ├── ClientModal.tsx        # Dialog de visualização/edição de cliente
│   │   │   ├── ContractModal.tsx      # Dialog de detalhes do contrato
│   │   │   └── DeleteConfirmationModal.tsx # Dialog de confirmação de exclusão
│   │   ├── shared/
│   │   │   └── AddressFields.tsx      # Campos reutilizáveis de endereço
│   │   ├── admin/
│   │   │   └── AdminIncidentPanel.tsx  # Gestão de incidentes (SuperAdmin): usuários, histórico, modelo ML, retreinamento
│   │   ├── Layout.tsx                 # AppBar + Drawer lateral (navegação MUI); alerta de erros de API (≥5)
│   │   ├── BlockedScreen.tsx         # Tela de sessão suspensa; mensagem confirmed_threat antes de redirect para login
│   │   ├── SystemLogs.tsx             # Tabela de logs com DataGrid MUI X
│   │   ├── ClientList.tsx             # Lista de clientes com busca
│   │   ├── ContractManagement.tsx     # Gestão de contratos
│   │   ├── ContractPreview.tsx        # Visualização e exportação PDF de contratos
│   │   └── GeolocationProvider.tsx    # Provider de geolocalização e IP
│   ├── ml/
│   │   ├── modelLoader.ts            # Carregamento do modelo TF.js no browser
│   │   ├── inferenceEngine.ts         # Classificação em tempo real + regras estáticas
│   │   └── featureEngineering.ts      # Extração de features para inferência
│   ├── store/
│   │   ├── useLogStore.ts             # Store Zustand para logs e sessão; persistência com contagem de erros de API
│   │   ├── useMLStore.ts             # Store Zustand para predições e alertas ML; mutex por userId em analyzeLog
│   │   ├── useAuthStore.ts           # Autenticação (login local; SuperAdmin / user1 / user2)
│   │   ├── useBlockStore.ts          # Estado de bloqueio (timeout / confirmed_threat)
│   │   └── useApiErrorStore.ts       # Contador de erros consecutivos de API (alerta no AppBar se ≥5)
│   ├── services/
│   │   └── api.ts                     # Funções de comunicação com a API
│   ├── types/
│   │   └── index.ts                   # Tipos TypeScript compartilhados + definição de features
│   ├── App.tsx                        # Componente raiz com rotas e estado global
│   ├── main.tsx                       # Entry point com ThemeProvider MUI
│   ├── theme.ts                       # Tema MUI customizado (paleta azul/cinza corporativa)
│   └── index.css                      # Import de fonte Inter
│
├── server/                            # ── Backend (Express + Node.js) ──
│   ├── src/
│   │   ├── db/
│   │   │   ├── connection.ts          # Conexão sql.js (SQLite embeddable)
│   │   │   ├── helpers.ts            # queryToObjects (reutilizado por todas as rotas que leem do SQLite)
│   │   │   └── schema.ts             # DDL das tabelas (logs, alertas, incidentes, user_blocks, feedback_labels, etc.)
│   │   ├── ml/
│   │   │   ├── datasetGenerator.ts    # Gerador de dataset sintético (8 perfis)
│   │   │   ├── featureEngineering.ts  # Extração e normalização de features
│   │   │   ├── evaluator.ts          # Avaliação do modelo + baseline de regras (8 regras)
│   │   │   ├── trainer.ts            # Treinamento da rede neural com TF.js
│   │   │   └── hyperparamSearch.ts   # Busca de hiperparâmetros com k-fold CV
│   │   ├── routes/
│   │   │   ├── logs.ts               # CRUD de logs (limite batch 100; limit GET até 500)
│   │   │   ├── alerts.ts             # Consulta de alertas e resumos
│   │   │   ├── incidents.ts          # Criação e resolução de incidentes (confirm_threat / clear)
│   │   │   ├── userBlocks.ts         # Status de bloqueio; status confirmed_threat quando sessão invalidada
│   │   │   ├── users.ts              # Predições, risk-levels, session-status, force-logout
│   │   │   ├── ml.ts                 # Feedback stats/list, retreinamento
│   │   │   └── model.ts              # Servir modelo, métricas, pesos
│   │   ├── index.ts                   # Entry point do servidor Express
│   │   └── sql.js.d.ts              # Type declarations para sql.js
│   ├── data/
│   │   ├── synthetic/
│   │   │   └── dataset.json          # Dataset gerado (10.000 amostras)
│   │   └── trained/
│   │       ├── model.json            # Topologia do modelo
│   │       ├── weights.bin           # Pesos binários
│   │       ├── learning_curve.json   # Histórico de treino
│   │       ├── confusion_matrix.json # Matrizes de confusão
│   │       └── feature_stats.json    # Stats de normalização
│   ├── package.json
│   └── tsconfig.json
│
├── package.json                       # Dependências do frontend
├── vite.config.ts                     # Configuração do Vite
├── tsconfig.json                      # Configuração TypeScript
├── index.html                         # HTML template
└── README.md                          # Este arquivo
```

---

## 🧠 O Modelo de Machine Learning

### Arquitetura da Rede Neural

```
┌─────────────────────────────────────────────────┐
│  Input Layer              (30 features)          │
├─────────────────────────────────────────────────┤
│  Dense(64, ReLU)          + L2(0.001)           │
│  BatchNormalization                              │
│  Dropout(0.3)                                    │
├─────────────────────────────────────────────────┤
│  Dense(32, ReLU)          + L2(0.001)           │
│  BatchNormalization                              │
│  Dropout(0.2)                                    │
├─────────────────────────────────────────────────┤
│  Dense(16, ReLU)                                 │
├─────────────────────────────────────────────────┤
│  Dense(1, Sigmoid)        → P(suspeito)         │
└─────────────────────────────────────────────────┘

Total de parâmetros treináveis: 4.993
```

### Configuração de Treinamento

| Parâmetro        | Valor                                                    |
| ---------------- | -------------------------------------------------------- |
| Optimizer        | Adam (learning rate = 0.001)                             |
| Loss function    | Binary Crossentropy                                      |
| Epochs           | 50                                                       |
| Batch size       | 64                                                       |
| Regularização    | L2 (λ = 0.001), Dropout (0.3 / 0.2), Batch Normalization |
| Split do dataset | 70% treino / 15% validação / 15% teste                   |
| Dataset          | 10.000 amostras (50% normal, 50% suspeito, 8 perfis)     |

### Hyperparameter Tuning

O script `npm run hyperparam-search` realiza uma busca de hiperparâmetros com **5-fold cross-validation**, testando combinações de:

- Número de unidades por camada
- Taxa de dropout
- Learning rate
- Fator de regularização L2

A melhor configuração é selecionada pelo F1-Score médio entre os folds.

### Métricas Finais (Conjunto de Teste)

| Métrica   | Modelo ML  | Baseline de Regras |
| --------- | ---------- | ------------------ |
| Accuracy  | 99.38%     | 84.25%             |
| Precision | 99.54%     | 58.56%             |
| Recall    | 99.21%     | 96.27%             |
| F1-Score  | **99.37%** | **72.79%**         |
| AUC-ROC   | 0.9998     | —                  |

### Baseline de Regras Estáticas (8 regras)

O baseline implementa 8 heurísticas de segurança. Uma ação é classificada como **suspeita se 2 ou mais regras** forem ativadas simultaneamente:

| #   | Regra                              | Threshold                        |
| --- | ---------------------------------- | -------------------------------- |
| 1   | Alta frequência de ações           | > 50 ações na janela temporal    |
| 2   | Acesso fora do horário comercial   | 22h às 6h                        |
| 3   | Múltiplas tentativas de login      | > 3 tentativas                   |
| 4   | Mudança de endereço IP             | IP diferente do habitual         |
| 5   | Alta taxa de erros                 | > 20% das operações              |
| 6   | Rajada de atividade (burst)        | > 5 ações em 1 minuto            |
| 7   | Acesso excessivo a dados sensíveis | > 20 acessos a módulos restritos |
| 8   | Distância geográfica anômala       | > 100 km do local habitual       |

### Limitações

> ⚠️ Os perfis de comportamento do **dataset sintético** possuem padrões bem definidos e separáveis por design. Em cenários reais, comportamentos legítimos e maliciosos tendem a se sobrepor de forma mais sutil, resultando em **métricas inferiores** às reportadas. Esta ressalva é fundamental para a seção de limitações da monografia.

---

## 📊 Dashboard ML

O dashboard apresenta 7 painéis interativos para monitoramento e análise:

| Painel                   | Descrição                                                                                                                                                  |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **MetricsPanel**         | Cards com Accuracy, Precision, Recall, F1-Score e AUC-ROC; comparativo ML vs. regras com percentual de melhoria; nota sobre limitação do dataset sintético |
| **AlertsPanel**          | Lista de alertas em tempo real com score de risco, tipo de alerta (ML ou Regra), usuário e timestamp; badge com contagem total                             |
| **UserRiskScore**        | Ranking de usuários por score de risco com barras de progresso coloridas (verde/amarelo/vermelho)                                                          |
| **ConfusionMatrixChart** | Matrizes de confusão 2x2 lado a lado (ML e Regras) com heatmap colorido, valores absolutos e percentuais                                                   |
| **LearningCurveChart**   | Gráficos de loss e acurácia por época (treino vs. validação) com diagnóstico automático de overfitting (saudável/leve/severo)                              |
| **AnomalyChart**         | Gráfico de área mostrando score de risco médio e máximo ao longo do tempo                                                                                  |
| **FeatureImportance**    | Gráfico de barras horizontal com as 15 features mais discriminantes entre comportamento normal e suspeito                                                  |

**Simulação de ações (SuperAdmin/DEV):** O botão "Simular Ações Suspeitas" dispara **20 ações** em sequência para um usuário alvo (user1 ou user2). A sequência mistura ações **sensíveis** (exportar dados, contratos, configuração) e **normais** (listagem de clientes, consulta empresa), em ordem aleatória. Cada log usa uma **sessão simulada** (duração, tentativas de login, inatividade variados) para que os vetores de features difiram e os gráficos (Importância das Features, Score ao Longo do Tempo) reflitam a simulação. O **Limiar de Decisão** definido no slider é usado na classificação: quanto menor o limiar, mais ações podem ser classificadas como suspeitas e gerar alerta/bloqueio.

> 📷 _Screenshots podem ser adicionados em versão futura da documentação._

---

## 🔒 Robustez e melhorias de UX (pós-auditoria)

Alterações aplicadas para maior estabilidade na demonstração e consistência entre treino e inferência:

### Backend

- **Limites de API:** `POST /logs/batch` aceita no máximo **100 itens** (retorna `400` se exceder). `GET /logs` aplica **limit máximo de 500** por request.
- **Helpers compartilhados:** A função `queryToObjects` foi extraída para `server/src/db/helpers.ts` e é utilizada pelas rotas de incidents, users, userBlocks, alerts, ml e model.
- **Status `confirmed_threat`:** A rota `GET /user-blocks/:userId` verifica se a sessão do usuário foi invalidada (admin confirmou ameaça). Nesse caso retorna `status: "confirmed_threat"` para o frontend exibir a mensagem adequada antes do redirect.
- **Parâmetros de log (sql.js):** Os valores enviados em `POST /logs` e `/logs/batch` são normalizados com `toBindable()` antes do bind no SQLite (apenas string, number ou null), evitando o erro "Wrong API use" quando o frontend envia objetos aninhados (ex.: Date não serializado).

### Frontend

- **Race condition e fila em `analyzeLog`:** Mutex por `userId` no `useMLStore` (`isAnalyzingByUser`) evita análises concorrentes; logs que chegam durante a análise entram numa **fila** (`analysisQueue`) e são processados em sequência, para que a simulação e os gráficos recebam todas as predições (Importância das Features, Score ao Longo do Tempo).
- **Simulação com sessão variada:** `addLog` aceita opcionalmente `options.overrideSession` (parcial). Na simulação do Dashboard, cada log recebe sessão simulada (startTime, loginAttempts, inactivityTime variados) para gerar vetores de features distintos e refletir o efeito do **Limiar de Decisão** sobre user1/user2.
- **Sessão em erro de rede:** `getSessionStatus` passa a retornar **`valid: false`** em caso de falha de rede ou resposta não-ok (antes assumia válido), garantindo que o force-logout seja aplicado quando o backend estiver indisponível ou retornar erro.
- **Fluxo `confirmed_threat`:** Quando o admin confirma ameaça, o usuário bloqueado vê a mensagem **"Seu acesso foi suspenso pelo administrador"** por **4 segundos** na tela de bloqueio e só então é redirecionado para o login (evita sair direto sem feedback).
- **Erros de API silenciosos:** Um contador de erros consecutivos (`useApiErrorStore`) é incrementado em falhas de `persistLog`, `reportPrediction` e `createIncident`. Se houver **5 ou mais erros consecutivos**, o AppBar exibe o alerta **"Problemas de comunicação com o servidor"** (o contador é zerado em qualquer sucesso).
- **Login com loading:** O botão de login exibe **CircularProgress** e o texto "Entrando..." enquanto o submit é processado; o botão fica desabilitado para evitar cliques duplicados.
- **Feature engineering alinhado:** As funções `classifyAction` e `classifyModule` em `src/ml/featureEngineering.ts` foram **sincronizadas** com o backend (`server/src/ml/featureEngineering.ts`) para que as mesmas strings gerem os mesmos códigos (evita divergência entre treino e inferência).
- **API base configurável:** A URL da API no frontend é definida por **`VITE_API_BASE`** (fallback: `http://localhost:3001/api`).
- **Logs em desenvolvimento:** `console.log` e `console.warn` no frontend (modelLoader, useMLStore, GeolocationProvider) são exibidos apenas quando **`import.meta.env.DEV`** é verdadeiro.

---

## 📚 Referências Acadêmicas

1. **Du, M., Li, F., Zheng, G., & Srikumar, V.** (2017). _DeepLog: Anomaly Detection and Diagnosis from System Logs through Deep Learning_. ACM CCS 2017.
2. **Berlin, K., Slater, D., & Saxe, J.** (2015). _Malicious Behavior Detection using Windows Audit Logs_. ACM AISec Workshop.
3. **Ranjan, R. & Kumar, S.S.** (2022). _User Behaviour Analysis using Data Analytics and Machine Learning to Identify Malicious User versus Legitimate User_. High Technology Letters, 28(1).
4. **Jiang, J. et al.** (2018). _Anomaly Detection with Graph Convolutional Networks for Insider Threat and Fraud Detection_. IEEE MILCOM.
5. **Bolt, A., de Leoni, M., & van der Aalst, W.M.P.** (2018). _Process Variant Comparison: Using Event Logs to Detect Differences in Behavior and Business Rules_. Information Systems, v. 74.
6. **Danziger, M. & Henriques, M.A.A.** (2017). _Autonomic Computing Guided by Machine Learning to Counteract Security Threats in Information Systems_. XIV SBSEG.

---

## 📄 Licença

Este projeto está licenciado sob a [MIT License](https://opensource.org/licenses/MIT).

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

## 🙏 Créditos

- **Universidade Federal de Uberlândia (UFU)** — Faculdade de Computação, Campus Monte Carmelo
- Desenvolvido como Trabalho de Conclusão de Curso para o Bacharelado em Sistemas de Informação
