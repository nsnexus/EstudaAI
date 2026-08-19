import { User, Disciplina, AtividadeDisciplina } from '@/types';
import { auth, db } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  getDocs,
  onSnapshot
} from 'firebase/firestore';

const isClient = () => typeof window !== 'undefined';

// ============================================================================
// AUTHENTICATION
// ============================================================================

export async function loginUser(email: string, password?: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password || '123456');
    const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
    if (userDoc.exists()) {
      if (isClient()) {
        localStorage.setItem('estudaai_is_logged_in', 'true');
        window.dispatchEvent(new Event('estudaai_auth_changed'));
      }
      return { success: true, user: userDoc.data() as User };
    }
    return { success: false, error: 'Usuário não encontrado no banco de dados.' };
  } catch (error: any) {
    console.error('Login error:', error);
    return { success: false, error: error.message || 'Falha ao fazer login.' };
  }
}

export async function registerUser(name: string, email: string, course: string, semester: number, role: 'aluno' | 'professor' = 'aluno'): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    // Para simplificar o MVP, a senha padrão será 123456 ou você pode adicionar um campo senha
    const cred = await createUserWithEmailAndPassword(auth, email, '123456');
    const newUser: User = {
      id: cred.user.uid,
      name,
      email,
      role,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8BFF&color=fff`,
      course,
      semester,
      studyGoalMinutes: 120,
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'users', cred.user.uid), newUser);
    if (isClient()) {
      localStorage.setItem('estudaai_is_logged_in', 'true');
      window.dispatchEvent(new Event('estudaai_auth_changed'));
    }
    return { success: true, user: newUser };
  } catch (error: any) {
    console.error('Register error:', error);
    return { success: false, error: error.message || 'Falha ao registrar.' };
  }
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
  if (isClient()) {
    localStorage.removeItem('estudaai_is_logged_in');
    localStorage.removeItem('estudaai_disciplinas');
    window.dispatchEvent(new Event('estudaai_auth_changed'));
  }
}

export function getCurrentUser(): User | null {
  // Para manter síncrono onde necessário na UI inicial, você pode gerenciar um estado global.
  // Como estamos exportando getCurrentUser que precisa retornar o User, usaremos localStorage de backup ou retornaremos nulo.
  // O recomendado é usar o onAuthStateChanged nos componentes.
  return null;
}

// ============================================================================
// DISCIPLINAS & ATIVIDADES
// ============================================================================

export async function getDisciplinas(): Promise<Disciplina[]> {
  const user = auth.currentUser;
  if (!user) {
    // Tenta ler do localStorage provisório sincronizado pela extensão se não estiver autenticado (ou enquanto inicializa)
    if (isClient()) {
      const raw = localStorage.getItem('estudaai_disciplinas');
      return raw ? JSON.parse(raw) : [];
    }
    return [];
  }
  
  try {
    const querySnapshot = await getDocs(collection(db, 'users', user.uid, 'disciplinas'));
    const discs: Disciplina[] = [];
    querySnapshot.forEach((doc) => {
      discs.push(doc.data() as Disciplina);
    });
    return discs;
  } catch (error) {
    console.error('Erro ao buscar disciplinas:', error);
    return [];
  }
}

export async function toggleAtividadeConcluida(disciplinaId: string, unidadeNumero: number, atividadeId: string): Promise<Disciplina | null> {
  // Este mock atualizava o localStorage. Com Firestore, atualizamos no banco.
  const user = auth.currentUser;
  if (!user) return null;

  try {
    const docRef = doc(db, 'users', user.uid, 'disciplinas', disciplinaId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;

    const d = snap.data() as Disciplina;
    let concluidaAgora = false;

    d.unidades = d.unidades.map(u => {
      if (u.numero === unidadeNumero) {
        u.atividades = u.atividades.map(a => {
          if (a.id === atividadeId) {
            concluidaAgora = a.status !== 'concluida';
            return { ...a, status: concluidaAgora ? 'concluida' : 'pendente' };
          }
          return a;
        });
        const concluidas = u.atividades.filter(a => a.status === 'concluida').length;
        u.andamentoTopico = (concluidas / u.atividades.length) * 100;
      }
      return u;
    });

    let totalConcluidas = 0;
    d.unidades.forEach(u => {
      totalConcluidas += u.atividades.filter(a => a.status === 'concluida').length;
    });
    d.atividadesConcluidas = totalConcluidas;
    d.andamentoGeral = (totalConcluidas / d.totalAtividades) * 100;

    await updateDoc(docRef, d as any);
    
    // Atualiza localstorage apenas por performance temporária
    if (isClient()) {
      window.dispatchEvent(new Event('estudaai_disciplinas_changed'));
    }

    return d;
  } catch (error) {
    console.error('Erro ao atualizar atividade:', error);
    return null;
  }
}

export async function concluirUnidadeDisciplina(disciplinaId: string, unidadeNumero: number): Promise<Disciplina | null> {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    const docRef = doc(db, 'users', user.uid, 'disciplinas', disciplinaId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;

    const d = snap.data() as Disciplina;
    d.unidades = d.unidades.map(u => {
      if (u.numero === unidadeNumero) {
        u.atividades = u.atividades.map(a => ({ ...a, status: 'concluida' }));
        u.andamentoTopico = 100;
      }
      return u;
    });

    let totalConcluidas = 0;
    d.unidades.forEach(u => {
      totalConcluidas += u.atividades.filter(a => a.status === 'concluida').length;
    });
    d.atividadesConcluidas = totalConcluidas;
    d.andamentoGeral = (totalConcluidas / d.totalAtividades) * 100;

    await updateDoc(docRef, d as any);
    return d;
  } catch (e) {
    return null;
  }
}

export async function concluirTodaDisciplina(disciplinaId: string): Promise<Disciplina | null> {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    const docRef = doc(db, 'users', user.uid, 'disciplinas', disciplinaId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;

    const d = snap.data() as Disciplina;
    d.unidades = d.unidades.map(u => {
      u.atividades = u.atividades.map(a => ({ ...a, status: 'concluida' }));
      u.andamentoTopico = 100;
      return u;
    });
    d.atividadesConcluidas = d.totalAtividades;
    d.andamentoGeral = 100;

    await updateDoc(docRef, d as any);
    return d;
  } catch (e) {
    return null;
  }
}

export async function concluirTodasDisciplinas(): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;

  try {
    const querySnapshot = await getDocs(collection(db, 'users', user.uid, 'disciplinas'));
    querySnapshot.forEach(async (document) => {
      await concluirTodaDisciplina(document.id);
    });
    return true;
  } catch (e) {
    return false;
  }
}

export async function syncPortalData(
  instituicao: string,
  cpfMatricula: string,
  senhaPortal: string,
  onProgress?: (step: number, text: string) => void
): Promise<{ success: boolean; data?: Disciplina[]; error?: string }> {
  // Essa função está deprecada, o sync agora é via extensão.
  return { success: false, error: 'Sincronização server-side deprecada. Use a extensão.' };
}