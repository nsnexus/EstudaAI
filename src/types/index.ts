export type UserRole = 'aluno' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  course: string;
  semester: number;
  studyGoalMinutes: number;
  createdAt: string;
}

export type TipoAtividade = 
  | 'livro_didatico' 
  | 'webaula' 
  | 'aprendizagem' 
  | 'avaliacao_unidade' 
  | 'discursiva' 
  | 'prova_digital';

export interface AtividadeDisciplina {
  id: string;
  unidadeNumero: number;
  titulo: string;
  descricao?: string;
  tipo: TipoAtividade;
  status: 'pendente' | 'concluida';
  prazo?: string;
  pontuacaoMaxima?: number;
  pontuacaoObtida?: number;
  linkTexto?: string;
  instrucao?: string;
  questoesDisponiveis?: number;
  dataConclusao?: string;
}

export interface UnidadeEnsino {
  numero: number;
  titulo: string;
  descricao?: string;
  andamentoTopico: number; // 0 a 100
  dataLiberacao?: string;
  atividades: AtividadeDisciplina[];
}

export type CategoriaDisciplina = 'AMI' | 'DI' | 'Extensao' | 'Complementar';

export interface Disciplina {
  id: string;
  codigo?: string;
  nome: string;
  categoria: CategoriaDisciplina;
  categoriaLabel: string;
  icone: string;
  cor: string;
  corFundo: string;
  andamentoGeral: number; // 0 a 100
  totalAtividades: number;
  atividadesConcluidas: number;
  proximoPrazo?: string;
  unidades: UnidadeEnsino[];
}

export interface TutorResponse {
  discipline: string;
  topic: string;
  concept: string;
  example: string;
  stepByStep: string[];
  reflectiveQuestion: string;
  integrityFlagged?: boolean;
  integrityNote?: string;
  suggestedAnswerOptions?: string[];
  followUpSuggestions: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tutorBlocks?: TutorResponse;
  timestamp: string;
  isIntegrityNotice?: boolean;
}

export interface StudySession {
  id: string;
  userId: string;
  discipline: string;
  topic: string;
  question: string;
  difficulty: 'iniciante' | 'intermediario' | 'avancado';
  response: TutorResponse;
  messages: ChatMessage[];
  studentAnswer?: string;
  studentAnswerEvaluated?: boolean;
  studentAnswerFeedback?: string;
  isMastered: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Flashcard {
  id: string;
  userId: string;
  discipline: string;
  topic: string;
  front: string;
  back: string;
  mastered: boolean;
  createdAt: string;
  lastReviewed?: string;
  reviewCount: number;
}

export interface QuizQuestion {
  id: string;
  discipline: string;
  topic: string;
  statement: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  explanation: string;
  hint: string;
}

export interface TutorPersona {
  id: string;
  name: string;
  discipline: string;
  icon: string;
  badgeColor: string;
  description: string;
  systemPromptExtension: string;
  suggestedTopics: string[];
}

export interface AdminMetrics {
  totalSessions: number;
  totalQuestionsAnswered: number;
  integrityBlocksCount: number;
  activeUsers: number;
  autonomyRate: number; // Porcentagem de alunos que concluíram a reflexão
  topDisciplines: { name: string; count: number; color: string }[];
  sessionsByDay: { date: string; count: number }[];
  recentIntegrityLogs: {
    id: string;
    studentName: string;
    discipline: string;
    querySnippet: string;
    intervention: string;
    timestamp: string;
  }[];
}
