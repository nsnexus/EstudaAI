'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  GraduationCap, 
  Sparkles, 
  BookOpen, 
  LayoutDashboard, 
  Settings, 
  Moon, 
  Sun, 
  UserCircle2, 
  Flame, 
  Menu, 
  X,
  ShieldCheck,
  BrainCircuit,
  LogOut,
  LogIn,
  Layers
} from 'lucide-react';
import { getCurrentUser, switchRole, logoutUser } from '@/lib/storage';
import { User, UserRole } from '@/types';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Inicializa o usuário
    const currentUser = getCurrentUser();
    setUser(currentUser);

    // Inicializa tema
    const isDarkMode = document.documentElement.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    }

    const handleAuthChange = () => {
      setUser(getCurrentUser());
    };

    window.addEventListener('estudaai_auth_changed', handleAuthChange);
    return () => window.removeEventListener('estudaai_auth_changed', handleAuthChange);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleToggleRole = () => {
    if (!user) return;
    const newRole: UserRole = user.role === 'aluno' ? 'admin' : 'aluno';
    const updated = switchRole(newRole);
    setUser(updated);
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    router.push('/login');
  };

  const navLinks = [
    { href: '/', label: 'Início', icon: Sparkles },
    { href: '/disciplinas', label: 'Disciplinas & Atividades', icon: Layers, badge: 'AVA' },
    { href: '/tutor', label: 'Tutor IA', icon: BrainCircuit, badge: 'Socrático' },
    { href: '/biblioteca', label: 'Flashcards & Simulados', icon: BookOpen },
    { href: '/admin', label: 'Painel Admin', icon: LayoutDashboard, adminOnly: true },
    { href: '/configuracoes', label: 'Configurações', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-surface-200/80 dark:border-surface-800/80 bg-white/80 dark:bg-surface-950/80 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-primary-600 text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-surface-900 dark:text-white">
                Estuda<span className="text-brand-600 dark:text-brand-400">AI</span>
              </span>
              <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-semibold text-brand-600 dark:text-brand-400 border border-brand-500/20">
                v1.0
              </span>
            </div>
            <p className="text-[10px] text-surface-500 dark:text-surface-400 font-medium -mt-1">
              Assistente de Estudos Socrático
            </p>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            if (link.adminOnly && user?.role !== 'admin') return null;
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'text-brand-600 dark:text-brand-400 bg-brand-50/80 dark:bg-brand-950/40'
                    : 'text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-800/60'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{link.label}</span>
                {link.badge && (
                  <span className="rounded bg-brand-500/15 px-1.5 py-0.2 text-[9px] font-bold text-brand-600 dark:text-brand-400">
                    {link.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-brand-500 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions & Profile */}
        <div className="flex items-center gap-2.5">
          
          {/* Study Streak Pill */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Flame className="h-3.5 w-3.5 text-amber-500 animate-bounce" />
            <span>4 dias</span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-200 dark:border-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            title="Alternar Tema Claro/Escuro"
            aria-label="Alternar Tema"
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-surface-700" />}
          </button>

          {/* User Profile / Login Button */}
          {user ? (
            <div className="flex items-center gap-2">
              {/* Role Switcher Pill */}
              <button
                onClick={handleToggleRole}
                className={`hidden md:flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold shadow-sm transition-all hover:scale-102 ${
                  user.role === 'admin'
                    ? 'border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400'
                    : 'border-brand-500/30 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                }`}
                title="Clique para alternar perfil de demonstração (Aluno ↔ Admin)"
              >
                {user.role === 'admin' ? (
                  <ShieldCheck className="h-3.5 w-3.5" />
                ) : (
                  <UserCircle2 className="h-3.5 w-3.5" />
                )}
                <span>{user.role === 'admin' ? 'Admin' : 'Aluno'}</span>
              </button>

              {/* User Avatar & Logout */}
              <div className="flex items-center gap-2 pl-1 border-l border-surface-200 dark:border-surface-800">
                <Link href="/disciplinas" className="flex items-center gap-2 group" title={user.name}>
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="h-8 w-8 rounded-lg object-cover ring-1 ring-brand-500/30 group-hover:ring-brand-500" 
                  />
                  <span className="hidden xl:inline text-xs font-bold text-surface-800 dark:text-surface-200 max-w-[120px] truncate">
                    {user.name.split(' ')[0]}
                  </span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  title="Sair da Conta (Logout)"
                  aria-label="Sair"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white px-3.5 py-1.5 text-xs font-bold shadow-md shadow-brand-500/20 transition-all"
            >
              <LogIn className="h-4 w-4" />
              <span>Entrar</span>
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex lg:hidden h-9 w-9 items-center justify-center rounded-lg border border-surface-200 dark:border-surface-800 text-surface-700 dark:text-surface-300"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-surface-200 dark:border-surface-800 bg-white/95 dark:bg-surface-950/95 px-4 py-4 backdrop-blur-lg">
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => {
              if (link.adminOnly && user?.role !== 'admin') return null;
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40'
                      : 'text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </div>
                  {link.badge && (
                    <span className="rounded bg-brand-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-brand-600 dark:text-brand-400">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
};
