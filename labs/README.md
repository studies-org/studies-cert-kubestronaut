# labs — Práticas e Simulados

```
   ┌──────────────────────────────────────────┐
   │  🧪  CAMPO DE TREINAMENTO                │
   └──────────────────────────────────────────┘
```

Espaço para **exercícios práticos**, simulados, scripts e manifestos
usados durante a preparação das certificações.

## Organização sugerida

```
labs/
├── 00-setup/        # Instalação de cluster local (kind, minikube, kubeadm)
├── kcna-quiz/       # Questões de múltipla escolha
├── kcsa-quiz/       # Questões de múltipla escolha
├── ckad-tasks/      # Exercícios práticos por domínio
├── cka-tasks/       # Exercícios práticos por domínio
├── cks-tasks/       # Exercícios práticos por domínio
└── killer-sh/       # Anotações dos simulados killer.sh
```

## Ambientes recomendados

| Ferramenta   | Uso                                                |
|--------------|----------------------------------------------------|
| **kind**     | Multi-node local, rápido — ideal pra CKA/CKS       |
| **minikube** | Cluster simples e descartável                      |
| **k3d**      | k3s em Docker, leve                                |
| **kubeadm**  | Reproduz o ambiente real da prova (essencial CKA)  |

## Setup mínimo recomendado

```bash
# aliases que economizam segundos preciosos na prova
alias k=kubectl
export do='--dry-run=client -o yaml'
export now='--force --grace-period=0'
source <(kubectl completion bash)
complete -F __start_kubectl k
```
