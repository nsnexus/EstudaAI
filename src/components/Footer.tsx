'use client';

import React from 'react';
import Link from 'next/link';
import { GraduationCap, ShieldCheck, Heart, Sparkles, Brain, BookOpen } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-surface-200 dark:border-surface-800/80 bg-surface-50/50 dark:bg-surface-950/50 backdrop-blur-sm transition-colors">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-5">
          
          {/* Brand Col */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-primary-600 text-white shadow-md">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-surface-900 dark:text-white">
                Estuda<span className="text-brand-600 dark:text-brand-400">AI</span>
              </span>
            </div>
            <p className="mt-3 max-w-sm text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
              Plataforma de tutoria com Inteligência Artificial Socrática. Transformamos a dúvida em autonomia cognitiva — sem atalhos e sem entregar gabarito pronto.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-brand-600 dark:text-brand-400">
              <ShieldCheck className="h-4 w-4" />
              <span>100% alinhado às diretrizes de integridade acadêmica</span>
            </div>
          </div>

          {/* Col 1 */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-surface-900 dark:text-white">
              Recursos
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-surface-600 dark:text-surface-400">
              <li>
                <Link href="/tutor" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Tutor Socrático
                </Link>
              </li>
              <li>
                <Link href="/biblioteca" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Flashcards 3D
                </Link>
              </li>
              <li>
                <Link href="/biblioteca" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Simulados com IA
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Painel de Métricas
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 2 */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-surface-900 dark:text-white">
              Metodologia
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-surface-600 dark:text-surface-400">
              <li className="flex items-center gap-1.5">
                <Brain className="h-3.5 w-3.5 text-brand-500" />
                <span>Método Socrático</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary-500" />
                <span>Exemplos Análogos</span>
              </li>
              <li className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-amber-500" />
                <span>Raciocínio Guiado</span>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-surface-900 dark:text-white">
              Projeto & Arquitetura
            </h3>
            <p className="mt-3 text-xs text-surface-500 dark:text-surface-400 leading-relaxed">
              Baseado na especificação <code className="font-mono text-xs text-brand-600 dark:text-brand-400">EstudaAI_Arquitetura.md</code>.
            </p>
            <div className="mt-3">
              <Link
                href="/configuracoes"
                className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 px-3 py-1.5 text-xs font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800"
              >
                ⚙️ Configurar APIs & IA
              </Link>
            </div>
          </div>

        </div>

        <div className="mt-10 border-t border-surface-200/60 dark:border-surface-800/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-surface-500">
          <p>© 2026 EstudaAI. Todos os direitos reservados. Foco em Aprendizagem Genuína.</p>
          <div className="flex items-center gap-1">
            <span>Desenvolvido com</span>
            <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
            <span>para estudantes universitários</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
