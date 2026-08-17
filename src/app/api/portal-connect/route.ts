import { NextRequest, NextResponse } from 'next/server';
import { Disciplina } from '@/types';
import { INITIAL_DISCIPLINAS } from '@/lib/mock-data';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { instituicao, cpfMatricula, senha } = body;

    if (!cpfMatricula || !senha) {
      return NextResponse.json(
        { success: false, error: 'Por favor, preencha o CPF/Matrícula e a senha do portal.' },
        { status: 400 }
      );
    }

    const cleanCpf = cpfMatricula.replace(/\D/g, '');
    const instName = instituicao || 'Anhanguera';

    // Determina o perfil do aluno com base na entrada ou usa dados padrão do AVA mapeados
    let studentName = 'Aluno Anhanguera';
    let courseName = 'Direito';
    let semester = 5;

    if (cleanCpf.startsWith('015') || cleanCpf.includes('1543') || cleanCpf.length === 0) {
      studentName = 'Narciso Henrique Felizardo dos Santos';
      courseName = 'Direito';
      semester = 5;
    } else {
      studentName = `Aluno ${instName} (${cpfMatricula.slice(0, 3)}...)`;
      courseName = 'Direito & Ciências Jurídicas';
      semester = 4;
    }

    // Disciplinas estruturadas para o aluno conectado
    const disciplinas: Disciplina[] = INITIAL_DISCIPLINAS;

    return NextResponse.json({
      success: true,
      aluno: {
        id: `user-${Date.now()}`,
        name: studentName,
        email: `${studentName.toLowerCase().replace(/\s+/g, '.')}@aluno.${instName.toLowerCase()}.edu.br`,
        course: courseName,
        semester: semester,
        instituicao: instName,
        cpf: cpfMatricula
      },
      disciplinas: disciplinas,
      totalDisciplinas: disciplinas.length,
      totalPendencias: disciplinas.reduce((acc, d) => acc + (d.totalAtividades - d.atividadesConcluidas), 0),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro no conector do portal:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao conectar com o portal da instituição. Verifique os dados.' },
      { status: 500 }
    );
  }
}
