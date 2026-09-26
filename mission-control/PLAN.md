# 🚀 Mission Control — Plano Detalhado

> Sistema pessoal de tracking para a jornada Kubestronaut.
> Roda local em Docker, **dogfooding** a stack cloud-native que estamos estudando.
> Futuramente deployável em VPS multi-usuário pros colegas.

---

## 📑 Sumário

1. [Visão e princípios](#-visão-e-princípios)
2. [Personas e cenários de uso](#-personas-e-cenários-de-uso)
3. [Arquitetura](#-arquitetura)
4. [Stack tecnológica + rationale](#-stack-tecnológica--rationale)
5. [Modelo de dados](#-modelo-de-dados)
6. [Features (MVP → V3)](#-features-mvp--v3)
7. [Sistema Pomodoro](#-sistema-pomodoro)
8. [UI/UX e identidade visual](#-uiux-e-identidade-visual)
9. [Estrutura de pastas](#-estrutura-de-pastas)
10. [docker-compose detalhado](#-docker-compose-detalhado)
11. [Roadmap de implementação](#-roadmap-de-implementação)
12. [Considerações de segurança](#-considerações-de-segurança)
13. [Métricas e observabilidade](#-métricas-e-observabilidade)
14. [Decisões pendentes](#-decisões-pendentes)

---

## 🎯 Visão e princípios

**Visão:** Centralizar a jornada de estudo das 5 certificações Kubernetes em um
sistema cloud-native pessoal que serve como:

- **Tracker prático** — pomodoros, sessões, progresso real
- **Painel motivacional** — visualizar avanço, streaks, conquistas
- **Laboratório vivo** — o próprio sistema é um exercício de cloud-native
  (FastAPI, Postgres, Redis, Traefik, Prometheus, Grafana e, no futuro, K8s)
- **Plataforma compartilhável** — quando subir em VPS, vira a "academia" dos colegas

**Princípios:**

| Princípio                       | O que significa                                          |
|---------------------------------|----------------------------------------------------------|
| Cloud-native first              | Tudo containerizado, 12-factor, K8s-ready                |
| Pessoal antes de coletivo       | MVP single-user; multi-tenant em V2                      |
| Métricas reais                  | Tempo medido pelo sistema, não chutado                   |
| Brutalmente honesto             | Mostra a verdade — streaks quebrados, semanas fracas etc |
| Tema espacial                   | Identidade Kubestronaut consistente                      |

---

## 👥 Personas e cenários de uso

### Persona principal: o astronauta-em-treinamento

**Cenário 1 — Sessão de estudo pela manhã**
> Abre o dashboard. Vê o card "Próxima sessão: KCNA - Container Orchestration".
> Aperta `Iniciar Pomodoro`. Modo 50/10 (long focus). Estuda. Sistema registra
> automaticamente 4 pomodoros = 3h20 contabilizadas pra KCNA.

**Cenário 2 — Noite de estudo intensivo (Madrugadão)**
> Seleciona modo **"Madrugadão"**. Sistema agenda: 4× (90 min foco + 20 min pausa),
> refeição no meio da sessão, mais 2× (90/20), encerra pela manhã. UI muda para tema
> noturno reforçado e mostra "Próxima refeição: 04:00".

**Cenário 3 — Retomando depois de uma pausa**
> Reabre. Sistema mostra "Bem-vindo de volta" com a meta do dia e quanto falta.
> Sugere conteúdo baseado no que tava estudando antes.

### Persona V2: colega

> Cria conta na VPS, escolhe certificação, segue seu próprio cronograma.
> Vê leaderboard semanal — quem fez mais horas, maior streak, etc.

---

## 🏛️ Arquitetura

```
                          ┌────────────────────────────┐
                          │       USUÁRIO (browser)    │
                          └─────────────┬──────────────┘
                                        │ HTTPS
                                        ▼
                          ┌────────────────────────────┐
                          │      TRAEFIK (proxy)       │
                          │  - TLS (Let's Encrypt VPS) │
                          │  - Roteamento por host     │
                          │  - Rate limiting           │
                          └──────┬──────────────┬──────┘
                                 │              │
                  ┌──────────────┘              └───────────────┐
                  ▼                                             ▼
        ┌─────────────────────┐                    ┌─────────────────────┐
        │   WEB (Next.js)     │  ◄──── API ────►   │   API (FastAPI)     │
        │   - Dark space UI   │     REST/WS        │   - Auth (JWT)      │
        │   - Pomodoro client │                    │   - CRUD            │
        │   - Realtime stats  │                    │   - WebSocket timer │
        └─────────────────────┘                    └──────────┬──────────┘
                                                              │
                                          ┌───────────────────┼───────────────────┐
                                          ▼                   ▼                   ▼
                                ┌──────────────────┐  ┌──────────────┐  ┌──────────────────┐
                                │  POSTGRES 16     │  │  REDIS 7     │  │  PROMETHEUS      │
                                │  - Dados        │  │  - Pomodoro  │  │  - Métricas API  │
                                │    persistentes  │  │    state     │  │  - Métricas app  │
                                │  - Sessões      │  │  - Sessions  │  └────────┬─────────┘
                                │  - Progresso    │  │  - Cache     │           │
                                └──────────────────┘  └──────────────┘           ▼
                                                                       ┌──────────────────┐
                                                                       │   GRAFANA        │
                                                                       │   - Dashboards   │
                                                                       │   - Heatmaps     │
                                                                       │   - Trends       │
                                                                       └──────────────────┘
```

### Fluxos críticos

**1. Iniciar pomodoro**
```
Usuário clica "Iniciar"
  → Frontend abre WS com /ws/pomodoro
  → Backend cria registro em Postgres (status=running)
  → Backend escreve estado no Redis (TTL = duração)
  → Backend envia ticks via WS a cada segundo
  → Ao final: backend marca completed=true, incrementa stats
```

**2. Auto-track de sessão**
```
Primeiro pomodoro do dia inicia → cria sessão pai
  → Pomodoros subsequentes herdam session_id
  → Após 30 min de inatividade, sessão é fechada
  → Total da sessão = soma dos pomodoros completos
```

---

## 🛠️ Stack tecnológica + rationale

| Camada           | Tecnologia                    | Por quê                                                              |
|------------------|-------------------------------|----------------------------------------------------------------------|
| Frontend         | **Next.js 15** + TS           | SSR, App Router, padrão de mercado                                   |
| UI components    | **shadcn/ui** + Tailwind      | Componentes acessíveis, fácil customizar tema espacial               |
| State (front)    | **Zustand** + React Query     | Leve, sem boilerplate de Redux                                       |
| Backend          | **FastAPI** (Python 3.12)     | Async nativo, OpenAPI grátis, ecossistema cloud-native               |
| ORM              | **SQLAlchemy 2** + Alembic    | Padrão Python, migrations versionadas                                |
| Validação        | **Pydantic v2**               | Vem com FastAPI, type-safe                                           |
| WebSocket        | FastAPI WS nativo             | Pomodoro precisa de tick em tempo real                               |
| DB               | **Postgres 16** alpine        | Robusto, JSONB pra dados flexíveis                                   |
| Cache/timer      | **Redis 7** alpine            | TTL nativo perfeito pro estado do pomodoro                           |
| Reverse proxy    | **Traefik v3**                | Auto-discovery via labels, TLS Let's Encrypt automático              |
| Métricas         | **Prometheus** + **Grafana**  | Padrão K8s — você vai usar na prova do CKA                           |
| Auth             | **fastapi-users** (Argon2)    | Pronto, seguro, suporta JWT cookie httpOnly                          |
| Testes back      | pytest + httpx                | Padrão                                                               |
| Testes front     | vitest + Playwright           | Unit + E2E                                                           |
| Container        | Docker + Compose v2           | MVP local                                                            |
| CI (futuro)      | GitHub Actions                | Build images, push, deploy                                           |
| Deploy V3        | Helm chart no K8s             | Quando rolar VPS → cluster                                           |

**Por que NÃO escolhi outras opções:**

- ~~Streamlit~~: rápido mas não dá pomodoro real-time decente
- ~~Django~~: peso desnecessário, FastAPI mais cloud-native
- ~~Go~~: mais verboso pra MVP, FastAPI ganha em produtividade
- ~~MongoDB~~: dados relacionais (cert ↔ sessão ↔ pomodoro), Postgres ganha
- ~~Nginx~~: Traefik trata TLS sozinho — menos chato pra VPS

---

## 🗃️ Modelo de dados

```sql
-- ─── USUÁRIOS ──────────────────────────────────────────────────────
CREATE TABLE users (
  id              UUID PRIMARY KEY,
  email           TEXT UNIQUE NOT NULL,
  display_name    TEXT NOT NULL,
  password_hash   TEXT NOT NULL,
  timezone        TEXT DEFAULT 'America/Sao_Paulo',
  created_at      TIMESTAMPTZ DEFAULT now(),
  is_admin        BOOLEAN DEFAULT FALSE
);

-- ─── CERTIFICAÇÕES (catálogo + progresso por usuário) ──────────────
CREATE TABLE certifications (         -- catálogo global
  id              SERIAL PRIMARY KEY,
  code            TEXT UNIQUE,        -- KCNA, KCSA, CKAD, CKA, CKS
  name            TEXT,
  order_index     INT,
  domains         JSONB               -- [{name, weight}]
);

CREATE TABLE user_cert_progress (
  user_id         UUID REFERENCES users(id),
  cert_id         INT REFERENCES certifications(id),
  status          TEXT,               -- pending|in_progress|booked|passed|failed
  target_date     DATE,
  exam_date       DATE,
  score           NUMERIC,
  domain_progress JSONB,              -- {domain_name: pct}
  PRIMARY KEY (user_id, cert_id)
);

-- ─── SESSÕES E POMODOROS ───────────────────────────────────────────
CREATE TABLE study_sessions (
  id              UUID PRIMARY KEY,
  user_id         UUID REFERENCES users(id),
  cert_id         INT REFERENCES certifications(id),
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ,
  focus           TEXT,               -- "KodeKloud > Module 3 > Pods"
  notes_md        TEXT,               -- markdown
  total_seconds   INT,
  pomodoro_count  INT
);

CREATE TABLE pomodoros (
  id              UUID PRIMARY KEY,
  session_id      UUID REFERENCES study_sessions(id),
  mode            TEXT,               -- classic|long|ultradian|madrugadao|quick
  duration_seconds INT,
  break_seconds   INT,
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ,
  completed       BOOLEAN,
  interrupted_reason TEXT
);

-- ─── CURSOS (KodeKloud, Descomplicando Kubernetes) ─────────────────
CREATE TABLE courses (
  id              SERIAL PRIMARY KEY,
  provider        TEXT,               -- kodekloud, linuxtips
  name            TEXT,
  cert_id         INT REFERENCES certifications(id),
  url             TEXT,
  modules         JSONB               -- [{name, slug, duration_min}]
);

CREATE TABLE course_progress (
  user_id         UUID,
  course_id       INT,
  module_slug     TEXT,
  completed_at    TIMESTAMPTZ,
  PRIMARY KEY (user_id, course_id, module_slug)
);

-- ─── GAMIFICAÇÃO ───────────────────────────────────────────────────
CREATE TABLE achievements (
  id              SERIAL PRIMARY KEY,
  code            TEXT UNIQUE,
  name            TEXT,
  description     TEXT,
  icon            TEXT,
  criteria        JSONB               -- regra programática
);

CREATE TABLE user_achievements (
  user_id         UUID,
  achievement_id  INT,
  unlocked_at     TIMESTAMPTZ,
  PRIMARY KEY (user_id, achievement_id)
);

-- ─── CRONOGRAMA (semanas e checks) ─────────────────────────────────
CREATE TABLE weekly_plans (
  id              UUID PRIMARY KEY,
  user_id         UUID,
  week_number     INT,
  starts_on       DATE,
  cert_focus      INT REFERENCES certifications(id),
  goal            TEXT
);

CREATE TABLE planned_slots (
  id              UUID PRIMARY KEY,
  plan_id         UUID REFERENCES weekly_plans(id),
  day_of_week     INT,                -- 0=mon, 6=sun
  starts_at       TIME,
  ends_at         TIME,
  type            TEXT,               -- study|sleep|run|office|free
  description     TEXT,
  done            BOOLEAN DEFAULT FALSE,
  done_at         TIMESTAMPTZ
);
```

---

## ✨ Features (MVP → V3)

### MVP — V1 (uso pessoal, single-user)

- [ ] **Auth** — login local, single-user inicialmente
- [ ] **Dashboard** — hoje + streak + horas semanais
- [ ] **Pomodoro timer** — todos os 5 modos, WebSocket realtime
- [ ] **Session logger** — auto-criada a partir dos pomodoros, notes md
- [ ] **Cronograma view** — render da semana atual, slots clicáveis
- [ ] **Cert roadmap** — 5 cards com progresso por domínio
- [ ] **Stats** — horas/dia, horas/cert, gráfico de streak
- [ ] **Notes** — markdown por sessão, busca full-text (Postgres)

### V2 — Multi-user + integrações

- [ ] **Auth completa** — registro, OAuth Google opcional
- [ ] **KodeKloud import** — colar URL → mapeia módulos
- [ ] **LinuxTips tracking** — capítulos do Descomplicando
- [ ] **Leaderboard** — entre colegas convidados
- [ ] **Achievements** — 30+ conquistas (primeira sessão, streak 7d, etc)
- [ ] **Mobile-friendly PWA** — abrir pomodoro do celular

### V3 — Kubernetes deploy + extras

- [ ] **Helm chart** — deploy do próprio sistema em K8s
- [ ] **Backup automatizado** — Postgres dump pra S3/B2
- [ ] **Notificações** — Telegram/Discord bot
- [ ] **Calendar sync** — Google Calendar / Caldav
- [ ] **Spaced repetition** — flashcards por domínio da cert

---

## 🍅 Sistema Pomodoro

### Modos disponíveis

| Modo            | Foco    | Pausa   | Caso de uso                                          |
|-----------------|---------|---------|------------------------------------------------------|
| **Quick**       | 15 min  | 5 min   | Revisão rápida, flashcards                           |
| **Classic**     | 25 min  | 5 min   | Estudo teórico (KCNA/KCSA)                           |
| **Long**        | 50 min  | 10 min  | Labs hands-on (CKAD/CKA)                             |
| **Ultradian**   | 90 min  | 20 min  | Deep work, troubleshooting complexo                  |
| **Madrugadão**  | custom  | custom  | Sessão noturna longa, 20:00 → 09:00 (ver abaixo)     |

### Modo Madrugadão (especial)

```
20:00 ─────────┐
              ├─► Ultradian 1   (90 min foco + 20 min pausa)   → 21:30
              ├─► Ultradian 2   (90 + 20)                       → 23:20
              ├─► Ultradian 3   (90 + 20)                       → 01:10
              ├─► Ultradian 4   (90 + 20)                       → 03:00
              │
              ├─► 🍽️ Refeição    (30 min)                        → 03:30
              │
              ├─► Ultradian 5   (90 + 20)                       → 05:20
              ├─► Ultradian 6   (90 + 20)                       → 07:10
              ├─► Ultradian 7   (90 + 20)                       → 09:00
              │
              └─► 💤 Descanso
                                                                
Total: 7 blocos de foco = 10h30 de estudo focado + 2h20 de pausa
```

**Recursos especiais do modo:**

- Tela escurecida automaticamente após 23:00
- Lembrete de hidratação a cada 2 ciclos
- Alarme de refeição
- Sons ambiente opcionais (chuva, café, naves espaciais)
- Modo "panic" — se cabecear, salva progresso e te manda dormir

### Auto-vinculação

Cada pomodoro pergunta no início:
1. **Cert** (default: cert ativa)
2. **Foco** (default: último foco da sessão)
3. **Recurso** (KodeKloud módulo X, LinuxTips cap Y, ou livre)

Depois disso, só clica "iniciar" e estuda.

---

## 🎨 UI/UX e identidade visual

### Paleta

```
┌─────────────────────────────────────────────────────────┐
│ Background       #0B0F1A  ████  deep space             │
│ Surface          #131826  ████  panel                  │
│ Primary          #326CE5  ████  K8s blue (identidade)  │
│ Accent           #FF6B35  ████  booster flame          │
│ Success          #00D9A3  ████  oxygen green           │
│ Warning          #FFC857  ████  caution amber          │
│ Danger           #FF4757  ████  red alert              │
│ Text primary     #E6EAF2  ████                          │
│ Text muted       #8892A6  ████                          │
└─────────────────────────────────────────────────────────┘
```

### Mockup do Dashboard

```
┌──────────────────────────────────────────────────────────────────────┐
│ 🚀  MISSION CONTROL                              👤 Astronauta ⚙️       │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────┐   ┌────────────────────────────────┐  │
│  │  PRÓXIMA SESSÃO          │   │  STREAK         🔥 12 dias     │  │
│  │  ━━━━━━━━━━━━━━━━━━━━    │   │                                │  │
│  │  Segunda · 20:00         │   │  ESTA SEMANA                   │  │
│  │  KCNA › Container Orch   │   │  ▓▓▓▓▓▓▓▓▓▓░░░░  42 / 57 h    │  │
│  │                          │   │                                │  │
│  │  [ ▶  INICIAR  ]         │   │  POMODOROS HOJE  🍅 8/12       │  │
│  └──────────────────────────┘   └────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  ROADMAP                                                     │   │
│  │  ●━━━━━━━━●╶╶╶╶╶╶╶○╶╶╶╶╶╶╶○╶╶╶╶╶╶╶○                          │   │
│  │  KCNA      KCSA      CKAD     CKA      CKS                   │   │
│  │  42%       0%        0%       0%       0%                    │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌────────────────────────────┐   ┌────────────────────────────┐    │
│  │  HEATMAP (12 semanas)      │   │  ÚLTIMA SESSÃO             │    │
│  │  ▓▓▒░▒▓▓░▓░░▒              │   │  ━━━━━━━━━━━━━━━━━━━━━     │    │
│  │  ▓▓▓░▒░▓▓░░▓▓              │   │  KCNA · 3h 20min           │    │
│  │  ░▓▒▓░▓░▓▓▓░░              │   │  4 pomodoros (long)        │    │
│  │  ▒▓▓▓░▒▓░▒▓░▓              │   │  📝 "k8s components..."    │    │
│  └────────────────────────────┘   └────────────────────────────┘    │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Mockup do Pomodoro (em foco)

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                                                                      │
│                     ╭─────────────────────────╮                      │
│                     │                         │                      │
│                     │         34:21           │                      │
│                     │                         │                      │
│                     │   ━━━━━━━━━━━━━━━━━     │                      │
│                     │   KCNA · long focus     │                      │
│                     │                         │                      │
│                     ╰─────────────────────────╯                      │
│                                                                      │
│                         🎯 Container Orchestration                   │
│                         📘 KodeKloud · Module 3                      │
│                                                                      │
│                         ⏸  Pausar     ✕  Cancelar                    │
│                                                                      │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Estrutura de pastas

```
mission-control/
├── PLAN.md                    ◄── este documento
├── README.md                  ◄── como rodar
├── docker-compose.yml         ◄── orquestração local
├── docker-compose.prod.yml    ◄── overrides VPS
├── .env.example
├── .gitignore
│
├── backend/
│   ├── Dockerfile
│   ├── pyproject.toml
│   ├── alembic.ini
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── db.py
│   │   ├── auth/
│   │   ├── models/
│   │   ├── routers/
│   │   │   ├── pomodoros.py
│   │   │   ├── sessions.py
│   │   │   ├── certs.py
│   │   │   ├── plans.py
│   │   │   └── stats.py
│   │   ├── ws/
│   │   │   └── pomodoro_ws.py
│   │   └── services/
│   ├── migrations/
│   └── tests/
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   ├── dashboard/
│   │   │   ├── pomodoro/
│   │   │   ├── cronograma/
│   │   │   ├── certs/[code]/
│   │   │   └── stats/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── styles/
│   └── public/
│
├── db/
│   └── init/
│       └── 01_seed_certs.sql
│
├── traefik/
│   ├── traefik.yml
│   └── dynamic/
│       └── tls.yml
│
├── prometheus/
│   └── prometheus.yml
│
└── grafana/
    ├── provisioning/
    │   ├── datasources/
    │   └── dashboards/
    └── dashboards/
        ├── study-overview.json
        ├── pomodoro-stats.json
        └── cert-progress.json
```

---

## 🐳 docker-compose detalhado

Skeleton funcional em `mission-control/docker-compose.yml` (arquivo separado).

Serviços:

| Service       | Image                         | Port (host) | Volume                  |
|---------------|-------------------------------|-------------|-------------------------|
| traefik       | traefik:v3.0                  | 80, 443, 8080 (dashboard) | — |
| web           | (build ./frontend)            | —           | —                       |
| api           | (build ./backend)             | —           | —                       |
| db            | postgres:16-alpine            | 5432        | postgres_data           |
| redis         | redis:7-alpine                | 6379        | redis_data              |
| prometheus    | prom/prometheus:latest        | 9090        | prom_data               |
| grafana       | grafana/grafana:latest        | 3001        | grafana_data            |

Hosts locais (via Traefik + hosts file):

- `mission.local`     → web
- `api.mission.local` → api
- `grafana.mission.local` → grafana
- `traefik.mission.local` → traefik dashboard

---

## 🛣️ Roadmap de implementação

### Fase 0 — Planejamento (✅ você está aqui)
Aprovação do PLAN.md, decisões pendentes resolvidas.

### Fase 1 — Setup (1 fim de semana)
- Estrutura de pastas
- docker-compose funcionando com hello-worlds
- Traefik roteando para api + web
- Postgres + Redis acessíveis
- Migrations iniciais
- Seed das 5 certs e domínios

### Fase 2 — MVP backend (1 semana)
- Auth single-user
- CRUD certs / sessions / pomodoros
- WebSocket pomodoro
- Migrations Alembic
- Testes pytest dos endpoints críticos

### Fase 3 — MVP frontend (1-2 semanas)
- Layout dark space
- Dashboard funcional
- Pomodoro com WebSocket
- Cronograma view
- Notes markdown

### Fase 4 — Polimento (1 semana)
- Stats e heatmaps
- Achievements iniciais
- Importar progresso manual dos cursos
- Grafana dashboards

### Fase 5 — Multi-user + VPS (V2, mais à frente)
- Auth completa
- Helm chart
- Deploy na VPS com TLS

**Estimativa total V1:** 4-5 semanas (em paralelo aos estudos, usando ~10% do tempo de estudo)

---

## 🔐 Considerações de segurança

- **Senhas**: Argon2id, nunca em logs
- **JWT**: cookies httpOnly + Secure + SameSite=Lax
- **CSRF**: token duplo em mutations
- **Rate limit**: Traefik middleware 100 req/min/IP
- **CORS**: lista branca de origens
- **Secrets**: `.env` no `.gitignore`, em produção via Docker secrets / K8s Secrets
- **SQL injection**: ORM sempre, nunca raw queries com input
- **Updates**: Renovate bot futuro
- **Backups**: dump diário do Postgres (cronjob ou Velero quando em K8s)

---

## 📊 Métricas e observabilidade

Métricas Prometheus expostas pela API em `/metrics`:

- `study_pomodoros_total{cert, mode, status}` — counter
- `study_session_duration_seconds{cert, user}` — histogram
- `study_active_users` — gauge
- `study_streak_days{user}` — gauge
- `http_requests_total{path, method, status}` — counter

Dashboards Grafana:

1. **Study Overview** — horas/dia, distribuição por cert, heatmap semanal
2. **Pomodoro Stats** — taxa de conclusão por modo, interrupções
3. **Cert Progress** — progresso por domínio em barras horizontais
4. **System Health** — latência API, conexões DB, memória Redis

---

## ✅ Decisões tomadas (2026-05-16)

| # | Decisão                | Escolha                                                |
|---|------------------------|--------------------------------------------------------|
| 1 | Nome do sistema        | **Mission Control**                                    |
| 2 | Stack frontend         | **Next.js 15 + shadcn/ui + Tailwind**                  |
| 3 | Escopo do MVP          | **Single-user** (multi-user fica pra V2)               |
| 4 | Observabilidade no V1  | **Não** — Prometheus/Grafana migrados pra V3           |
| 5 | Idioma da UI           | **PT-BR** (default; reavaliar se for público em VPS)   |

**Implicações do #4:** docker-compose do V1 fica com 5 serviços (traefik, web, api, db, redis). Prometheus + Grafana entram só na Fase 4/V3 — quando chegar a hora, adicionar serviços ao mesmo compose ou criar um compose dedicado.

---

> _"In space, no one can hear you skip studying."_
