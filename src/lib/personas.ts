import { TutorPersona } from '@/types';

export const TUTOR_PERSONAS: TutorPersona[] = [
  {
    id: 'direito',
    name: 'Tutor Juridico Socratico',
    discipline: 'Direito (Civil, Penal, Trabalho)',
    icon: 'Scale',
    badgeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    description: 'Doutrina, legislacao (CC, CP, CLT), jurisprudencia e raciocinio hermeneutico guiado.',
    systemPromptExtension: 'Use a metodologia de estudo de caso, principios constitucionais e hermeneutica sem entregar a subsuncao pronta.',
    suggestedTopics: ['Teoria Geral dos Contratos', 'Fato Tipico e Dolo Eventual', 'Requisitos da Relacao de Emprego', 'Principio da Funcao Social do Contrato']
  },
  {
    id: 'exatas',
    name: 'Tutor de Exatas & Calculo',
    discipline: 'Calculo & Matematica',
    icon: 'Calculator',
    badgeColor: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    description: 'Especialista em decompor equacoes, derivadas, integrais e algebra linear em passos intuitivos.',
    systemPromptExtension: 'Foque em decompor visualmente as variaveis, mostrar o significado geometrico e fisico das formulas.',
    suggestedTopics: ['Regra da Cadeia em Derivadas', 'Integrais por Partes', 'Matrizes e Determinantes', 'Cinematica Vetorial']
  },
  {
    id: 'saude',
    name: 'Tutor de Saude & Biologicas',
    discipline: 'Saude & Medicina',
    icon: 'HeartPulse',
    badgeColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    description: 'Fisiologia, farmacologia, anatomia e patologia explicadas com fluxos sistemicos.',
    systemPromptExtension: 'Explique o mecanismo de acao fisiopatologico e a cascata biologica antes de discutir condutas.',
    suggestedTopics: ['Ciclo Cardiaco e Eletrocardiograma', 'Mecanismo da Bomba de Sodio e Potassio', 'Farmacocinetica vs Farmacodinamica', 'Sistema Imunologico Inato']
  },
  {
    id: 'ti',
    name: 'Tutor de Tecnologia & Dev',
    discipline: 'Ciencia da Computacao',
    icon: 'Code2',
    badgeColor: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    description: 'Algoritmos, estruturas de dados, POO, banco de dados e arquitetura de software.',
    systemPromptExtension: 'Use pseudocodigo limpo, analise de complexidade Big-O e analogias computacionais.',
    suggestedTopics: ['Recursao vs Iteracao', 'Complexidade de Tempo Big-O', 'Polimorfismo e Interfaces em POO', 'Normalizacao de Banco de Dados (3FN)']
  },
  {
    id: 'gestao',
    name: 'Tutor de Gestao & Financas',
    discipline: 'Administracao & Economia',
    icon: 'TrendingUp',
    badgeColor: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    description: 'Fluxo de caixa, micro/macroeconomia, marketing e tomada de decisao gerencial.',
    systemPromptExtension: 'Ilustre com dilemas empresariais, trade-offs e metricas de retorno sobre investimento (ROI).',
    suggestedTopics: ['Taxa Interna de Retorno (TIR) vs VPL', 'Elasticidade-Preco da Demanda', 'Matriz SWOT e Analise Estrategica', 'Gestao de Capital de Giro']
  }
];

export const SAMPLE_QUESTIONS = [
  {
    discipline: 'Direito Civil - Contratos',
    title: 'Vicio Redibiotorio vs Erro Essencial',
    question: 'Em um contrato de compra e venda de um veiculo, o comprador descobre apos 2 semanas um defeito oculto no motor que inviabiliza o uso. Ele quer desfazer o negocio. A questao de prova pergunta se cabe Acao Redibitoria ou Anulacao por Erro e qual alternativa assinalar.',
    personaId: 'direito'
  },
  {
    discipline: 'Teoria Juridica do Direito Penal',
    title: 'Dolo Eventual vs Culpa Consciente',
    question: 'Um motorista trafega a 120km/h em via urbana de 60km/h e atropela um pedestre. A questao pergunta se ele responde por homicidio doloso ou culposo. Nao sei como diferenciar dolo eventual de culpa consciente nas opcoes.',
    personaId: 'direito'
  },
  {
    discipline: 'Direito do Trabalho',
    title: 'Pejotizacao e Primazia da Realidade',
    question: 'Um trabalhador foi contratado como PJ (pessoa juridica), mas cumpre horario fixo das 8h as 17h, recebe ordens diretas de seu superior e nao pode ser substituido por outra pessoa. A questao pede para assinalar a consequencia juridica trabalhista.',
    personaId: 'direito'
  },
  {
    discipline: 'Calculo & Matematica',
    title: 'Derivada da Funcao Composta (Regra da Cadeia)',
    question: 'Em uma questao de prova, me pediram para calcular a derivada de f(x) = (3x^2 + 5x)^4. As alternativas tinham expressoes com potencias de 3 e 4. Qual e a regra e qual alternativa devo marcar?',
    personaId: 'exatas'
  }
];