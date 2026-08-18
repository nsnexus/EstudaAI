'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  GraduationCap, 
  Scale, 
  Shield, 
  Briefcase, 
  TrendingUp, 
  Sparkles, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  BrainCircuit, 
  ArrowRight, 
  Filter, 
  Search, 
  ChevronRight, 
  X, 
  Flame, 
  FileText, 
  Award,
  Video,
  BookMarked,
  Zap,
  RefreshCw,
  Loader2,
  Lock,
  User as UserIcon,
  ShieldCheck
} from 'lucide-react';
import { getDisciplinas, toggleAtividadeConcluida, getCurrentUser, syncPortalData } from '@/lib/storage';
import { Disciplina, AtividadeDisciplina, User } from '@/types';

export default function DisciplinasPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [selectedDisciplina, setSelectedDisciplina] = useState<Disciplina | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPendingOnly, setFilterPendingOnly] = useState(false);
  const [modalPendingOnly, setModalPendingOnly] = useState(true);

  // Sync Portal Modal State
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [instituicao, setInstituicao] = useState('Anhanguera');
  const [cpfMatricula, setCpfMatricula] = useState('');
  const [senhaPortal, setSenhaPortal] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStepText, setSyncStepText] = useState('');
  const [syncStep, setSyncStep] = useState(0);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);

  const loadData = () => {
    setUser(getCurrentUser());
    const discs = getDisciplinas();
    setDisciplinas(discs);
    if (selectedDisciplina) {
      const updated = discs.find(d => d.id === selectedDisciplina.id);
      if (updated) setSelectedDisciplina(updated);
    }
  };

  useEffect(() => {
    loadData();
    const handleDiscChange = () => loadData();
    const handleAuthChange = () => setUser(getCurrentUser());

    window.addEventListener('estudaai_disciplinas_changed', handleDiscChange);
    window.addEventListener('estudaai_auth_changed', handleAuthChange);

    return () => {
      window.removeEventListener('estudaai_disciplinas_changed', handleDiscChange);
      window.removeEventListener('estudaai_auth_changed', handleAuthChange);
    };
  }, []);

  const handleToggleAtividade = (disciplinaId: string, atividadeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = toggleAtividadeConcluida(disciplinaId, atividadeId);
    if (updated && selectedDisciplina && selectedDisciplina.id === disciplinaId) {
      setSelectedDisciplina({ ...updated });
    }
  };

  const handleOpenTutorForAtividade = (disciplinaNome: string, atividade: AtividadeDisciplina, e: React.MouseEvent) => {
    e.stopPropagation();
    const query = new URLSearchParams({
      disciplina: disciplinaNome,
      tema: `${atividade.titulo} - Dúvidas conceituais e raciocínio`,
    }).toString();
    router.push(`/tutor?${query}`);
  };

  const handleSyncSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncError(null);
    setSyncSuccess(null);

    if (!cpfMatricula.trim() || !senhaPortal.trim()) {
      setSyncError('Preencha seu CPF/Matrícula e Senha do Portal.');
      return;
    }

    setIsSyncing(true);
    setSyncStep(1);
    setSyncStepText(`1. Conectando aos servidores da ${instituicao}...`);

    try {
      setTimeout(() => {
        setSyncStep(2);
        setSyncStepText('2. Autenticando credenciais no AVA KLS...');
      }, 600);

      setTimeout(() => {
        setSyncStep(3);
        setSyncStepText('3. Mapeando disciplinas matriculadas e unidades...');
      }, 1200);

      setTimeout(() => {
        setSyncStep(4);
        setSyncStepText('4. Identificando avaliações e atividades pendentes...');
      }, 1800);

      const res = await fetch('/api/portal-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instituicao,
          cpfMatricula,
          senha: senhaPortal
        })
      });

      const data = await res.json();

      setTimeout(() => {
        setIsSyncing(false);
        if (data.success) {
          setSyncStep(5);
          setSyncStepText(`✅ ${data.totalDisciplinas} disciplinas mapeadas com sucesso!`);
          
          syncPortalData(data.aluno, data.disciplinas);
          loadData();
          setSyncSuccess(`Sincronização concluída com sucesso! ${data.totalDisciplinas} disciplinas atualizadas.`);
          
          setTimeout(() => {
            setSyncModalOpen(false);
            setSyncSuccess(null);
          }, 1500);
        } else {
          setSyncStep(0);
          setSyncError(data.error || 'Erro na sincronização.');
        }
      }, 2400);

    } catch (err) {
      setIsSyncing(false);
      setSyncStep(0);
      setSyncError('Falha ao conectar com o portal. Tente novamente.');
    }
  };

  // Cálculo de Métricas Globais
  const totalDisciplinas = disciplinas.length;
  const mediaProgressoGeral = totalDisciplinas > 0 
    ? Math.round(disciplinas.reduce((acc, d) => acc + d.andamentoGeral, 0) / totalDisciplinas) 
    : 0;
  
  const totalAtividadesGeral = disciplinas.reduce((acc, d) => acc + d.totalAtividades, 0);
  const totalConcluidasGeral = disciplinas.reduce((acc, d) => acc + d.atividadesConcluidas, 0);
  const totalPendentesGeral = totalAtividadesGeral - totalConcluidasGeral;

  // Filtragem de Disciplinas
  const filteredDisciplinas = disciplinas.filter(d => {
    const matchesSearch = d.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.categoriaLabel.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || d.categoria === filterCategory;
    const matchesPending = !filterPendingOnly || (d.totalAtividades - d.atividadesConcluidas > 0);
    return matchesSearch && matchesCategory && matchesPending;
  });

  // Helper de Ícones
  const getDisciplineIcon = (iconName: string) => {
    switch (iconName) {
      case 'Scale': return <Scale className="h-6 w-6" />;
      case 'Shield': return <Shield className="h-6 w-6" />;
      case 'Briefcase': return <Briefcase className="h-6 w-6" />;
      case 'TrendingUp': return <TrendingUp className="h-6 w-6" />;
      case 'GraduationCap': return <GraduationCap className="h-6 w-6" />;
      default: return <Sparkles className="h-6 w-6" />;
    }
  };

  const getActivityIcon = (tipo: string) => {
    switch (tipo) {
      case 'livro_didatico': return <BookMarked className="h-4 w-4 text-blue-500" />;
      case 'webaula': return <Video className="h-4 w-4 text-purple-500" />;
      case 'aprendizagem': return <BrainCircuit className="h-4 w-4 text-emerald-500" />;
      case 'avaliacao_unidade': return <Award className="h-4 w-4 text-amber-500" />;
      case 'discursiva': return <FileText className="h-4 w-4 text-red-500" />;
      default: return <CheckCircle2 className="h-4 w-4 text-surface-400" />;
    }
  };

  const getActivityTypeLabel = (tipo: string) => {
    switch (tipo) {
      case 'livro_didatico': return 'Material Didático (PDF)';
      case 'webaula': return 'Webaula / Teleaula';
      case 'aprendizagem': return 'Atividade de Aprendizagem (Quiz)';
      case 'avaliacao_unidade': return 'Avaliação da Unidade (AV Oficial)';
      case 'discursiva': return 'Atividade Discursiva / Relatório';
      case 'prova_digital': return 'Prova Digital Institucional';
      default: return 'Atividade';
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* 1. Header & Saudação */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-surface-200 dark:border-surface-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400 border border-brand-500/20">
              🎓 Portal do Aluno
            </span>
            <span className="text-xs text-surface-500 dark:text-surface-400">
              {user ? `${user.course} • ${user.semester}º Semestre` : 'Direito • 5º Semestre'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 dark:text-white mt-1">
            Minhas Disciplinas & Atividades
          </h1>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-0.5">
            Acompanhe o percentual de conclusão e veja exatamente o que falta fazer em cada matéria.
          </p>
        </div>

        {/* Sync Button & Quick User Banner */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Botão Conectar / Sincronizar Portal */}
          <button
            onClick={() => {
              setSyncError(null);
              setSyncSuccess(null);
              setSyncModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-brand-600 to-primary-600 hover:from-brand-500 hover:to-primary-500 text-white text-xs font-bold shadow-md shadow-brand-500/20 active:scale-95 transition-all"
            title="Conectar com o portal Anhanguera ou Unopar para atualizar notas e pendências"
          >
            <Zap className="h-4 w-4 text-amber-300" />
            <span>Sincronizar com Portal AVA</span>
          </button>

          <div className="flex items-center gap-3 bg-surface-100 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl p-2.5">
            <img 
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'} 
              alt="Avatar" 
              className="h-9 w-9 rounded-xl object-cover ring-2 ring-brand-500/30"
            />
            <div>
              <p className="text-xs font-bold text-surface-900 dark:text-white">
                {user?.name || 'Narciso Henrique Felizardo'}
              </p>
              <p className="text-[11px] text-surface-500 dark:text-surface-400">
                {totalPendentesGeral > 0 ? `${totalPendentesGeral} pendências para concluir` : '🎉 Tudo em dia!'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white/80 dark:bg-surface-900/80 p-4 shadow-sm">
          <div className="flex items-center justify-between text-surface-500 dark:text-surface-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Disciplinas</span>
            <BookOpen className="h-4 w-4 text-primary-500" />
          </div>
          <p className="text-2xl font-bold text-surface-900 dark:text-white">{totalDisciplinas}</p>
          <p className="text-xs text-surface-500 mt-1">Matriculadas no semestre</p>
        </div>

        <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white/80 dark:bg-surface-900/80 p-4 shadow-sm">
          <div className="flex items-center justify-between text-surface-500 dark:text-surface-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Progresso Médio</span>
            <TrendingUp className="h-4 w-4 text-brand-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-surface-900 dark:text-white">{mediaProgressoGeral}%</p>
            <span className="text-xs text-brand-600 dark:text-brand-400 font-medium">concluído</span>
          </div>
          <div className="w-full bg-surface-200 dark:bg-surface-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-gradient-to-r from-brand-500 to-primary-500 h-full rounded-full transition-all duration-500" style={{ width: `${mediaProgressoGeral}%` }} />
          </div>
        </div>

        <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white/80 dark:bg-surface-900/80 p-4 shadow-sm">
          <div className="flex items-center justify-between text-surface-500 dark:text-surface-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Atividades Pendentes</span>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{totalPendentesGeral}</p>
          <p className="text-xs text-surface-500 mt-1">de {totalAtividadesGeral} tarefas mapeadas</p>
        </div>

        <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white/80 dark:bg-surface-900/80 p-4 shadow-sm">
          <div className="flex items-center justify-between text-surface-500 dark:text-surface-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Próximo Prazo</span>
            <Clock className="h-4 w-4 text-red-500" />
          </div>
          <p className="text-sm font-bold text-surface-900 dark:text-white truncate">10 de Agosto de 2026</p>
          <p className="text-xs text-surface-500 mt-1">Direito Civil - Contratos (U1)</p>
        </div>
      </div>

      {/* 3. Barra de Busca e Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por disciplina ou código..."
            className="w-full rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 pl-10 pr-4 py-2.5 text-sm text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Categoria Selector */}
          <div className="flex rounded-xl bg-surface-100 dark:bg-surface-900 p-1 border border-surface-200 dark:border-surface-800 text-xs font-medium">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterCategory === 'all'
                  ? 'bg-white dark:bg-surface-800 text-surface-900 dark:text-white shadow-sm font-bold'
                  : 'text-surface-500 hover:text-surface-900 dark:hover:text-white'
              }`}
            >
              Todas ({disciplinas.length})
            </button>
            <button
              onClick={() => setFilterCategory('AMI')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterCategory === 'AMI'
                  ? 'bg-white dark:bg-surface-800 text-surface-900 dark:text-white shadow-sm font-bold'
                  : 'text-surface-500 hover:text-surface-900 dark:hover:text-white'
              }`}
            >
              Aula Modelo (AMI)
            </button>
            <button
              onClick={() => setFilterCategory('DI')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterCategory === 'DI'
                  ? 'bg-white dark:bg-surface-800 text-surface-900 dark:text-white shadow-sm font-bold'
                  : 'text-surface-500 hover:text-surface-900 dark:hover:text-white'
              }`}
            >
              Interativas (DI)
            </button>
            <button
              onClick={() => setFilterCategory('Extensao')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterCategory === 'Extensao'
                  ? 'bg-white dark:bg-surface-800 text-surface-900 dark:text-white shadow-sm font-bold'
                  : 'text-surface-500 hover:text-surface-900 dark:hover:text-white'
              }`}
            >
              Extensão
            </button>
          </div>

          {/* Toggle Pendentes */}
          <button
            onClick={() => setFilterPendingOnly(!filterPendingOnly)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              filterPendingOnly
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                : 'border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800'
            }`}
          >
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Com Pendências</span>
          </button>
        </div>
      </div>

      {/* 4. Galeria de Disciplinas (Grid de Cards) ou Empty State */}
      {disciplinas.length === 0 ? (
        <div className="rounded-3xl border border-surface-200 dark:border-surface-800 bg-white/80 dark:bg-surface-900/80 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-500/10 text-brand-600 dark:text-brand-400 mx-auto mb-4 border border-brand-500/20">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-surface-900 dark:text-white">
            Nenhuma disciplina sincronizada ainda
          </h3>
          <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-400 mt-2 max-w-md mx-auto">
            Conecte seu portal acadêmico (Anhanguera, Unopar ou Pitágoras) com seu CPF e senha para mapear suas matérias, unidades e pendências em tempo real.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                setSyncError(null);
                setSyncSuccess(null);
                setSyncModalOpen(true);
              }}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-primary-600 hover:from-brand-500 hover:to-primary-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-brand-500/25 active:scale-95 transition-all"
            >
              <Zap className="h-4 w-4 text-amber-300" />
              <span>Conectar e Mapear Portal Acadêmico</span>
            </button>
            <Link
              href="/login"
              className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-surface-200 dark:border-surface-800 hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-700 dark:text-surface-300 text-xs sm:text-sm font-bold transition-all"
            >
              <span>Ir para Tela de Login</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDisciplinas.map((disciplina) => {
            const pendentes = disciplina.totalAtividades - disciplina.atividadesConcluidas;
            const isComplete = disciplina.andamentoGeral === 100;

            return (
              <div
                key={disciplina.id}
                onClick={() => setSelectedDisciplina(disciplina)}
                className="group relative flex flex-col justify-between rounded-3xl border border-surface-200/80 dark:border-surface-800/80 bg-white dark:bg-surface-900/90 hover:border-brand-500/50 dark:hover:border-brand-500/40 p-6 shadow-sm hover:shadow-xl hover:shadow-brand-500/5 transition-all duration-300 cursor-pointer overflow-hidden"
              >
                {/* Top Row: Icon & Tag */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${disciplina.corFundo} ${disciplina.cor} group-hover:scale-105 transition-transform`}>
                      {getDisciplineIcon(disciplina.icone)}
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="rounded-full bg-surface-100 dark:bg-surface-800 px-2.5 py-0.5 text-[10px] font-semibold text-surface-600 dark:text-surface-400 border border-surface-200 dark:border-surface-700">
                        {disciplina.categoriaLabel}
                      </span>
                      {disciplina.codigo && (
                        <span className="text-[10px] text-surface-400 font-mono mt-0.5">
                          Cód: {disciplina.codigo}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-surface-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-2">
                    {disciplina.nome}
                  </h3>

                  {/* Units preview */}
                  <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                    {disciplina.unidades.length} {disciplina.unidades.length === 1 ? 'Módulo' : 'Unidades de Ensino'} • {disciplina.totalAtividades} Atividades
                  </p>
                </div>

                {/* Progress Section */}
                <div className="mt-6 pt-4 border-t border-surface-100 dark:border-surface-800">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-surface-600 dark:text-surface-400">
                      Conclusão Geral
                    </span>
                    <span className="font-bold text-surface-900 dark:text-white">
                      {disciplina.andamentoGeral}%
                    </span>
                  </div>

                  <div className="w-full bg-surface-100 dark:bg-surface-800 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${
                        isComplete 
                          ? 'bg-emerald-500' 
                          : disciplina.andamentoGeral > 0 
                            ? 'bg-gradient-to-r from-brand-500 to-primary-500' 
                            : 'bg-surface-300 dark:bg-surface-700'
                      }`}
                      style={{ width: `${Math.max(disciplina.andamentoGeral, 4)}%` }}
                    />
                  </div>

                  {/* Pending Status Badge */}
                  <div className="flex items-center justify-between mt-4">
                    {pendentes > 0 ? (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{pendentes} {pendentes === 1 ? 'pendência' : 'pendências'}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        <span>100% Concluída</span>
                      </div>
                    )}

                    <span className="flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 group-hover:translate-x-0.5 transition-transform">
                      Ver detalhes <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Painel Detalhado ("O QUE PRECISA SER FEITO AINDA") */}
      {selectedDisciplina && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-surface-950/60 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-surface-200 dark:border-surface-800 flex items-start justify-between gap-4 bg-surface-50/50 dark:bg-surface-950/50">
              <div className="flex items-center gap-3.5">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${selectedDisciplina.corFundo} ${selectedDisciplina.cor} shrink-0`}>
                  {getDisciplineIcon(selectedDisciplina.icone)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-surface-200/70 dark:bg-surface-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-surface-700 dark:text-surface-300">
                      {selectedDisciplina.categoriaLabel}
                    </span>
                    {selectedDisciplina.codigo && (
                      <span className="text-xs text-surface-400 font-mono">
                        Cód: {selectedDisciplina.codigo}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-surface-900 dark:text-white mt-1">
                    {selectedDisciplina.nome}
                  </h2>
                </div>
              </div>

              <button
                onClick={() => setSelectedDisciplina(null)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Progress Summary */}
            <div className="px-6 py-4 bg-brand-50/40 dark:bg-brand-950/20 border-b border-surface-200 dark:border-surface-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="text-surface-700 dark:text-surface-300">
                    Progresso Geral da Matéria: {selectedDisciplina.andamentoGeral}%
                  </span>
                  <span className="text-surface-500">
                    {selectedDisciplina.atividadesConcluidas} de {selectedDisciplina.totalAtividades} concluídas
                  </span>
                </div>
                <div className="w-full bg-surface-200 dark:bg-surface-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-brand-500 to-primary-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${selectedDisciplina.andamentoGeral}%` }}
                  />
                </div>
              </div>

              {/* Toggle Filter inside Modal */}
              <div className="flex items-center gap-1.5 self-end sm:self-auto bg-white dark:bg-surface-900 p-1 rounded-xl border border-surface-200 dark:border-surface-800">
                <button
                  onClick={() => setModalPendingOnly(true)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    modalPendingOnly
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold'
                      : 'text-surface-500 hover:text-surface-900 dark:hover:text-white'
                  }`}
                >
                  ⚠️ Só Pendentes ({selectedDisciplina.totalAtividades - selectedDisciplina.atividadesConcluidas})
                </button>
                <button
                  onClick={() => setModalPendingOnly(false)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    !modalPendingOnly
                      ? 'bg-surface-200 dark:bg-surface-800 text-surface-900 dark:text-white font-bold'
                      : 'text-surface-500 hover:text-surface-900 dark:hover:text-white'
                  }`}
                >
                  Todas ({selectedDisciplina.totalAtividades})
                </button>
              </div>
            </div>

            {/* Modal Body: Units & Activities List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {selectedDisciplina.unidades.map((unidade) => {
                const filteredAtividades = unidade.atividades.filter(
                  a => !modalPendingOnly || a.status === 'pendente'
                );

                if (filteredAtividades.length === 0 && modalPendingOnly) return null;

                return (
                  <div 
                    key={unidade.numero} 
                    className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-50/60 dark:bg-surface-950/40 p-4 sm:p-5"
                  >
                    {/* Unit Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-200/80 dark:border-surface-800/80 pb-3 mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-brand-500/10 px-2 py-0.5 text-[11px] font-bold text-brand-600 dark:text-brand-400">
                            Unidade {unidade.numero}
                          </span>
                          {unidade.dataLiberacao && (
                            <span className="text-[11px] text-surface-400">
                              Disponível desde {unidade.dataLiberacao}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-surface-900 dark:text-white mt-1">
                          {unidade.titulo}
                        </h4>
                      </div>

                      {/* Topic Progress */}
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="text-xs font-semibold text-surface-500">
                          {unidade.andamentoTopico}%
                        </span>
                        <div className="w-16 bg-surface-200 dark:bg-surface-800 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-brand-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${unidade.andamentoTopico}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Activities List */}
                    <div className="space-y-3">
                      {filteredAtividades.map((atividade) => {
                        const isDone = atividade.status === 'concluida';

                        return (
                          <div
                            key={atividade.id}
                            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                              isDone
                                ? 'bg-emerald-500/5 border-emerald-500/20 text-surface-600 dark:text-surface-400'
                                : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800 shadow-sm hover:border-brand-500/30'
                            }`}
                          >
                            {/* Left: Info */}
                            <div className="flex items-start gap-3 min-w-0">
                              <button
                                onClick={(e) => handleToggleAtividade(selectedDisciplina.id, atividade.id, e)}
                                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                                  isDone
                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                    : 'border-surface-300 dark:border-surface-600 hover:border-brand-500'
                                }`}
                                title={isDone ? 'Marcar como pendente' : 'Marcar como concluída'}
                              >
                                {isDone && <CheckCircle2 className="h-4 w-4" />}
                              </button>

                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  {getActivityIcon(atividade.tipo)}
                                  <span className="text-xs font-bold text-surface-900 dark:text-white truncate">
                                    {atividade.titulo}
                                  </span>
                                  <span className="rounded bg-surface-100 dark:bg-surface-800 px-1.5 py-0.2 text-[10px] text-surface-500 font-medium">
                                    {getActivityTypeLabel(atividade.tipo)}
                                  </span>
                                </div>

                                {atividade.descricao && (
                                  <p className="text-xs text-surface-500 dark:text-surface-400 mt-1 line-clamp-2">
                                    {atividade.descricao}
                                  </p>
                                )}

                                {atividade.instrucao && (
                                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 italic">
                                    {atividade.instrucao}
                                  </p>
                                )}

                                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-surface-400">
                                  {atividade.prazo && (
                                    <span className="flex items-center gap-1 text-red-500 dark:text-red-400 font-medium">
                                      <Clock className="h-3 w-3" /> Prazo: {atividade.prazo}
                                    </span>
                                  )}
                                  {atividade.pontuacaoMaxima ? (
                                    <span>Pontos: {atividade.pontuacaoMaxima} pts</span>
                                  ) : null}
                                </div>
                              </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              {/* Botão de Estudar com IA Socrática */}
                              <button
                                onClick={(e) => handleOpenTutorForAtividade(selectedDisciplina.nome, atividade, e)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-brand-600 to-primary-600 hover:from-brand-500 hover:to-primary-500 text-white text-xs font-bold shadow-sm shadow-brand-500/20 active:scale-95 transition-all"
                                title="Abrir Tutor IA para entender os conceitos desta atividade"
                              >
                                <BrainCircuit className="h-3.5 w-3.5" />
                                <span>Estudar com IA</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {selectedDisciplina.totalAtividades - selectedDisciplina.atividadesConcluidas === 0 && modalPendingOnly && (
                <div className="text-center py-12">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mx-auto mb-3">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h4 className="text-lg font-bold text-surface-900 dark:text-white">
                    Parabéns! Todas as atividades desta disciplina foram concluídas!
                  </h4>
                  <p className="text-sm text-surface-500 mt-1">
                    Você pode revisar os conceitos ou gerar flashcards e simulados na biblioteca.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-950 flex items-center justify-between">
              <span className="text-xs text-surface-500">
                💡 Clique no checkbox para atualizar seu progresso em tempo real.
              </span>
              <button
                onClick={() => setSelectedDisciplina(null)}
                className="px-4 py-2 rounded-xl bg-surface-200 dark:bg-surface-800 text-xs font-bold text-surface-900 dark:text-white hover:bg-surface-300 dark:hover:bg-surface-700 transition-colors"
              >
                Concluir Visualização
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 6. MODAL DE CONEXÃO & SINCRONIZAÇÃO COM PORTAL (ANHANGUERA / UNOPAR) */}
      {syncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-surface-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-md rounded-3xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-2xl p-6 sm:p-7 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-primary-600 text-white shadow-md">
                  <Zap className="h-5 w-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-surface-900 dark:text-white">
                    Sincronizar com Portal AVA
                  </h3>
                  <p className="text-xs text-surface-500">
                    Mapeie suas matérias e notas em tempo real
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSyncModalOpen(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-surface-400 hover:text-surface-900 dark:hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error / Success Feedback */}
            {syncError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{syncError}</span>
              </div>
            )}

            {syncSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 animate-pulse">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{syncSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSyncSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider mb-1">
                  Instituição
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Anhanguera', 'Unopar', 'Pitágoras', 'Kroton'].map((inst) => (
                    <button
                      type="button"
                      key={inst}
                      onClick={() => setInstituicao(inst)}
                      className={`py-1.5 px-2.5 rounded-lg border text-xs font-bold text-center transition-all ${
                        instituicao === inst
                          ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 font-extrabold'
                          : 'border-surface-200 dark:border-surface-700 text-surface-500 hover:bg-surface-50 dark:hover:bg-surface-800'
                      }`}
                    >
                      {instituicao === inst ? '✓ ' : ''}{inst}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider mb-1">
                  CPF ou Matrícula
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                  <input
                    type="text"
                    value={cpfMatricula}
                    onChange={(e) => setCpfMatricula(e.target.value)}
                    placeholder="Ex: 015.432.300-00"
                    disabled={isSyncing}
                    className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/50 pl-10 pr-4 py-2 text-sm text-surface-900 dark:text-white placeholder-surface-400 focus:border-brand-500 focus:outline-none transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider mb-1">
                  Senha do Portal (PDA/AVA)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                  <input
                    type="password"
                    value={senhaPortal}
                    onChange={(e) => setSenhaPortal(e.target.value)}
                    placeholder="••••••••••••"
                    disabled={isSyncing}
                    className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/50 pl-10 pr-4 py-2 text-sm text-surface-900 dark:text-white placeholder-surface-400 focus:border-brand-500 focus:outline-none transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Progress Steps Animation */}
              {isSyncing && (
                <div className="p-3 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-brand-600 dark:text-brand-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{syncStepText}</span>
                  </div>
                  <div className="w-full bg-surface-200 dark:bg-surface-700 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-brand-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${(syncStep / 4) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSyncModalOpen(false)}
                  disabled={isSyncing}
                  className="flex-1 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 text-xs font-bold text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSyncing}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-primary-600 hover:from-brand-500 hover:to-primary-500 text-white text-xs font-bold shadow-md shadow-brand-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Sincronizando...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-3.5 w-3.5 text-amber-300" />
                      <span>Sincronizar Agora</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
