import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Calendar,
  Users,
  Dumbbell,
  Award,
  Trophy,
  FileText,
  BarChart3,
  Clock,
  UserCheck,
  History,
  ShieldAlert,
  Settings,
  HeartHandshake
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { role, activeNav, setActiveNav, documents } = useApp();

  // Pending docs count for verifier badge
  const pendingDocsCount = documents.filter(d => d.verificationStatus === 'unverified').length;

  const userProfiles: Record<string, { name: string; title: string; initials: string; badge: string }> = {
    coach: { name: 'Иванов А. В.', title: 'Старший тренер', initials: 'АИ', badge: 'Тренер Группы 1' },
    athlete: { name: 'Антон Кузнецов', title: 'Спортсмен (12 лет)', initials: 'АК', badge: 'Группа 1 • -42 кг' },
    parent: { name: 'Ольга Кузнецова', title: 'Родитель спортсмена', initials: 'ОК', badge: 'Мама Антона К.' },
    admin: { name: 'Михайлов Д. П.', title: 'Администратор школы', initials: 'ДМ', badge: 'Управление клубом' },
    verifier: { name: 'Смирнова В. А.', title: 'Служба верификации', initials: 'ВС', badge: 'Медконтроль и полисы' },
  };

  const currentProfile = userProfiles[role] || userProfiles.coach;

  const renderNavItems = () => {
    switch (role) {
      case 'coach':
        return [
          { id: 'today', label: 'Сегодня', icon: Calendar },
          { id: 'athletes', label: 'Спортсмены', icon: Users },
          { id: 'sessions', label: 'Занятия', icon: Dumbbell },
          { id: 'development', label: 'Развитие', icon: Award },
          { id: 'competitions', label: 'Соревнования', icon: Trophy },
          { id: 'documents', label: 'Документы', icon: FileText },
          { id: 'reports', label: 'Отчёты', icon: BarChart3 },
        ];
      case 'verifier':
        return [
          { id: 'queue', label: 'Очередь проверки', icon: Clock, badge: pendingDocsCount },
          { id: 'verifier_athletes', label: 'Назначенные спортсмены', icon: Users },
          { id: 'verifier_history', label: 'История проверок', icon: History },
        ];
      case 'parent':
        return [
          { id: 'parent_main', label: 'Мой ребёнок', icon: HeartHandshake },
          { id: 'parent_attendance', label: 'Занятия и пропуски', icon: Dumbbell },
          { id: 'parent_documents', label: 'Документы ребёнка', icon: FileText },
          { id: 'parent_tasks', label: 'Задачи тренера', icon: Award },
        ];
      case 'athlete':
        return [
          { id: 'athlete_main', label: 'Мой кабинет', icon: UserCheck },
          { id: 'athlete_sessions', label: 'Мои тренировки', icon: Dumbbell },
          { id: 'athlete_tasks', label: 'Мои задачи', icon: Award },
          { id: 'athlete_competitions', label: 'Старты и допуск', icon: Trophy },
        ];
      case 'admin':
        return [
          { id: 'admin_main', label: 'Управление группой', icon: Settings },
          { id: 'admin_schedule', label: 'Расписание занятий', icon: Calendar },
          { id: 'admin_roles', label: 'Роли и назначения', icon: Users },
          { id: 'admin_security', label: 'Контур безопасности', icon: ShieldAlert },
        ];
      default:
        return [];
    }
  };

  const navItems = renderNavItems();

  return (
    <aside className="w-64 bg-[#111827] text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none min-h-[calc(100vh-45px)] no-print">
      {/* Brand Header */}
      <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-red-900/40">
            ★
          </div>
          <div>
            <div className="font-bold text-white text-base tracking-wide flex items-center gap-1.5">
              <span>САМБО</span>
              <span className="text-[10px] font-semibold bg-red-600/30 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20">
                PRO
              </span>
            </div>
            <div className="text-[11px] text-slate-400">Цифровой кабинет</div>
          </div>
        </div>
      </div>

      {/* User Profile Block */}
      <div className="p-4 mx-3 my-3 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-semibold text-sm shadow ring-2 ring-slate-700">
          {currentProfile.initials}
        </div>
        <div className="overflow-hidden">
          <div className="text-sm font-semibold text-white truncate" title={currentProfile.name}>
            {currentProfile.name}
          </div>
          <div className="text-xs text-slate-400 truncate">{currentProfile.title}</div>
          <div className="mt-1 inline-block text-[10px] font-medium bg-red-500/10 text-red-400 px-1.5 py-0.2 rounded border border-red-500/20">
            {currentProfile.badge}
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Навигация
        </div>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-red-600 text-white shadow-sm shadow-red-900/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-1.5 py-0.5 text-xs font-bold rounded-full bg-amber-500 text-slate-950">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 text-xs text-slate-400">
        <div className="flex items-center justify-between">
          <span>Версия прототипа</span>
          <span className="text-slate-300 font-mono">1.0.0</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-400">
          Самбо: Группа 1 (2026/2027)
        </div>
      </div>
    </aside>
  );
};
