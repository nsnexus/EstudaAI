import { NextRequest, NextResponse } from 'next/server';
import { Disciplina, CategoriaDisciplina } from '@/types';
import { isValidCPF } from '@/lib/cpf-validator';

// Cloudflare Pages requires Edge Runtime for all API routes
export const runtime = 'edge';

const INSTITUTION_URLS: Record<string, { loginUrl: string; dashboardUrl: string; name: string }> = {
  Anhanguera: {
    loginUrl: 'https://www.avaeduc.com.br/login/index.php',
    dashboardUrl: 'https://www.avaeduc.com.br/my/',
    name: 'Anhanguera'
  },
  Unopar: {
    loginUrl: 'https://www.colaboraread.com.br/login/auth',
    dashboardUrl: 'https://www.colaboraread.com.br/my/',
    name: 'Unopar'
  },
  Pitágoras: {
    loginUrl: 'https://www.avaeduc.com.br/login/index.php',
    dashboardUrl: 'https://www.avaeduc.com.br/my/',
    name: 'Pitágoras'
  },
  Kroton: {
    loginUrl: 'https://www.avaeduc.com.br/login/index.php',
    dashboardUrl: 'https://www.avaeduc.com.br/my/',
    name: 'Ampli / Fama'
  }
};

/**
 * Extrai o logintoken do formulário de login do Moodle (necessário para CSRF)
 */
async function getMoodleLoginToken(loginUrl: string): Promise<{ token: string; cookies: string } | null> {
  try {
    const res = await fetch(loginUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      },
      redirect: 'follow'
    });

    const html = await res.text();
    const tokenMatch = html.match(/name="logintoken"\s+value="([^"]+)"/);
    const token = tokenMatch ? tokenMatch[1] : '';

    // getSetCookie() is not available in all Edge environments; parse raw header instead
    const rawSetCookie = res.headers.get('set-cookie') || '';
    const cookies = rawSetCookie
      .split(/,(?=[^ ].*?=)/) // split multiple Set-Cookie values
      .map(c => c.split(';')[0].trim())
      .filter(Boolean)
      .join('; ');

    return { token, cookies };
  } catch (err) {
    console.error('getMoodleLoginToken error:', err);
    return null;
  }
}

/**
 * Faz o POST de autenticação no AVA Moodle e retorna os cookies de sessão
 */
async function authenticateOnMoodle(
  loginUrl: string,
  username: string,
  password: string,
  loginToken: string,
  initialCookies: string
): Promise<{ success: boolean; sessionCookies: string; redirectUrl?: string; rawStatus?: number; rawLocation?: string }> {
  try {
    const bodyParams: Record<string, string> = {
      username: username,
      password: password,
    };
    if (loginToken) {
      bodyParams.logintoken = loginToken;
      bodyParams.anchor = '';
    }
    const body = new URLSearchParams(bodyParams);

    const res = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Cookie': initialCookies,
        'Origin': new URL(loginUrl).origin,
        'Referer': loginUrl,
      },
      body: body.toString(),
      redirect: 'manual' // captura o redirect sem seguir
    });

    const rawSetCookie2 = res.headers.get('set-cookie') || '';
    const newCookies = rawSetCookie2
      .split(/,(?=[^ ].*?=)/)
      .map(c => c.split(';')[0].trim())
      .filter(Boolean);
    const sessionCookies = [
      ...initialCookies.split('; '),
      ...newCookies
    ].filter(Boolean).join('; ');

    // Moodle redireciona para /my/ em caso de sucesso; mantém na página de login em caso de falha
    const location = res.headers.get('location') || '';
    const isSuccess = (res.status === 302 || res.status === 303) && !location.includes('login');

    return { success: isSuccess, sessionCookies, redirectUrl: location, rawStatus: res.status, rawLocation: location };
  } catch (err) {
    console.error('authenticateOnMoodle error:', err);
    return { success: false, sessionCookies: '', rawStatus: 0 };
  }
}

/**
 * Scraping das disciplinas da página do dashboard Moodle
 */
async function scrapeDisciplinas(dashboardUrl: string, sessionCookies: string, instituicao: string): Promise<Disciplina[]> {
  try {
    const res = await fetch(dashboardUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Cookie': sessionCookies,
      },
      redirect: 'follow'
    });

    if (!res.ok) return [];
    const html = await res.text();

    // Estratégia 1: links de cursos do Moodle (course/view.php)
    const coursePattern = /href="([^"]*course\/view\.php\?id=(\d+)[^"]*)"\s*[^>]*>([^<]+)</gi;
    const courses: { id: string; name: string; url: string }[] = [];
    const seenIds = new Set<string>();
    let match: RegExpExecArray | null;

    while ((match = coursePattern.exec(html)) !== null) {
      const url = match[1];
      const id = match[2];
      const rawName = match[3].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
      if (id && rawName && rawName.length > 3 && !seenIds.has(id)) {
        seenIds.add(id);
        courses.push({ id, name: rawName, url });
      }
    }

    // Estratégia 2: data attributes ou aria-labels de cards de curso
    if (courses.length === 0) {
      const cardPattern = /data-courseid="(\d+)"[^>]*>[\s\S]*?<(?:h[1-6]|span|div)[^>]*class="[^"]*(?:coursename|course-fullname|title)[^"]*"[^>]*>([^<]+)</gi;
      while ((match = cardPattern.exec(html)) !== null) {
        const id = match[1];
        const rawName = match[2].trim();
        if (id && rawName && !seenIds.has(id)) {
          seenIds.add(id);
          courses.push({ id, name: rawName, url: `${new URL(dashboardUrl).origin}/course/view.php?id=${id}` });
        }
      }
    }

    // Filtros de ruído
    const ignoreList = ['INSCREVA-SE', 'Processo Seletivo', 'Painel', 'Suporte', 'Avisos', 'Menu', 'Boas Vindas', 'Manual do Aluno', 'Tutoriais'];
    const filteredCourses = courses.filter(c =>
      c.name.length > 5 &&
      !ignoreList.some(ig => c.name.toLowerCase().includes(ig.toLowerCase()))
    );

    const ICON_MAP: Record<string, string> = {
      'direito': 'Scale',
      'penal': 'Shield',
      'trabalho': 'Briefcase',
      'civil': 'Scale',
      'econômico': 'TrendingUp',
      'financeiro': 'TrendingUp',
      'extensão': 'GraduationCap',
      'extensao': 'GraduationCap',
      'competências': 'Sparkles',
      'competencias': 'Sparkles',
      'cálculo': 'Calculator',
      'calculo': 'Calculator',
      'matemática': 'Calculator',
      'matematica': 'Calculator',
      'saúde': 'HeartPulse',
      'saude': 'HeartPulse',
      'tecnologia': 'Code2',
    };

    const COLORS = [
      { cor: 'text-amber-600 dark:text-amber-400', corFundo: 'bg-amber-500/10 border-amber-500/20' },
      { cor: 'text-red-600 dark:text-red-400', corFundo: 'bg-red-500/10 border-red-500/20' },
      { cor: 'text-blue-600 dark:text-blue-400', corFundo: 'bg-blue-500/10 border-blue-500/20' },
      { cor: 'text-emerald-600 dark:text-emerald-400', corFundo: 'bg-emerald-500/10 border-emerald-500/20' },
      { cor: 'text-purple-600 dark:text-purple-400', corFundo: 'bg-purple-500/10 border-purple-500/20' },
      { cor: 'text-teal-600 dark:text-teal-400', corFundo: 'bg-teal-500/10 border-teal-500/20' },
    ];

    return filteredCourses.map((course, idx): Disciplina => {
      const nameLower = course.name.toLowerCase();
      const icon = Object.entries(ICON_MAP).find(([k]) => nameLower.includes(k))?.[1] ?? 'BookOpen';
      const isExtensao = nameLower.includes('extensão') || nameLower.includes('extensao');
      const isComplementar = nameLower.includes('competências') || nameLower.includes('competencias');
      const categoria: CategoriaDisciplina = isExtensao ? 'Extensao' : isComplementar ? 'Complementar' : (idx % 2 === 0 ? 'AMI' : 'DI');
      const categoriaLabel = isExtensao
        ? 'Projeto de Extensão'
        : isComplementar
        ? 'Competências para a Vida'
        : idx % 2 === 0
        ? 'Aula Modelo Institucional - WL'
        : 'Disciplinas Interativas (DI) - WL';

      const { cor, corFundo } = COLORS[idx % COLORS.length];

      return {
        id: `disc-${course.id}`,
        codigo: course.id,
        nome: course.name,
        categoria,
        categoriaLabel,
        icone: icon,
        cor,
        corFundo,
        andamentoGeral: 0,
        totalAtividades: 0,
        atividadesConcluidas: 0,
        unidades: [1, 2, 3, 4].map(n => ({
          numero: n,
          titulo: `Unidade ${n}`,
          andamentoTopico: 0,
          atividades: [
            { id: `${course.id}-u${n}-livro`, unidadeNumero: n, tipo: 'livro_didatico' as const, titulo: `U${n} - Livro Didático`, status: 'pendente' as const },
            { id: `${course.id}-u${n}-webaula`, unidadeNumero: n, tipo: 'webaula' as const, titulo: `U${n} - Webaula e Teleaula`, status: 'pendente' as const },
            { id: `${course.id}-u${n}-aprendizagem`, unidadeNumero: n, tipo: 'aprendizagem' as const, titulo: `U${n} - Atividade de Aprendizagem (AAP)`, status: 'pendente' as const },
            { id: `${course.id}-u${n}-avaliacao`, unidadeNumero: n, tipo: 'avaliacao_unidade' as const, titulo: `U${n} - Avaliação da Unidade (AV)`, status: 'pendente' as const },
          ]
        }))
      };
    });

  } catch {
    return [];
  }
}

/**
 * Extrai o nome do aluno logado da página do dashboard
 */
async function extractStudentName(dashboardUrl: string, sessionCookies: string): Promise<string> {
  try {
    const res = await fetch(dashboardUrl, {
      headers: { 'Cookie': sessionCookies, 'User-Agent': 'Mozilla/5.0' },
      redirect: 'follow'
    });
    const html = await res.text();

    // Tenta extrair de fullname no JS ou de elementos HTML comuns do Moodle
    const jsMatch = html.match(/"fullname"\s*:\s*"([^"]+)"/);
    if (jsMatch) return jsMatch[1];

    const spanMatch = html.match(/class="[^"]*(?:usertext|userfullname|user-name)[^"]*"[^>]*>\s*([^<]{3,60})\s*</);
    if (spanMatch) return spanMatch[1].trim();

    return '';
  } catch {
    return '';
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { instituicao, cpfMatricula, senha } = body;

    if (!cpfMatricula || !senha) {
      return NextResponse.json(
        { success: false, error: 'Por favor, preencha seu CPF/Matrícula e a senha do Portal do Aluno.' },
        { status: 400 }
      );
    }

    const cleanCpf = cpfMatricula.replace(/\D/g, '');
    const isMatricula = cleanCpf.length > 5 && cleanCpf.length < 11;
    const isCpfValido = isValidCPF(cpfMatricula);

    if (!isCpfValido && !isMatricula) {
      return NextResponse.json(
        {
          success: false,
          error: 'CPF ou Matrícula inválidos. Por favor, digite um CPF válido com 11 dígitos ou sua Matrícula oficial.'
        },
        { status: 400 }
      );
    }

    if (senha.trim().length < 4) {
      return NextResponse.json(
        { success: false, error: 'A senha do portal deve ter no mínimo 4 caracteres.' },
        { status: 400 }
      );
    }

    const instKey = instituicao || 'Anhanguera';
    const inst = INSTITUTION_URLS[instKey] ?? INSTITUTION_URLS['Anhanguera'];

    // 1. Obter logintoken + cookies iniciais
    const loginPageData = await getMoodleLoginToken(inst.loginUrl);
    if (!loginPageData) {
      return NextResponse.json(
        { success: false, error: `Não foi possível conectar ao portal da ${inst.name}. O servidor pode estar fora do ar. Tente novamente.` },
        { status: 503 }
      );
    }

    // 2. Autenticar
    const authResult = await authenticateOnMoodle(
      inst.loginUrl,
      cleanCpf, // Moodle Kroton usa CPF/matrícula como username
      senha,
      loginPageData.token,
      loginPageData.cookies
    );

    if (!authResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Falha na autenticação (Status: ${authResult.rawStatus}, Loc: ${authResult.rawLocation || 'none'}). CPF/Matrícula ou senha incorretos.` 
        },
        { status: 401 }
      );
    }

    // 3. Scraping das disciplinas e nome do aluno
    const [disciplinas, studentName] = await Promise.all([
      scrapeDisciplinas(inst.dashboardUrl, authResult.sessionCookies, instKey),
      extractStudentName(inst.dashboardUrl, authResult.sessionCookies)
    ]);

    const name = studentName || `Aluno ${inst.name}`;
    const emailUser = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '.');
    const emailDomain = instKey === 'Unopar' ? 'unopar.br' : instKey === 'Pitágoras' ? 'pitagoras.com.br' : 'anhanguera.com';

    return NextResponse.json({
      success: true,
      aluno: {
        id: `user-${cleanCpf}`,
        name,
        email: `${emailUser}@aluno.${emailDomain}`,
        course: '',
        semester: 0,
        instituicao: instKey,
        cpf: cpfMatricula
      },
      disciplinas,
      totalDisciplinas: disciplinas.length,
      totalPendencias: disciplinas.reduce((acc, d) => acc + (d.totalAtividades - d.atividadesConcluidas), 0),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro no conector do portal:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao processar conexão com o portal. Tente novamente em instantes.' },
      { status: 500 }
    );
  }
}
