'use client';

import { User, StudySession, Flashcard, TutorPersona, AdminMetrics, UserRole, Disciplina } from '@/types';
import { TUTOR_PERSONAS } from './personas';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc, getDocs, collection, updateDoc } from 'firebase/firestore';

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
  provider: 'openai' | 'gemini';
  openaiApiKey?: string;
  geminiApiKey?: string;
  openaiModel?: string;
}

// Helper seguro para SSR
function isClient(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Inicializa os dados no LocalStorage sem for├ºar mocks de usu├írio
 */
export function initStorage() {
  if (!isClient()) return;

  if (!localStorage.getItem(STORAGE_KEYS.ALL_USERS)) {
    localStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify([]));
  }

  if (!localStorage.getItem(STORAGE_KEYS.PERSONAS)) {
    localStorage.setItem(STORAGE_KEYS.PERSONAS, JSON.stringify(TUTOR_PERSONAS));
  }

  if (!localStorage.getItem(STORAGE_KEYS.AI_CONFIG)) {
    const defaultConfig: AIConfig = {
      provider: 'openai',
      openaiModel: 'gpt-4o-mini',
    };
    localStorage.setItem(STORAGE_KEYS.AI_CONFIG, JSON.stringify(defaultConfig));
  }
}

/**
 * Autentica├º├úo e Usu├írios
 */
export function getCurrentUser(): User | null {
  if (!isClient()) return null;
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
  if (!isClient()) return [];
  initStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.ALL_USERS);
  return raw ? JSON.parse(raw) : [];
}

export async function loginUser(email: string, password?: string): Promise<{ success: boolean; user?: User; error?: string }> {
  if (!isClient()) return { success: false, error: 'Ambiente indisponível.' };
  initStorage();

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password || '123456');
    const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
    if (userDoc.exists()) {
      const user = userDoc.data() as User;
      setCurrentUser(user);
      localStorage.setItem('estudaai_is_logged_in', 'true');
      return { success: true, user };
    }
    return { success: false, error: 'Usuário não encontrado no banco de dados.' };
  } catch (error: any) {
    console.error('Login error:', error);
    return { success: false, error: error.message || 'Falha ao fazer login.' };
  }
}

export async function registerUser(name: string, email: string, password?: string, course?: string, semester?: number, role: UserRole = 'aluno'): Promise<{ success: boolean; user?: User; error?: string }> {
  if (!isClient()) return { success: false, error: 'Ambiente indisponível.' };
  initStorage();

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password || '123456');
    const newUser: User = {
      id: cred.user.uid,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8BFF&color=fff`,
      course: course?.trim() || 'Direito',
      semester: semester || 1,
      studyGoalMinutes: 45,
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'users', cred.user.uid), newUser);
    setCurrentUser(newUser);
    localStorage.setItem('estudaai_is_logged_in', 'true');
    return { success: true, user: newUser };
  } catch (error: any) {
    console.error('Register error:', error);
    if (error.code === 'auth/weak-password') return { success: false, error: 'A senha deve ter pelo menos 6 caracteres.' };
    if (error.code === 'auth/email-already-in-use') return { success: false, error: 'Este e-mail já está em uso.' };
    return { success: false, error: error.message || 'Falha ao registrar.' };
  }
}

export async function resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: any) {
    console.error('Reset password error:', error);
    if (error.code === 'auth/user-not-found') return { success: false, error: 'Usuário não encontrado.' };
    if (error.code === 'auth/invalid-email') return { success: false, error: 'E-mail inválido.' };
    return { success: false, error: error.message || 'Falha ao enviar e-mail de recuperação.' };
  }
}

export function switchRole(role: UserRole): User | null {
  const current = getCurrentUser();
  if (current) {
    const updated: User = { ...current, role };
    updateUser(updated);
    return updated;
  }
  return null;
}

export function updateUser(user: User): void {
  if (!isClient()) return;
  initStorage();
  const users = getAllUsers();
  const idx = users.findIndex(u => u.id === user.id);
  if (idx !== -1) {
    users[idx] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(users));
  
  const current = getCurrentUser();
  if (current && current.id === user.id) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  }
  window.dispatchEvent(new Event('estudaai_auth_changed'));
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
  setCurrentUser(null);
  if (isClient()) {
    localStorage.removeItem('estudaai_is_logged_in');
  }
}

/**
 * Gest├úo e Sincroniza├º├úo de Disciplinas
 */
export function getDisciplinas(): Disciplina[] {
  if (!isClient()) return [];
  initStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.DISCIPLINAS);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveDisciplinas(disciplinas: Disciplina[]): void {
  if (!isClient()) return;
  localStorage.setItem(STORAGE_KEYS.DISCIPLINAS, JSON.stringify(disciplinas));
  window.dispatchEvent(new Event('estudaai_disciplinas_changed'));
}

export function toggleAtividadeConcluida(disciplinaId: string, atividadeId: string): Disciplina | null {
  if (!isClient()) return null;
  const list = getDisciplinas();
  const discIndex = list.findIndex(d => d.id === disciplinaId);
  if (discIndex === -1) return null;

  const disc = list[discIndex];
  let updated = false;

  for (const unidade of disc.unidades) {
    const atv = unidade.atividades.find(a => a.id === atividadeId);
    if (atv) {
      atv.status = atv.status === 'concluida' ? 'pendente' : 'concluida';
      atv.dataConclusao = atv.status === 'concluida' ? new Date().toISOString() : undefined;
      updated = true;
      break;
    }
  }

  if (!updated) return null;

  // Recalcula totais e percentuais
  let total = 0;
  let concluidas = 0;

  disc.unidades.forEach(u => {
    const uTotal = u.atividades.length;
    const uConcluidas = u.atividades.filter(a => a.status === 'concluida').length;
    u.andamentoTopico = uTotal > 0 ? Math.round((uConcluidas / uTotal) * 100) : 0;

    total += uTotal;
    concluidas += uConcluidas;
  });

  disc.totalAtividades = total;
  disc.atividadesConcluidas = concluidas;
  disc.andamentoGeral = total > 0 ? Math.round((concluidas / total) * 100) : 0;

  list[discIndex] = disc;
  saveDisciplinas(list);
  return disc;
}

export function concluirTodaDisciplina(disciplinaId: string): Disciplina | null {
  if (!isClient()) return null;
  const list = getDisciplinas();
  const discIndex = list.findIndex(d => d.id === disciplinaId);
  if (discIndex === -1) return null;

  const disc = list[discIndex];
  let total = 0;

  disc.unidades.forEach(u => {
    u.atividades.forEach(a => {
      a.status = 'concluida';
      a.dataConclusao = new Date().toISOString();
    });
    u.andamentoTopico = 100;
    total += u.atividades.length;
  });

  disc.totalAtividades = total;
  disc.atividadesConcluidas = total;
  disc.andamentoGeral = 100;

  list[discIndex] = disc;
  saveDisciplinas(list);
  return disc;
}

export function concluirUnidadeDisciplina(disciplinaId: string, unidadeNumero: number): Disciplina | null {
  if (!isClient()) return null;
  const list = getDisciplinas();
  const discIndex = list.findIndex(d => d.id === disciplinaId);
  if (discIndex === -1) return null;

  const disc = list[discIndex];
  const unidade = disc.unidades.find(u => u.numero === unidadeNumero);
  if (!unidade) return null;

  unidade.atividades.forEach(a => {
    a.status = 'concluida';
    a.dataConclusao = new Date().toISOString();
  });
  unidade.andamentoTopico = 100;

  let total = 0;
  let concluidas = 0;
  disc.unidades.forEach(u => {
    total += u.atividades.length;
    concluidas += u.atividades.filter(a => a.status === 'concluida').length;
  });

  disc.totalAtividades = total;
  disc.atividadesConcluidas = concluidas;
  disc.andamentoGeral = total > 0 ? Math.round((concluidas / total) * 100) : 0;

  list[discIndex] = disc;
  saveDisciplinas(list);
  return disc;
}

export function concluirTodasDisciplinas(): void {
  if (!isClient()) return;
  const list = getDisciplinas();
  list.forEach(disc => {
    let total = 0;
    disc.unidades.forEach(u => {
      u.atividades.forEach(a => {
        a.status = 'concluida';
        a.dataConclusao = new Date().toISOString();
      });
      u.andamentoTopico = 100;
      total += u.atividades.length;
    });
    disc.totalAtividades = total;
    disc.atividadesConcluidas = total;
    disc.andamentoGeral = 100;
  });
  saveDisciplinas(list);
}

export function syncPortalData(aluno: any, disciplinas: Disciplina[]): void {
  if (!isClient()) return;
  initStorage();

  if (disciplinas && Array.isArray(disciplinas)) {
    saveDisciplinas(disciplinas);
  }

  if (aluno) {
    const users = getAllUsers();
    let existing = users.find(u => u.id === aluno.id || u.email === aluno.email);
    const userToSave: User = {
      id: aluno.id || `user-${Date.now()}`,
      name: aluno.name,
      email: aluno.email,
      role: 'aluno',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      course: aluno.course || 'Direito',
      semester: aluno.semester || 5,
      studyGoalMinutes: 60,
      createdAt: new Date().toISOString()
    };

    if (!existing) {
      users.push(userToSave);
      localStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(users));
    }
    setCurrentUser(userToSave);
  }
}

/**
 * Sess├Áes de Estudo & Hist├│rico
 */
export function getStudySessions(): StudySession[] {
  if (!isClient()) return [];
  initStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
  return raw ? JSON.parse(raw) : [];
}

export function saveStudySession(session: Omit<StudySession, 'id' | 'createdAt'>): StudySession {
  const sessions = getStudySessions();
  const newSession: StudySession = {
    ...session,
    id: `session-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  sessions.unshift(newSession);
  if (isClient()) {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    window.dispatchEvent(new Event('estudaai_sessions_changed'));
  }
  return newSession;
}

/**
 * Flashcards
 */
export function getFlashcards(): Flashcard[] {
  if (!isClient()) return [];
  initStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.FLASHCARDS);
  return raw ? JSON.parse(raw) : [];
}

export function saveFlashcard(card: Omit<Flashcard, 'id' | 'createdAt' | 'mastered' | 'reviewCount'>): Flashcard {
  const cards = getFlashcards();
  const newCard: Flashcard = {
    ...card,
    id: `card-${Date.now()}`,
    mastered: false,
    reviewCount: 0,
    createdAt: new Date().toISOString(),
  };
  cards.unshift(newCard);
  if (isClient()) {
    localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(cards));
    window.dispatchEvent(new Event('estudaai_flashcards_changed'));
  }
  return newCard;
}

export function toggleFlashcardMastery(id: string): boolean {
  const cards = getFlashcards();
  const card = cards.find((c) => c.id === id);
  if (card) {
    card.mastered = !card.mastered;
    card.reviewCount += 1;
    card.lastReviewed = new Date().toISOString();
    if (isClient()) {
      localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(cards));
      window.dispatchEvent(new Event('estudaai_flashcards_changed'));
    }
    return card.mastered;
  }
  return false;
}

export function deleteFlashcard(id: string): void {
  const cards = getFlashcards().filter((c) => c.id !== id);
  if (isClient()) {
    localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(cards));
    window.dispatchEvent(new Event('estudaai_flashcards_changed'));
  }
}

/**
 * Personas de Tutoria
 */
export function getTutorPersonas(): TutorPersona[] {
  if (!isClient()) return TUTOR_PERSONAS;
  initStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.PERSONAS);
  return raw ? JSON.parse(raw) : TUTOR_PERSONAS;
}

export function updateTutorPersona(persona: TutorPersona): void {
  const personas = getTutorPersonas();
  const idx = personas.findIndex((p) => p.id === persona.id);
  if (idx !== -1) {
    personas[idx] = persona;
    if (isClient()) {
      localStorage.setItem(STORAGE_KEYS.PERSONAS, JSON.stringify(personas));
      window.dispatchEvent(new Event('estudaai_personas_changed'));
    }
  }
}

/**
 * M├®tricas Administrativas & Integridade
 */
const EMPTY_ADMIN_METRICS: AdminMetrics = {
  totalSessions: 0,
  totalQuestionsAnswered: 0,
  integrityBlocksCount: 0,
  activeUsers: 0,
  autonomyRate: 0,
  topDisciplines: [],
  sessionsByDay: [],
  recentIntegrityLogs: []
};

export function getAdminMetrics(): AdminMetrics {
  if (!isClient()) return EMPTY_ADMIN_METRICS;
  initStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.METRICS);
  return raw ? JSON.parse(raw) : EMPTY_ADMIN_METRICS;
}

export function recordIntegrityIntervention(userName?: string, discipline?: string, query?: string): void {
  if (!isClient()) return;
  const metrics = getAdminMetrics();
  metrics.integrityBlocksCount += 1;
  if (userName && query) {
    metrics.recentIntegrityLogs.unshift({
      id: `log-${Date.now()}`,
      studentName: userName,
      discipline: discipline || 'Geral',
      querySnippet: query.slice(0, 80),
      intervention: 'Redirecionamento Socr├ítico (Anti-Gabarito)',
      timestamp: new Date().toISOString()
    });
  }
  localStorage.setItem(STORAGE_KEYS.METRICS, JSON.stringify(metrics));
}

/**
 * Configura├º├Áes de IA
 */
export function getAIConfig(): AIConfig {
  if (!isClient()) return { provider: 'openai', openaiModel: 'gpt-4o-mini' };
  initStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.AI_CONFIG);
  return raw ? JSON.parse(raw) : { provider: 'openai', openaiModel: 'gpt-4o-mini' };
}

export function saveAIConfig(config: AIConfig): void {
  if (!isClient()) return;
  localStorage.setItem(STORAGE_KEYS.AI_CONFIG, JSON.stringify(config));
  window.dispatchEvent(new Event('estudaai_aiconfig_changed'));
}
