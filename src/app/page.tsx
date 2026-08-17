'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  BrainCircuit, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  XCircle, 
  CheckCircle2, 
  Lightbulb, 
  Compass, 
  GitBranch, 
  Target, 
  Calculator, 
  Scale, 
  HeartPulse, 
  Code2, 
  TrendingUp, 
  Send,
  Zap,
  BookOpen,
  Award,
  Play
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MathRenderer } from '@/components/MathRenderer';
import { MOCK_SAMPLE_QUESTIONS } from '@/lib/mock-data';
import { generateTutorResponse, evaluateStudentReflection } from '@/lib/tutor-engine';
import { TutorResponse } from '@/types';

export default function LandingPage() {
  const [selectedDemoIndex, setSelectedDemoIndex] = useState(0);
  const [demoResponse, setDemoResponse] = useState<TutorResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [studentReflection, setStudentReflection] = useState('');
  const [reflectionFeedback, setReflectionFeedback] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const handleRunDemo = async (index: number) => {
    setSelectedDemoIndex(index);
    setIsGenerating(true);
    setReflectionFeedback(null);
    setStudentReflection('');

    const sample = MOCK_SAMPLE_QUESTIONS[index];
    const response = await generateTutorResponse({
      question: sample.question,
      discipline: sample.discipline,
      topic: sample.title,
    });

    setDemoResponse(response);
    setIsGenerating(false);
  };

  const handleEvaluateReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentReflection.trim() || !demoResponse) return;

    setIsEvaluating(true);
    const result = await evaluateStudentReflection(
      MOCK_SAMPLE_QUESTIONS[selectedDemoIndex].question,
      demoResponse,
      studentReflection
    );

    setReflectionFeedback(result.feedback);
    setIsEvaluating(false);

    if (result.isCorrect) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
  };

  return (
    <div className="flex flex-col gap-24 pb-20 overflow-hidden">
      
      {/* 🌟 HERO SECTION */}
      <section className="relative pt-12 sm:pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        
        {/* Floating badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 backdrop-blur-sm mb-6 animate-pulse-slow">
          <Sparkles className="h-3.5 w-3.5 text-brand-500" />
          <span>Inteligência Artificial Baseada no Método Socrático</span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-surface-900 dark:text-white max-w-4xl mx-auto leading-[1.15]">
          Não apenas copie a resposta.{' '}
          <span className="bg-gradient-to-r from-brand-600 via-emerald-500 to-primary-600 bg-clip-text text-transparent">
            Aprenda a pensar.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-lg sm:text-xl text-surface-600 dark:text-surface-300 max-w-2xl mx-auto leading-relaxed">
          O <strong>EstudaAI</strong> guia você passo a passo: do conceito à analogia prática e à dedução lógica. Você chega à resposta por conta própria — e nunca mais esquece na prova.
        </p>

        {/* Principle Quote */}
        <div className="mt-6 inline-block rounded-xl border border-surface-200 dark:border-surface-800 bg-white/60 dark:bg-surface-900/60 px-5 py-2.5 text-xs sm:text-sm text-surface-700 dark:text-surface-300 italic shadow-sm backdrop-blur-sm">
          💡 &ldquo;Depois de usar o EstudaAI, você será capaz de responder à questão sem ele.&rdquo;
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/tutor"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-primary-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:scale-105 active:scale-98 transition-all"
          >
            <BrainCircuit className="h-5 w-5" />
            <span>Experimentar Tutor IA Agora</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          
          <a
            href="#demonstracao"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-6 py-3.5 text-base font-medium text-surface-800 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          >
            <Play className="h-4 w-4 text-brand-500" />
            <span>Ver Demonstração ao Vivo</span>
          </a>
        </div>

        {/* Live Metrics Ribbon */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto border-t border-surface-200 dark:border-surface-800/80 pt-8">
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-brand-600 dark:text-brand-400">1.840+</p>
            <p className="text-xs text-surface-500 dark:text-surface-400 font-medium">Dúvidas Guiadas</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-primary-600 dark:text-primary-400">88.4%</p>
            <p className="text-xs text-surface-500 dark:text-surface-400 font-medium">Taxa de Autonomia</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-500">4 Pilares</p>
            <p className="text-xs text-surface-500 dark:text-surface-400 font-medium">Método Socrático</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-500">100%</p>
            <p className="text-xs text-surface-500 dark:text-surface-400 font-medium">Integridade Acadêmica</p>
          </div>
        </div>
      </section>

      {/* 🧪 INTERACTIVE LIVE SOCRATIC DEMO WIDGET */}
      <section id="demonstracao" className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full scroll-mt-24">
        <div className="rounded-3xl border border-surface-200 dark:border-surface-800 bg-white/80 dark:bg-surface-900/80 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-200 dark:border-surface-800 pb-6">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-bold text-brand-600 dark:text-brand-400">
                <Zap className="h-3.5 w-3.5" /> Demonstração Interativa em Tempo Real
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-surface-900 dark:text-white">
                Veja o Método Socrático em Ação
              </h2>
              <p className="text-sm text-surface-600 dark:text-surface-400">
                Escolha uma questão simulada e veja como o EstudaAI conduz o raciocínio.
              </p>
            </div>

            {/* Quick Sample Selector */}
            <div className="flex flex-wrap gap-2">
              {MOCK_SAMPLE_QUESTIONS.map((sample, idx) => (
                <button
                  key={sample.title}
                  onClick={() => handleRunDemo(idx)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    selectedDemoIndex === idx
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25 scale-105'
                      : 'bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700'
                  }`}
                >
                  {sample.discipline.split('&')[0].trim()}
                </button>
              ))}
            </div>
          </div>

          {/* Question Box */}
          <div className="mt-6 rounded-2xl bg-surface-100/70 dark:bg-surface-950/60 p-5 border border-surface-200/80 dark:border-surface-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                {MOCK_SAMPLE_QUESTIONS[selectedDemoIndex].discipline} • {MOCK_SAMPLE_QUESTIONS[selectedDemoIndex].title}
              </span>
              <span className="text-xs text-surface-500 font-medium">Entrada do Aluno</span>
            </div>
            <p className="mt-2 text-sm sm:text-base font-medium text-surface-800 dark:text-surface-100 leading-relaxed">
              &ldquo;{MOCK_SAMPLE_QUESTIONS[selectedDemoIndex].question}&rdquo;
            </p>
            
            {!demoResponse && !isGenerating && (
              <div className="mt-4">
                <button
                  onClick={() => handleRunDemo(selectedDemoIndex)}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-semibold text-white shadow hover:bg-brand-700 transition-colors"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Gerar Orientação Didática com IA</span>
                </button>
              </div>
            )}
          </div>

          {/* Socratic Output Container */}
          {isGenerating && (
            <div className="mt-8 flex flex-col items-center justify-center py-12 text-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent mb-3" />
              <p className="text-sm font-medium text-surface-600 dark:text-surface-400">
                O EstudaAI está estruturando os 4 passos pedagógicos...
              </p>
            </div>
          )}

          {demoResponse && !isGenerating && (
            <div className="mt-8 space-y-5 animate-in fade-in duration-500">
              
              {/* Anti-cheat banner if triggered */}
              {demoResponse.integrityFlagged && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-amber-500 shrink-0" />
                  <span>
                    <strong>Camada Anti-Gabarito Ativada:</strong> Como o enunciado pediu qual alternativa marcar, a IA removeu o gabarito e construiu a lógica passo a passo para você deduzir com segurança!
                  </span>
                </div>
              )}

              {/* Step 1: Conceito */}
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 dark:border-emerald-500/10">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                  <Lightbulb className="h-4 w-4" />
                  <span>1. Conceito Fundamental</span>
                </div>
                <div className="mt-2 text-sm leading-relaxed">
                  <MathRenderer content={demoResponse.concept} />
                </div>
              </div>

              {/* Step 2: Exemplo Análogo */}
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5 dark:border-blue-500/10">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm">
                  <Compass className="h-4 w-4" />
                  <span>2. Exemplo do Cotidiano (Analogia Didática)</span>
                </div>
                <div className="mt-2 text-sm leading-relaxed">
                  <MathRenderer content={demoResponse.example} />
                </div>
              </div>

              {/* Step 3: Raciocínio Guiado */}
              <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5 dark:border-purple-500/10">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-sm">
                  <GitBranch className="h-4 w-4" />
                  <span>3. Passo a Passo do Raciocínio</span>
                </div>
                <div className="mt-3 space-y-2.5 text-sm">
                  {demoResponse.stepByStep.map((step, idx) => (
                    <div key={idx} className="rounded-lg bg-white/60 dark:bg-surface-950/40 p-3 border border-surface-200/50 dark:border-surface-800/50">
                      <MathRenderer content={step} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 4: Pergunta Reflexiva + Interactive Input */}
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 dark:border-amber-500/20">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm">
                  <Target className="h-4 w-4" />
                  <span>4. Desafio Reflexivo (Conclua com seu Raciocínio)</span>
                </div>
                <div className="mt-2 text-sm font-medium text-surface-900 dark:text-white">
                  <MathRenderer content={demoResponse.reflectiveQuestion} />
                </div>

                {/* Form to submit student answer */}
                <form onSubmit={handleEvaluateReflection} className="mt-4 flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={studentReflection}
                    onChange={(e) => setStudentReflection(e.target.value)}
                    placeholder="Digite sua conclusão ou raciocínio aqui..."
                    className="flex-1 rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-950 px-4 py-2.5 text-sm text-surface-900 dark:text-white placeholder-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                  <button
                    type="submit"
                    disabled={isEvaluating || !studentReflection.trim()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-primary-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:scale-102 transition-all disabled:opacity-50"
                  >
                    {isEvaluating ? 'Avaliando...' : 'Validar Resposta'}
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>

                {/* Evaluation Feedback */}
                {reflectionFeedback && (
                  <div className="mt-4 rounded-xl bg-white dark:bg-surface-900 p-4 border border-brand-500/30 text-xs sm:text-sm leading-relaxed text-surface-800 dark:text-surface-200 animate-in fade-in">
                    <MathRenderer content={reflectionFeedback} />
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </section>

      {/* ⚖️ COMPARISON: BOT DE COLA vs ESTUDAAI */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest">
            Integridade & Pedagogia
          </span>
          <h2 className="mt-2 text-3xl font-extrabold text-surface-900 dark:text-white">
            Por que o EstudaAI é diferente de um ChatGPT comum?
          </h2>
          <p className="mt-3 text-sm text-surface-600 dark:text-surface-400">
            Enquanto outros bots viram atalhos de cola que prejudicam a formação acadêmica, o EstudaAI é construído para desenvolver o pensamento crítico.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Bad bot */}
          <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-6 sm:p-8 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-500">
                <XCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-surface-900 dark:text-white">Bot Tradicional / Cola Fácil</h3>
                <p className="text-xs text-surface-500">O aluno passa na prova, mas zera no mercado</p>
              </div>
            </div>

            <ul className="mt-6 space-y-3.5 text-xs sm:text-sm text-surface-700 dark:text-surface-300">
              <li className="flex items-start gap-2.5">
                <span className="text-rose-500 font-bold mt-0.5">✕</span>
                <span>Entrega a alternativa "Letra C" diretamente sem estimular reflexão.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-rose-500 font-bold mt-0.5">✕</span>
                <span>Cria dependência cognitiva: o aluno não sabe resolver sem o bot.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-rose-500 font-bold mt-0.5">✕</span>
                <span>Sem conexão com a ementa ou progressão pedagógica.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-rose-500 font-bold mt-0.5">✕</span>
                <span>Vulnerável a alucinações sem verificação de etapas lógicas.</span>
              </li>
            </ul>
          </div>

          {/* EstudaAI Socrático */}
          <div className="rounded-3xl border border-brand-500/40 bg-gradient-to-b from-brand-500/10 to-transparent p-6 sm:p-8 shadow-xl shadow-brand-500/5 relative">
            <div className="absolute top-4 right-4">
              <span className="rounded-full bg-brand-500 px-3 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">
                Recomendado
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/20 text-brand-600 dark:text-brand-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-surface-900 dark:text-white">EstudaAI — Tutor Socrático</h3>
                <p className="text-xs text-brand-600 dark:text-brand-400 font-medium">Aprendizado genuíno e retenção duradoura</p>
              </div>
            </div>

            <ul className="mt-6 space-y-3.5 text-xs sm:text-sm text-surface-700 dark:text-surface-300">
              <li className="flex items-start gap-2.5">
                <span className="text-brand-500 font-bold mt-0.5">✓</span>
                <span><strong>Camada de Integridade:</strong> Bloqueia gabaritos prontos e ensina o método de dedução.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-brand-500 font-bold mt-0.5">✓</span>
                <span><strong>4 Pilares Didáticos:</strong> Conceito, analogia simples, passos e pergunta reflexiva.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-brand-500 font-bold mt-0.5">✓</span>
                <span><strong>Biblioteca de Flashcards & Simulados:</strong> Transforma dúvidas em cartões de revisão ativa.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-brand-500 font-bold mt-0.5">✓</span>
                <span><strong>Painel de Métricas:</strong> Professores e gestores acompanham o ganho real de autonomia.</span>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* 🧩 OS 4 PILARES PEDAGÓGICOS */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest">
            A Metodologia
          </span>
          <h2 className="mt-2 text-3xl font-extrabold text-surface-900 dark:text-white">
            Como a IA ensina você a dominar qualquer disciplina
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6 hover:border-brand-500/50 transition-all hover:scale-102">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 mb-4">
              <Lightbulb className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-surface-900 dark:text-white text-base">1. Conceito Chave</h3>
            <p className="mt-2 text-xs text-surface-600 dark:text-surface-400 leading-relaxed">
              Explicação direta e livre de enrolação das leis, teorias e definições centrais do tema.
            </p>
          </div>

          <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6 hover:border-brand-500/50 transition-all hover:scale-102">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 mb-4">
              <Compass className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-surface-900 dark:text-white text-base">2. Exemplo Análogo</h3>
            <p className="mt-2 text-xs text-surface-600 dark:text-surface-400 leading-relaxed">
              Uma metáfora do mundo real para você criar âncoras mentais e fixar o conhecimento intuitivo.
            </p>
          </div>

          <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6 hover:border-brand-500/50 transition-all hover:scale-102">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 mb-4">
              <GitBranch className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-surface-900 dark:text-white text-base">3. Raciocínio Guiado</h3>
            <p className="mt-2 text-xs text-surface-600 dark:text-surface-400 leading-relaxed">
              Decomposição da lógica em passos organizados, mostrando como conectar os dados à resolução.
            </p>
          </div>

          <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6 hover:border-brand-500/50 transition-all hover:scale-102">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 mb-4">
              <Target className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-surface-900 dark:text-white text-base">4. Pergunta Reflexiva</h3>
            <p className="mt-2 text-xs text-surface-600 dark:text-surface-400 leading-relaxed">
              Um desafio final para o aluno aplicar o raciocínio construído e validar sua própria compreensão.
            </p>
          </div>

        </div>
      </section>

      {/* 📚 DISCIPLINAS E PERSONAS SUPORTADAS */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest">
            Todas as Áreas
          </span>
          <h2 className="mt-2 text-3xl font-extrabold text-surface-900 dark:text-white">
            Personas de Tutores Especializados
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white/70 dark:bg-surface-900/70 p-5 flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <Calculator className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-surface-900 dark:text-white text-sm">Exatas & Engenharias</h4>
              <p className="text-xs text-surface-500 mt-1">Cálculo, Física, Álgebra Linear e Resistência dos Materiais.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white/70 dark:bg-surface-900/70 p-5 flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <Scale className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-surface-900 dark:text-white text-sm">Ciências Jurídicas</h4>
              <p className="text-xs text-surface-500 mt-1">Direito Penal, Civil, Constitucional, Processual e Tributário.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white/70 dark:bg-surface-900/70 p-5 flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <HeartPulse className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-surface-900 dark:text-white text-sm">Saúde & Biológicas</h4>
              <p className="text-xs text-surface-500 mt-1">Anatomia, Fisiologia, Farmacologia, Bioquímica e Enfermagem.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white/70 dark:bg-surface-900/70 p-5 flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
              <Code2 className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-surface-900 dark:text-white text-sm">Tecnologia & Dev</h4>
              <p className="text-xs text-surface-500 mt-1">Algoritmos, Estrutura de Dados, Banco de Dados e Redes.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white/70 dark:bg-surface-900/70 p-5 flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-surface-900 dark:text-white text-sm">Gestão & Finanças</h4>
              <p className="text-xs text-surface-500 mt-1">Administração, Economia, Contabilidade, Marketing e Logística.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white/70 dark:bg-surface-900/70 p-5 flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-surface-900 dark:text-white text-sm">ENADE & Provas Oficiais</h4>
              <p className="text-xs text-surface-500 mt-1">Questões discursivas e de múltipla escolha no padrão avaliativo.</p>
            </div>
          </div>

        </div>
      </section>

      {/* 🚀 FINAL CTA BANNER */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="rounded-3xl bg-gradient-to-r from-brand-600 via-emerald-600 to-primary-600 p-8 sm:p-12 text-center text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Pronto para transformar sua rotina de estudos?
            </h2>
            <p className="mt-4 text-brand-100 text-sm sm:text-base leading-relaxed">
              Comece agora mesmo a tirar suas dúvidas com o tutor socrático, crie flashcards com 1 clique e acompanhe seu crescimento cognitivo.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/tutor"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-bold text-brand-700 shadow hover:bg-brand-50 hover:scale-105 transition-all"
              >
                <BrainCircuit className="h-5 w-5" />
                <span>Abrir Tutor IA Grátis</span>
              </Link>
              <Link
                href="/biblioteca"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/10 px-6 py-3.5 text-base font-medium text-white hover:bg-white/20 transition-colors"
              >
                <BookOpen className="h-5 w-5" />
                <span>Explorar Flashcards & Simulados</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
