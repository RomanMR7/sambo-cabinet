import React from 'react';
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
import { VerifierView } from './views/verifier/VerifierView';
import { ParentView } from './views/parent/ParentView';
import { AthleteView } from './views/athlete/AthleteView';
import { AdminView } from './views/admin/AdminView';

export const App: React.FC = () => {
  const { role, activeNav } = useApp();

  const renderCoachContent = () => {
    switch (activeNav) {
      case 'today':
        return <TodayView />;
      case 'athletes':
        return <AthletesView />;
      case 'athlete_detail':
        return <AthleteDetailView />;
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      {/* Dev Switcher Bar */}
      <DevHeader />

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Workspace Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
