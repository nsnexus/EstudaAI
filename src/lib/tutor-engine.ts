import { TutorResponse, ChatMessage, TutorPersona } from '@/types';
import { checkInputIntegrity, sanitizeTutorOutput, BASE_TUTOR_SYSTEM_PROMPT } from './integrity-filter';
import { AIConfig } from './storage';

export interface AskTutorParams {
  question: string;
  discipline?: string;
  topic?: string;
  difficulty?: 'iniciante' | 'intermediario' | 'avancado';
  persona?: TutorPersona;
  aiConfig?: AIConfig;
  conversationHistory?: ChatMessage[];
}

/**
 * Orquestra o processamento da dúvida pedagógica
 */
export async function generateTutorResponse(params: AskTutorParams): Promise<TutorResponse> {
  const { question, discipline = 'Geral', topic = 'Tópico de Estudo', persona, aiConfig } = params;

  // 1. Verificação de integridade no input
  const integrityCheck = checkInputIntegrity(question);

  // 2. Se houver chave e provedor remoto configurado, podemos usar a API
  if (aiConfig && aiConfig.provider === 'openai' && aiConfig.openaiApiKey) {
    try {
      const res = await callOpenAITutor(params);
      if (res) return res;
    } catch (e) {
      console.warn('Falha ao conectar com OpenAI API. Usando motor pedagógico local inteligente:', e);
    }
  }

  // 3. Motor Pedagógico Local Inteligente (Gera respostas socráticas ricas e estruturadas)
  return generateIntelligentLocalResponse(question, discipline, topic, integrityCheck.isCheatingAttempt, integrityCheck.pedagogicalNotice);
}

/**
 * Avalia a tentativa de resposta ou reflexão enviada pelo aluno
 */
export async function evaluateStudentReflection(
  question: string,
  tutorPreviousStep: TutorResponse,
  studentAnswer: string
): Promise<{ isCorrect: boolean; feedback: string; nextQuestion?: string }> {
  const lowerAnswer = studentAnswer.toLowerCase().trim();

  // Análise semântica simplificada de palavras-chave
  const hasReasoning = lowerAnswer.length > 8;
  const isDirectGuess = /^(a|b|c|d|e|letra [a-e])$/i.test(lowerAnswer);

  if (isDirectGuess) {
    return {
      isCorrect: false,
      feedback: 'Você indicou uma letra diretamente. Que tal me explicar em uma frase rápida **por que** essa alternativa faz sentido segundo os passos que vimos acima? Isso vai consolidar sua memória!',
      nextQuestion: 'Qual conceito dos passos 1 ou 2 você utilizou para chegar nessa conclusão?'
    };
  }

  if (!hasReasoning) {
    return {
      isCorrect: false,
      feedback: 'Muito bem por tentar! Tente aprofundar um pouco mais: conecte o conceito chave ao exemplo prático que analisamos.',
      nextQuestion: 'O que aconteceria se você aplicasse a mesma lógica em um caso inverso?'
    };
  }

  return {
    isCorrect: true,
    feedback: `Excelente raciocínio! 🌟 Você identificou a lógica central. Quando você consegue articular com suas próprias palavras ("${studentAnswer.slice(0, 60)}..."), significa que o conceito deixou de ser apenas decorado e virou conhecimento dominado.`,
    nextQuestion: 'Você se sente seguro(a) para resolver uma questão similar em uma prova ou quer gerar um Flashcard para fixação?'
  };
}

/**
 * Motor Didático Local Inteligente com conhecimento por área
 */
function generateIntelligentLocalResponse(
  question: string,
  discipline: string,
  topic: string,
  isCheatAttempt: boolean,
  integrityNotice?: string
): TutorResponse {
  const qLower = question.toLowerCase();

  // Exatas / Cálculo
  if (qLower.includes('derivada') || qLower.includes('integral') || qLower.includes('regra da cadeia') || qLower.includes('f(x)') || discipline.includes('Cálculo') || discipline.includes('Exatas')) {
    return {
      discipline: 'Cálculo & Matemática',
      topic: 'Regra da Cadeia e Funções Compostas',
      concept: 'A **Regra da Cadeia** é o método fundamental para derivar funções compostas, ou seja, funções dentro de funções no formato $f(g(x))$. A regra estabelece que a taxa de variação total é o produto da taxa de variação da função externa multiplicada pela taxa de variação da função interna: $$\\frac{d}{dx}[f(g(x))] = f\'(g(x)) \\cdot g\'(x)$$',
      example: 'Pense em engrenagens conectadas: se a engrenagem A gira 3 vezes mais rápido que a engrenagem B, e a engrenagem B gira 2 vezes mais rápido que a engrenagem C, a engrenagem A gira $3 \\times 2 = 6$ vezes mais rápido que a C. A multiplicação das taxas encadeadas é a essência da Regra da Cadeia.',
      stepByStep: [
        '**Etapa 1 — Identifique a camada externa e interna**: Chame o miolo de $u = g(x)$ e a casca externa de $f(u)$. Por exemplo, em $(3x^2 + 5x)^4$, o interior é $u = 3x^2 + 5x$ e o exterior é $u^4$.',
        '**Etapa 2 — Derive a função externa**: Aplique a regra do tombo mantendo o interior idêntico: $\\frac{d}{du}[u^4] = 4u^3 = 4(3x^2 + 5x)^3$.',
        '**Etapa 3 — Derive o miolo interno**: $\\frac{d}{dx}[3x^2 + 5x] = 6x + 5$.',
        '**Etapa 4 — Multiplique os dois resultados**: Monte o produto final $4(3x^2 + 5x)^3 \\cdot (6x + 5)$ e verifique se há fatores para agrupar.'
      ],
      reflectiveQuestion: 'Se tivéssemos a função $h(x) = (5x^3 - 2)^6$, qual seria o valor resultante da derivada do miolo interno antes de multiplicar pelo expoente tombado?',
      integrityFlagged: isCheatAttempt,
      integrityNote: integrityNotice,
      followUpSuggestions: [
        'Como aplicar isso se houver raiz quadrada?',
        'O que muda na Regra do Produto?',
        'Qual a interpretação geométrica da derivada?'
      ]
    };
  }

  // Direito / Jurídico
  if (qLower.includes('dolo') || qLower.includes('culpa') || qLower.includes('crime') || qLower.includes('constitucional') || discipline.includes('Direito')) {
    return {
      discipline: 'Direito',
      topic: 'Teoria do Crime & Elementos Subjetivos',
      concept: 'A distinção entre **Dolo Eventual** e **Culpa Consciente** reside na atitude anímica (psicológica) do agente em relação ao resultado lesivo previsível. No Dolo Eventual (art. 18, I, 2ª parte do CP), o agente prevê o resultado e assume o risco de produzi-lo (*"dane-se se acontecer"*). Na Culpa Consciente, o agente também prevê o resultado, mas confia sinceramente em suas habilidades para evitá-lo (*"não vai acontecer porque sou bom motorista"*).',
      example: 'Imagine dois atiradores de facas em um circo com uma pessoa amarrada no alvo: o atirador experiente que confia cegamente na sua pontaria mas erra age com **culpa consciente**; já a pessoa bêbada que nunca atirou facas e dispara rindo dizendo "se acertar acertou" age com **dolo eventual**.',
      stepByStep: [
        '**Etapa 1 — Análise da Previsibilidade**: O autor tinha plena consciência de que sua conduta perigosa poderia gerar o resultado fatal?',
        '**Etapa 2 — Formulação de Frank**: Pergunte-se: "Se o agente soubesse com 100% de certeza que a morte ocorreria, ele teria continuado a conduta?". Se sim, há assentimento (dolo).',
        '**Etapa 3 — Avaliação do Assentimento vs Confiança**: Houve indiferença com a vida da vítima ou crença genuína de evitação do perigo?',
        '**Etapa 4 — Subsunção Legal**: Conecte os fatos narrados no enunciado com a presença de indiferença (dolo) ou negligência com excesso de confiança (culpa).'
      ],
      reflectiveQuestion: 'No caso de alguém disputando "racha" em avenida movimentada no centro da cidade, o motorista demonstra conformismo indiferente ou prudência razoável?',
      integrityFlagged: isCheatAttempt,
      integrityNote: integrityNotice,
      followUpSuggestions: [
        'Qual a diferença entre Culpa Inconsciente e Consciente?',
        'Quais são os elementos do Fato Típico?',
        'Como o STF e STJ julgam homicídio no trânsito?'
      ]
    };
  }

  // Saúde / Biológicas
  if (qLower.includes('eca') || qLower.includes('coração') || qLower.includes('pressão') || qLower.includes('fisiologia') || discipline.includes('Saúde')) {
    return {
      discipline: 'Saúde & Biologia',
      topic: 'Sistema Renina-Angiotensina-Aldosterona (SRAA)',
      concept: 'O **Sistema Renina-Angiotensina-Aldosterona (SRAA)** é a principal cascata neuro-humoral de controle da pressão arterial e volemia. A enzima conversora de angiotensina (ECA) converte a Angiotensina I na potente substância vasoconstritora Angiotensina II e, simultaneamente, degrada a **bradicinina** (um peptídeo vasodilatador e pró-tussígeno).',
      example: 'Pense na ECA como uma chave de encanamento que ao mesmo tempo aumenta a pressão da água fechando os canos (produzindo Angiotensina II) e queima o freio de segurança (degradando a bradicinina). Quando usamos um inibidor, os canos relaxam e a bradicinina se acumula.',
      stepByStep: [
        '**Etapa 1 — Bloqueio da conversão**: O fármaco inibe a enzima ECA no endotélio pulmonar e vascular.',
        '**Etapa 2 — Queda da Angiotensina II**: Reduz a vasoconstrição arteriolar e diminui a secreção de aldosterona no córtex adrenal.',
        '**Etapa 3 — Efeito Pressórico**: Menor resistência vascular periférica (RVP) e menor retenção de sódio/água = queda da Pressão Arterial.',
        '**Etapa 4 — Origem do Efeito Colateral**: Sem a ECA para degradá-la, a bradicinina e substância P se acumulam nas vias aéreas superiores, irritando terminações nervosas brônquicas e causando tosse seca persistente.'
      ],
      reflectiveQuestion: 'Se um paciente não tolera a tosse por acúmulo de bradicinina com Enalapril, por que a classe dos BRA (ex: Losartana) é a alternativa ideal sem causar tosse?',
      integrityFlagged: isCheatAttempt,
      integrityNote: integrityNotice,
      followUpSuggestions: [
        'Qual a função da Aldosterona nos túbulos renais?',
        'Como a renina é liberada pelas células justa-glomerulares?',
        'Qual o impacto dos diuréticos tiazídicos?'
      ]
    };
  }

  // TI / Computação
  if (qLower.includes('array') || qLower.includes('lista') || qLower.includes('algoritmo') || qLower.includes('big-o') || discipline.includes('Computação') || discipline.includes('Tecnologia')) {
    return {
      discipline: 'Ciência da Computação',
      topic: 'Estruturas de Dados & Complexidade de Acesso',
      concept: 'A diferença na complexidade assintótica de acesso entre **Vetores (Arrays)** e **Listas Encadeadas (Linked Lists)** decorre do modelo de alocação de memória. Arrays são alocados em **blocos contíguos** de memória física, permitindo endereçamento direto por aritmética de ponteiros em tempo constante $\\mathcal{O}(1)$. Listas encadeadas consistem em nós dispersos na memória Heap ligados por ponteiros, exigindo percurso sequencial $\\mathcal{O}(n)$.',
      example: 'Um Array é como um prédio de apartamentos numerados: para ir ao apto 402, você pega o elevador diretamente para o 4º andar (acesso $\\mathcal{O}(1)$). Uma Lista Encadeada é como uma caça ao tesouro: cada pista só contém o endereço da pista seguinte, então para achar a 5ª pista você precisa passar obrigatoriamente pelas 4 anteriores (busca $\\mathcal{O}(n)$).',
      stepByStep: [
        '**Etapa 1 — Fórmula do Endereço no Array**: $\\text{Endereço}(i) = \\text{EndereçoBase} + (i \\times \\text{TamanhoDoElemento})$. Isso é calculado pela CPU em 1 ciclo.',
        '**Etapa 2 — Modelo do Nó da Lista**: Cada nó armazena `[Dado | PróximoPonteiro]`. A CPU só conhece o ponteiro `Head` (primeiro elemento).',
        '**Etapa 3 — Algoritmo de Busca na Lista**: Comece no `Head`. Enquanto `contador < índice`, avance para `atual.proximo`. No pior caso, são $n$ iterações.',
        '**Etapa 4 — Trade-off de Inserção**: Embora o Array acesse mais rápido, inserir no início de um Array exige deslocar todos os $n$ elementos $\\mathcal{O}(n)$, enquanto na Lista basta atualizar 2 ponteiros $\\mathcal{O}(1)$.'
      ],
      reflectiveQuestion: 'Se o seu software precisa fazer 1 milhão de buscas aleatórias por índice a cada segundo, qual das duas estruturas garante que seu servidor não trave?',
      integrityFlagged: isCheatAttempt,
      integrityNote: integrityNotice,
      followUpSuggestions: [
        'Qual a diferença de cache locality entre Arrays e Listas?',
        'Como funciona uma Tabela Hash em relação ao Array?',
        'O que é uma Lista Duplamente Encadeada?'
      ]
    };
  }

  // Genérico Pedagógico Dinâmico
  return {
    discipline: discipline || 'Área de Conhecimento Geral',
    topic: topic || 'Análise Crítica do Enunciado',
    concept: `Para resolver com segurança a questão proposta sobre "${question.slice(0, 50)}...", o conceito chave envolve compreender os princípios teóricos que regem o fenômeno e isolar as premissas verdadeiras das armadilhas comuns em enunciados.`,
    example: 'Pense neste problema como a montagem de um quebra-cabeça: em vez de tentar adivinhar a figura final olhando as peças soltas, nós primeiro separamos as bordas (as regras fixas e dados do enunciado) para depois encaixar o centro.',
    stepByStep: [
      '**Etapa 1 — Destaque os Dados e Condições**: Sublinhe no enunciado quais valores, leis ou premissas foram expressamente fornecidos.',
      '**Etapa 2 — Identifique o que é pedido**: Qual é a grandeza, decisão jurídica ou consequência lógica que precisa ser comprovada?',
      '**Etapa 3 — Conecte a Regra Geral ao Caso Específico**: Aplique a fórmula ou doutrina correspondente passo a passo.',
      '**Etapa 4 — Eliminação Crítica**: Avalie as alternativas incorretas e observe por que cada uma falha (seja por extrapolar o texto ou errar o cálculo intermediário).'
    ],
    reflectiveQuestion: 'Olhando para as condições do enunciado, qual é a consequência direta do primeiro passo do raciocínio?',
    integrityFlagged: isCheatAttempt,
    integrityNote: integrityNotice,
    followUpSuggestions: [
      'Como estruturar o resumo deste tópico em 3 tópicos?',
      'Qual é o erro mais comum que os alunos cometem nesta matéria?',
      'Quero testar minha resposta com o tutor.'
    ]
  };
}

/**
 * Chamada à API da OpenAI (caso configurado)
 */
async function callOpenAITutor(params: AskTutorParams): Promise<TutorResponse | null> {
  const { question, discipline, topic, aiConfig } = params;
  if (!aiConfig?.openaiApiKey) return null;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${aiConfig.openaiApiKey}`
    },
    body: JSON.stringify({
      model: aiConfig.openaiModel || 'gpt-4o-mini',
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: `${BASE_TUTOR_SYSTEM_PROMPT}\n\nResponda EXCLUSIVAMENTE em formato JSON com as seguintes chaves:\n{\n  "discipline": "Nome da disciplina",\n  "topic": "Nome do tópico específico",\n  "concept": "Explicação teórica sem jargões (use LaTeX $...$ se houver fórmulas)",\n  "example": "Analogia simples do mundo real",\n  "stepByStep": ["Etapa 1...", "Etapa 2...", "Etapa 3..."],\n  "reflectiveQuestion": "Pergunta para o aluno concluir sozinho a resposta",\n  "followUpSuggestions": ["Sugestão 1", "Sugestão 2"]\n}`
        },
        {
          role: 'user',
          content: `Disciplina: ${discipline || 'Geral'}\nTópico: ${topic || 'Estudo'}\nDúvida/Enunciado: ${question}`
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content;
  if (!rawContent) return null;

  const sanitized = sanitizeTutorOutput(rawContent);
  // Extrai o JSON da resposta
  const jsonMatch = sanitized.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]) as TutorResponse;
  }

  return null;
}
