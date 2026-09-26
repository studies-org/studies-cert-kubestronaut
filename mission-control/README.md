# 🚀 Mission Control

Sistema pessoal de tracking da jornada Kubestronaut.
**Cloud-native by design** — usa a stack que você tá estudando.

> 📐 Plano completo: [PLAN.md](./PLAN.md)

## Status atual

| Componente   | Estado                                              |
|--------------|-----------------------------------------------------|
| Frontend     | ✅ MVP rodando (Next.js 15 + Three.js)              |
| Backend API  | ✅ Skeleton FastAPI rodando (/health, /api/info, /docs) |
| Postgres     | ✅ Up + healthy (conecta no API)                    |
| Redis        | ✅ Up + healthy (conecta no API)                    |
| Traefik      | ✅ Up (use ports diretos no WSL2)                   |
| Observabilidade | 📐 V3 (deferred)                                |

## Estrutura

```
mission-control/
├── PLAN.md                              # plano completo
├── docker-compose.yml                   # orquestração local
├── .env.example                         # template de variáveis
├── frontend/                            # ✅ Next.js 15 + Three.js
│   ├── src/
│   │   ├── app/                         # rotas (App Router)
│   │   ├── components/
│   │   │   ├── ui/                      # Icon, Panel, Eyebrow, Badge, Progress, Ring, Heatmap
│   │   │   ├── layout/                  # Sidebar, TopBar
│   │   │   ├── pomodoro/                # Provider + Modal
│   │   │   ├── neural/                  # NeuralMission (Three.js)
│   │   │   └── screens/                 # Dashboard, Schedule, Stats, etc.
│   │   └── lib/mock-data.ts             # dados temporários (vira API depois)
│   ├── Dockerfile                       # multi-stage, Next standalone
│   ├── package.json
│   ├── next.config.mjs
│   ├── tailwind.config.ts
│   └── tsconfig.json
```

## Rodar localmente

### Stack completa — testado ✅

A partir da **raiz do repo** (recomendado):

```bash
docker compose up -d
```

Ou de dentro de `mission-control/`:

```bash
docker compose up -d
```

### Acesso

| Serviço     | URL                                | Notas                  |
|-------------|------------------------------------|------------------------|
| Frontend    | <http://localhost:3000>            | Next.js                |
| API         | <http://localhost:8000>            | FastAPI                |
| API · docs  | <http://localhost:8000/docs>       | Swagger UI             |
| API · health| <http://localhost:8000/health>     | DB + Redis status      |
| Postgres    | localhost:5432                     | mission / mission_dev  |
| Redis       | localhost:6379                     | —                      |

### Comandos úteis

```bash
docker compose ps              # status dos containers
docker compose logs -f api     # logs em tempo real
docker compose down            # para tudo
docker compose down -v         # para tudo + apaga volumes
docker compose build api       # rebuild só do api
```

> ⚠️ **Traefik no WSL2**: pode dar erro de acesso ao socket
> (_"Failed to retrieve information of the docker client"_).
> Você pode ignorar — todos os serviços têm porta exposta direto e
> funcionam sem Traefik no dev local.

## Rotas

| Rota              | Tela                       |
|-------------------|----------------------------|
| `/`               | Dashboard principal        |
| `/neural`         | **Neural Mission** (3D)    |
| `/pomodoro`       | Lista de modos             |
| `/cronograma`     | Grade semanal              |
| `/certs`          | Lista das 5 certs          |
| `/certs/[code]`   | Detalhe de uma cert        |
| `/stats`          | Histórico e achievements   |

## Pomodoro

Modal fullscreen disponível **em qualquer rota** via botão "Iniciar foco"
ou pelo botão grande do dashboard.

Modos: Quick (15/5), Classic (25/5), Long (50/10), Ultradian (90/20),
**Madrugadão** (sessão noturna longa).

## Neural Mission · atalhos

| Tecla         | Ação                          |
|---------------|-------------------------------|
| `H`           | Toggle HUD                    |
| `L`           | Toggle labels das regiões     |
| `F` / `Space` | Toggle modo Cinema            |
| `Esc`         | Sair do modo Cinema           |
| `Drag`        | Rotacionar manualmente        |
| `Scroll`      | Zoom in/out                   |
| `Click neurônio` | Foco na região             |

## Próximos passos

Ver [PLAN.md](./PLAN.md) — Fase 2: scaffold do backend FastAPI.
