import React from 'react';
import { useApp } from '../context/AppContext';
import { Role } from '../types';
import { Shield, RotateCcw, UserCheck, Dumbbell, Users, Eye, Sparkles } from 'lucide-react';

export const DevHeader: React.FC = () => {
  const { role, setRole, resetToDemo } = useApp();

  const roles: Array<{ key: Role; label: string; icon: React.ReactNode; desc: string }> = [
    { key: 'coach', label: 'Тренер', icon: <Dumbbell className="w-3.5 h-3.5" />, desc: 'Полный доступ к группе' },
    { key: 'athlete', label: 'Спортсмен', icon: <UserCheck className="w-3.5 h-3.5" />, desc: 'Только Антон К.' },
    { key: 'parent', label: 'Родитель', icon: <Users className="w-3.5 h-3.5" />, desc: 'Семья Антона К.' },
    { key: 'admin', label: 'Администратор', icon: <Shield className="w-3.5 h-3.5" />, desc: 'Орг. структура без медкопий' },
    { key: 'verifier', label: 'Проверяющий', icon: <Eye className="w-3.5 h-3.5" />, desc: 'Очередь верификации' },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-md no-print z-50">
      {/* Role Switcher */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wider pr-2 border-r border-slate-700">
          <Sparkles className="w-3.5 h-3.5 text-red-500" />
          <span>Среда (Dev):</span>
        </div>
        <div className="flex items-center bg-slate-950/70 p-1 rounded-lg border border-slate-800 gap-1">
          {roles.map(r => {
            const isActive = role === r.key;
            return (
              <button
                key={r.key}
                onClick={() => setRole(r.key)}
                title={r.desc}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
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
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Автономный SPA • LocalStorage</span>
        </div>
        <button
          onClick={() => {
            if (confirm('Сбросить все демо-данные к первоначальному состоянию?')) {
              resetToDemo();
            }
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-md transition-colors"
          title="Восстановить seed-данные"
        >
          <RotateCcw className="w-3.5 h-3.5 text-red-400" />
          <span>Сбросить демо-данные</span>
        </button>
      </div>
    </header>
  );
};
