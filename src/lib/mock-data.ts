import { User, TutorPersona, Flashcard, QuizQuestion, AdminMetrics, Disciplina } from '@/types';

export const MOCK_USERS: User[] = [
  {
    id: 'user-1',
    name: 'Narciso Henrique Felizardo dos Santos',
    email: 'narciso.santos@aluno.anhanguera.edu.br',
    role: 'aluno',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    course: 'Direito',
    semester: 5,
    studyGoalMinutes: 60,
    createdAt: '2026-02-10T10:00:00Z',
  },
  {
    id: 'user-2',
    name: 'Dra. Camila Vasconcelos',
    email: 'camila.admin@anhanguera.edu.br',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    course: 'Coordenação Acadêmica de Direito',
    semester: 0,
    studyGoalMinutes: 0,
    createdAt: '2026-01-05T08:00:00Z',
  },
  {
    id: 'user-3',
    name: 'Lucas Mendes',
    email: 'lucas.mendes@aluno.anhanguera.edu.br',
    role: 'aluno',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    course: 'Engenharia de Software',
    semester: 4,
    studyGoalMinutes: 45,
    createdAt: '2026-03-01T14:30:00Z',
  }
];

export const INITIAL_DISCIPLINAS: Disciplina[] = [
  {
    id: 'disc-direito-civil-contratos',
    codigo: '10703',
    nome: 'Direito Civil - Contratos',
    categoria: 'AMI',
    categoriaLabel: 'Aula Modelo Institucional - WL',
    icone: 'Scale',
    cor: 'text-amber-600 dark:text-amber-400',
    corFundo: 'bg-amber-500/10 border-amber-500/20',
    andamentoGeral: 25,
    totalAtividades: 12,
    atividadesConcluidas: 3,
    proximoPrazo: '10 de Agosto de 2026',
    unidades: [
      {
        numero: 1,
        titulo: 'Unidade 1: Teoria Geral dos Contratos e Princípios Fundamentais',
        andamentoTopico: 75,
        dataLiberacao: '10 de agosto de 2026',
        atividades: [
          {
            id: 'act-dc-u1-livro',
            unidadeNumero: 1,
            titulo: 'U1 - Livro Didático (Teoria Geral e Formação dos Contratos)',
            tipo: 'livro_didatico',
            status: 'concluida',
            descricao: 'Capítulo 1 e 2: Autonomia privada, boa-fé objetiva e função social do contrato.',
            pontuacaoMaxima: 0,
            pontuacaoObtida: 0
          },
          {
            id: 'act-dc-u1-webaula',
            unidadeNumero: 1,
            titulo: 'U1 - Webaula e Teleaula',
            tipo: 'webaula',
            status: 'concluida',
            descricao: 'Vídeos explicativos e estudos de caso sobre vícios de consentimento.',
            pontuacaoMaxima: 0,
            pontuacaoObtida: 0
          },
          {
            id: 'act-dc-u1-aprendizagem',
            unidadeNumero: 1,
            titulo: 'U1 - Atividade de Aprendizagem',
            tipo: 'aprendizagem',
            status: 'concluida',
            descricao: 'Exercícios de fixação sobre princípios contratuais modernos.',
            prazo: '15/09/2026',
            pontuacaoMaxima: 200,
            pontuacaoObtida: 200,
            instrucao: 'Para sua tentativa ser contabilizada, você deve clicar em "Enviar Tudo e Terminar".'
          },
          {
            id: 'act-dc-u1-avaliacao',
            unidadeNumero: 1,
            titulo: 'U1 - Avaliação da Unidade (AV)',
            tipo: 'avaliacao_unidade',
            status: 'pendente',
            descricao: 'Questões avaliativas oficiais da Unidade 1 para pontuação semestral.',
            prazo: '28/09/2026',
            pontuacaoMaxima: 600,
            instrucao: 'Atenção: Para sua tentativa ser contabilizada, você deve clicar no botão "Enviar Tudo e Terminar".',
            questoesDisponiveis: 4
          }
        ]
      },
      {
        numero: 2,
        titulo: 'Unidade 2: Espécies Contratuais em Espécie (Compra e Venda, Doação)',
        andamentoTopico: 0,
        dataLiberacao: '24 de agosto de 2026',
        atividades: [
          {
            id: 'act-dc-u2-livro',
            unidadeNumero: 2,
            titulo: 'U2 - Livro Didático (Contratos em Espécie)',
            tipo: 'livro_didatico',
            status: 'pendente',
            descricao: 'Cláusulas especiais de compra e venda, retrovenda e doação com encargo.'
          },
          {
            id: 'act-dc-u2-aprendizagem',
            unidadeNumero: 2,
            titulo: 'U2 - Atividade de Aprendizagem',
            tipo: 'aprendizagem',
            status: 'pendente',
            prazo: '15/10/2026',
            pontuacaoMaxima: 200,
            instrucao: 'Para sua tentativa ser contabilizada, clique em "Enviar Tudo e Terminar".'
          },
          {
            id: 'act-dc-u2-avaliacao',
            unidadeNumero: 2,
            titulo: 'U2 - Avaliação da Unidade (AV)',
            tipo: 'avaliacao_unidade',
            status: 'pendente',
            prazo: '28/10/2026',
            pontuacaoMaxima: 600,
            questoesDisponiveis: 4
          }
        ]
      },
      {
        numero: 3,
        titulo: 'Unidade 3: Locação, Prestação de Serviços e Empreitada',
        andamentoTopico: 0,
        dataLiberacao: '14 de setembro de 2026',
        atividades: [
          {
            id: 'act-dc-u3-livro',
            unidadeNumero: 3,
            titulo: 'U3 - Livro Didático (Contratos de Utilização e Trabalho)',
            tipo: 'livro_didatico',
            status: 'pendente'
          },
          {
            id: 'act-dc-u3-aprendizagem',
            unidadeNumero: 3,
            titulo: 'U3 - Atividade de Aprendizagem',
            tipo: 'aprendizagem',
            status: 'pendente',
            prazo: '15/11/2026',
            pontuacaoMaxima: 200
          },
          {
            id: 'act-dc-u3-avaliacao',
            unidadeNumero: 3,
            titulo: 'U3 - Avaliação da Unidade (AV)',
            tipo: 'avaliacao_unidade',
            status: 'pendente',
            prazo: '28/11/2026',
            pontuacaoMaxima: 600,
            questoesDisponiveis: 4
          }
        ]
      },
      {
        numero: 4,
        titulo: 'Unidade 4: Extinção Contratual, Resilição e Inadimplemento',
        andamentoTopico: 0,
        dataLiberacao: '05 de outubro de 2026',
        atividades: [
          {
            id: 'act-dc-u4-livro',
            unidadeNumero: 4,
            titulo: 'U4 - Livro Didático (Resolução, Exceção do Contrato Não Cumprido)',
            tipo: 'livro_didatico',
            status: 'pendente'
          },
          {
            id: 'act-dc-u4-aprendizagem',
            unidadeNumero: 4,
            titulo: 'U4 - Atividade de Aprendizagem',
            tipo: 'aprendizagem',
            status: 'pendente',
            prazo: '05/12/2026',
            pontuacaoMaxima: 200
          },
          {
            id: 'act-dc-u4-avaliacao',
            unidadeNumero: 4,
            titulo: 'U4 - Avaliação da Unidade (AV)',
            tipo: 'avaliacao_unidade',
            status: 'pendente',
            prazo: '12/12/2026',
            pontuacaoMaxima: 600,
            questoesDisponiveis: 4
          }
        ]
      }
    ]
  },
  {
    id: 'disc-direito-penal',
    codigo: '10082',
    nome: 'Teoria Jurídica do Direito Penal',
    categoria: 'AMI',
    categoriaLabel: 'Aula Modelo Institucional - WL',
    icone: 'Shield',
    cor: 'text-red-600 dark:text-red-400',
    corFundo: 'bg-red-500/10 border-red-500/20',
    andamentoGeral: 8,
    totalAtividades: 12,
    atividadesConcluidas: 1,
    proximoPrazo: '16 de Agosto de 2026',
    unidades: [
      {
        numero: 1,
        titulo: 'Unidade 1: Princípios Penais e Teoria do Crime (Fato Típico)',
        andamentoTopico: 25,
        atividades: [
          {
            id: 'act-dp-u1-livro',
            unidadeNumero: 1,
            titulo: 'U1 - Livro Didático (Fato Típico, Conduta e Dolo/Culpa)',
            tipo: 'livro_didatico',
            status: 'concluida',
            descricao: 'Teoria analítica do crime e critérios de imputação objetiva.'
          },
          {
            id: 'act-dp-u1-aprendizagem',
            unidadeNumero: 1,
            titulo: 'U1 - Atividade de Aprendizagem',
            tipo: 'aprendizagem',
            status: 'pendente',
            prazo: '20/09/2026',
            pontuacaoMaxima: 200,
            instrucao: 'Atenção: Para sua tentativa ser contabilizada, clique em "Enviar Tudo e Terminar".'
          },
          {
            id: 'act-dp-u1-avaliacao',
            unidadeNumero: 1,
            titulo: 'U1 - Avaliação da Unidade (AV)',
            tipo: 'avaliacao_unidade',
            status: 'pendente',
            prazo: '30/09/2026',
            pontuacaoMaxima: 600,
            questoesDisponiveis: 4
          }
        ]
      },
      {
        numero: 2,
        titulo: 'Unidade 2: Ilicitude e Causas de Justificação',
        andamentoTopico: 0,
        atividades: [
          {
            id: 'act-dp-u2-livro',
            unidadeNumero: 2,
            titulo: 'U2 - Livro Didático (Legítima Defesa, Estado de Necessidade)',
            tipo: 'livro_didatico',
            status: 'pendente'
          },
          {
            id: 'act-dp-u2-aprendizagem',
            unidadeNumero: 2,
            titulo: 'U2 - Atividade de Aprendizagem',
            tipo: 'aprendizagem',
            status: 'pendente',
            prazo: '20/10/2026',
            pontuacaoMaxima: 200
          },
          {
            id: 'act-dp-u2-avaliacao',
            unidadeNumero: 2,
            titulo: 'U2 - Avaliação da Unidade (AV)',
            tipo: 'avaliacao_unidade',
            status: 'pendente',
            prazo: '30/10/2026',
            pontuacaoMaxima: 600,
            questoesDisponiveis: 4
          }
        ]
      },
      {
        numero: 3,
        titulo: 'Unidade 3: Culpabilidade e Teoria da Pena',
        andamentoTopico: 0,
        atividades: [
          {
            id: 'act-dp-u3-livro',
            unidadeNumero: 3,
            titulo: 'U3 - Livro Didático (Imputabilidade e Dosimetria da Pena)',
            tipo: 'livro_didatico',
            status: 'pendente'
          },
          {
            id: 'act-dp-u3-aprendizagem',
            unidadeNumero: 3,
            titulo: 'U3 - Atividade de Aprendizagem',
            tipo: 'aprendizagem',
            status: 'pendente',
            prazo: '20/11/2026',
            pontuacaoMaxima: 200
          },
          {
            id: 'act-dp-u3-avaliacao',
            unidadeNumero: 3,
            titulo: 'U3 - Avaliação da Unidade (AV)',
            tipo: 'avaliacao_unidade',
            status: 'pendente',
            prazo: '30/11/2026',
            pontuacaoMaxima: 600,
            questoesDisponiveis: 4
          }
        ]
      },
      {
        numero: 4,
        titulo: 'Unidade 4: Concurso de Pessoas e Concurso de Crimes',
        andamentoTopico: 0,
        atividades: [
          {
            id: 'act-dp-u4-livro',
            unidadeNumero: 4,
            titulo: 'U4 - Livro Didático (Autoria, Coautoria e Participação)',
            tipo: 'livro_didatico',
            status: 'pendente'
          },
          {
            id: 'act-dp-u4-aprendizagem',
            unidadeNumero: 4,
            titulo: 'U4 - Atividade de Aprendizagem',
            tipo: 'aprendizagem',
            status: 'pendente',
            prazo: '05/12/2026',
            pontuacaoMaxima: 200
          },
          {
            id: 'act-dp-u4-avaliacao',
            unidadeNumero: 4,
            titulo: 'U4 - Avaliação da Unidade (AV)',
            tipo: 'avaliacao_unidade',
            status: 'pendente',
            prazo: '12/12/2026',
            pontuacaoMaxima: 600,
            questoesDisponiveis: 4
          }
        ]
      }
    ]
  },
  {
    id: 'disc-direito-trabalho',
    codigo: '10102',
    nome: 'Direito do Trabalho',
    categoria: 'AMI',
    categoriaLabel: 'Aula Modelo Institucional - WL',
    icone: 'Briefcase',
    cor: 'text-blue-600 dark:text-blue-400',
    corFundo: 'bg-blue-500/10 border-blue-500/20',
    andamentoGeral: 0,
    totalAtividades: 12,
    atividadesConcluidas: 0,
    proximoPrazo: '24 de Agosto de 2026',
    unidades: [
      {
        numero: 1,
        titulo: 'Unidade 1: Relação de Trabalho vs Relação de Emprego (Requisitos do art. 3º CLT)',
        andamentoTopico: 0,
        atividades: [
          {
            id: 'act-dt-u1-livro',
            unidadeNumero: 1,
            titulo: 'U1 - Livro Didático (Subordinação, Habitualidade, Onerosidade e Pessoalidade)',
            tipo: 'livro_didatico',
            status: 'pendente'
          },
          {
            id: 'act-dt-u1-aprendizagem',
            unidadeNumero: 1,
            titulo: 'U1 - Atividade de Aprendizagem',
            tipo: 'aprendizagem',
            status: 'pendente',
            prazo: '25/09/2026',
            pontuacaoMaxima: 200
          },
          {
            id: 'act-dt-u1-avaliacao',
            unidadeNumero: 1,
            titulo: 'U1 - Avaliação da Unidade (AV)',
            tipo: 'avaliacao_unidade',
            status: 'pendente',
            prazo: '30/09/2026',
            pontuacaoMaxima: 600,
            questoesDisponiveis: 4
          }
        ]
      },
      {
        numero: 2,
        titulo: 'Unidade 2: Jornada de Trabalho, Horas Extras e Intervalos',
        andamentoTopico: 0,
        atividades: [
          {
            id: 'act-dt-u2-livro',
            unidadeNumero: 2,
            titulo: 'U2 - Livro Didático (Regime de Trabalho e Descanso Semanal)',
            tipo: 'livro_didatico',
            status: 'pendente'
          },
          {
            id: 'act-dt-u2-aprendizagem',
            unidadeNumero: 2,
            titulo: 'U2 - Atividade de Aprendizagem',
            tipo: 'aprendizagem',
            status: 'pendente',
            prazo: '25/10/2026',
            pontuacaoMaxima: 200
          },
          {
            id: 'act-dt-u2-avaliacao',
            unidadeNumero: 2,
            titulo: 'U2 - Avaliação da Unidade (AV)',
            tipo: 'avaliacao_unidade',
            status: 'pendente',
            prazo: '30/10/2026',
            pontuacaoMaxima: 600,
            questoesDisponiveis: 4
          }
        ]
      },
      {
        numero: 3,
        titulo: 'Unidade 3: Remuneração, Salário e Adicionais (Insalubridade/Periculosidade)',
        andamentoTopico: 0,
        atividades: [
          {
            id: 'act-dt-u3-livro',
            unidadeNumero: 3,
            titulo: 'U3 - Livro Didático (Composição Salarial e Gorjetas)',
            tipo: 'livro_didatico',
            status: 'pendente'
          },
          {
            id: 'act-dt-u3-aprendizagem',
            unidadeNumero: 3,
            titulo: 'U3 - Atividade de Aprendizagem',
            tipo: 'aprendizagem',
            status: 'pendente',
            prazo: '25/11/2026',
            pontuacaoMaxima: 200
          },
          {
            id: 'act-dt-u3-avaliacao',
            unidadeNumero: 3,
            titulo: 'U3 - Avaliação da Unidade (AV)',
            tipo: 'avaliacao_unidade',
            status: 'pendente',
            prazo: '30/11/2026',
            pontuacaoMaxima: 600,
            questoesDisponiveis: 4
          }
        ]
      },
      {
        numero: 4,
        titulo: 'Unidade 4: Rescisão do Contrato de Trabalho e Verbas Rescisórias',
        andamentoTopico: 0,
        atividades: [
          {
            id: 'act-dt-u4-livro',
            unidadeNumero: 4,
            titulo: 'U4 - Livro Didático (Justa Causa, Rescisão Indireta e Culpa Recíproca)',
            tipo: 'livro_didatico',
            status: 'pendente'
          },
          {
            id: 'act-dt-u4-aprendizagem',
            unidadeNumero: 4,
            titulo: 'U4 - Atividade de Aprendizagem',
            tipo: 'aprendizagem',
            status: 'pendente',
            prazo: '05/12/2026',
            pontuacaoMaxima: 200
          },
          {
            id: 'act-dt-u4-avaliacao',
            unidadeNumero: 4,
            titulo: 'U4 - Avaliação da Unidade (AV)',
            tipo: 'avaliacao_unidade',
            status: 'pendente',
            prazo: '12/12/2026',
            pontuacaoMaxima: 600,
            questoesDisponiveis: 4
          }
        ]
      }
    ]
  },
  {
    id: 'disc-direito-economico',
    codigo: '9470',
    nome: 'Direito Econômico e Financeiro',
    categoria: 'DI',
    categoriaLabel: 'Disciplinas Interativas (DI) - WL',
    icone: 'TrendingUp',
    cor: 'text-emerald-600 dark:text-emerald-400',
    corFundo: 'bg-emerald-500/10 border-emerald-500/20',
    andamentoGeral: 0,
    totalAtividades: 14,
    atividadesConcluidas: 0,
    proximoPrazo: '01 de Setembro de 2026',
    unidades: [
      {
        numero: 1,
        titulo: 'Unidade 1: Ordem Econômica Constitucional e Livre Concorrência',
        andamentoTopico: 0,
        atividades: [
          {
            id: 'act-de-u1-livro',
            unidadeNumero: 1,
            titulo: 'U1 - Livro Didático e Webaula',
            tipo: 'livro_didatico',
            status: 'pendente'
          },
          {
            id: 'act-de-u1-aprendizagem',
            unidadeNumero: 1,
            titulo: 'U1 - Atividade de Aprendizagem',
            tipo: 'aprendizagem',
            status: 'pendente',
            prazo: '28/09/2026',
            pontuacaoMaxima: 200
          },
          {
            id: 'act-de-u1-avaliacao',
            unidadeNumero: 1,
            titulo: 'U1 - Avaliação da Unidade (AV)',
            tipo: 'avaliacao_unidade',
            status: 'pendente',
            prazo: '05/10/2026',
            pontuacaoMaxima: 600,
            questoesDisponiveis: 4
          }
        ]
      },
      {
        numero: 2,
        titulo: 'Unidade 2: Regulação Estatal e Sistema Financeiro Nacional',
        andamentoTopico: 0,
        atividades: [
          {
            id: 'act-de-u2-livro',
            unidadeNumero: 2,
            titulo: 'U2 - Livro Didático (BACEN, CVM e CADE)',
            tipo: 'livro_didatico',
            status: 'pendente'
          },
          {
            id: 'act-de-u2-aprendizagem',
            unidadeNumero: 2,
            titulo: 'U2 - Atividade de Aprendizagem',
            tipo: 'aprendizagem',
            status: 'pendente',
            prazo: '28/10/2026',
            pontuacaoMaxima: 200
          },
          {
            id: 'act-de-u2-avaliacao',
            unidadeNumero: 2,
            titulo: 'U2 - Avaliação da Unidade (AV)',
            tipo: 'avaliacao_unidade',
            status: 'pendente',
            prazo: '05/11/2026',
            pontuacaoMaxima: 600,
            questoesDisponiveis: 4
          }
        ]
      },
      {
        numero: 3,
        titulo: 'Unidade 3: Direito Financeiro, Orçamento Público e LRF',
        andamentoTopico: 0,
        atividades: [
          {
            id: 'act-de-u3-livro',
            unidadeNumero: 3,
            titulo: 'U3 - Livro Didático (PPA, LDO e LOA)',
            tipo: 'livro_didatico',
            status: 'pendente'
          },
          {
            id: 'act-de-u3-aprendizagem',
            unidadeNumero: 3,
            titulo: 'U3 - Atividade de Aprendizagem',
            tipo: 'aprendizagem',
            status: 'pendente',
            prazo: '28/11/2026',
            pontuacaoMaxima: 200
          },
          {
            id: 'act-de-u3-avaliacao',
            unidadeNumero: 3,
            titulo: 'U3 - Avaliação da Unidade (AV)',
            tipo: 'avaliacao_unidade',
            status: 'pendente',
            prazo: '05/12/2026',
            pontuacaoMaxima: 600,
            questoesDisponiveis: 4
          }
        ]
      },
      {
        numero: 4,
        titulo: 'Unidade 4: Dívida Pública e Responsabilidade Fiscal',
        andamentoTopico: 0,
        atividades: [
          {
            id: 'act-de-u4-discursiva',
            unidadeNumero: 4,
            titulo: 'Atividade Discursiva (Estudo de Caso Prático CADE/LRF)',
            tipo: 'discursiva',
            status: 'pendente',
            prazo: '20/11/2026',
            pontuacaoMaxima: 1000,
            descricao: 'Redação dissertativa de caso prático com envio no AVA.'
          },
          {
            id: 'act-de-u4-avaliacao',
            unidadeNumero: 4,
            titulo: 'U4 - Avaliação da Unidade (AV)',
            tipo: 'avaliacao_unidade',
            status: 'pendente',
            prazo: '12/12/2026',
            pontuacaoMaxima: 600,
            questoesDisponiveis: 4
          }
        ]
      }
    ]
  },
  {
    id: 'disc-projeto-extensao-1',
    codigo: '8970',
    nome: 'Projeto de Extensão - Direito I',
    categoria: 'Extensao',
    categoriaLabel: 'Disciplinas Projeto de Extensão',
    icone: 'GraduationCap',
    cor: 'text-purple-600 dark:text-purple-400',
    corFundo: 'bg-purple-500/10 border-purple-500/20',
    andamentoGeral: 10,
    totalAtividades: 4,
    atividadesConcluidas: 1,
    proximoPrazo: '15 de Outubro de 2026',
    unidades: [
      {
        numero: 1,
        titulo: 'Módulos do Projeto: Planejamento PDCA e Execução Comunitária',
        andamentoTopico: 25,
        atividades: [
          {
            id: 'act-pe-1',
            unidadeNumero: 1,
            titulo: 'Template PDCA de Planejamento da Ação Extensionista',
            tipo: 'discursiva',
            status: 'concluida',
            descricao: 'Definição do público-alvo, objetivo ODS da ONU e cronograma de campo.'
          },
          {
            id: 'act-pe-2',
            unidadeNumero: 1,
            titulo: 'Relatório Final de Atividades de Extensão',
            tipo: 'discursiva',
            status: 'pendente',
            prazo: '25/11/2026',
            descricao: 'Documentação comprobatória das horas e impacto social gerado.'
          }
        ]
      }
    ]
  },
  {
    id: 'disc-competencias-vida',
    codigo: 'COMP-01',
    nome: 'Competências para a Vida',
    categoria: 'Complementar',
    categoriaLabel: 'Competências para a Vida',
    icone: 'Sparkles',
    cor: 'text-teal-600 dark:text-teal-400',
    corFundo: 'bg-teal-500/10 border-teal-500/20',
    andamentoGeral: 50,
    totalAtividades: 4,
    atividadesConcluidas: 2,
    proximoPrazo: '15 de Novembro de 2026',
    unidades: [
      {
        numero: 1,
        titulo: 'Módulo: Inteligência Emocional, Ética e Carreira',
        andamentoTopico: 50,
        atividades: [
          {
            id: 'act-cv-1',
            unidadeNumero: 1,
            titulo: 'Trilha de Aprendizagem: Autogestão e Comunicação Não Violenta',
            tipo: 'webaula',
            status: 'concluida'
          },
          {
            id: 'act-cv-2',
            unidadeNumero: 1,
            titulo: 'Avaliação de Competências Socioemocionais',
            tipo: 'avaliacao_unidade',
            status: 'pendente',
            prazo: '15/11/2026',
            pontuacaoMaxima: 1000
          }
        ]
      }
    ]
  }
];

export const MOCK_PERSONAS: TutorPersona[] = [
  {
    id: 'direito',
    name: 'Tutor Jurídico Socrático',
    discipline: 'Direito (Civil, Penal, Trabalho)',
    icon: 'Scale',
    badgeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    description: 'Doutrina, legislação (CC, CP, CLT), jurisprudência e raciocínio hermenêutico guiado.',
    systemPromptExtension: 'Use a metodologia de estudo de caso, princípios constitucionais e hermenêutica sem entregar a subsunção pronta.',
    suggestedTopics: ['Teoria Geral dos Contratos', 'Fato Típico e Dolo Eventual', 'Requisitos da Relação de Emprego', 'Princípio da Função Social do Contrato']
  },
  {
    id: 'exatas',
    name: 'Tutor de Exatas & Cálculo',
    discipline: 'Cálculo & Matemática',
    icon: 'Calculator',
    badgeColor: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    description: 'Especialista em decompor equações, derivadas, integrais e álgebra linear em passos intuitivos.',
    systemPromptExtension: 'Foque em decompor visualmente as variáveis, mostrar o significado geométrico e físico das fórmulas.',
    suggestedTopics: ['Regra da Cadeia em Derivadas', 'Integrais por Partes', 'Matrizes e Determinantes', 'Cinemática Vetorial']
  },
  {
    id: 'saude',
    name: 'Tutor de Saúde & Biológicas',
    discipline: 'Saúde & Medicina',
    icon: 'HeartPulse',
    badgeColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    description: 'Fisiologia, farmacologia, anatomia e patologia explicadas com fluxos sistêmicos.',
    systemPromptExtension: 'Explique o mecanismo de ação fisiopatológico e a cascata biológica antes de discutir condutas.',
    suggestedTopics: ['Ciclo Cardíaco e Eletrocardiograma', 'Mecanismo da Bomba de Sódio e Potássio', 'Farmacocinética vs Farmacodinâmica', 'Sistema Imunológico Inato']
  },
  {
    id: 'ti',
    name: 'Tutor de Tecnologia & Dev',
    discipline: 'Ciência da Computação',
    icon: 'Code2',
    badgeColor: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    description: 'Algoritmos, estruturas de dados, POO, banco de dados e arquitetura de software.',
    systemPromptExtension: 'Use pseudocódigo limpo, análise de complexidade Big-O e analogias computacionais.',
    suggestedTopics: ['Recursão vs Iteração', 'Complexidade de Tempo Big-O', 'Polimorfismo e Interfaces em POO', 'Normalização de Banco de Dados (3FN)']
  },
  {
    id: 'gestao',
    name: 'Tutor de Gestão & Finanças',
    discipline: 'Administração & Economia',
    icon: 'TrendingUp',
    badgeColor: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    description: 'Fluxo de caixa, micro/macroeconomia, marketing e tomada de decisão gerencial.',
    systemPromptExtension: 'Ilustre com dilemas empresariais, trade-offs e métricas de retorno sobre investimento (ROI).',
    suggestedTopics: ['Taxa Interna de Retorno (TIR) vs VPL', 'Elasticidade-Preço da Demanda', 'Matriz SWOT e Análise Estratégica', 'Gestão de Capital de Giro']
  }
];

export const MOCK_SAMPLE_QUESTIONS = [
  {
    discipline: 'Direito Civil - Contratos',
    title: 'Vício Redibitório vs Erro Essencial',
    question: 'Em um contrato de compra e venda de um veículo, o comprador descobre após 2 semanas um defeito oculto no motor que inviabiliza o uso. Ele quer desfazer o negócio. A questão de prova pergunta se cabe Ação Redibitória ou Anulação por Erro e qual alternativa assinalar.',
    personaId: 'direito'
  },
  {
    discipline: 'Teoria Jurídica do Direito Penal',
    title: 'Dolo Eventual vs Culpa Consciente',
    question: 'Um motorista trafega a 120km/h em via urbana de 60km/h e atropela um pedestre. A questão pergunta se ele responde por homicídio doloso ou culposo. Não sei como diferenciar dolo eventual de culpa consciente nas opções.',
    personaId: 'direito'
  },
  {
    discipline: 'Direito do Trabalho',
    title: 'Pejotização e Primazia da Realidade',
    question: 'Um trabalhador foi contratado como PJ (pessoa jurídica), mas cumpre horário fixo das 8h às 17h, recebe ordens diretas de seu superior e não pode ser substituído por outra pessoa. A questão pede para assinalar a consequência jurídica trabalhista.',
    personaId: 'direito'
  },
  {
    discipline: 'Cálculo & Matemática',
    title: 'Derivada da Função Composta (Regra da Cadeia)',
    question: 'Em uma questão de prova, me pediram para calcular a derivada de f(x) = (3x² + 5x)⁴. As alternativas tinham expressões com potências de 3 e 4. Qual é a regra e qual alternativa devo marcar?',
    personaId: 'exatas'
  }
];

export const INITIAL_FLASHCARDS: Flashcard[] = [
  {
    id: 'fc-1',
    userId: 'user-1',
    discipline: 'Direito Civil - Contratos',
    topic: 'Boa-fé Objetiva',
    front: 'Quais são as três funções fundamentais do princípio da Boa-fé Objetiva nos contratos (art. 422 CC)?',
    back: '1. Função Interpretativa/Integrativa (art. 113 CC);\n2. Função Criadora de Deveres Anexos/Laterais (lealdade, informação, proteção);\n3. Função Limitadora ao Exercício de Direitos Subjetivos (vedação ao abuso de direito, art. 187 CC).',
    mastered: true,
    createdAt: '2026-03-01T10:00:00Z',
    reviewCount: 3,
    lastReviewed: '2026-03-05T14:00:00Z'
  },
  {
    id: 'fc-2',
    userId: 'user-1',
    discipline: 'Teoria Jurídica do Direito Penal',
    topic: 'Dolo Eventual vs Culpa Consciente',
    front: 'Qual é o critério psicológico que distingue Dolo Eventual de Culpa Consciente?',
    back: 'No Dolo Eventual o agente antevê o resultado e "assume o risco / não se importa" (dano indiferente). Na Culpa Consciente o agente antevê o risco mas crê sinceramente que sua perícia evitará o resultado.',
    mastered: false,
    createdAt: '2026-03-02T11:00:00Z',
    reviewCount: 1,
    lastReviewed: '2026-03-04T09:00:00Z'
  },
  {
    id: 'fc-3',
    userId: 'user-1',
    discipline: 'Direito do Trabalho',
    topic: 'Requisitos do Vínculo Empregatício',
    front: 'Quais são os 5 requisitos cumulativos para caracterização do vínculo de emprego (art. 2º e 3º da CLT)?',
    back: 'P-P-O-S-N:\n1. Pessoa física;\n2. Pessoalidade;\n3. Onerosidade;\n4. Subordinação jurídica;\n5. Não-eventualidade (habitualidade).',
    mastered: true,
    createdAt: '2026-03-03T15:00:00Z',
    reviewCount: 4,
    lastReviewed: '2026-03-06T16:20:00Z'
  }
];

export const INITIAL_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'quiz-1',
    discipline: 'Direito Civil',
    topic: 'Contratos',
    statement: 'A cláusula que permite a uma das partes rescindir unilateralmente o contrato por conveniência, mediante prévio aviso e indenização ajustada, denomina-se:',
    options: [
      { id: 'opt-a', text: 'Cláusula resolutiva expressa' },
      { id: 'opt-b', text: 'Resilição bilateral (Distrato)' },
      { id: 'opt-c', text: 'Denúncia vazia ou resilição unilateral' },
      { id: 'opt-d', text: 'Exceção do contrato não cumprido' },
    ],
    correctOptionId: 'opt-c',
    explanation: 'A denúncia (art. 473 CC) opera a resilição unilateral nos casos em que a lei expressa ou implicitamente o permita.',
    hint: 'Pense no ato de uma única parte exercendo a faculdade de descontinuidade da relação contínua.'
  },
  {
    id: 'quiz-2',
    discipline: 'Direito Penal',
    topic: 'Teoria do Crime',
    statement: 'Qual elemento integra o Fato Típico na teoria analítica tripartida do crime?',
    options: [
      { id: 'opt-a', text: 'Imputabilidade penal e potencial consciência da ilicitude' },
      { id: 'opt-b', text: 'Conduta, resultado, nexo causal e tipicidade' },
      { id: 'opt-c', text: 'Legítima defesa e estado de necessidade' },
      { id: 'opt-d', text: 'Exigibilidade de conduta diversa' },
    ],
    correctOptionId: 'opt-b',
    explanation: 'O Fato Típico é composto por Conduta (dolosa/culposa), Resultado, Nexo de Causalidade e Tipicidade.',
    hint: 'Pense nos elementos materiais e objetivos que caracterizam o evento antes de analisar sua contrariedade ao direito.'
  }
];

export const INITIAL_ADMIN_METRICS: AdminMetrics = {
  totalSessions: 1842,
  totalQuestionsAnswered: 4120,
  integrityBlocksCount: 389,
  activeUsers: 642,
  autonomyRate: 88.4,
  topDisciplines: [
    { name: 'Direito Civil - Contratos', count: 620, color: '#d97706' },
    { name: 'Teoria Jurídica Penal', count: 480, color: '#dc2626' },
    { name: 'Direito do Trabalho', count: 390, color: '#2563eb' },
    { name: 'Direito Econômico', count: 212, color: '#059669' },
    { name: 'Projeto de Extensão', count: 140, color: '#7c3aed' }
  ],
  sessionsByDay: [
    { date: 'Segunda', count: 240 },
    { date: 'Terça', count: 310 },
    { date: 'Quarta', count: 380 },
    { date: 'Quinta', count: 420 },
    { date: 'Sexta', count: 290 },
    { date: 'Sábado', count: 120 },
    { date: 'Domingo', count: 82 }
  ],
  recentIntegrityLogs: [
    {
      id: 'log-1',
      studentName: 'Narciso Santos',
      discipline: 'Direito Civil - Contratos',
      querySnippet: 'qual a resposta certa da questão 3 de U1 - Avaliação da Unidade?',
      intervention: 'Bloqueio de gabarito direto. Ativação do método socrático com explicação da boa-fé objetiva.',
      timestamp: 'Hoje, 14:15'
    },
    {
      id: 'log-2',
      studentName: 'Mariana Duarte',
      discipline: 'Direito do Trabalho',
      querySnippet: 'só me dê a letra da resposta para eu marcar no AVA',
      intervention: 'Redirecionamento pedagógico. Apresentação de analogia sobre subordinação jurídica.',
      timestamp: 'Hoje, 13:40'
    }
  ]
};
