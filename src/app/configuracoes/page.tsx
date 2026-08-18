'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Key, 
  BrainCircuit, 
  User, 
  Save, 
  RotateCcw, 
  Check, 
  Download, 
  ShieldCheck,
  Sparkles,
  Database,
  Lock,
  Globe
} from 'lucide-react';
import { 
  getAIConfig, 
  saveAIConfig, 
  getCurrentUser, 
  updateUser, 
  AIConfig, 
  getStudySessions, 
  getFlashcards 
} from '@/lib/storage';
import { User as UserType } from '@/types';

export default function ConfiguracoesPage() {
  const [aiConfig, setAiConfig] = useState<AIConfig>({ provider: 'openai', openaiModel: 'gpt-4o-mini' });
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  
  // Profile inputs
  const [name, setName] = useState('');
  const [course, setCourse] = useState('');
  const [semester, setSemester] = useState(1);
  const [studyGoal, setStudyGoal] = useState(45);

  // AI keys
  const [openaiKey, setOpenaiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [provider, setProvider] = useState<'openai' | 'gemini'>('openai');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const config = getAIConfig();
    setAiConfig(config);
    setProvider(config.provider || 'openai');
    setOpenaiKey(config.openaiApiKey || '');
    setGeminiKey(config.geminiApiKey || '');
    setSelectedModel(config.openaiModel || 'gpt-4o-mini');

    const u = getCurrentUser();
    setCurrentUser(u);
    if (u) {
      setName(u.name);
      setCourse(u.course);
      setSemester(u.semester || 1);
      setStudyGoal(u.studyGoalMinutes || 45);
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveAIConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const nextConfig: AIConfig = {
      provider,
      openaiApiKey: openaiKey.trim() || undefined,
      geminiApiKey: geminiKey.trim() || undefined,
      openaiModel: selectedModel
    };
    saveAIConfig(nextConfig);
    setAiConfig(nextConfig);
    showToast('Configurações de IA salvas com sucesso!');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const updated: UserType = {
      ...currentUser,
      name,
      course,
      semester: Number(semester),
      studyGoalMinutes: Number(studyGoal)
    };

    updateUser(updated);
    setCurrentUser(updated);
    showToast('Perfil acadêmico atualizado com sucesso!');
  };

  const handleExportData = () => {
    const sessions = getStudySessions();
    const flashcards = getFlashcards();
    const exportData = {
      user: currentUser,
      sessions,
      flashcards,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estudaai-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup exportado com sucesso!');
  };

  const handleResetData = () => {
    if (confirm('Tem certeza que deseja redefinir todas as sessões e configurações salvas?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
      
      {/* Feedback Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-emerald-600 text-white px-5 py-3 shadow-2xl flex items-center gap-2 animate-in fade-in">
          <Check className="h-4 w-4" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-surface-200 dark:border-surface-800 pb-6">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white">
              Configurações & Chaves de IA
            </h1>
            <p className="text-xs sm:text-sm text-surface-600 dark:text-surface-400">
              Personalize o motor de inteligência artificial em tempo real, chaves de API e preferências.
            </p>
          </div>
        </div>
      </div>

      {/* 🧠 1. MOTOR DE IA & APIS REAIS */}
      <div className="rounded-3xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-surface-900 dark:text-white">
              Provedor de Inteligência Artificial Real
            </h2>
            <p className="text-xs text-surface-500">
              Configure a OpenAI (GPT-4o) ou Google Gemini para respostas pedagógicas autênticas e dinâmicas.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveAIConfig} className="space-y-5">
          {/* Provider Radio Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`flex flex-col p-4 rounded-2xl border cursor-pointer transition-all ${
                provider === 'openai'
                  ? 'border-brand-500 bg-brand-50/80 dark:bg-brand-950/40 text-brand-900 dark:text-brand-100 ring-2 ring-brand-500/20'
                  : 'border-surface-200 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/40 text-surface-700 dark:text-surface-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-brand-500" />
                  OpenAI API (GPT-4o / GPT-4o-mini)
                </span>
                <input
                  type="radio"
                  name="provider"
                  value="openai"
                  checked={provider === 'openai'}
                  onChange={() => setProvider('openai')}
                  className="accent-brand-600"
                />
              </div>
              <p className="text-[11px] text-surface-500 mt-2">
                Respostas socráticas de altíssima precisão pedagógica com raciocínio guiado.
              </p>
            </label>

            <label
              className={`flex flex-col p-4 rounded-2xl border cursor-pointer transition-all ${
                provider === 'gemini'
                  ? 'border-brand-500 bg-brand-50/80 dark:bg-brand-950/40 text-brand-900 dark:text-brand-100 ring-2 ring-brand-500/20'
                  : 'border-surface-200 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/40 text-surface-700 dark:text-surface-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                  Google Gemini (Gemini 1.5 Flash)
                </span>
                <input
                  type="radio"
                  name="provider"
                  value="gemini"
                  checked={provider === 'gemini'}
                  onChange={() => setProvider('gemini')}
                  className="accent-brand-600"
                />
              </div>
              <p className="text-[11px] text-surface-500 mt-2">
                Velocidade ultrarrápida e excelente entendimento de enunciados complexos.
              </p>
            </label>
          </div>

          {/* OpenAI Configuration */}
          {provider === 'openai' && (
            <div className="space-y-4 pt-2 border-t border-surface-100 dark:border-surface-800 animate-in fade-in">
              <div>
                <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider mb-1.5">
                  OpenAI API Key (sk-...)
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                  <input
                    type="password"
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/50 pl-10 pr-4 py-2.5 text-sm text-surface-900 dark:text-white placeholder-surface-400 focus:border-brand-500 focus:outline-none transition-all font-mono"
                  />
                </div>
                <p className="text-[11px] text-surface-400 mt-1">
                  💡 Você também pode configurar a variável <code className="bg-surface-100 dark:bg-surface-800 px-1 py-0.5 rounded text-brand-500">OPENAI_API_KEY</code> no painel de Environment Variables do Cloudflare Pages.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider mb-1.5">
                  Modelo Selecionado
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/50 px-3.5 py-2.5 text-sm text-surface-900 dark:text-white focus:border-brand-500 focus:outline-none transition-all"
                >
                  <option value="gpt-4o-mini">gpt-4o-mini (Recomendado: Ultrarrápido, Econômico e Preciso)</option>
                  <option value="gpt-4o">gpt-4o (Máximo Raciocínio & Multimodal)</option>
                  <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                </select>
              </div>
            </div>
          )}

          {/* Gemini Configuration */}
          {provider === 'gemini' && (
            <div className="space-y-4 pt-2 border-t border-surface-100 dark:border-surface-800 animate-in fade-in">
              <div>
                <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider mb-1.5">
                  Google Gemini API Key
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                  <input
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/50 pl-10 pr-4 py-2.5 text-sm text-surface-900 dark:text-white placeholder-surface-400 focus:border-brand-500 focus:outline-none transition-all font-mono"
                  />
                </div>
                <p className="text-[11px] text-surface-400 mt-1">
                  💡 Obtenha gratuitamente no Google AI Studio ou configure como variável <code className="bg-surface-100 dark:bg-surface-800 px-1 py-0.5 rounded text-blue-500">GEMINI_API_KEY</code> no Cloudflare Pages.
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-primary-600 hover:from-brand-500 hover:to-primary-500 text-white text-xs font-bold shadow-md shadow-brand-500/20 active:scale-95 transition-all"
          >
            <Save className="h-4 w-4" />
            <span>Salvar Configurações de IA</span>
          </button>
        </form>
      </div>

      {/* 👤 2. PERFIL DO ALUNO */}
      <div className="rounded-3xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-surface-900 dark:text-white">
              Perfil Acadêmico
            </h2>
            <p className="text-xs text-surface-500">
              Dados do estudante para calibração das respostas e linguagem do tutor.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider mb-1.5">
                Nome do Estudante
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Narciso Henrique"
                className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/50 px-3.5 py-2.5 text-sm text-surface-900 dark:text-white focus:border-brand-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider mb-1.5">
                Curso Universitário
              </label>
              <input
                type="text"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="Ex: Direito"
                className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/50 px-3.5 py-2.5 text-sm text-surface-900 dark:text-white focus:border-brand-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider mb-1.5">
                Semestre Atual
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value))}
                className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/50 px-3.5 py-2.5 text-sm text-surface-900 dark:text-white focus:border-brand-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider mb-1.5">
                Meta Diária de Estudos (Minutos)
              </label>
              <input
                type="number"
                step="5"
                min="15"
                max="300"
                value={studyGoal}
                onChange={(e) => setStudyGoal(Number(e.target.value))}
                className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/50 px-3.5 py-2.5 text-sm text-surface-900 dark:text-white focus:border-brand-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900 hover:bg-surface-800 dark:hover:bg-surface-200 text-xs font-bold shadow-md active:scale-95 transition-all"
          >
            <Save className="h-4 w-4" />
            <span>Salvar Perfil</span>
          </button>
        </form>
      </div>

      {/* 💾 3. GESTÃO DE DADOS & BACKUP */}
      <div className="rounded-3xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-surface-900 dark:text-white">
              Armazenamento & Backup de Estudos
            </h2>
            <p className="text-xs text-surface-500">
              Exporte seus flashcards, métricas e sessões ou redefina o banco local.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportData}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800 text-surface-700 dark:text-surface-300 text-xs font-bold transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Exportar Dados (JSON)</span>
          </button>

          <button
            onClick={handleResetData}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Redefinir Dados Locais</span>
          </button>
        </div>
      </div>

    </div>
  );
}
