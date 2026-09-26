# Day 1 — Containers, Engine e Runtime

> Curso: **Descomplicando Kubernetes** (LinuxTips · Jeferson Fernando)
> Foco: fundamentos antes de partir pra orquestração.

---

## 🧱 Container

Container é **isolamento**. Analogia: numa casa, o container é o cômodo —
cada cômodo é isolado dos outros, mas todos compartilham a estrutura da casa.

### O que é isolado

- Arquivos e diretórios — ficam apenas dentro do container
- Interface de rede e IP dedicado
- Processos — containers diferentes rodam processos isolados entre si

### De onde vêm os recursos

Os recursos computacionais (CPU, memória, disco) vêm da **casa** — ou seja, do
**host / node / nó** onde o container está rodando.

> Container **não cria uma VM** — ele não utiliza recursos diretamente como se
> fosse uma máquina virtual. Ele apenas **isola** e consome os recursos do host.

### Quem faz o isolamento

Tudo isso vem do **kernel do Linux**, através de dois mecanismos principais:

| Mecanismo     | Responsabilidade                                            |
|---------------|-------------------------------------------------------------|
| **cgroups**   | Isolamento de CPU e memória                                 |
| **namespaces**| Isolamento de usuários, processos, montagem, rede etc.      |

Os **namespaces** são módulos do kernel (assim como cgroups) que dão a
habilidade de isolar diferentes recursos:

- mount namespace
- user namespace
- pid namespace (processos)
- net namespace
- ipc namespace
- uts namespace (hostname)

### Containers ≠ Docker

Container **não é Docker**. Containers existem **muito antes** do Docker —
o Docker só popularizou a ideia ao oferecer uma interface fácil em cima dos
mecanismos do kernel.

> **Resumo:** container = isolamento de recursos do kernel do Linux. Só isso.

### 📝 Dúvida da aula

Jeferson comentou algo que soou como _"ibpiefe"_ — provavelmente é o
**eBPF** (Extended Berkeley Packet Filter), módulo do kernel usado para
observabilidade, rede e segurança, frequentemente citado junto com cgroups e
namespaces. _Confirmar na próxima aula._

---

## ⚙️ Container Engine

Quando se trabalha com containers, é fundamental entender a diferença entre
**Container Engine** e **Container Runtime**.

### O que faz o Container Engine

É o cara responsável por **criar e gerenciar** o container. Sem ele, o
container não existe.

Responsabilidades:

- Criar o container
- Verificar se está saudável (healthcheck)
- Configurar rede
- Configurar storage (volumes, pontos de montagem)
- Disponibilizar diretórios e recursos específicos

### Projetos famosos

| Engine          | Empresa / Mantenedor       |
|-----------------|----------------------------|
| **Docker Engine** | Docker, Inc.             |
| **Podman**        | Red Hat                  |

### Limitação importante

O **Container Engine não conversa diretamente com o kernel**. Pra isso ele
precisa de outro componente: o **Container Runtime**.

```
┌─────────────────┐   ┌─────────────────┐   ┌───────────────┐
│ Container Engine│ → │Container Runtime│ → │ Kernel Linux  │
│ (docker/podman) │   │   (runc, etc)   │   │ cgroups + ns  │
└─────────────────┘   └─────────────────┘   └───────────────┘
```

Independente da Engine escolhida (Docker, Podman, …), todas precisam de um
**Container Runtime** para conversar com o kernel.

---

## 🔧 Container Runtime

Camada que conversa **diretamente com o kernel** para de fato criar/executar
o container. Existem dois níveis:

### Low-level Runtime

Executados **diretamente pelo kernel**. São os mais "baixo nível".

| Runtime  | Detalhe                                                |
|----------|--------------------------------------------------------|
| **runc** | Padrão da indústria (Open Container Initiative · OCI)  |
| **crun** | Escrito em C, alternativa mais leve                    |
| **runsc**| Da gVisor (Google), com isolamento extra (sandbox)     |

### High-level Runtime

Executados **por um Container Engine** — orquestram o low-level runtime
adicionando funcionalidades como gerenciamento de imagens, networking de
mais alto nível, etc.

| Runtime       | Detalhe                                                 |
|---------------|---------------------------------------------------------|
| **containerd**| Originalmente parte do Docker; padrão no K8s atual      |
| **CRI-O**     | Implementação do CRI feita pra Kubernetes (Red Hat)     |
| **Podman**    | Daemonless, roda como processo de usuário               |

### Fluxo completo

```
┌──────────────────────┐
│  docker run nginx    │  ← você
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│   Container Engine   │  Docker / Podman
│   (cria + gerencia)  │
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│  High-level Runtime  │  containerd / CRI-O
│  (imagens, network)  │
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│  Low-level Runtime   │  runc / crun
│  (fala c/ kernel)    │
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│   Kernel Linux       │  cgroups · namespaces · eBPF
│   (isolamento real)  │
└──────────────────────┘
```

---

## ✅ Checklist do Day 1

- [x] Entender que container = isolamento
- [x] Diferenciar cgroups e namespaces
- [x] Entender que container ≠ Docker
- [x] Diferenciar Container Engine vs Container Runtime
- [x] Entender Low-level vs High-level Runtime
