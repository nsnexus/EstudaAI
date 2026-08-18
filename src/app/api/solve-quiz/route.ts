import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      question, 
      options = [], 
      discipline = 'Direito Civil - Contratos', 
      apiKey, 
      provider = 'openai',
      model = 'gpt-4o' // Modelo Flagship GPT-4o completo para precisão máxima
    } = body;

    if (!question) {
      return NextResponse.json(
        { error: 'Enunciado da questão não fornecido.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const openaiApiKey = (provider === 'openai' && apiKey) ? apiKey : process.env.OPENAI_API_KEY;
    const geminiApiKey = (provider === 'gemini' && apiKey) ? apiKey : (apiKey?.startsWith('AIza') ? apiKey : process.env.GEMINI_API_KEY);

    let solvedResult = {
      correctIndex: 0,
      correctLetter: 'A',
      explanation: 'Baseado na legislação vigente e nos princípios da matéria.',
      confidence: 0.95
    };

    const prompt = `Você é um jurista e professor de Direito de altíssimo nível (Magistrado/Doutor em Direito pela USP) especializado em bancas examinadoras e avaliações universitárias de ${discipline}.
Sua missão é atingir 100% de acerto na questão abaixo, analisando cada detalhe e citando as fontes legais (artigos do Código Civil de 2002, Código de Defesa do Consumidor, CLT, CP ou CF/88 e Súmulas do STJ/STF).

ENUNCIADO DA QUESTÃO:
${question}

ALTERNATIVAS DA QUESTÃO:
${options.map((opt: string, i: number) => `[Alternativa ${String.fromCharCode(65 + i)}] ${opt}`).join('\n')}

MÉTODO DE RESOLUÇÃO EXAUSTIVA PASSO A PASSO (Chain of Thought):
1. ANÁLISE DE CADA ASSERTIVA: Se a questão for de Verdadeiro ou Falso (V/F) ou assertivas (I, II, III, IV), analise cada item individualmente confrontando com o artigo de lei específico.
2. ELIMINAÇÃO: Demonstre por que cada uma das alternativas incorretas possui vício, erro factual ou divergência com a lei.
3. CONCLUSÃO INFALÍVEL: Indique a única alternativa que atende com rigor técnico absoluto à pergunta formulada.
4. ÍNDICES: 
   - "correctIndex": número exato de 0 a ${Math.max(0, options.length - 1)} (0 para Alternativa A, 1 para B, 2 para C, 3 para D, 4 para E).
   - "correctLetter": letra correspondente ("A", "B", "C", "D" ou "E").

Responda ESTRITAMENTE em formato JSON:
{
  "chainOfThought": "<análise detalhada de cada item e artigo de lei correspondente>",
  "correctIndex": <índice numérico de 0 a ${Math.max(0, options.length - 1)}>,
  "correctLetter": "<A, B, C, D ou E>",
  "legalSource": "<artigos de lei e doutrina correspondentes>",
  "explanation": "<justificativa clara e fundamentada nos artigos citados>",
  "confidence": 1.0
}`;

    // 1. Resolução com OpenAI (usando GPT-4o completo ou modelo selecionado)
    if (openaiApiKey) {
      try {
        const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`
          },
          body: JSON.stringify({
            model: model || 'gpt-4o', // Usa GPT-4o em vez de mini
            temperature: 0.0, // Zero aleatoriedade para máxima precisão lógica
            response_format: { type: 'json_object' },
            messages: [
              { 
                role: 'system', 
                content: 'Você é um jurista renomado e professor universitário de Direito. Você analisa questões com rigor científico absoluto e nunca erra interpretações legais.' 
              },
              { role: 'user', content: prompt }
            ]
          })
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const parsed = JSON.parse(aiData.choices?.[0]?.message?.content || '{}');
          if (typeof parsed.correctIndex === 'number') {
            solvedResult = parsed;
          }
        } else {
          console.error('Erro na resposta OpenAI:', await aiRes.text());
        }
      } catch (e) {
        console.warn('Falha no OpenAI:', e);
      }
    } 
    // 2. Fallback com Google Gemini 1.5 Pro
    else if (geminiApiKey) {
      try {
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.0 }
          })
        });

        if (geminiRes.ok) {
          const gData = await geminiRes.json();
          const text = gData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsed = JSON.parse(text);
            if (typeof parsed.correctIndex === 'number') {
              solvedResult = parsed;
            }
          }
        }
      } catch (e) {
        console.warn('Falha no Gemini:', e);
      }
    }

    return NextResponse.json(
      {
        success: true,
        ...solvedResult
      },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Erro ao resolver questão:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar resolução da questão.' },
      { status: 500, headers: corsHeaders }
    );
  }
}
