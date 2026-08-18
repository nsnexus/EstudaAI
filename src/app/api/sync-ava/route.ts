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
    const { student, disciplinas, aluno } = body;

    const studentInfo = student || aluno || { name: 'Aluno Anhanguera' };
    const coursesList = disciplinas || [];

    // Retorna confirmação de recebimento dos dados sincronizados com headers CORS
    return NextResponse.json(
      {
        success: true,
        message: 'Dados sincronizados com sucesso no EstudaAI!',
        student: studentInfo,
        totalDisciplinas: coursesList.length,
        timestamp: new Date().toISOString()
      },
      {
        status: 200,
        headers: corsHeaders
      }
    );
  } catch (error) {
    console.error('Erro na sincronização:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao processar sincronização.' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      status: 'online',
      service: 'EstudaAI Sync API',
      version: '1.0.0'
    },
    { headers: corsHeaders }
  );
}
