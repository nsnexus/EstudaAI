import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'EstudaAI — Assistente de Estudos com IA Socrática',
  description: 'Plataforma inteligente que ajuda o aluno a aprender de verdade: conceito, exemplo análogo, raciocínio guiado e pergunta reflexiva sem atalhos ou cola.',
  keywords: ['estudos', 'inteligência artificial', 'tutor socrático', 'faculdade', 'anhanguera', 'educação', 'flashcards', 'simulados'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-50 antialiased flex flex-col font-sans selection:bg-brand-500 selection:text-white">
        
        {/* Background Ambient Glow */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-brand-500/10 via-primary-500/10 to-transparent blur-3xl opacity-60 dark:opacity-40" />
          <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-brand-500/5 blur-3xl rounded-full" />
          <div className="absolute top-2/3 -right-40 w-[500px] h-[500px] bg-primary-500/5 blur-3xl rounded-full" />
        </div>

        {/* Global Navbar */}
        <Navbar />

        {/* Page Content */}
        <main className="flex-1 w-full">
          {children}
        </main>

        {/* Global Footer */}
        <Footer />
      </body>
    </html>
  );
}
