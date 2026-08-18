import { NextRequest, NextResponse } from 'next/server';
import { checkInputIntegrity, sanitizeTutorOutput, BASE_TUTOR_SYSTEM_PROMPT } from '@/lib/integrity-filter';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      action = 'ask_tutor',
      question, 
      discipline = 'Geral', 
      topic = 'Tópico de Estudo', 
      difficulty = 'intermediario',
      provider = 'openai',
      openaiApiKey: customOpenAiKey,
      geminiApiKey: customGeminiKey,
      model = 'gpt-4o-mini',
      studentAnswer,
      tutorPreviousConcept
    } = body;

    const openaiApiKey = customOpenAiKey || process.env.OPENAI_API_KEY;
    const geminiApiKey = customGeminiKey || process.env.GEMINI_API_KEY;

    // Ação de Avaliar Resposta do Aluno com IA Real
    if (action === 'evaluate_reflection') {
      if (!studentAnswer) {
        return NextResponse.json({ error: 'Resposta do aluno não fornecida.' }, { status: 400 });
      }

      // Se houver OpenAI disponível
      if (openaiApiKey) {
        try {
          const evalRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openaiApiKey}`
            },
            body: JSON.stringify({
              model: model || 'gpt-4o-mini',
              temperature: 0.2,
              messages: [
                {
                  role: 'system',
                  content: `Você é um tutor pedagógico socrático. Avalie a reflexão do aluno sobre a questão "${question}". O conceito chave explicado era: "${tutorPreviousConcept}". Responda em JSON:\n{\n  "isCorrect": boolean,\n  "feedback": "Feedback encorajador explicando se o raciocínio está correto e o porquê",\n  "nextQuestion": "Próxima pergunta reflexiva ou desafio de aprofundamento"\n}`
                },
                {
                  role: 'user',
                  content: `Reflexão do aluno: "${studentAnswer}"`
                }
              ]
            })
          });

          if (evalRes.ok) {
            const data = await evalRes.json();
            const content = data.choices?.[0]?.message?.content;
            const match = content?.match(/\{[\s\S]*\}/);
            if (match) return NextResponse.json(JSON.parse(match[0]));
          }
        } catch (e) {
          console.warn('Falha na avaliação com OpenAI:', e);
        }
      }

      // Fallback analítico se nenhuma chave estiver configurada
      const hasReasoning = studentAnswer.trim().length > 10;
      return NextResponse.json({
        isCorrect: hasReasoning,
        feedback: hasReasoning 
          ? `Ótimo raciocínio! Você conseguiu articular os pontos fundamentais da matéria com suas próprias palavras.`
          : `Muito bem pela tentativa! Tente detalhar mais o "porquê" dessa conclusão para fixar na memória.`,
        nextQuestion: 'Como você aplicaria essa mesma regra caso a situação fosse invertida?'
      });
    }

    // Ação Principal: Gerar Explicação do Tutor Socrático
    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Pergunta ou dúvida obrigatória.' }, { status: 400 });
    }

    // 1. Verificação de integridade no input (anti-cola)
    const integrityResult = checkInputIntegrity(question);

    const systemPrompt = `${BASE_TUTOR_SYSTEM_PROMPT}

Você deve responder EXCLUSIVAMENTE em formato JSON puro, sem blocos markdown adicionais, com o seguinte schema obrigatório:
{
  "discipline": "${discipline}",
  "topic": "${topic}",
  "concept": "Explicação clara e aprofundada da teoria fundamental (use LaTeX com $...$ para fórmulas matemáticas ou citações de artigos de leis)",
  "example": "Uma analogia prática, simples e vívida do mundo real ou cotidiano que ilustre perfeitamente a teoria",
  "stepByStep": [
    "Etapa 1: ...",
    "Etapa 2: ...",
    "Etapa 3: ...",
    "Etapa 4: ..."
  ],
  "reflectiveQuestion": "Uma pergunta reflexiva e desafiadora que leve o aluno a deduzir a resposta final sozinho, SEM entregar qual letra ou alternativa marcar",
  "followUpSuggestions": [
    "Sugestão de pergunta de aprofundamento 1",
    "Sugestão de pergunta de aprofundamento 2"
  ]
}`;

    // 2. Chamada à API da OpenAI (se chave presente)
    if ((provider === 'openai' || !geminiApiKey) && openaiApiKey) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: model || 'gpt-4o-mini',
          temperature: 0.3,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `Nível: ${difficulty}\nDisciplina: ${discipline}\nTópico: ${topic}\nDúvida ou Questão do Aluno:\n${question}`
            }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const rawContent = data.choices?.[0]?.message?.content;
        if (rawContent) {
          const sanitized = sanitizeTutorOutput(rawContent);
          const jsonMatch = sanitized.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return NextResponse.json({
              ...parsed,
              integrityFlagged: integrityResult.isCheatingAttempt,
              integrityNote: integrityResult.pedagogicalNotice
            });
          }
        }
      }
    }

    // 3. Chamada à API do Google Gemini (se chave presente)
    if (geminiApiKey) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: `${systemPrompt}\n\nAnalise a seguinte questão:\nNível: ${difficulty}\nDisciplina: ${discipline}\nDúvida:\n${question}` }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: 'application/json'
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const sanitized = sanitizeTutorOutput(rawText);
          const jsonMatch = sanitized.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return NextResponse.json({
              ...parsed,
              integrityFlagged: integrityResult.isCheatingAttempt,
              integrityNote: integrityResult.pedagogicalNotice
            });
          }
        }
      }
    }

    // 4. Se nenhuma chave de IA estiver configurada no momento
    return NextResponse.json({
      discipline: discipline || 'Geral',
      topic: topic || 'Análise de Questão',
      concept: `Para dominar este problema sobre "${question.slice(0, 70)}...", é essencial compreender os princípios e normas aplicáveis. Insira sua chave da OpenAI ou Gemini em Configurações para respostas geradas por IA em tempo real com GPT-4o.`,
      example: 'Pense nesta questão como a interpretação de um contrato ou regra: identificamos os fatos descritos e aplicamos a regra geral passo a passo.',
      stepByStep: [
        'Etapa 1: Destaque os dados concretos apresentados no enunciado.',
        'Etapa 2: Isole o conceito ou artigo de lei que fundamenta a situação.',
        'Etapa 3: Analise o nexo entre a premissa e as possíveis consequências.',
        'Etapa 4: Descarte as opções que extrapolarem os fatos ou violarem as regras.'
      ],
      reflectiveQuestion: 'Com base nas informações do texto, qual é o princípio que rege a solução deste caso?',
      integrityFlagged: integrityResult.isCheatingAttempt,
      integrityNote: integrityResult.pedagogicalNotice,
      followUpSuggestions: [
        'Como aplicar este conceito na prática?',
        'Qual o erro mais comum nesta matéria?'
      ]
    });

  } catch (err: any) {
    console.error('API Tutor Error:', err);
    return NextResponse.json({ error: 'Erro interno ao processar tutoria.', details: err.message }, { status: 500 });
  }
}
