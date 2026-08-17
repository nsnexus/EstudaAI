'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Layers, 
  CheckCircle2, 
  RotateCw, 
  Plus, 
  Trash2, 
  BrainCircuit, 
  HelpCircle, 
  Sparkles, 
  Search, 
  Filter, 
  Check, 
  X, 
  GraduationCap, 
  ArrowRight,
  Lightbulb,
  FileQuestion
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MathRenderer } from '@/components/MathRenderer';
import { 
  getFlashcards, 
  saveFlashcard, 
  toggleFlashcardMastery, 
  deleteFlashcard, 
  getStudySessions, 
  getCurrentUser 
} from '@/lib/storage';
import { INITIAL_QUIZ_QUESTIONS } from '@/lib/mock-data';
import { Flashcard, StudySession, QuizQuestion, User } from '@/types';

export default function BibliotecaPage() {
  const [activeTab, setActiveTab] = useState<'flashcards' | 'simulados' | 'historico'>('flashcards');
  const [user, setUser] = useState<User | null>(null);
  
  // Flashcards state
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [flashcardFilter, setFlashcardFilter] = useState<'todos' | 'dominados' | 'revisar'>('todos');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('todas');
  const [isNewCardModalOpen, setIsNewCardModalOpen] = useState(false);
  
  // Form para novo flashcard
  const [newDiscipline, setNewDiscipline] = useState('Cálculo & Matemática');
  const [newTopic, setNewTopic] = useState('');
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');

  // Simulados state
  const [quizQuestions] = useState<QuizQuestion[]>(INITIAL_QUIZ_QUESTIONS);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [questionId: string]: string }>({});
  const [revealedExplanations, setRevealedExplanations] = useState<{ [questionId: string]: boolean }>({});
  const [revealedHints, setRevealedHints] = useState<{ [questionId: string]: boolean }>({});

  // Histórico state
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [searchHistory, setSearchHistory] = useState('');

  useEffect(() => {
    setUser(getCurrentUser());
    setFlashcards(getFlashcards());
    setSessions(getStudySessions());

    const handleCardsChange = () => setFlashcards(getFlashcards());
    const handleSessionsChange = () => setSessions(getStudySessions());

    window.addEventListener('estudaai_flashcards_changed', handleCardsChange);
    window.addEventListener('estudaai_sessions_changed', handleSessionsChange);

    return () => {
      window.removeEventListener('estudaai_flashcards_changed', handleCardsChange);
      window.removeEventListener('estudaai_sessions_changed', handleSessionsChange);
    };
  }, []);

  // Flashcards filtrados
  const filteredCards = flashcards.filter(c => {
    if (flashcardFilter === 'dominados' && !c.mastered) return false;
    if (flashcardFilter === 'revisar' && c.mastered) return false;
    if (selectedDiscipline !== 'todas' && c.discipline !== selectedDiscipline) return false;
    return true;
  });

  const currentCard = filteredCards[activeCardIndex] || filteredCards[0];

  const handleToggleMastery = (id: string) => {
    const isNowMastered = toggleFlashcardMastery(id);
    if (isNowMastered) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
  };

  const handleDeleteCard = (id: string) => {
    deleteFlashcard(id);
    if (activeCardIndex >= filteredCards.length - 1) {
      setActiveCardIndex(Math.max(0, filteredCards.length - 2));
    }
  };

  const handleCreateFlashcard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim()) return;

    const newCard: Flashcard = {
      id: `fc-${Date.now()}`,
      userId: user?.id || 'anon',
      discipline: newDiscipline,
      topic: newTopic || 'Conceito Geral',
      front: newFront,
      back: newBack,
      mastered: false,
      createdAt: new Date().toISOString(),
      reviewCount: 0
    };

    saveFlashcard(newCard);
    setIsNewCardModalOpen(false);
    setNewFront('');
    setNewBack('');
    setNewTopic('');
  };

  const handleSelectQuizOption = (questionId: string, optionId: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionId }));
    setRevealedExplanations(prev => ({ ...prev, [questionId]: true }));

    const q = quizQuestions.find(item => item.id === questionId);
    if (q && q.correctOptionId === optionId) {
      confetti({
        particleCount: 60,
        spread: 55,
        origin: { y: 0.6 }
      });
    }
  };

  // Histórico filtrado
  const filteredSessions = sessions.filter(s => {
    if (!searchHistory.trim()) return true;
    const term = searchHistory.toLowerCase();
    return (
      s.question.toLowerCase().includes(term) ||
      s.topic.toLowerCase().includes(term) ||
      s.discipline.toLowerCase().includes(term) ||
      s.response.concept.toLowerCase().includes(term)
    );
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-200 dark:border-surface-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-surface-900 dark:text-white">
                Biblioteca & Estudo Ativo
              </h1>
              <p className="text-xs sm:text-sm text-surface-600 dark:text-surface-400">
                Fixação com Flashcards 3D, Simulados com IA e seu Caderno de Dúvidas.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center gap-1 rounded-2xl bg-surface-100 dark:bg-surface-900 p-1.5 border border-surface-200 dark:border-surface-800">
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'flashcards'
                ? 'bg-white dark:bg-surface-800 text-surface-900 dark:text-white shadow-sm'
                : 'text-surface-600 dark:text-surface-400 hover:text-surface-900'
            }`}
          >
            <Layers className="h-4 w-4 text-brand-500" />
            <span>Flashcards 3D ({flashcards.length})</span>
          </button>
          
          <button
            onClick={() => setActiveTab('simulados')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'simulados'
                ? 'bg-white dark:bg-surface-800 text-surface-900 dark:text-white shadow-sm'
                : 'text-surface-600 dark:text-surface-400 hover:text-surface-900'
            }`}
          >
            <FileQuestion className="h-4 w-4 text-primary-500" />
            <span>Simulados IA</span>
          </button>

          <button
            onClick={() => setActiveTab('historico')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'historico'
                ? 'bg-white dark:bg-surface-800 text-surface-900 dark:text-white shadow-sm'
                : 'text-surface-600 dark:text-surface-400 hover:text-surface-900'
            }`}
          >
            <GraduationCap className="h-4 w-4 text-amber-500" />
            <span>Caderno de Dúvidas ({sessions.length})</span>
          </button>
        </div>
      </div>

      {/* 🗂️ TAB 1: FLASHCARDS 3D */}
      {activeTab === 'flashcards' && (
        <div className="mt-8 space-y-6">
          
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {(['todos', 'dominados', 'revisar'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => {
                    setFlashcardFilter(filter);
                    setActiveCardIndex(0);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                    flashcardFilter === filter
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200'
                  }`}
                >
                  {filter === 'todos' ? 'Todos os Cards' : filter === 'dominados' ? '✓ Dominados' : '⚡ Preciso Rever'}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsNewCardModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-primary-600 px-4 py-2 text-xs font-bold text-white shadow hover:scale-102 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Criar Novo Flashcard</span>
            </button>
          </div>

          {/* 3D Flippable Flashcard Canvas */}
          {filteredCards.length > 0 && currentCard ? (
            <div className="max-w-2xl mx-auto flex flex-col items-center">
              
              {/* Card Index & Badge */}
              <div className="w-full flex items-center justify-between text-xs text-surface-500 mb-2 px-2">
                <span className="font-semibold">
                  Card {activeCardIndex + 1} de {filteredCards.length}
                </span>
                <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 font-bold text-brand-600 dark:text-brand-400">
                  {currentCard.discipline} • {currentCard.topic}
                </span>
              </div>

              {/* The 3D Card */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="w-full min-h-[340px] cursor-pointer rounded-3xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-8 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between relative group select-none"
              >
                {/* Header inside card */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-surface-400">
                    {isFlipped ? '💡 Verso (Conceito & Explicação)' : '❓ Frente (Pergunta / Dúvida)'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-surface-400 group-hover:text-brand-500 transition-colors flex items-center gap-1">
                      <RotateCw className="h-3 w-3" /> Clique para virar
                    </span>
                    {currentCard.mastered && (
                      <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
                        Dominado
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="py-6 my-auto text-center">
                  <div className="text-base sm:text-lg font-medium text-surface-900 dark:text-white leading-relaxed">
                    <MathRenderer content={isFlipped ? currentCard.back : currentCard.front} />
                  </div>
                </div>

                {/* Footer inside card */}
                <div className="flex items-center justify-between border-t border-surface-100 dark:border-surface-800 pt-3 text-[11px] text-surface-400">
                  <span>Revisões: {currentCard.reviewCount || 0}</span>
                  <span className="text-xs font-medium text-brand-600 dark:text-brand-400">
                    {isFlipped ? 'Pronto para avaliar?' : 'Tente lembrar antes de virar'}
                  </span>
                </div>
              </div>

              {/* Card Controls Toolbar */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setIsFlipped(false);
                    setActiveCardIndex(prev => Math.max(0, prev - 1));
                  }}
                  disabled={activeCardIndex === 0}
                  className="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 px-4 py-2 text-xs font-semibold text-surface-700 dark:text-surface-300 disabled:opacity-40 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                >
                  ← Anterior
                </button>

                <button
                  onClick={() => handleToggleMastery(currentCard.id)}
                  className={`flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold shadow transition-all ${
                    currentCard.mastered
                      ? 'bg-emerald-600 text-white'
                      : 'bg-surface-100 dark:bg-surface-800 text-surface-800 dark:text-surface-200 hover:bg-emerald-500/20'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{currentCard.mastered ? 'Marcar como Pendente' : 'Marcar como Dominado'}</span>
                </button>

                <button
                  onClick={() => handleDeleteCard(currentCard.id)}
                  className="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-2 text-surface-400 hover:text-rose-500 transition-colors"
                  title="Excluir Flashcard"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                <button
                  onClick={() => {
                    setIsFlipped(false);
                    setActiveCardIndex(prev => Math.min(filteredCards.length - 1, prev + 1));
                  }}
                  disabled={activeCardIndex === filteredCards.length - 1}
                  className="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 px-4 py-2 text-xs font-semibold text-surface-700 dark:text-surface-300 disabled:opacity-40 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                >
                  Próximo →
                </button>
              </div>

            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-surface-300 dark:border-surface-800 p-12 text-center max-w-lg mx-auto">
              <Layers className="h-10 w-10 text-surface-400 mx-auto mb-3" />
              <h3 className="font-bold text-surface-900 dark:text-white">Nenhum flashcard neste filtro</h3>
              <p className="text-xs text-surface-500 mt-1">Crie um novo cartão ou tire uma dúvida no Tutor IA para gerar automaticamente.</p>
            </div>
          )}

        </div>
      )}

      {/* 📝 TAB 2: SIMULADOS REFLEXIVOS COM IA */}
      {activeTab === 'simulados' && (
        <div className="mt-8 max-w-4xl mx-auto space-y-6">
          <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white/70 dark:bg-surface-900/70 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500">
                <FileQuestion className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-surface-900 dark:text-white">
                  Simulado Conceitual com Explicação Imediata
                </h2>
                <p className="text-xs text-surface-600 dark:text-surface-400">
                  Responda às questões e descubra imediatamente a lógica por trás de cada resposta correta.
                </p>
              </div>
            </div>
          </div>

          {/* Questions list */}
          <div className="space-y-6">
            {quizQuestions.map((quiz, qIdx) => {
              const selectedOpt = selectedAnswers[quiz.id];
              const isAnswered = Boolean(selectedOpt);
              const isCorrect = selectedOpt === quiz.correctOptionId;
              const isHintRevealed = revealedHints[quiz.id];

              return (
                <div
                  key={quiz.id}
                  className="rounded-3xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6 sm:p-8 shadow-sm space-y-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-lg bg-primary-500/10 px-2.5 py-1 text-xs font-bold text-primary-600 dark:text-primary-400">
                      Questão {qIdx + 1} • {quiz.discipline} ({quiz.topic})
                    </span>
                    <button
                      onClick={() => setRevealedHints(prev => ({ ...prev, [quiz.id]: !prev[quiz.id] }))}
                      className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Lightbulb className="h-3.5 w-3.5" />
                      <span>{isHintRevealed ? 'Ocultar Dica' : 'Ver Dica Socrática'}</span>
                    </button>
                  </div>

                  {/* Statement */}
                  <div className="text-base font-semibold text-surface-900 dark:text-white leading-relaxed">
                    <MathRenderer content={quiz.statement} />
                  </div>

                  {/* Socratic Hint if open */}
                  {isHintRevealed && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-800 dark:text-amber-200">
                      💡 <strong>Dica do Tutor:</strong> {quiz.hint}
                    </div>
                  )}

                  {/* Options */}
                  <div className="space-y-2.5">
                    {quiz.options.map((opt) => {
                      const isOptionSelected = selectedOpt === opt.id;
                      const isOptionCorrect = opt.id === quiz.correctOptionId;

                      let style = 'border-surface-200 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/60';
                      if (isAnswered) {
                        if (isOptionCorrect) {
                          style = 'border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 font-semibold';
                        } else if (isOptionSelected && !isCorrect) {
                          style = 'border-rose-500 bg-rose-500/10 text-rose-900 dark:text-rose-200';
                        } else {
                          style = 'opacity-50 border-surface-200 dark:border-surface-800';
                        }
                      }

                      return (
                        <button
                          key={opt.id}
                          disabled={isAnswered}
                          onClick={() => handleSelectQuizOption(quiz.id, opt.id)}
                          className={`w-full rounded-2xl border p-4 text-left text-sm transition-all flex items-start justify-between gap-3 ${style}`}
                        >
                          <div className="flex-1">
                            <MathRenderer content={opt.text} />
                          </div>
                          {isAnswered && isOptionCorrect && (
                            <span className="rounded-full bg-emerald-500 text-white p-1">
                              <Check className="h-3 w-3" />
                            </span>
                          )}
                          {isAnswered && isOptionSelected && !isCorrect && (
                            <span className="rounded-full bg-rose-500 text-white p-1">
                              <X className="h-3 w-3" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedback Explanation */}
                  {isAnswered && (
                    <div className={`rounded-2xl p-5 text-sm leading-relaxed border animate-in fade-in ${
                      isCorrect
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100'
                        : 'bg-surface-100 dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-800 dark:text-surface-200'
                    }`}>
                      <div className="flex items-center gap-2 font-bold mb-2">
                        {isCorrect ? (
                          <span className="text-emerald-600 dark:text-emerald-400">🎉 Resposta Correta!</span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400">💡 Compreendendo a Lógica da Questão:</span>
                        )}
                      </div>
                      <MathRenderer content={quiz.explanation} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 📖 TAB 3: CADERNO DE DÚVIDAS & HISTÓRICO */}
      {activeTab === 'historico' && (
        <div className="mt-8 max-w-4xl mx-auto space-y-6">
          
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-surface-400" />
            <input
              type="text"
              value={searchHistory}
              onChange={(e) => setSearchHistory(e.target.value)}
              placeholder="Pesquisar por disciplina, conceito ou fórmula no seu histórico..."
              className="w-full rounded-2xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 pl-11 pr-4 py-3 text-sm text-surface-900 dark:text-white placeholder-surface-400 focus:border-brand-500 focus:outline-none"
            />
          </div>

          {filteredSessions.length > 0 ? (
            <div className="space-y-4">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-3xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6 shadow-sm hover:border-brand-500/40 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-100 dark:border-surface-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-brand-500/10 px-2.5 py-1 text-xs font-bold text-brand-600 dark:text-brand-400">
                        {session.discipline}
                      </span>
                      <h3 className="font-bold text-sm text-surface-900 dark:text-white">
                        {session.topic}
                      </h3>
                    </div>
                    <span className="text-[11px] text-surface-400">
                      {new Date(session.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <p className="mt-3 text-xs sm:text-sm text-surface-700 dark:text-surface-300 font-medium italic">
                    &ldquo;{session.question}&rdquo;
                  </p>

                  {/* Socratic summary snippet */}
                  <div className="mt-3 rounded-xl bg-surface-50 dark:bg-surface-950/60 p-3.5 text-xs text-surface-600 dark:text-surface-400 line-clamp-2">
                    <MathRenderer content={session.response.concept} />
                  </div>

                  <div className="mt-4 flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      {session.isMastered ? (
                        <span className="text-emerald-500 flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" /> Conceito Dominado
                        </span>
                      ) : (
                        <span className="text-amber-500 flex items-center gap-1">
                          ⚡ Em Aprendizagem
                        </span>
                      )}
                    </div>
                    <Link
                      href="/tutor"
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      <span>Reabrir no Tutor IA</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-surface-300 dark:border-surface-800 p-12 text-center">
              <GraduationCap className="h-10 w-10 text-surface-400 mx-auto mb-3" />
              <h3 className="font-bold text-surface-900 dark:text-white">Nenhuma sessão encontrada</h3>
              <p className="text-xs text-surface-500 mt-1">Faça sua primeira pergunta ao Tutor IA para registrar no seu caderno!</p>
            </div>
          )}

        </div>
      )}

      {/* Modal para Criar Novo Flashcard */}
      {isNewCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-surface-200 dark:border-surface-800 pb-4">
              <h3 className="font-bold text-lg text-surface-900 dark:text-white">Criar Novo Flashcard</h3>
              <button
                onClick={() => setIsNewCardModalOpen(false)}
                className="text-surface-400 hover:text-surface-600 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFlashcard} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-surface-600 dark:text-surface-300">Disciplina</label>
                <input
                  type="text"
                  value={newDiscipline}
                  onChange={(e) => setNewDiscipline(e.target.value)}
                  placeholder="Ex: Cálculo, Direito, Farmacologia..."
                  className="mt-1 w-full rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-950 px-3.5 py-2 text-xs text-surface-900 dark:text-white focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-surface-600 dark:text-surface-300">Tópico</label>
                <input
                  type="text"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="Ex: Teorema Fundamental do Cálculo"
                  className="mt-1 w-full rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-950 px-3.5 py-2 text-xs text-surface-900 dark:text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-surface-600 dark:text-surface-300">Frente (Pergunta / Desafio)</label>
                <textarea
                  value={newFront}
                  onChange={(e) => setNewFront(e.target.value)}
                  placeholder="Qual a fórmula ou conceito que você quer memorizar?"
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-950 p-3 text-xs text-surface-900 dark:text-white focus:outline-none focus:border-brand-500 resize-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-surface-600 dark:text-surface-300">Verso (Explicação & Conceito)</label>
                <textarea
                  value={newBack}
                  onChange={(e) => setNewBack(e.target.value)}
                  placeholder="Explique o conceito ou passo a passo da resposta..."
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-950 p-3 text-xs text-surface-900 dark:text-white focus:outline-none focus:border-brand-500 resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewCardModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-brand-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-brand-700"
                >
                  Salvar Flashcard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
