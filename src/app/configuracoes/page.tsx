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
  Database
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
  const [aiConfig, setAiConfig] = useState<AIConfig>({ provider: 'mock' });
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
  const [provider, setProvider] = useState<'mock' | 'openai' | 'gemini'>('mock');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const config = getAIConfig();
    setAiConfig(config);
    setProvider(config.provider || 'mock');
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
    const exportObj = {
      user: currentUser,
      sessions,
      flashcards,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estudaai_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup exportado com sucesso!');
  };

  const handleResetData = () => {
    if (confirm('Deseja restaurar todos os dados mock e histórico para os valores iniciais?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      
      {/* Toast Alert */}
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
              Personalize o motor de inteligência artificial, chaves de API e preferências do aluno.
            </p>
          </div>
        </div>
      </div>

      {/* 🧠 1. MOTOR DE IA & APIS */}
      <div className="rounded-3xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-surface-900 dark:text-white">
              Provedor de Inteligência Artificial
            </h2>
            <p className="text-xs text-surface-500">
              Escolha entre o Motor Socrático Nativo Local ou conectar com chaves próprias.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveAIConfig} className="space-y-5">
          {/* Provider Radio Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label
              className={`flex flex-col p-4 rounded-2xl border cursor-pointer transition-all ${
                provider === 'mock'
                  ? 'border-brand-500 bg-brand-50/80 dark:bg-brand-950/40 text-brand-900 dark:text-brand-100 ring-2 ring-brand-500/20'
                  : 'border-surface-200 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/40 text-surface-700 dark:text-surface-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">Motor Local Inteligente</span>
                <input
                  type="radio"
                  name="provider"
                  value="mock"
                  checked={provider === 'mock'}
                  onChange={() => setProvider('mock')}
                  className="accent-brand-600"
                />
              </div>
              <p className="text-[11px] text-surface-500 mt-2">
                100% gratuito e pronto para uso. Não exige chave externa.
              </p>
            </label>

            <label
              className={`flex flex-col p-4 rounded-2xl border cursor-pointer transition-all ${
                provider === 'openai'
                  ? 'border-brand-500 bg-brand-50/80 dark:bg-brand-950/40 text-brand-900 dark:text-brand-100 ring-2 ring-brand-500/20'
                  : 'border-surface-200 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/40 text-surface-700 dark:text-surface-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">OpenAI API (GPT-4o)</span>
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
                Conexão direta com a API da OpenAI usando sua API Key.
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
                <span className="text-xs font-bold">Google Gemini API</span>
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
                Suporte ao modelo Gemini 1.5 Pro / Flash.
              </p>
            </label>
          </div>

          {/* Conditional Key Fields */}
          {provider === 'openai' && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-semibold text-surface-700 dark:text-surface-300">
                  OpenAI API Key (sk-...)
                </label>
                <div className="relative mt-1">
                  <Key className="absolute left-3.5 top-2.5 h-4 w-4 text-surface-400" />
                  <input
                    type="password"
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder="sk-proj-..."
                    className="w-full rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-950 pl-10 pr-4 py-2 text-xs text-surface-900 dark:text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-surface-700 dark:text-surface-300">
                  Modelo OpenAI
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-950 px-3.5 py-2 text-xs text-surface-900 dark:text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="gpt-4o-mini">GPT-4o Mini (Rápido e Didático)</option>
                  <option value="gpt-4o">GPT-4o (Máximo Raciocínio)</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </select>
              </div>
            </div>
          )}

          {provider === 'gemini' && (
            <div className="pt-2">
              <label className="text-xs font-semibold text-surface-700 dark:text-surface-300">
                Gemini API Key
              </label>
              <div className="relative mt-1">
                <Key className="absolute left-3.5 top-2.5 h-4 w-4 text-surface-400" />
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-950 pl-10 pr-4 py-2 text-xs text-surface-900 dark:text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-brand-700 transition-colors"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Salvar Chaves de IA</span>
            </button>
          </div>
        </form>
      </div>

      {/* 🎓 2. PERFIL ACADÊMICO */}
      <div className="rounded-3xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-surface-900 dark:text-white">
              Perfil Acadêmico do Aluno
            </h2>
            <p className="text-xs text-surface-500">
              Informações utilizadas para contextualizar o nível de explicação do tutor.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-surface-700 dark:text-surface-300">
              Nome Completo
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-950 px-3.5 py-2 text-xs text-surface-900 dark:text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-surface-700 dark:text-surface-300">
              Curso Universitário
            </label>
            <input
              type="text"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="Ex: Engenharia, Direito, Medicina..."
              className="mt-1 w-full rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-950 px-3.5 py-2 text-xs text-surface-900 dark:text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-surface-700 dark:text-surface-300">
              Semestre Atual
            </label>
            <input
              type="number"
              min={1}
              max={12}
              value={semester}
              onChange={(e) => setSemester(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-950 px-3.5 py-2 text-xs text-surface-900 dark:text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-surface-700 dark:text-surface-300">
              Meta Diária de Estudos (Minutos)
            </label>
            <input
              type="number"
              min={10}
              max={300}
              step={5}
              value={studyGoal}
              onChange={(e) => setStudyGoal(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-950 px-3.5 py-2 text-xs text-surface-900 dark:text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="sm:col-span-2 flex justify-end pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-primary-700 transition-colors"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Salvar Perfil</span>
            </button>
          </div>
        </form>
      </div>

      {/* 💾 3. GESTÃO DE DADOS & BACKUP */}
      <div className="rounded-3xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-surface-900 dark:text-white flex items-center gap-2">
          <Database className="h-4 w-4 text-brand-500" />
          <span>Armazenamento Local & Backup</span>
        </h2>
        <p className="text-xs text-surface-500 leading-relaxed">
          Você pode exportar todas as suas dúvidas, notas e flashcards salvos para um arquivo JSON ou restaurar os dados de demonstração originais.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={handleExportData}
            className="inline-flex items-center gap-2 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-4 py-2 text-xs font-semibold text-surface-700 dark:text-surface-300 hover:border-brand-500 hover:text-brand-500 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Exportar Backup (JSON)</span>
          </button>

          <button
            onClick={handleResetData}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Restaurar Dados Iniciais de Teste</span>
          </button>
        </div>
      </div>

    </div>
  );
}
