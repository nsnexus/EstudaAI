'use client';

import { User, StudySession, Flashcard, TutorPersona, AdminMetrics, UserRole, Disciplina } from '@/types';
import { MOCK_USERS, MOCK_PERSONAS, INITIAL_FLASHCARDS, INITIAL_ADMIN_METRICS, INITIAL_DISCIPLINAS } from './mock-data';

const STORAGE_KEYS = {
  CURRENT_USER: 'estudaai_current_user',
  ALL_USERS: 'estudaai_all_users',
  DISCIPLINAS: 'estudaai_disciplinas',
  SESSIONS: 'estudaai_sessions',
  FLASHCARDS: 'estudaai_flashcards',
  PERSONAS: 'estudaai_personas',
  METRICS: 'estudaai_metrics',
  AI_CONFIG: 'estudaai_ai_config',
  THEME: 'estudaai_theme',
};

export interface AIConfig {
  provider: 'mock' | 'openai' | 'gemini';
  openaiApiKey?: string;
  geminiApiKey?: string;
  openaiModel?: string;
}

// Helper seguro para SSR
function isClient(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Inicializa os dados no LocalStorage caso ainda não existam
 */
export function initStorage() {
  if (!isClient()) return;

  if (!localStorage.getItem(STORAGE_KEYS.ALL_USERS)) {
    localStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(MOCK_USERS));
  }

  if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(MOCK_USERS[0]));
  }

  if (!localStorage.getItem(STORAGE_KEYS.DISCIPLINAS)) {
    localStorage.setItem(STORAGE_KEYS.DISCIPLINAS, JSON.stringify(INITIAL_DISCIPLINAS));
  }

  if (!localStorage.getItem(STORAGE_KEYS.PERSONAS)) {
    localStorage.setItem(STORAGE_KEYS.PERSONAS, JSON.stringify(MOCK_PERSONAS));
  }

  if (!localStorage.getItem(STORAGE_KEYS.FLASHCARDS)) {
    localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(INITIAL_FLASHCARDS));
  }

  if (!localStorage.getItem(STORAGE_KEYS.METRICS)) {
    localStorage.setItem(STORAGE_KEYS.METRICS, JSON.stringify(INITIAL_ADMIN_METRICS));
  }

  if (!localStorage.getItem(STORAGE_KEYS.AI_CONFIG)) {
    const defaultConfig: AIConfig = {
      provider: 'mock',
      openaiModel: 'gpt-4o-mini',
    };
    localStorage.setItem(STORAGE_KEYS.AI_CONFIG, JSON.stringify(defaultConfig));
  }
}

/**
 * Autenticação e Usuários
 */
export function getCurrentUser(): User | null {
  if (!isClient()) return MOCK_USERS[0];
  initStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User | null): void {
  if (!isClient()) return;
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
  window.dispatchEvent(new Event('estudaai_auth_changed'));
}

export function getAllUsers(): User[] {
  if (!isClient()) return MOCK_USERS;
  initStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.ALL_USERS);
  return raw ? JSON.parse(raw) : MOCK_USERS;
}

export function loginUser(email: string, password?: string): { success: boolean; user?: User; error?: string } {
  if (!isClient()) return { success: false, error: 'Ambiente indisponível.' };
  initStorage();
  const users = getAllUsers();
  const cleanEmail = email.trim().toLowerCase();
  
  const found = users.find(u => u.email.toLowerCase() === cleanEmail);
  if (found) {
    setCurrentUser(found);
    return { success: true, user: found };
  }

  // Se for um novo login rápido
  const newUser: User = {
    id: `user-${Date.now()}`,
    name: cleanEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    email: cleanEmail,
    role: 'aluno',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    course: 'Direito',
    semester: 5,
    studyGoalMinutes: 45,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  localStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(users));
  setCurrentUser(newUser);
  return { success: true, user: newUser };
}

export function registerUser(name: string, email: string, course: string, semester: number, role: UserRole = 'aluno'): { success: boolean; user?: User; error?: string } {
  if (!isClient()) return { success: false, error: 'Ambiente indisponível.' };
  initStorage();
  const users = getAllUsers();
  const cleanEmail = email.trim().toLowerCase();

  if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
    return { success: false, error: 'Já existe uma conta cadastrada com este e-mail.' };
  }

  const newUser: User = {
    id: `user-${Date.now()}`,
    name: name.trim(),
    email: cleanEmail,
    role,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    course: course.trim() || 'Direito',
    semester: semester || 1,
    studyGoalMinutes: 45,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  localStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(users));
  setCurrentUser(newUser);
  return { success: true, user: newUser };
}

export function logoutUser(): void {
  setCurrentUser(null);
}

export function switchRole(role: UserRole): User {
  const users = getAllUsers();
  const targetUser = users.find(u => u.role === role) || users[0];
  setCurrentUser(targetUser);
  return targetUser;
}

export function updateUser(updated: User): void {
  if (!isClient()) return;
  const users = getAllUsers();
  const index = users.findIndex(u => u.id === updated.id);
  if (index !== -1) {
    users[index] = updated;
    localStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(users));
    const current = getCurrentUser();
    if (current && current.id === updated.id) {
      setCurrentUser(updated);
    }
  }
}

/**
 * Gerenciamento de Disciplinas e Atividades
 */
export function getDisciplinas(): Disciplina[] {
  if (!isClient()) return INITIAL_DISCIPLINAS;
  initStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.DISCIPLINAS);
  return raw ? JSON.parse(raw) : INITIAL_DISCIPLINAS;
}

export function getDisciplinaById(id: string): Disciplina | undefined {
  const disciplinas = getDisciplinas();
  return disciplinas.find(d => d.id === id);
}

export function toggleAtividadeConcluida(disciplinaId: string, atividadeId: string): Disciplina | undefined {
  if (!isClient()) return undefined;
  const disciplinas = getDisciplinas();
  const disciplina = disciplinas.find(d => d.id === disciplinaId);
  if (!disciplina) return undefined;

  let totalActs = 0;
  let concluidas = 0;

  for (const unidade of disciplina.unidades) {
    let uTotal = unidade.atividades.length;
    let uConcluidas = 0;

    for (const atv of unidade.atividades) {
      if (atv.id === atividadeId) {
        atv.status = atv.status === 'concluida' ? 'pendente' : 'concluida';
      }
      if (atv.status === 'concluida') {
        uConcluidas++;
        concluidas++;
      }
      totalActs++;
    }

    unidade.andamentoTopico = uTotal > 0 ? Math.round((uConcluidas / uTotal) * 100) : 0;
  }

  disciplina.totalAtividades = totalActs;
  disciplina.atividadesConcluidas = concluidas;
  disciplina.andamentoGeral = totalActs > 0 ? Math.round((concluidas / totalActs) * 100) : 0;

  localStorage.setItem(STORAGE_KEYS.DISCIPLINAS, JSON.stringify(disciplinas));
  window.dispatchEvent(new Event('estudaai_disciplinas_changed'));
  return disciplina;
}

export function syncPortalData(alunoData: Partial<User>, novasDisciplinas?: Disciplina[]): User {
  if (!isClient()) return MOCK_USERS[0];
  initStorage();

  const users = getAllUsers();
  let user = users.find(u => u.email === alunoData.email || u.name === alunoData.name);

  if (!user) {
    user = {
      id: `user-${Date.now()}`,
      name: alunoData.name || 'Aluno Conectado',
      email: alunoData.email || `aluno.${Date.now()}@anhanguera.edu.br`,
      role: 'aluno',
      avatar: alunoData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      course: alunoData.course || 'Direito',
      semester: alunoData.semester || 5,
      studyGoalMinutes: 60,
      createdAt: new Date().toISOString()
    };
    users.push(user);
    localStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(users));
  } else {
    if (alunoData.course) user.course = alunoData.course;
    if (alunoData.semester) user.semester = alunoData.semester;
    updateUser(user);
  }

  setCurrentUser(user);

  if (novasDisciplinas && novasDisciplinas.length > 0) {
    localStorage.setItem(STORAGE_KEYS.DISCIPLINAS, JSON.stringify(novasDisciplinas));
    window.dispatchEvent(new Event('estudaai_disciplinas_changed'));
  }

  return user;
}

/**
 * Gerenciamento de Sessões de Estudo / Dúvidas
 */
export function getStudySessions(): StudySession[] {
  if (!isClient()) return [];
  initStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
  return raw ? JSON.parse(raw) : [];
}

export function saveStudySession(session: StudySession): void {
  if (!isClient()) return;
  const sessions = getStudySessions();
  const index = sessions.findIndex(s => s.id === session.id);
  if (index !== -1) {
    sessions[index] = session;
  } else {
    sessions.unshift(session);
  }
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  window.dispatchEvent(new Event('estudaai_sessions_changed'));
}

export function getStudySessionById(id: string): StudySession | undefined {
  const sessions = getStudySessions();
  return sessions.find(s => s.id === id);
}

/**
 * Gerenciamento de Flashcards
 */
export function getFlashcards(): Flashcard[] {
  if (!isClient()) return INITIAL_FLASHCARDS;
  initStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.FLASHCARDS);
  return raw ? JSON.parse(raw) : INITIAL_FLASHCARDS;
}

export function saveFlashcard(card: Flashcard): void {
  if (!isClient()) return;
  const cards = getFlashcards();
  const index = cards.findIndex(c => c.id === card.id);
  if (index !== -1) {
    cards[index] = card;
  } else {
    cards.unshift(card);
  }
  localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(cards));
  window.dispatchEvent(new Event('estudaai_flashcards_changed'));
}

export function toggleFlashcardMastery(id: string): boolean {
  const cards = getFlashcards();
  const card = cards.find(c => c.id === id);
  if (card) {
    card.mastered = !card.mastered;
    card.reviewCount = (card.reviewCount || 0) + 1;
    card.lastReviewed = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(cards));
    window.dispatchEvent(new Event('estudaai_flashcards_changed'));
    return card.mastered;
  }
  return false;
}

export function deleteFlashcard(id: string): void {
  if (!isClient()) return;
  const cards = getFlashcards().filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(cards));
  window.dispatchEvent(new Event('estudaai_flashcards_changed'));
}

/**
 * Personas de Tutores
 */
export function getTutorPersonas(): TutorPersona[] {
  if (!isClient()) return MOCK_PERSONAS;
  initStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.PERSONAS);
  return raw ? JSON.parse(raw) : MOCK_PERSONAS;
}

export function updateTutorPersona(persona: TutorPersona): void {
  if (!isClient()) return;
  const personas = getTutorPersonas();
  const index = personas.findIndex(p => p.id === persona.id);
  if (index !== -1) {
    personas[index] = persona;
    localStorage.setItem(STORAGE_KEYS.PERSONAS, JSON.stringify(personas));
    window.dispatchEvent(new Event('estudaai_personas_changed'));
  }
}

/**
 * Métricas do Administrador
 */
export function getAdminMetrics(): AdminMetrics {
  if (!isClient()) return INITIAL_ADMIN_METRICS;
  initStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.METRICS);
  return raw ? JSON.parse(raw) : INITIAL_ADMIN_METRICS;
}

export function recordIntegrityIntervention(studentName: string, discipline: string, querySnippet: string): void {
  if (!isClient()) return;
  const metrics = getAdminMetrics();
  metrics.integrityBlocksCount += 1;
  metrics.recentIntegrityLogs.unshift({
    id: `log-${Date.now()}`,
    studentName,
    discipline,
    querySnippet,
    intervention: 'Intervenção Socrática: bloqueio de gabarito direto e redirecionamento para reflexão.',
    timestamp: 'Agora mesmo'
  });
  localStorage.setItem(STORAGE_KEYS.METRICS, JSON.stringify(metrics));
}

/**
 * Configurações de IA
 */
export function getAIConfig(): AIConfig {
  if (!isClient()) return { provider: 'mock' };
  initStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.AI_CONFIG);
  return raw ? JSON.parse(raw) : { provider: 'mock' };
}

export function saveAIConfig(config: AIConfig): void {
  if (!isClient()) return;
  localStorage.setItem(STORAGE_KEYS.AI_CONFIG, JSON.stringify(config));
  window.dispatchEvent(new Event('estudaai_aiconfig_changed'));
}
