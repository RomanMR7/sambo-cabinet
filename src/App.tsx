import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { DevHeader } from './components/DevHeader';
import { Sidebar } from './components/Sidebar';
import { TodayView } from './views/coach/TodayView';
import { AthletesView } from './views/coach/AthletesView';
import { AthleteDetailView } from './views/coach/AthleteDetailView';
import { SessionView } from './views/coach/SessionView';
import { DevelopmentView } from './views/coach/DevelopmentView';
import { CompetitionsView } from './views/coach/CompetitionsView';
import { DocumentsView } from './views/coach/DocumentsView';
import { ReportsView } from './views/coach/ReportsView';
import { TrainingPlansView } from './views/coach/TrainingPlansView';
import { VerifierView } from './views/verifier/VerifierView';
import { ParentView } from './views/parent/ParentView';
import { AthleteView } from './views/athlete/AthleteView';
import { AdminView } from './views/admin/AdminView';
import { HallCalendarView } from './components/calendar/HallCalendarView';
import {
  Menu,
  Calendar,
  Users,
  Dumbbell,
  BarChart3,
  UserCheck,
  HeartHandshake,
  Clock,
  Settings,
  MoreHorizontal,
  FileText
} from 'lucide-react';

export const App: React.FC = () => {
  const { role, activeNav, setActiveNav, documentRequests } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const renderCoachContent = () => {
    switch (activeNav) {
      case 'today':
        return <TodayView />;
      case 'athletes':
        return <AthletesView />;
      case 'athlete_detail':
        return <AthleteDetailView />;
      case 'schedule':
        return <HallCalendarView />;
      case 'training_plans':
        return <TrainingPlansView />;
      case 'sessions':
        return <SessionView />;
      case 'development':
        return <DevelopmentView />;
      case 'competitions':
        return <CompetitionsView />;
      case 'documents':
        return <DocumentsView />;
      case 'reports':
        return <ReportsView />;
      default:
        return <TodayView />;
    }
  };

  const renderContent = () => {
    switch (role) {
      case 'coach':
        return renderCoachContent();
      case 'verifier':
        return <VerifierView />;
      case 'parent':
        return <ParentView />;
      case 'athlete':
        return <AthleteView />;
      case 'admin':
        return <AdminView />;
      default:
        return <TodayView />;
    }
  };

  // Bottom Navigation tabs for mobile based on role
  const getBottomNavItems = () => {
    switch (role) {
      case 'coach':
        return [
          { id: 'today', label: 'Сегодня', icon: Calendar },
          { id: 'athletes', label: 'Группа', icon: Users },
          { id: 'sessions', label: 'Занятие', icon: Dumbbell },
          { id: 'reports', label: 'Отчёты', icon: BarChart3 },
        ];
      case 'athlete':
        return [
          { id: 'athlete_main', label: 'Кабинет', icon: UserCheck },
          { id: 'athlete_sessions', label: 'Занятия', icon: Dumbbell },
          { id: 'athlete_tasks', label: 'Задачи', icon: BarChart3 },
        ];
      case 'parent':
        const parentRequestsCount = (documentRequests || []).filter(
          r => r && r.athleteId === 'ath-1' && r.status === 'pending'
        ).length;
        return [
          {
            id: 'parent_main',
            label: 'Ребёнок',
            icon: HeartHandshake,
            badge: parentRequestsCount > 0 ? parentRequestsCount : undefined
          },
          { id: 'parent_attendance', label: 'Пропуски', icon: Dumbbell },
          {
            id: 'parent_documents',
            label: 'Документы',
            icon: FileText,
            badge: parentRequestsCount > 0 ? parentRequestsCount : undefined
          },
        ];
      case 'verifier':
        return [
          { id: 'queue', label: 'Очередь', icon: Clock },
          { id: 'verifier_athletes', label: 'Атлеты', icon: Users },
          { id: 'verifier_history', label: 'История', icon: Calendar },
        ];
      case 'admin':
        return [
          { id: 'admin_main', label: 'Группы', icon: Settings },
          { id: 'admin_schedule', label: 'График', icon: Calendar },
          { id: 'admin_roles', label: 'Роли', icon: Users },
        ];
      default:
        return [];
    }
  };

  const bottomNavItems = getBottomNavItems();

  const roleTitles: Record<string, string> = {
    coach: 'Тренер',
    athlete: 'Спортсмен',
    parent: 'Родитель',
    admin: 'Администратор',
    verifier: 'Проверяющий'
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      {/* Dev Switcher Bar */}
      <DevHeader />

      {/* Mobile Top App Bar (shown only on small screens) */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 text-white px-4 py-2.5 flex items-center justify-between shadow-sm sticky top-[45px] z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            aria-label="Открыть меню"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-red-600 text-white font-bold text-xs flex items-center justify-center">
              ★
            </span>
            <span className="font-extrabold text-sm tracking-wide text-white">САМБО PRO</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-red-500/20 text-red-400 border border-red-500/30">
            {roleTitles[role] || role}
          </span>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar (drawer on mobile, fixed on desktop) */}
        <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

        {/* Workspace Area with bottom padding for mobile bar */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 pb-20 md:pb-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Thumb friendly for phones) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 text-slate-400 flex items-center justify-around py-1.5 px-2 z-30 no-print">
        {bottomNavItems.map(item => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors touch-manipulation ${
                isActive ? 'text-red-500 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-red-500' : 'text-slate-400'}`} />
                {(item as any).badge !== undefined && (item as any).badge > 0 && (
                  <span className="absolute -top-1 -right-2 px-1 text-[9px] font-black rounded-full bg-amber-400 text-slate-950">
                    {(item as any).badge}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* More Button to open Drawer */}
        <button
          onClick={() => setMobileOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-medium text-slate-400 hover:text-slate-200 transition touch-manipulation"
        >
          <MoreHorizontal className="w-4 h-4 mb-0.5" />
          <span>Ещё</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
