'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  Send, 
  Lightbulb, 
  Compass, 
  GitBranch, 
  Target, 
  BookmarkPlus, 
  CheckCircle, 
  ShieldCheck, 
  MessageSquare, 
  RotateCcw, 
  Flame, 
  BookOpen, 
  Share2,
  Check,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MathRenderer } from '@/components/MathRenderer';
import { IntegrityAlert } from '@/components/IntegrityAlert';
import { 
  getTutorPersonas, 
  getCurrentUser, 
  saveStudySession, 
  saveFlashcard, 
  recordIntegrityIntervention,
  getStudySessions 
} from '@/lib/storage';
import { generateTutorResponse, evaluateStudentReflection } from '@/lib/tutor-engine';
import { TutorPersona, TutorResponse, StudySession, User, ChatMessage } from '@/types';
import { SAMPLE_QUESTIONS } from '@/lib/personas';

export default function TutorPage() {
  const [user, setUser] = useState<User | null>(null);
  const [personas, setPersonas] = useState<TutorPersona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<TutorPersona | null>(null);
  
  const [question, setQuestion] = useState('');
  const [customDiscipline, setCustomDiscipline] = useState('');
  const [difficulty, setDifficulty] = useState<'iniciante' | 'intermediario' | 'avancado'>('intermediario');
  
  const [isLoading, setIsLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<TutorResponse | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  // Resposta reflexiva do aluno
  const [studentAnswer, setStudentAnswer] = useState('');
  const [isEvaluatingAnswer, setIsEvaluatingAnswer] = useState(false);
  const [evaluationFeedback, setEvaluationFeedback] = useState<string | null>(null);
  const [isMastered, setIsMastered] = useState(false);

  // Chat de acompanhamento socrático
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Notificações / Toasts
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [recentSessions, setRecentSessions] = useState<StudySession[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUser(getCurrentUser());
    const loadedPersonas = getTutorPersonas();
    setPersonas(loadedPersonas);
    if (loadedPersonas.length > 0) {
      setSelectedPersona(loadedPersonas[0]);
    }
    setRecentSessions(getStudySessions().slice(0, 5));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAskTutor = async (e?: React.FormEvent, customQ?: string) => {
    if (e) e.preventDefault();
    const queryText = customQ || question;
    if (!queryText.trim()) return;

    setIsLoading(true);
    setEvaluationFeedback(null);
    setStudentAnswer('');
    setIsMastered(false);
    setChatMessages([]);

    const disciplineName = selectedPersona ? selectedPersona.discipline : (customDiscipline || 'Geral');

    try {
      const response = await generateTutorResponse({
        question: queryText,
        discipline: disciplineName,
        difficulty,
        persona: selectedPersona || undefined
      });

      setCurrentResponse(response);

      // Registra intervenção de integridade se ativada
      if (response.integrityFlagged && user) {
        recordIntegrityIntervention(user.name, disciplineName, queryText);
      }

      // Cria sessão salva
      const newSession: StudySession = {
        id: `sess-${Date.now()}`,
        userId: user?.id || 'anon',
        discipline: disciplineName,
        topic: response.topic,
        question: queryText,
        difficulty,
        response,
        messages: [],
        isMastered: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setActiveSessionId(newSession.id);
      saveStudySession(newSession);
      setRecentSessions(getStudySessions().slice(0, 5));

    } catch (err) {
      console.error(err);
      showToast('Erro ao processar tutoria. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEvaluateStudentAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentAnswer.trim() || !currentResponse) return;

    setIsEvaluatingAnswer(true);
    const result = await evaluateStudentReflection(question, currentResponse, studentAnswer);

    setEvaluationFeedback(result.feedback);
    setIsEvaluatingAnswer(false);

    if (result.isCorrect) {
      setIsMastered(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      showToast('🎉 Parabéns! Conceito dominado com sucesso.');

      // Atualiza a sessão
      if (activeSessionId) {
        const sessions = getStudySessions();
        const s = sessions.find(item => item.id === activeSessionId);
        if (s) {
          s.studentAnswer = studentAnswer;
          s.studentAnswerEvaluated = true;
          s.studentAnswerFeedback = result.feedback;
          s.isMastered = true;
          saveStudySession(s);
        }
      }
    }
  };

  const handleSendFollowUpChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !currentResponse) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    const inputClean = chatInput;
    setChatInput('');
    setIsSendingChat(true);

    // Resposta socrática de follow-up
    setTimeout(() => {
      let replyContent = `Excelente dúvida sobre **${inputClean}**! `;
      if (inputClean.toLowerCase().includes('por que') || inputClean.toLowerCase().includes('pq')) {
        replyContent += `Observe que a razão fundamental reside na conexão entre a Etapa 1 e a Etapa 2 que analisamos: quando o elemento varia, o sistema responde ajustando a taxa de equilíbrio.`;
      } else {
        replyContent += `Vamos pensar juntos: se alterarmos essa condição que você mencionou, qual seria o impacto no resultado intermediário da Etapa 3? Tente visualizar mentalmente antes de prosseguir!`;
      }

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: replyContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages(prev => [...prev, assistantMsg]);
      setIsSendingChat(false);
    }, 650);
  };

  const handleCreateFlashcardFromDoubt = () => {
    if (!currentResponse || !user) return;

    const newCard = {
      id: `fc-${Date.now()}`,
      userId: user.id,
      discipline: currentResponse.discipline,
      topic: currentResponse.topic,
      front: `[${currentResponse.discipline}] ${currentResponse.topic}:\nComo estruturar o raciocínio para responder: "${question.slice(0, 100)}..."?`,
      back: `💡 Conceito Chave: ${currentResponse.concept}\n\n🪜 Passo Lógico Central: ${currentResponse.stepByStep[0] || ''}`,
      mastered: false,
      createdAt: new Date().toISOString(),
      reviewCount: 0
    };

    saveFlashcard(newCard);
    showToast('✨ Flashcard adicionado à sua Biblioteca de Estudos!');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-surface-900 text-white dark:bg-white dark:text-surface-950 px-5 py-3 shadow-2xl border border-surface-700/30 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <Sparkles className="h-4 w-4 text-brand-400" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-200 dark:border-surface-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-surface-900 dark:text-white">
                Núcleo de Tutoria Socrática
              </h1>
              <p className="text-xs sm:text-sm text-surface-600 dark:text-surface-400">
                Cole sua dúvida ou questão de avaliação. A IA guiará seu raciocínio passo a passo.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Integrity Pill */}
        <div className="flex items-center gap-2 rounded-xl bg-surface-100 dark:bg-surface-900 px-3.5 py-2 border border-surface-200 dark:border-surface-800 text-xs font-medium text-surface-700 dark:text-surface-300">
          <ShieldCheck className="h-4 w-4 text-brand-500" />
          <span>Modo Anti-Gabarito Ativo</span>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Input & Controls (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* 1. Persona Selection */}
          <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white/70 dark:bg-surface-900/70 p-5 backdrop-blur-sm shadow-sm">
            <label className="text-xs font-bold uppercase tracking-wider text-surface-600 dark:text-surface-400">
              1. Selecione o Tutor Especialista
            </label>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {personas.map((p) => {
                const isSelected = selectedPersona?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedPersona(p);
                      setCustomDiscipline('');
                    }}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/80 dark:bg-brand-950/40 text-brand-900 dark:text-brand-100 ring-2 ring-brand-500/20'
                        : 'border-surface-200 dark:border-surface-800 hover:bg-surface-100 dark:hover:bg-surface-800/60 text-surface-700 dark:text-surface-300'
                    }`}
                  >
                    <span className="text-xs font-bold truncate w-full">{p.name.replace('Tutor de ', '')}</span>
                    <span className="text-[10px] text-surface-500 truncate w-full mt-0.5">{p.discipline}</span>
                  </button>
                );
              })}
            </div>

            {/* Difficulty Slider / Buttons */}
            <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-800/80 flex items-center justify-between">
              <span className="text-xs text-surface-600 dark:text-surface-400 font-medium">Nível de Profundidade:</span>
              <div className="flex gap-1">
                {(['iniciante', 'intermediario', 'avancado'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setDifficulty(lvl)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition-all ${
                      difficulty === lvl
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200'
                    }`}
                  >
                    {lvl === 'iniciante' ? 'Básico' : lvl === 'intermediario' ? 'Médio' : 'Avançado'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Dúvida / Enunciado Input */}
          <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white/70 dark:bg-surface-900/70 p-5 backdrop-blur-sm shadow-sm">
            <form onSubmit={(e) => handleAskTutor(e)}>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-surface-600 dark:text-surface-400">
                  2. Cole ou Digite sua Dúvida
                </label>
                <span className="text-[10px] text-surface-500">Suporta fórmulas LaTeX</span>
              </div>

              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Exemplo: Em uma questão de cálculo, preciso encontrar a derivada de f(x) = (3x² + 5x)⁴. Como aplico a regra da cadeia e qual o raciocínio passo a passo?"
                rows={5}
                className="mt-3 w-full rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-950 p-3.5 text-sm text-surface-900 dark:text-white placeholder-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 leading-relaxed resize-none"
              />

              {/* Sample Questions to click */}
              <div className="mt-3">
                <p className="text-[11px] font-semibold text-surface-500 mb-1.5 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-brand-500" /> Exemplos rápidos para testar:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setQuestion('Qual a alternativa correta entre A e B na derivada de f(x) = (3x² + 5x)⁴? Só me dê a letra da resposta!');
                      handleAskTutor(undefined, 'Qual a alternativa correta entre A e B na derivada de f(x) = (3x² + 5x)⁴? Só me dê a letra da resposta!');
                    }}
                    className="rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-1 text-[11px] font-medium border border-amber-500/20 transition-colors text-left"
                    title="Testa o bloqueio anti-cola com aviso amigável"
                  >
                    🚨 Testar Bloqueio Anti-Cola ("qual a letra?")
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQuestion('Como diferenciar Dolo Eventual de Culpa Consciente no trânsito?');
                      handleAskTutor(undefined, 'Como diferenciar Dolo Eventual de Culpa Consciente no trânsito?');
                    }}
                    className="rounded-lg bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 px-2 py-1 text-[11px] font-medium transition-colors"
                  >
                    ⚖️ Dolo vs Culpa
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQuestion('Por que inibidores da ECA causam tosse seca em alguns pacientes?');
                      handleAskTutor(undefined, 'Por que inibidores da ECA causam tosse seca em alguns pacientes?');
                    }}
                    className="rounded-lg bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 px-2 py-1 text-[11px] font-medium transition-colors"
                  >
                    🩺 Farmacologia ECA
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !question.trim()}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-primary-600 py-3 text-sm font-bold text-white shadow-md shadow-brand-500/20 hover:shadow-brand-500/35 hover:scale-101 active:scale-98 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Estruturando Orientação Pedagógica...</span>
                  </>
                ) : (
                  <>
                    <BrainCircuit className="h-4 w-4" />
                    <span>Pedir Orientação Didática</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Recent Sessions widget */}
          {recentSessions.length > 0 && (
            <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white/70 dark:bg-surface-900/70 p-5 backdrop-blur-sm shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-surface-600 dark:text-surface-400 flex items-center justify-between">
                <span>Histórico Recente de Dúvidas</span>
                <BookOpen className="h-3.5 w-3.5 text-brand-500" />
              </h3>
              <div className="mt-3 space-y-2">
                {recentSessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setQuestion(s.question);
                      setCurrentResponse(s.response);
                      setActiveSessionId(s.id);
                      setIsMastered(s.isMastered);
                      setEvaluationFeedback(s.studentAnswerFeedback || null);
                    }}
                    className="w-full rounded-xl bg-surface-50 dark:bg-surface-950/60 p-2.5 border border-surface-200/60 dark:border-surface-800/60 text-left hover:border-brand-500/40 transition-colors flex items-center justify-between group"
                  >
                    <div className="truncate pr-2">
                      <p className="text-xs font-semibold text-surface-900 dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-brand-400">
                        {s.topic}
                      </p>
                      <p className="text-[10px] text-surface-500 truncate">{s.discipline}</p>
                    </div>
                    {s.isMastered ? (
                      <span className="rounded-full bg-emerald-500/10 text-emerald-500 p-1">
                        <Check className="h-3 w-3" />
                      </span>
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-surface-400 group-hover:translate-x-0.5 transition-transform" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Socratic Response Display (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {!currentResponse && !isLoading && (
            <div className="rounded-3xl border border-dashed border-surface-300 dark:border-surface-800 p-12 text-center flex flex-col items-center justify-center min-h-[450px]">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 mb-4 animate-bounce">
                <BrainCircuit className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-surface-900 dark:text-white">
                Seu Tutor Socrático está pronto
              </h3>
              <p className="mt-2 text-sm text-surface-600 dark:text-surface-400 max-w-md leading-relaxed">
                Digite sua dúvida ao lado ou clique em um dos exemplos rápidos para ver a estruturação pedagógica em 4 etapas: Conceito, Exemplo, Raciocínio e Pergunta Reflexiva.
              </p>
            </div>
          )}

          {isLoading && (
            <div className="rounded-3xl border border-surface-200 dark:border-surface-800 bg-white/60 dark:bg-surface-900/60 p-12 text-center flex flex-col items-center justify-center min-h-[450px]">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-500 border-t-transparent mb-4" />
              <h3 className="text-base font-bold text-surface-900 dark:text-white">
                Processando Raciocínio Didático
              </h3>
              <p className="mt-1 text-xs text-surface-500">
                Isolando variáveis, formulando analogia e aplicando camada anti-gabarito...
              </p>
            </div>
          )}

          {currentResponse && !isLoading && (
            <div className="space-y-6 animate-in fade-in duration-500">
              
              {/* Integrity Notification Banner if triggered */}
              {currentResponse.integrityFlagged && (
                <IntegrityAlert note={currentResponse.integrityNote} />
              )}

              {/* Action Ribbon: Subject badge + Add to Flashcard */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface-100/70 dark:bg-surface-900/70 p-3.5 border border-surface-200 dark:border-surface-800">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-brand-500/15 px-2.5 py-1 text-xs font-bold text-brand-600 dark:text-brand-400">
                    {currentResponse.discipline}
                  </span>
                  <span className="text-xs font-semibold text-surface-700 dark:text-surface-300">
                    {currentResponse.topic}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCreateFlashcardFromDoubt}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white dark:bg-surface-800 px-3 py-1.5 text-xs font-semibold text-surface-800 dark:text-surface-200 hover:text-brand-600 dark:hover:text-brand-400 border border-surface-200 dark:border-surface-700 shadow-sm transition-colors"
                  >
                    <BookmarkPlus className="h-3.5 w-3.5 text-brand-500" />
                    <span>Gerar Flashcard</span>
                  </button>
                  {isMastered && (
                    <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Dominado</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Card 1: 💡 Conceito Fundamental */}
              <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-6 dark:border-emerald-500/15 shadow-sm">
                <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20">
                    <Lightbulb className="h-4 w-4" />
                  </div>
                  <span>1. Conceito Fundamental</span>
                </div>
                <div className="mt-3 text-sm leading-relaxed">
                  <MathRenderer content={currentResponse.concept} />
                </div>
              </div>

              {/* Card 2: 🔍 Exemplo do Cotidiano (Analogia) */}
              <div className="rounded-3xl border border-blue-500/30 bg-blue-500/5 p-6 dark:border-blue-500/15 shadow-sm">
                <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400 font-bold text-sm">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/20">
                    <Compass className="h-4 w-4" />
                  </div>
                  <span>2. Analogia Prática do Mundo Real</span>
                </div>
                <div className="mt-3 text-sm leading-relaxed">
                  <MathRenderer content={currentResponse.example} />
                </div>
              </div>

              {/* Card 3: 🪜 Passo a Passo do Raciocínio */}
              <div className="rounded-3xl border border-purple-500/30 bg-purple-500/5 p-6 dark:border-purple-500/15 shadow-sm">
                <div className="flex items-center gap-2.5 text-purple-600 dark:text-purple-400 font-bold text-sm">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/20">
                    <GitBranch className="h-4 w-4" />
                  </div>
                  <span>3. Passo a Passo do Raciocínio Lógico</span>
                </div>
                <div className="mt-4 space-y-3">
                  {currentResponse.stepByStep.map((step, idx) => (
                    <div key={idx} className="rounded-xl bg-white/70 dark:bg-surface-950/60 p-3.5 border border-surface-200/60 dark:border-surface-800/60 text-sm">
                      <MathRenderer content={step} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 4: 🎯 Desafio & Pergunta Reflexiva (Com campo de resposta interativo) */}
              <div className="rounded-3xl border border-amber-500/40 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent p-6 shadow-md">
                <div className="flex items-center gap-2.5 text-amber-700 dark:text-amber-400 font-bold text-sm">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20">
                    <Target className="h-4 w-4" />
                  </div>
                  <span>4. Desafio Reflexivo — Chegue à Conclusão por Conta Própria</span>
                </div>

                <div className="mt-3 text-sm font-semibold text-surface-900 dark:text-white leading-relaxed">
                  <MathRenderer content={currentResponse.reflectiveQuestion} />
                </div>

                {/* Input de resposta do aluno */}
                <form onSubmit={handleEvaluateStudentAnswer} className="mt-5 space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={studentAnswer}
                      onChange={(e) => setStudentAnswer(e.target.value)}
                      placeholder="Explique sua resposta ou conclusão com suas próprias palavras..."
                      className="w-full rounded-2xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-950 px-4 py-3.5 pr-28 text-sm text-surface-900 dark:text-white placeholder-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                    <button
                      type="submit"
                      disabled={isEvaluatingAnswer || !studentAnswer.trim()}
                      className="absolute right-2 top-2 bottom-2 rounded-xl bg-brand-600 px-4 text-xs font-bold text-white shadow hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                    >
                      {isEvaluatingAnswer ? 'Validando...' : 'Concluir'}
                      <Send className="h-3 w-3" />
                    </button>
                  </div>
                </form>

                {/* Feedback da validação */}
                {evaluationFeedback && (
                  <div className={`mt-4 rounded-2xl p-4 text-sm leading-relaxed border animate-in fade-in ${
                    isMastered
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                  }`}>
                    <MathRenderer content={evaluationFeedback} />
                  </div>
                )}
              </div>

              {/* Socratic Follow-up Chat */}
              <div className="rounded-3xl border border-surface-200 dark:border-surface-800 bg-white/70 dark:bg-surface-900/70 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between border-b border-surface-200 dark:border-surface-800 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-surface-600 dark:text-surface-400 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-brand-500" />
                    <span>Diálogo de Tutoria Contínuo</span>
                  </h3>
                  <span className="text-[10px] text-surface-500">Tire dúvidas pontuais sobre as etapas</span>
                </div>

                {/* Messages list */}
                <div className="mt-4 max-h-60 overflow-y-auto space-y-3 pr-1">
                  {chatMessages.length === 0 && (
                    <p className="text-xs text-surface-500 italic py-2">
                      Ficou com alguma dúvida no passo a passo ou na analogia? Envie sua pergunta abaixo para aprofundar.
                    </p>
                  )}
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`rounded-2xl px-4 py-2.5 text-xs max-w-[85%] leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-brand-600 text-white rounded-br-none'
                          : 'bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white rounded-bl-none'
                      }`}>
                        <MathRenderer content={msg.content} />
                      </div>
                      <span className="text-[9px] text-surface-400 mt-1 px-1">{msg.timestamp}</span>
                    </div>
                  ))}
                  {isSendingChat && (
                    <div className="flex items-center gap-2 text-xs text-surface-500 italic">
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                      <span>Tutor elaborando reflexão...</span>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Follow-up suggestions chips */}
                {currentResponse.followUpSuggestions?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-surface-200/60 dark:border-surface-800/60 flex flex-wrap gap-1.5">
                    {currentResponse.followUpSuggestions.map((sug, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setChatInput(sug);
                        }}
                        className="rounded-lg bg-surface-100 dark:bg-surface-800 hover:bg-brand-50 dark:hover:bg-brand-950/40 text-surface-600 dark:text-surface-400 hover:text-brand-600 dark:hover:text-brand-400 px-2.5 py-1 text-[11px] transition-colors text-left"
                      >
                        💬 {sug}
                      </button>
                    ))}
                  </div>
                )}

                {/* Chat input box */}
                <form onSubmit={handleSendFollowUpChat} className="mt-4 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Pergunte ao tutor sobre esta questão..."
                    className="flex-1 rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-950 px-3.5 py-2 text-xs text-surface-900 dark:text-white placeholder-surface-400 focus:border-brand-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isSendingChat || !chatInput.trim()}
                    className="rounded-xl bg-surface-900 text-white dark:bg-white dark:text-surface-900 px-4 py-2 text-xs font-semibold shadow hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    Enviar
                  </button>
                </form>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
