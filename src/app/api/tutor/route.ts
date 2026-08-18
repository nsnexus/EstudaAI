import { NextRequest, NextResponse } from 'next/server';
import { checkInputIntegrity, sanitizeTutorOutput, BASE_TUTOR_SYSTEM_PROMPT } from '@/lib/integrity-filter';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, discipline = 'Geral', topic = 'Tópico de Estudo', difficulty = 'intermediario' } = body;

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Pergunta obrigatória.' }, { status: 400 });
    }

    // 1. Verificação de integridade no input
    const integrityResult = checkInputIntegrity(question);

    const openaiApiKey = process.env.OPENAI_API_KEY;

    // Se houver chave no ambiente do servidor, podemos invocar a OpenAI
    if (openaiApiKey) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          temperature: 0.3,
          messages: [
            {
              role: 'system',
              content: `${BASE_TUTOR_SYSTEM_PROMPT}\n\nResponda EXCLUSIVAMENTE em formato JSON com a estrutura:\n{\n  "discipline": "${discipline}",\n  "topic": "${topic}",\n  "concept": "Explicação teórica sem jargões e sem entregar qual alternativa marcar",\n  "example": "Analogia simples do cotidiano",\n  "stepByStep": ["Passo 1...", "Passo 2...", "Passo 3..."],\n  "reflectiveQuestion": "Pergunta para o aluno deduzir a resposta sozinho",\n  "followUpSuggestions": ["Sugestão 1", "Sugestão 2"]\n}`
            },
            {
              role: 'user',
              content: `Nível: ${difficulty}\nDisciplina: ${discipline}\nDúvida/Questão: ${question}`
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

    // Fallback pedagógico seguro estruturado
    return NextResponse.json({
      discipline,
      topic,
      concept: `O conceito central de "${question.slice(0, 50)}..." envolve compreender os princípios teóricos que regem o fenômeno e relacionar as variáveis em jogo sem tentar adivinhar a alternativa diretamente.`,
      example: 'Pense neste problema como a montagem de um quebra-cabeça lógico: primeiro estabelecemos as regras do jogo (as leis científicas e definições) para depois resolver o caso específico.',
      stepByStep: [
        'Etapa 1: Destaque as condições fornecidas no enunciado.',
        'Etapa 2: Identifique a lei ou fórmula correspondente.',
        'Etapa 3: Aplique a regra passo a passo observando as transformações.',
        'Etapa 4: Elimine as alternativas inconsistentes com base na dedução lógica.'
      ],
      reflectiveQuestion: 'Aplicando a primeira etapa ao enunciado, qual é a dedução inicial que você obtém?',
      integrityFlagged: integrityResult.isCheatingAttempt,
      integrityNote: integrityResult.pedagogicalNotice,
      followUpSuggestions: [
        'Como aplicar isso em outro exemplo?',
        'Qual o erro mais frequente nessa matéria?'
      ]
    });

  } catch (err: any) {
    console.error('API Tutor Error:', err);
    return NextResponse.json({ error: 'Erro interno ao processar tutoria.', details: err.message }, { status: 500 });
  }
}
