# 📚 EstudaAI — Assistente de Estudos com IA Socrática

> **Plataforma web de aprendizagem ativa:** ajuda o aluno a **aprender de verdade**, recebendo uma questão ou dúvida e devolvendo explicação didática guiada (conceito → exemplo → raciocínio → pergunta reflexiva) — **sem entregar a alternativa pronta**.

---

## 🎯 Proposta & Princípio Norteador

> *"Depois de usar o sistema, o aluno deve saber responder a questão sem ele."*

O **EstudaAI** combate a dependência de "bots de cola" através de uma **Camada de Integridade Pedagógica** que bloqueia pedidos de gabarito direto e orquestra a resposta em 4 blocos socráticos fundamentais:
1. 💡 **Conceito Fundamental**: A teoria clara por trás do problema.
2. 🔍 **Exemplo do Cotidiano**: Uma analogia prática do mundo real.
3. 🪜 **Passo a Passo do Raciocínio**: A dedução lógica estruturada.
4. 🎯 **Desafio / Pergunta Reflexiva**: Onde o aluno conclui sozinho.

---

## 🚀 Funcionalidades Principais

- 🌟 **Landing Page Interativa**: Demonstração em tempo real do método socrático com seletor de disciplinas e comparativo didático.
- 🧠 **Núcleo de Tutoria IA**: Suporte a LaTeX / KaTeX para fórmulas matemáticas, seleção de nível de profundidade e chat de acompanhamento contínuo.
- 🛡️ **Camada de Integridade Anti-Abuso**: Intercepta tentativas de forçar resposta direta (ex: "qual marcar?", "é A ou B?") e redireciona para a aprendizagem.
- 🗂️ **Biblioteca & Flashcards 3D**: Efeito de virada 3D, controle de domínio (Dominado / Rever) e geração de cards a partir de dúvidas com 1 clique.
- 📝 **Simulados Reflexivos**: Questões conceituais com dicas do tutor e explicações imediatas para cada alternativa.
- 📊 **Painel do Administrador & Coordenação**: Gráficos analíticos, taxa de autonomia, gestão de usuários e editor de personas de tutores.
- ⚙️ **Configuração Flexível**: Funciona 100% offline no Modo Local Inteligente ou conectado a chaves da OpenAI (GPT-4o) / Google Gemini / Firebase.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: [Next.js 14](https://nextjs.org/) (App Router), [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/), Glassmorphism, Dark & Light Mode
- **Ícones & UI**: [Lucide React](https://lucide.dev/), Canvas Confetti
- **Renderização Matemática**: [KaTeX](https://katex.org/)
- **Armazenamento**: LocalStorage reativo com sincronização instantânea de eventos e suporte a Firebase Firestore

---

## 🏃‍♂️ Como Executar Localmente

### 1. Requisitos
- Node.js v18+ (ou o ambiente portátil do sistema)

### 2. Instalação e Execução
```powershell
# Definir o caminho do Node portátil se necessário:
$env:Path = "C:\temp\NodeJS\node-v24.19.0-win-x64;" + $env:Path

# Instalar dependências
npm install

# Iniciar o servidor de desenvolvimento
npm run dev
```

Acesse em seu navegador: **`http://localhost:3000`**

### 3. Build de Produção
```powershell
npm run build
npm run start
```

---

*EstudaAI — Versão 1.0 • Desenvolvido para transformar o aprendizado acadêmico com integridade e rigor didático.*
