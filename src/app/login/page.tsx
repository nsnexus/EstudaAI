'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  CheckCircle2,
  Zap,
  Loader2
} from 'lucide-react';
import { loginUser, registerUser, syncPortalData } from '@/lib/storage';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'portal' | 'login' | 'register'>('portal');
  
  // Portal Connect Form State
  const [instituicao, setInstituicao] = useState('Anhanguera');
  const [cpfMatricula, setCpfMatricula] = useState('');
  const [senhaPortal, setSenhaPortal] = useState('');
  const [syncStep, setSyncStep] = useState<number>(0);
  const [syncStepText, setSyncStepText] = useState<string>('');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regCourse, setRegCourse] = useState('Direito');
  const [regSemester, setRegSemester] = useState(5);
  
  // UI states
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePortalConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!cpfMatricula.trim() || !senhaPortal.trim()) {
      setError('Por favor, digite seu CPF/Matrícula e a senha do Portal do Aluno.');
      return;
    }

    setIsLoading(true);
    setSyncStep(1);
    setSyncStepText(`1. Conectando aos servidores seguros da ${instituicao}...`);

    try {
      setTimeout(() => {
        setSyncStep(2);
        setSyncStepText('2. Autenticando credenciais no AVA KLS...');
      }, 700);

      setTimeout(() => {
        setSyncStep(3);
        setSyncStepText('3. Mapeando disciplinas matriculadas e unidades...');
      }, 1400);

      setTimeout(() => {
        setSyncStep(4);
        setSyncStepText('4. Identificando avaliações e atividades pendentes...');
      }, 2100);

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
        setIsLoading(false);
        if (data.success) {
          setSyncStep(5);
          setSyncStepText(`✅ ${data.totalDisciplinas} disciplinas mapeadas com sucesso!`);
          
          // Salva dados no storage
          syncPortalData(data.aluno, data.disciplinas);
          
          setSuccessMsg(`Bem-vindo(a), ${data.aluno.name}! Redirecionando para seu painel...`);
          setTimeout(() => router.push('/disciplinas'), 900);
        } else {
          setSyncStep(0);
          setError(data.error || 'Erro ao conectar ao portal.');
        }
      }, 2800);

    } catch (err) {
      setIsLoading(false);
      setSyncStep(0);
      setError('Falha ao conectar com o servidor. Tente novamente.');
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError('Por favor, informe seu e-mail.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = loginUser(email, password);
      setIsLoading(false);
      if (res.success) {
        setSuccessMsg(`Bem-vindo(a), ${res.user?.name}! Redirecionando...`);
        setTimeout(() => router.push('/disciplinas'), 600);
      } else {
        setError(res.error || 'Erro ao realizar login.');
      }
    }, 400);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!regName || !regEmail) {
      setError('Preencha nome e e-mail.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = registerUser(regName, regEmail, regCourse, regSemester, 'aluno');
      setIsLoading(false);
      if (res.success) {
        setSuccessMsg(`Conta criada com sucesso! Bem-vindo(a), ${res.user?.name}!`);
        setTimeout(() => router.push('/disciplinas'), 600);
      } else {
        setError(res.error || 'Erro ao criar conta.');
      }
    }, 400);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-brand-500/10 dark:bg-brand-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-primary-500/10 dark:bg-primary-500/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2.5 group mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-primary-600 text-white shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform">
              <GraduationCap className="h-7 w-7" />
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 dark:text-white tracking-tight">
            Acesse o <span className="text-brand-600 dark:text-brand-400">EstudaAI</span>
          </h1>
          <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-400 mt-1">
            Conecte seu portal acadêmico ou entre com sua conta de estudos
          </p>
        </div>

        {/* Auth Card */}
        <div className="rounded-3xl border border-surface-200 dark:border-surface-800 bg-white/85 dark:bg-surface-900/85 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-surface-950/5">
          
          {/* Tabs */}
          <div className="flex rounded-xl bg-surface-100 dark:bg-surface-800/60 p-1 mb-6 text-xs font-semibold">
            <button
              onClick={() => { setTab('portal'); setError(null); }}
              className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                tab === 'portal'
                  ? 'bg-gradient-to-r from-brand-600 to-primary-600 text-white shadow-md shadow-brand-500/20 font-bold'
                  : 'text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-white'
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Conectar Portal</span>
            </button>
            <button
              onClick={() => { setTab('login'); setError(null); }}
              className={`flex-1 py-2.5 rounded-lg transition-all ${
                tab === 'login'
                  ? 'bg-white dark:bg-surface-900 text-surface-900 dark:text-white shadow-sm font-bold'
                  : 'text-surface-500 hover:text-surface-900 dark:hover:text-white'
              }`}
            >
              Entrar E-mail
            </button>
            <button
              onClick={() => { setTab('register'); setError(null); }}
              className={`flex-1 py-2.5 rounded-lg transition-all ${
                tab === 'register'
                  ? 'bg-white dark:bg-surface-900 text-surface-900 dark:text-white shadow-sm font-bold'
                  : 'text-surface-500 hover:text-surface-900 dark:hover:text-white'
              }`}
            >
              Cadastrar
            </button>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs sm:text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 animate-pulse">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: CONECTAR PORTAL ACADÊMICO (ANHANGUERA / UNOPAR / PITÁGORAS) */}
          {tab === 'portal' && (
            <form onSubmit={handlePortalConnectSubmit} className="space-y-4">
              
              {/* Institution Selector */}
              <div>
                <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider mb-1.5">
                  Instituição de Ensino
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'Anhanguera', label: 'Anhanguera', color: 'border-amber-500/40 bg-amber-500/5 text-amber-600 dark:text-amber-400' },
                    { id: 'Unopar', label: 'Unopar', color: 'border-blue-500/40 bg-blue-500/5 text-blue-600 dark:text-blue-400' },
                    { id: 'Pitágoras', label: 'Pitágoras', color: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400' },
                    { id: 'Kroton', label: 'Ampli / Fama', color: 'border-purple-500/40 bg-purple-500/5 text-purple-600 dark:text-purple-400' }
                  ].map((inst) => (
                    <button
                      type="button"
                      key={inst.id}
                      onClick={() => setInstituicao(inst.id)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold text-left transition-all ${
                        instituicao === inst.id
                          ? `${inst.color} ring-2 ring-brand-500/30 font-extrabold shadow-sm`
                          : 'border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800'
                      }`}
                    >
                      {instituicao === inst.id ? '✓ ' : ''}{inst.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* CPF / Matrícula */}
              <div>
                <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider mb-1.5">
                  CPF ou Matrícula do Aluno
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                  <input
                    type="text"
                    value={cpfMatricula}
                    onChange={(e) => setCpfMatricula(e.target.value)}
                    placeholder="Ex: 015.432.300-00 ou Matrícula"
                    disabled={isLoading}
                    className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/50 pl-10 pr-4 py-2.5 text-sm text-surface-900 dark:text-white placeholder-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Senha do Portal */}
              <div>
                <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider mb-1.5">
                  Senha do Portal do Aluno (PDA / AVA)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                  <input
                    type="password"
                    value={senhaPortal}
                    onChange={(e) => setSenhaPortal(e.target.value)}
                    placeholder="••••••••••••"
                    disabled={isLoading}
                    className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/50 pl-10 pr-4 py-2.5 text-sm text-surface-900 dark:text-white placeholder-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all disabled:opacity-50"
                  />
                </div>
                <p className="text-[11px] text-surface-400 mt-1 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Conexão segura direta para mapeamento das suas disciplinas.
                </p>
              </div>

              {/* Animated Progress Steps */}
              {isLoading && (
                <div className="p-3.5 rounded-2xl bg-surface-100/80 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700 space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 text-xs font-bold text-brand-600 dark:text-brand-400">
                    <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
                    <span>Mapeando seu Portal Acadêmico...</span>
                  </div>
                  <p className="text-xs text-surface-600 dark:text-surface-300 font-medium">
                    {syncStepText}
                  </p>
                  <div className="w-full bg-surface-200 dark:bg-surface-700 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-brand-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(syncStep / 4) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-primary-600 hover:from-brand-500 hover:to-primary-500 text-white font-bold py-3 px-4 shadow-lg shadow-brand-500/25 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Mapeando Disciplinas...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 text-amber-300" />
                    <span>Conectar e Mapear Minhas Disciplinas</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: LOGIN TRADICIONAL */}
          {tab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider mb-1.5">
                  E-mail do Aluno
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.nome@aluno.anhanguera.edu.br"
                    className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/50 pl-10 pr-4 py-2.5 text-sm text-surface-900 dark:text-white placeholder-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/50 pl-10 pr-4 py-2.5 text-sm text-surface-900 dark:text-white placeholder-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-primary-600 hover:from-brand-500 hover:to-primary-500 text-white font-semibold py-3 px-4 shadow-lg shadow-brand-500/25 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? 'Conectando...' : 'Acessar Painel de Estudos'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {/* TAB 3: CADASTRO MANUAL */}
          {tab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider mb-1">
                  Nome Completo
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ex: Narciso Santos"
                    className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/50 pl-10 pr-4 py-2 text-sm text-surface-900 dark:text-white placeholder-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider mb-1">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="narciso@aluno.anhanguera.edu.br"
                    className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/50 pl-10 pr-4 py-2 text-sm text-surface-900 dark:text-white placeholder-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider mb-1">
                    Curso
                  </label>
                  <input
                    type="text"
                    value={regCourse}
                    onChange={(e) => setRegCourse(e.target.value)}
                    placeholder="Direito"
                    className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/50 px-3 py-2 text-sm text-surface-900 dark:text-white placeholder-surface-400 focus:border-brand-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider mb-1">
                    Semestre
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={regSemester}
                    onChange={(e) => setRegSemester(Number(e.target.value))}
                    className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/50 px-3 py-2 text-sm text-surface-900 dark:text-white placeholder-surface-400 focus:border-brand-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-primary-600 hover:from-brand-500 hover:to-primary-500 text-white font-semibold py-3 px-4 shadow-lg shadow-brand-500/25 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? 'Criando conta...' : 'Criar Conta e Iniciar'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
