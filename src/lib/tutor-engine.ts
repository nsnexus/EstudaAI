import { TutorResponse, ChatMessage, TutorPersona } from '@/types';
import { checkInputIntegrity, sanitizeTutorOutput } from './integrity-filter';
import { AIConfig, getAIConfig } from './storage';

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
 * Orquestra o processamento da dúvida pedagógica enviando para a API real de IA
 */
export async function generateTutorResponse(params: AskTutorParams): Promise<TutorResponse> {
  const { question, discipline = 'Geral', topic = 'Tópico de Estudo', difficulty = 'intermediario', persona, aiConfig } = params;

  const currentConfig = aiConfig || getAIConfig();
  const integrityCheck = checkInputIntegrity(question);

  try {
    const res = await fetch('/api/tutor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'ask_tutor',
        question,
        discipline,
        topic,
        difficulty,
        provider: currentConfig.provider,
        openaiApiKey: currentConfig.openaiApiKey,
        geminiApiKey: currentConfig.geminiApiKey,
        model: currentConfig.openaiModel || 'gpt-4o-mini'
      })
    });

    if (res.ok) {
      const data = await res.json();
      return {
        ...data,
        integrityFlagged: integrityCheck.isCheatingAttempt || data.integrityFlagged,
        integrityNote: integrityCheck.pedagogicalNotice || data.integrityNote
      };
    }
  } catch (err) {
    console.warn('Erro ao chamar rota /api/tutor:', err);
  }

  // Fallback se estiver offline
  return {
    discipline: discipline || 'Geral',
    topic: topic || 'Estudo Dirigido',
    concept: `Para entender a fundo "${question.slice(0, 60)}...", estruture as premissas e os conceitos fundamentais da matéria.`,
    example: 'Analise o problema como um caso prático real onde cada variável desempenha um papel determinado.',
    stepByStep: [
      'Etapa 1: Isole os dados fornecidos no enunciado.',
      'Etapa 2: Aplique o conceito teórico central.',
      'Etapa 3: Verifique as condições de exceção.',
      'Etapa 4: Elimine as opções contraditórias.'
    ],
    reflectiveQuestion: 'Qual elemento do enunciado é o ponto chave para a dedução da resposta?',
    integrityFlagged: integrityCheck.isCheatingAttempt,
    integrityNote: integrityCheck.pedagogicalNotice,
    followUpSuggestions: [
      'Como aplicar esse conceito em outros casos?',
      'Qual o erro mais frequente nessa matéria?'
    ]
  };
}

/**
 * Avalia a tentativa de resposta ou reflexão enviada pelo aluno com IA Real
 */
export async function evaluateStudentReflection(
  question: string,
  tutorPreviousStep: TutorResponse,
  studentAnswer: string
): Promise<{ isCorrect: boolean; feedback: string; nextQuestion?: string }> {
  const currentConfig = getAIConfig();

  try {
    const res = await fetch('/api/tutor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'evaluate_reflection',
        question,
        studentAnswer,
        tutorPreviousConcept: tutorPreviousStep.concept,
        provider: currentConfig.provider,
        openaiApiKey: currentConfig.openaiApiKey,
        geminiApiKey: currentConfig.geminiApiKey,
        model: currentConfig.openaiModel || 'gpt-4o-mini'
      })
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Erro ao avaliar reflexão via API:', err);
  }

  const hasReasoning = studentAnswer.trim().length > 8;
  return {
    isCorrect: hasReasoning,
    feedback: hasReasoning
      ? `Excelente raciocínio! 🌟 Você articulou com suas próprias palavras a lógica central da questão.`
      : `Muito bem pela tentativa! Tente detalhar mais o porquê dessa conclusão.`,
    nextQuestion: 'Como você aplicaria essa mesma regra caso a situação fosse invertida?'
  };
}
