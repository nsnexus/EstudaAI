'use client';

import React from 'react';
import { ShieldAlert, Sparkles, BookOpenCheck } from 'lucide-react';

interface IntegrityAlertProps {
  note?: string;
  onDismiss?: () => void;
}

export const IntegrityAlert: React.FC<IntegrityAlertProps> = ({ note, onDismiss }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-5 backdrop-blur-sm transition-all duration-300">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500 ring-1 ring-amber-500/30">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
              <Sparkles className="h-3 w-3" /> Camada de Integridade Ativada
            </span>
            <span className="text-xs text-surface-500 dark:text-surface-400 font-medium">
              Foco no Aprendizado Real
            </span>
          </div>
          <h4 className="mt-1 text-sm font-semibold text-surface-900 dark:text-white">
            Nós não entregamos a alternativa pronta!
          </h4>
          <p className="mt-1 text-xs leading-relaxed text-surface-600 dark:text-surface-300">
            {note || 'O EstudaAI foi desenhado para guiar o seu raciocínio. Ao invés de apenas marcar a resposta, vamos entender o conceito, a analogia e os passos lógicos para você acertar qualquer questão similar sozinho!'}
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs font-medium text-amber-600 dark:text-amber-400">
            <BookOpenCheck className="h-4 w-4" />
            <span>Princípio: Conceito → Exemplo → Raciocínio → Conclusão Própria</span>
          </div>
        </div>
      </div>
    </div>
  );
};
