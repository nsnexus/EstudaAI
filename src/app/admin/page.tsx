'use client';

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ShieldAlert, 
  Sparkles, 
  TrendingUp, 
  BrainCircuit, 
  Settings2, 
  Search, 
  UserCheck, 
  ShieldCheck, 
  Edit3, 
  Save, 
  Check,
  AlertCircle
} from 'lucide-react';
import { 
  getAdminMetrics, 
  getAllUsers, 
  updateUser, 
  getTutorPersonas, 
  updateTutorPersona, 
  getCurrentUser 
} from '@/lib/storage';
import { AdminMetrics, User, TutorPersona } from '@/types';

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [personas, setPersonas] = useState<TutorPersona[]>([]);
  
  const [activeTab, setActiveTab] = useState<'kpis' | 'usuarios' | 'personas' | 'auditoria'>('kpis');
  const [searchUser, setSearchUser] = useState('');
  
  // Edição de persona
  const [editingPersona, setEditingPersona] = useState<TutorPersona | null>(null);
  const [personaSavedToast, setPersonaSavedToast] = useState(false);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    setMetrics(getAdminMetrics());
    setUsers(getAllUsers());
    setPersonas(getTutorPersonas());

    const handleDataChange = () => {
      setMetrics(getAdminMetrics());
      setUsers(getAllUsers());
      setPersonas(getTutorPersonas());
    };

    window.addEventListener('estudaai_personas_changed', handleDataChange);
    return () => window.removeEventListener('estudaai_personas_changed', handleDataChange);
  }, []);

  const handleToggleUserRole = (u: User) => {
    const nextRole = u.role === 'aluno' ? 'admin' : 'aluno';
    const updated: User = { ...u, role: nextRole };
    updateUser(updated);
    setUsers(getAllUsers());
  };

  const handleSavePersona = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPersona) return;
    updateTutorPersona(editingPersona);
    setEditingPersona(null);
    setPersonaSavedToast(true);
    setTimeout(() => setPersonaSavedToast(false), 3000);
  };

  const filteredUsers = users.filter(u => {
    if (!searchUser.trim()) return true;
    const term = searchUser.toLowerCase();
    return u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term) || u.course.toLowerCase().includes(term);
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      
      {/* Toast */}
      {personaSavedToast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-emerald-600 text-white px-5 py-3 shadow-2xl flex items-center gap-2 animate-in fade-in">
          <Check className="h-4 w-4" />
          <span className="text-xs font-bold">Diretrizes do Tutor salvas com sucesso!</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-200 dark:border-surface-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <LayoutDashboard className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-surface-900 dark:text-white">
                Painel do Administrador & Coordenação
              </h1>
              <p className="text-xs sm:text-sm text-surface-600 dark:text-surface-400">
                Métricas de autonomia, gestão de alunos, auditoria de integridade e configuração de personas.
              </p>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 rounded-2xl bg-surface-100 dark:bg-surface-900 p-1.5 border border-surface-200 dark:border-surface-800">
          <button
            onClick={() => setActiveTab('kpis')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'kpis' ? 'bg-white dark:bg-surface-800 text-surface-900 dark:text-white shadow-sm' : 'text-surface-600 dark:text-surface-400'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('usuarios')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'usuarios' ? 'bg-white dark:bg-surface-800 text-surface-900 dark:text-white shadow-sm' : 'text-surface-600 dark:text-surface-400'
            }`}
          >
            Usuários ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('personas')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'personas' ? 'bg-white dark:bg-surface-800 text-surface-900 dark:text-white shadow-sm' : 'text-surface-600 dark:text-surface-400'
            }`}
          >
            Personas & Prompts
          </button>
          <button
            onClick={() => setActiveTab('auditoria')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'auditoria' ? 'bg-white dark:bg-surface-800 text-surface-900 dark:text-white shadow-sm' : 'text-surface-600 dark:text-surface-400'
            }`}
          >
            Integridade
          </button>
        </div>
      </div>

      {/* 📊 TAB 1: KPIS & ANALYTICS */}
      {activeTab === 'kpis' && metrics && (
        <div className="mt-8 space-y-8">
          
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            <div className="rounded-3xl border border-surface-200 dark:border-surface-800 bg-white/70 dark:bg-surface-900/70 p-6 backdrop-blur-sm shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Sessões Guiadas</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                  <BrainCircuit className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-extrabold text-surface-900 dark:text-white">
                {metrics.totalSessions.toLocaleString('pt-BR')}
              </p>
              <p className="mt-1 text-xs text-emerald-500 font-medium flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> +14% em relação ao mês anterior
              </p>
            </div>

            <div className="rounded-3xl border border-surface-200 dark:border-surface-800 bg-white/70 dark:bg-surface-900/70 p-6 backdrop-blur-sm shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Taxa de Autonomia</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Sparkles className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {metrics.autonomyRate}%
              </p>
              <p className="mt-1 text-xs text-surface-500 font-medium">
                Alunos que concluíram a reflexão sem ajuda
              </p>
            </div>

            <div className="rounded-3xl border border-surface-200 dark:border-surface-800 bg-white/70 dark:bg-surface-900/70 p-6 backdrop-blur-sm shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Intervenções Anti-Cola</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                  <ShieldAlert className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-extrabold text-amber-600 dark:text-amber-400">
                {metrics.integrityBlocksCount}
              </p>
              <p className="mt-1 text-xs text-surface-500 font-medium">
                Redirecionados para aprendizagem ativa
              </p>
            </div>

            <div className="rounded-3xl border border-surface-200 dark:border-surface-800 bg-white/70 dark:bg-surface-900/70 p-6 backdrop-blur-sm shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Usuários Ativos</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-extrabold text-surface-900 dark:text-white">
                {metrics.activeUsers}
              </p>
              <p className="mt-1 text-xs text-surface-500 font-medium">
                Engajados nesta semana
              </p>
            </div>

          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Top Disciplinas */}
            <div className="lg:col-span-6 rounded-3xl border border-surface-200 dark:border-surface-800 bg-white/70 dark:bg-surface-900/70 p-6 backdrop-blur-sm">
              <h3 className="font-bold text-base text-surface-900 dark:text-white mb-4">
                Disciplinas com Mais Demandas de Tutoria
              </h3>
              <div className="space-y-4">
                {metrics.topDisciplines.map((d) => {
                  const maxCount = Math.max(...metrics.topDisciplines.map(item => item.count));
                  const percentage = Math.round((d.count / maxCount) * 100);

                  return (
                    <div key={d.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-surface-700 dark:text-surface-300">{d.name}</span>
                        <span className="font-bold text-surface-900 dark:text-white">{d.count} dúvidas</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%`, backgroundColor: d.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Atividade Semanal */}
            <div className="lg:col-span-6 rounded-3xl border border-surface-200 dark:border-surface-800 bg-white/70 dark:bg-surface-900/70 p-6 backdrop-blur-sm">
              <h3 className="font-bold text-base text-surface-900 dark:text-white mb-4">
                Ritmo de Estudos por Dia da Semana
              </h3>
              <div className="flex items-end justify-between gap-2 h-44 pt-6">
                {metrics.sessionsByDay.map((day) => {
                  const maxVal = Math.max(...metrics.sessionsByDay.map(i => i.count));
                  const heightPercent = Math.round((day.count / maxVal) * 100);

                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <span className="text-[10px] font-bold text-surface-500 group-hover:text-brand-500 transition-colors">
                        {day.count}
                      </span>
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-brand-600 to-primary-500 opacity-80 group-hover:opacity-100 transition-opacity"
                        style={{ height: `${heightPercent}%` }}
                      />
                      <span className="text-[10px] text-surface-400 font-medium truncate w-full text-center">
                        {day.date.slice(0, 3)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 👥 TAB 2: GESTÃO DE USUÁRIOS */}
      {activeTab === 'usuarios' && (
        <div className="mt-8 space-y-6">
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-surface-400" />
              <input
                type="text"
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                placeholder="Buscar usuário por nome, email ou curso..."
                className="w-full rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 pl-10 pr-4 py-2.5 text-xs text-surface-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <span className="text-xs text-surface-500">
              Mostrando {filteredUsers.length} usuários cadastrados
            </span>
          </div>

          <div className="rounded-3xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-surface-600 dark:text-surface-400">
                <thead className="border-b border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-950/60 uppercase font-bold text-surface-500">
                  <tr>
                    <th className="px-6 py-4">Usuário</th>
                    <th className="px-6 py-4">Curso / Setor</th>
                    <th className="px-6 py-4">Perfil Atual</th>
                    <th className="px-6 py-4">Cadastro</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-800/60">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-brand-500/20 text-brand-600 flex items-center justify-center font-bold text-sm">
                            {u.name.slice(0, 1)}
                          </div>
                          <div>
                            <p className="font-bold text-surface-900 dark:text-white">{u.name}</p>
                            <p className="text-[11px] text-surface-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-surface-700 dark:text-surface-300">
                        {u.course} {u.semester ? `(${u.semester}º Semestre)` : ''}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          u.role === 'admin'
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                            : 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20'
                        }`}>
                          {u.role === 'admin' ? <ShieldCheck className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                          {u.role === 'admin' ? 'Administrador' : 'Aluno'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-surface-400">
                        {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleToggleUserRole(u)}
                          className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-1.5 text-xs font-semibold text-surface-700 dark:text-surface-300 hover:border-brand-500 hover:text-brand-500 transition-colors"
                        >
                          {u.role === 'aluno' ? 'Promover a Admin' : 'Alterar para Aluno'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* 🎭 TAB 3: PERSONAS & SYSTEM PROMPTS */}
      {activeTab === 'personas' && (
        <div className="mt-8 space-y-6">
          <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white/70 dark:bg-surface-900/70 p-6 backdrop-blur-sm">
            <h2 className="text-base font-bold text-surface-900 dark:text-white">
              Configuração Pedagógica por Disciplina
            </h2>
            <p className="text-xs text-surface-600 dark:text-surface-400 mt-1">
              Personalize as diretrizes pedagógicas e o tom socrático de cada tutor especialista.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {personas.map((p) => (
              <div
                key={p.id}
                className="rounded-3xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-lg bg-brand-500/10 px-2.5 py-1 text-xs font-bold text-brand-600 dark:text-brand-400">
                      {p.discipline}
                    </span>
                    <button
                      onClick={() => setEditingPersona(p)}
                      className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Editar Diretrizes</span>
                    </button>
                  </div>

                  <h3 className="font-bold text-base text-surface-900 dark:text-white mt-3">
                    {p.name}
                  </h3>
                  <p className="text-xs text-surface-600 dark:text-surface-400 mt-1">
                    {p.description}
                  </p>

                  <div className="mt-4 rounded-xl bg-surface-50 dark:bg-surface-950/60 p-3 border border-surface-200/60 dark:border-surface-800/60 text-xs">
                    <span className="font-bold text-surface-700 dark:text-surface-300 block mb-1">
                      Extensão do System Prompt:
                    </span>
                    <p className="text-surface-500 italic">
                      &ldquo;{p.systemPromptExtension}&rdquo;
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-surface-100 dark:border-surface-800 flex flex-wrap gap-1">
                  {p.suggestedTopics.map((top, idx) => (
                    <span key={idx} className="rounded-md bg-surface-100 dark:bg-surface-800 px-2 py-0.5 text-[10px] text-surface-500">
                      {top}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Modal de Edição de Persona */}
          {editingPersona && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="w-full max-w-lg rounded-3xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6 sm:p-8 shadow-2xl space-y-4">
                <h3 className="font-bold text-lg text-surface-900 dark:text-white">
                  Editar Persona: {editingPersona.name}
                </h3>

                <form onSubmit={handleSavePersona} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-surface-600 dark:text-surface-300">
                      Descrição do Especialista
                    </label>
                    <input
                      type="text"
                      value={editingPersona.description}
                      onChange={(e) => setEditingPersona({ ...editingPersona, description: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-950 px-3.5 py-2 text-xs text-surface-900 dark:text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-surface-600 dark:text-surface-300">
                      Extensão do System Prompt (Diretrizes Pedagógicas)
                    </label>
                    <textarea
                      value={editingPersona.systemPromptExtension}
                      onChange={(e) => setEditingPersona({ ...editingPersona, systemPromptExtension: e.target.value })}
                      rows={4}
                      className="mt-1 w-full rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-950 p-3 text-xs text-surface-900 dark:text-white focus:outline-none focus:border-brand-500 leading-relaxed resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingPersona(null)}
                      className="rounded-xl px-4 py-2 text-xs font-semibold text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-brand-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-brand-700"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

      {/* 🛡️ TAB 4: AUDITORIA DE INTEGRIDADE PEDAGÓGICA */}
      {activeTab === 'auditoria' && metrics && (
        <div className="mt-8 space-y-6">
          <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white/70 dark:bg-surface-900/70 p-6 backdrop-blur-sm flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-surface-900 dark:text-white">
                Log de Integridade & Intervenções Socráticas
              </h2>
              <p className="text-xs text-surface-600 dark:text-surface-400 mt-1 leading-relaxed">
                Relatório de solicitações de gabarito direto interceptadas e transformadas em estímulo ao raciocínio lógico.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {metrics.recentIntegrityLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-5 shadow-sm space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-surface-900 dark:text-white">{log.studentName}</span>
                    <span className="rounded bg-surface-100 dark:bg-surface-800 px-2 py-0.5 text-[10px] text-surface-500">
                      {log.discipline}
                    </span>
                  </div>
                  <span className="text-[10px] text-surface-400">{log.timestamp}</span>
                </div>

                <div className="rounded-xl bg-rose-500/5 border border-rose-500/20 p-2.5 text-xs text-rose-700 dark:text-rose-300">
                  <strong>Entrada interceptada:</strong> &ldquo;{log.querySnippet}&rdquo;
                </div>

                <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                  <strong>Ação Pedagógica:</strong> {log.intervention}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
