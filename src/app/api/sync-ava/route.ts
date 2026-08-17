import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { aluno, disciplinas } = body;

    if (!disciplinas || !Array.isArray(disciplinas)) {
      return NextResponse.json(
        { success: false, error: 'Lista de disciplinas inválida.' },
        { status: 400 }
      );
    }

    // Retorna confirmação de recebimento dos dados sincronizados da extensão
    return NextResponse.json({
      success: true,
      message: `${disciplinas.length} disciplinas sincronizadas com sucesso!`,
      aluno: aluno || 'Aluno Conectado',
      totalDisciplinas: disciplinas.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro na sincronização:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao processar sincronização.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    service: 'EstudaAI Sync API',
    version: '1.0.0'
  });
}
