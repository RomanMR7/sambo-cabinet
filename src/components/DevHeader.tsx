import React from 'react';
import { useApp } from '../context/AppContext';
import { Role } from '../types';
import { Shield, RotateCcw, UserCheck, Dumbbell, Users, Eye, Sparkles } from 'lucide-react';

export const DevHeader: React.FC = () => {
  const { role, setRole, resetToDemo } = useApp();

  const roles: Array<{ key: Role; label: string; icon: React.ReactNode; desc: string }> = [
    { key: 'coach', label: 'Тренер', icon: <Dumbbell className="w-3.5 h-3.5 shrink-0" />, desc: 'Полный доступ к группе' },
    { key: 'athlete', label: 'Спортсмен', icon: <UserCheck className="w-3.5 h-3.5 shrink-0" />, desc: 'Только Антон К.' },
    { key: 'parent', label: 'Родитель', icon: <Users className="w-3.5 h-3.5 shrink-0" />, desc: 'Семья Антона К.' },
    { key: 'admin', label: 'Админ', icon: <Shield className="w-3.5 h-3.5 shrink-0" />, desc: 'Орг. структура без медкопий' },
    { key: 'verifier', label: 'Проверяющий', icon: <Eye className="w-3.5 h-3.5 shrink-0" />, desc: 'Очередь верификации' },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white px-2.5 sm:px-4 py-2 flex items-center justify-between gap-2 shadow-md no-print z-50 sticky top-0">
      {/* Role Switcher */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
        <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 font-semibold uppercase tracking-wider pr-1.5 border-r border-slate-700 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-red-500" />
          <span>Роль:</span>
        </div>
        <div className="flex items-center bg-slate-950/80 p-0.5 sm:p-1 rounded-lg border border-slate-800 gap-0.5 sm:gap-1 shrink-0">
          {roles.map(r => {
            const isActive = role === r.key;
            return (
              <button
                key={r.key}
                onClick={() => setRole(r.key)}
                title={r.desc}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap touch-manipulation ${
                  isActive
                    ? 'bg-red-600 text-white shadow-sm ring-1 ring-red-400'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                {r.icon}
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Info & Reset */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Автономный SPA</span>
        </div>
        <button
          onClick={() => {
            if (confirm('Сбросить все демо-данные к первоначальному состоянию?')) {
              resetToDemo();
            }
          }}
          className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-md transition-colors shrink-0 touch-manipulation"
          title="Сбросить все данные к исходным seed"
        >
          <RotateCcw className="w-3.5 h-3.5 text-red-400" />
          <span className="hidden sm:inline">Сброс</span>
        </button>
      </div>
    </header>
  );
};
