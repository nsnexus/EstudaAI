'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Lock, Database, EyeOff, FileText } from 'lucide-react';

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-200 dark:border-surface-800 pb-6">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar para o Início</span>
        </Link>
        <span className="text-xs text-surface-400">Última atualização: Agosto de 2026</span>
      </div>

      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 mb-2">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-surface-900 dark:text-white tracking-tight">
          Política de Privacidade do EstudaAI
        </h1>
        <p className="text-sm text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">
          Esta Política de Privacidade descreve como a plataforma web e a extensão de navegador EstudaAI tratam suas informações com transparência e em conformidade com a LGPD.
        </p>
      </div>

      {/* Main Content */}
      <div className="rounded-3xl border border-surface-200 dark:border-surface-800 bg-white/80 dark:bg-surface-900/80 p-6 sm:p-10 shadow-sm space-y-8 text-surface-700 dark:text-surface-300 text-sm leading-relaxed">
        
        {/* 1. Compromisso Principal */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5 text-surface-900 dark:text-white font-bold text-lg">
            <Lock className="h-5 w-5 text-brand-500" />
            <h2>1. Compromisso de Privacidade e Finalidade Única</h2>
          </div>
          <p>
            O <strong>EstudaAI</strong> e sua extensão de navegador foram desenvolvidos com a finalidade exclusiva de auxiliar estudantes universitários na organização de seus estudos, acompanhamento de pendências acadêmicas e tutoria socrática por inteligência artificial.
          </p>
          <p>
            Nós <strong>NÃO vendemos, alugamos ou comercializamos</strong> quaisquer dados pessoais de nossos usuários para empresas terceiras ou agências de publicidade.
          </p>
        </section>

        {/* 2. Coleta de Dados pela Extensão */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5 text-surface-900 dark:text-white font-bold text-lg">
            <Database className="h-5 w-5 text-primary-500" />
            <h2>2. Dados Coletados e Utilizados</h2>
          </div>
          <p>
            Quando o estudante utiliza a extensão ou o conector do portal acadêmico (AVA KLS / Anhanguera / Unopar):
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-surface-600 dark:text-surface-400">
            <li><strong>Dados de Disciplinas:</strong> Nomes das matérias matriculadas, módulos/unidades de ensino e status de conclusão das atividades formativas;</li>
            <li><strong>Nome de Exibição do Aluno:</strong> Utilizado exclusivamente para personalizar a saudação no painel de estudos;</li>
            <li><strong>Interações com o Tutor IA:</strong> As dúvidas conceituais enviadas ao Tutor Socrático são processadas de forma anônima para gerar explicações pedagógicas.</li>
          </ul>
        </section>

        {/* 3. Permissões da Extensão do Chrome */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5 text-surface-900 dark:text-white font-bold text-lg">
            <EyeOff className="h-5 w-5 text-amber-500" />
            <h2>3. Permissões Técnicas da Extensão</h2>
          </div>
          <p>
            A extensão de navegador utiliza as seguintes permissões estritamente necessárias:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-surface-100 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700">
              <span className="font-bold text-surface-900 dark:text-white text-xs block mb-1">activeTab & scripting</span>
              <p className="text-xs text-surface-500 dark:text-surface-400">Permite ler os elementos da grade de matérias apenas quando o aluno aciona a sincronização.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-100 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700">
              <span className="font-bold text-surface-900 dark:text-white text-xs block mb-1">storage</span>
              <p className="text-xs text-surface-500 dark:text-surface-400">Armazena os dados das disciplinas localmente no dispositivo do estudante para acesso offline rápido.</p>
            </div>
          </div>
        </section>

        {/* 4. Segurança e Armazenamento */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5 text-surface-900 dark:text-white font-bold text-lg">
            <FileText className="h-5 w-5 text-emerald-500" />
            <h2>4. Armazenamento e Exclusão de Dados</h2>
          </div>
          <p>
            Todos os dados de estudos ficam salvos no armazenamento local do navegador do próprio aluno (LocalStorage / Chrome Storage). O estudante pode, a qualquer momento, limpar seus dados clicando em &quot;Sair da Conta&quot; ou limpando o cache do navegador.
          </p>
        </section>

        {/* 5. Contato */}
        <section className="p-4 rounded-2xl bg-brand-500/5 border border-brand-500/20 text-xs sm:text-sm">
          <p className="font-bold text-surface-900 dark:text-white mb-1">Dúvidas sobre Privacidade?</p>
          <p className="text-surface-600 dark:text-surface-400">
            Para dúvidas ou solicitações referentes à proteção de dados e privacidade, entre em contato através da plataforma em <a href="https://estudaai.pages.dev" className="text-brand-600 dark:text-brand-400 font-semibold underline">estudaai.pages.dev</a>.
          </p>
        </section>

      </div>
    </div>
  );
}
