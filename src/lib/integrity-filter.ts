/**
 * EstudaAI - Camada de Integridade Pedagógica
 * 
 * Garante que a plataforma funcione como tutoria socrática e impede que a IA
 * seja utilizada como mero gabaritador ou facilitador de cola em avaliações.
 */

// Padrões de solicitação explícita de gabarito ou alternativa
const DIRECT_ANSWER_PATTERNS = [
  /qual\s+(é\s+|eh\s+)?(a\s+)?(alternativa|resposta|letra|opcao|opção)/i,
  /(só|apenas|so)\s+me\s+(d[eê]|fala|diga|responda)\s+(a\s+)?(resposta|letra|alternativa)/i,
  /marca(r)?\s+(qual|a|b|c|d|e)/i,
  /é\s+(a\s+)?letra\s+[a-e]\??/i,
  /eh\s+(a\s+)?letra\s+[a-e]\??/i,
  /gabarito/i,
  /resolva\s+sem\s+(enrolar|explicar)/i,
  /me\s+d[aá]\s+o\s+gabarito/i,
  /só\s+a\s+letra/i,
  /qual\s+marca\??/i,
  /me\s+passe\s+a\s+resposta\s+pronta/i,
  /escolha\s+entre\s+a,\s*b,\s*c,\s*d/i,
  /assinale\s+a\s+alternativa/i,
  /marque\s+a\s+correta/i
];

// Padrões que o modelo não deve emitir na resposta (leak de alternativa)
const LEAK_ANSWER_PATTERNS = [
  /portanto[,]?\s+a\s+resposta\s+correta\s+[ée]\s+(a\s+)?letra\s+[a-e]/gi,
  /a\s+alternativa\s+correta\s+[ée]\s+(a\s+)?letra\s+[a-e]/gi,
  /você\s+deve\s+marcar\s+(a\s+)?letra\s+[a-e]/gi,
  /a\s+letra\s+[a-e]\s+[ée]\s+a\s+correta/gi,
  /gabarito:\s*(letra\s+)?[a-e]/gi,
  /resposta:\s*(letra\s+)?[a-e]/gi,
];

export interface IntegrityCheckResult {
  isCheatingAttempt: boolean;
  reason?: string;
  pedagogicalNotice?: string;
}

/**
 * Avalia se o input do aluno tenta burlar o aprendizado para pegar a resposta pronta
 */
export function checkInputIntegrity(input: string): IntegrityCheckResult {
  const normalized = input.trim();

  for (const pattern of DIRECT_ANSWER_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        isCheatingAttempt: true,
        reason: 'Solicitação direta de alternativa ou gabarito detectada.',
        pedagogicalNotice: '💡 **Princípio EstudaAI**: Nosso objetivo é fazer você entender o raciocínio para dominar o assunto com autonomia! Não fornecemos a letra pronta, mas vamos construir o passo a passo com você.',
      };
    }
  }

  return {
    isCheatingAttempt: false,
  };
}

/**
 * Higieniza o output da IA para garantir que nenhuma alternativa direta seja entregue
 */
export function sanitizeTutorOutput(content: string): string {
  let sanitized = content;

  for (const pattern of LEAK_ANSWER_PATTERNS) {
    sanitized = sanitized.replace(pattern, 'analisando as etapas acima, você conseguirá identificar qual alternativa se encaixa com exatidão');
  }

  return sanitized;
}

/**
 * System prompt base restritivo conforme especificação do EstudaAI
 */
export const BASE_TUTOR_SYSTEM_PROMPT = `
Você é o EstudaAI, um tutor pedagógico de excelência inspirado no Método Socrático.

DIRETRIZES FUNDAMENTAIS DE INTEGRIDADE E ENSINO:
1. NUNCA, em hipótese alguma, forneça a alternativa correta (ex: "A resposta é a letra B") diretamente.
2. NUNCA diga para o aluno qual alternativa assinalar em provas ou avaliações.
3. Se a questão for de múltipla escolha ou tiver opções A, B, C, D, E, você deve:
   - Extrair e explicar o CONCEITO TEÓRICO central.
   - Criar uma ANALOGIA ou EXEMPLO didático simplificado do cotidiano.
   - Detalhar o PASSO A PASSO DO RACIOCÍNIO com a lógica de resolução.
   - Concluir com uma PERGUNTA REFLEXIVA que desafie o aluno a aplicar o raciocínio e escolher a opção por mérito próprio.
4. Seu tom é encorajador, caloroso, rigoroso tecnicamente e extremamente didático.
5. Se o aluno pedir "só me dê a resposta", explique educadamente que o propósito do EstudaAI é garantir que ele domine a matéria para sempre.
6. Quando apropriado, use notações matemáticas claras e exemplos práticos.
`.trim();
