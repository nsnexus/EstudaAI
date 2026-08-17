# 📚 EstudaAI — Documento de Arquitetura

> **Plataforma de Assistente de Estudos com IA**
> Sistema web que ajuda o aluno a **aprender de verdade**: recebe uma questão ou conteúdo e devolve explicação didática, conceito, exemplo e raciocínio guiado — **sem entregar a alternativa pronta**.

---

## 🎯 1. Visão Geral

**Nome sugerido:** EstudaAI

**Proposta:** plataforma onde o aluno insere uma questão/conteúdo e recebe da IA uma **explicação didática guiada** (conceito → exemplo → raciocínio → pergunta reflexiva), em vez da alternativa marcada. O foco é **aprendizado, não substituição da avaliação**.

**Princípio norteador:**
> *"Depois de usar o sistema, o aluno deve saber responder a questão sem ele."*

---

## 🏗️ 2. Arquitetura em Camadas

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (Next.js)                 │
│  Landing • Área do Aluno • Painel Admin • Auth UI    │
└───────────────────────┬─────────────────────────────┘
                        │  HTTPS / REST
┌───────────────────────▼─────────────────────────────┐
│           BACKEND / API (Next API Routes             │
│                ou Firebase Functions)                │
│  • Auth guard   • Rate limit   • Validação           │
│  • Orquestração do prompt didático                   │
│  • Camada anti-abuso (bloqueia "só me dê a resposta")│
└──────────┬───────────────────────┬──────────────────┘
           │                       │
┌──────────▼─────────┐   ┌─────────▼──────────────────┐
│   OpenAI API       │   │   Firebase                 │
│  (ChatGPT)         │   │  • Auth (login aluno/admin)│
│  Modo "tutor"      │   │  • Firestore (dados)       │
│  system prompt     │   │  • Storage (materiais)     │
│  restritivo        │   │  • Functions (serverless)  │
└────────────────────┘   └────────────────────────────┘
```

---

## 🧩 3. Módulos Principais

### 3.1. Autenticação & Perfis
- **Firebase Auth** (e-mail/senha + login com Google).
- Dois perfis: **Aluno** (comum) e **Admin** — controle via *custom claims*.
- Admin gerencia usuários, vê métricas e configura os "modos de tutoria".

### 3.2. Núcleo de Tutoria (o coração 💚)
- Recebe a questão/conteúdo do aluno (texto colado ou upload).
- Monta o prompt com um **system prompt restritivo** que obriga a IA a agir como *tutor*, não como *gabaritador*.
- Retorna: **conceito → exemplo → raciocínio guiado → pergunta reflexiva**.

### 3.3. Biblioteca de Estudos
- Flashcards e simulados gerados pela IA a partir do material.
- Histórico de dúvidas do aluno para revisão posterior.

### 3.4. Painel Admin (CRUD)
- Gestão de usuários (adicionar/remover, promover admin).
- Configuração de disciplinas e "personas" de tutor.
- Dashboard de uso: nº de dúvidas, temas mais buscados, engajamento.

---

## 🗄️ 4. Modelo de Dados (Firestore)

```
usuarios/
  {uid}: { nome, email, perfil: "aluno"|"admin", criadoEm }

sessoes_estudo/
  {id}: { uid, disciplina, pergunta, respostaTutor,
          conceito, exemplo, timestamp }

materiais/
  {id}: { titulo, disciplina, arquivoUrl, uploadPor }

flashcards/
  {id}: { uid, disciplina, frente, verso, dominado: bool }

metricas/
  {data}: { totalSessoes, temasTop[], usuariosAtivos }
```

---

## ⚙️ 5. Stack Tecnológica

| Camada | Tecnologia | Por quê |
|--------|-----------|---------|
| **Frontend** | Next.js + Tailwind CSS | SPA rápido, SEO na landing |
| **Auth** | Firebase Auth | Pronto, seguro, integra fácil |
| **Backend** | Firebase Functions ou Next API Routes | Serverless, escala sozinho |
| **Banco** | Firestore | NoSQL real-time |
| **IA** | OpenAI API (GPT) | Motor da tutoria |
| **Storage** | Firebase Storage | PDFs/materiais de estudo |
| **Deploy** | Vercel (front) + Firebase (back) | CI/CD simples |

---

## 🔒 6. Camada de Integridade (mantém tudo legítimo)

Essa é a parte **mais importante** da arquitetura — o que diferencia o sistema de um bot de cola:

- **System prompt "modo tutor"**: instrui a IA a *nunca* entregar a alternativa correta diretamente, e sim explicar o conceito e guiar o raciocínio.
- **Filtro de saída**: pós-processamento que detecta e bloqueia respostas do tipo *"a resposta é a letra X"*.
- **Sem integração de auto-marcação**: o sistema **não** se conecta ao AVA para marcar/enviar nada. O aluno estuda na plataforma e responde a avaliação por conta própria.
- **Log de aprendizado**: registra o que o aluno estudou, não "o que ele colou".

**Esboço do system prompt:**
```
Você é um tutor didático. NUNCA forneça a alternativa correta
de uma questão de prova diretamente. Explique o conceito
envolvido, dê um exemplo análogo, mostre o passo a passo do
raciocínio e termine com uma pergunta que ajude o aluno a
concluir sozinho.
```

---

## 🛤️ 7. Roadmap de Implementação

| Fase | Entrega |
|------|---------|
| **Fase 1 — Fundação** | Setup Next + Firebase, Auth, estrutura de pastas |
| **Fase 2 — Núcleo de Tutoria** | Integração OpenAI + system prompt + tela de dúvida |
| **Fase 3 — Biblioteca** | Flashcards e simulados gerados por IA |
| **Fase 4 — Painel Admin** | CRUD de usuários + dashboard de métricas |
| **Fase 5 — Polimento** | Landing bonita, PWA, deploy |

---

## 📌 8. Próximos Passos

1. Definir a(s) **disciplina(s)** foco para ajustar as "personas de tutor".
2. Gerar o **prompt de arquiteto detalhado** para uso em IA mais robusta.
3. Iniciar o **scaffold Next + Firebase**.

---

*Documento de arquitetura — EstudaAI • Versão 1.0*
