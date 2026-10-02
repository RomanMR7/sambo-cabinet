import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AthleteDetailView } from './AthleteDetailView';
import { Search, Clock, XCircle, ArrowRight, CheckCircle2, UserPlus, Users } from 'lucide-react';
import { AddAthleteModal } from '../../components/modals/AddAthleteModal';

export const AthletesView: React.FC = () => {
  const { athletes, selectedAthleteId, setSelectedAthleteId } = useApp();
  const [showDetail, setShowDetail] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'admitted' | 'pending' | 'not_admitted'>('all');
  const [isAddAthleteOpen, setIsAddAthleteOpen] = useState(false);

  const filteredAthletes = athletes.filter(a => {
    const matchesSearch =
      a.fullName.toLowerCase().includes(search.toLowerCase()) ||
      a.shortName.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    return a.admissionDecision.status === statusFilter;
  });

  const handleSelect = (id: string) => {
    setSelectedAthleteId(id);
    setShowDetail(true);
  };

  if (showDetail) {
    return <AthleteDetailView onBack={() => setShowDetail(false)} />;
  }

  const admittedCount = athletes.filter(a => a.admissionDecision.status === 'admitted').length;
  const pendingCount = athletes.filter(a => a.admissionDecision.status === 'pending').length;
  const notAdmittedCount = athletes.filter(a => a.admissionDecision.status === 'not_admitted').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider">
            <Users className="w-3.5 h-3.5" />
            <span>Состав группы</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Спортсмены группы
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Группа 1 • {athletes.length} спортсменов в активном списке
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddAthleteOpen(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-sm shadow-red-900/20 transition flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Добавить спортсмена</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
        {/* Status Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Все ({athletes.length})
          </button>
          <button
            onClick={() => setStatusFilter('admitted')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              statusFilter === 'admitted'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Допущены ({admittedCount})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Ожидают ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('not_admitted')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              statusFilter === 'not_admitted'
                ? 'bg-red-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Не допущены ({notAdmittedCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по имени..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          />
        </div>
      </div>

      {/* Grid of Athletes */}
      {filteredAthletes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 text-sm">
          Спортсмены не найдены по заданным критериям фильтра.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAthletes.map(athlete => {
            const isSelected = athlete.id === selectedAthleteId;
            const status = athlete.admissionDecision.status;

            return (
              <div
                key={athlete.id}
                onClick={() => handleSelect(athlete.id)}
                className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between gap-4 ${
                  isSelected ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-800 text-white font-bold text-base flex items-center justify-center shadow-sm shrink-0">
                      {athlete.avatarInitials}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 leading-tight">
                        {athlete.shortName}
                      </h3>
                      <p className="text-xs text-slate-500">{athlete.fullName}</p>
                      <span className="inline-block text-[10px] font-semibold text-slate-400 mt-0.5">
                        {athlete.groupId === 'grp-1' ? 'Группа 1' : 'Группа 2'}
                      </span>
                    </div>
                  </div>

                  {status === 'admitted' && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3 h-3" /> Допущен
                    </span>
                  )}
                  {status === 'pending' && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" /> Ожидает
                    </span>
                  )}
                  {status === 'not_admitted' && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200 flex items-center gap-1 shrink-0">
                      <XCircle className="w-3 h-3" /> Не допущен
                    </span>
                  )}
                </div>

                <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Родитель:</span>
                    <span className="font-semibold text-slate-800">{athlete.parentName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Телефон:</span>
                    <span className="font-mono">{athlete.parentPhone}</span>
                  </div>
                  <div className="pt-1 text-[11px] text-slate-500 border-t border-slate-200/60 truncate">
                    Основание: {athlete.admissionDecision.basis}
                  </div>
                </div>

                <div className="flex items-center justify-end text-xs font-bold text-red-600 gap-1 pt-1">
                  <span>Открыть карточку</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Athlete Modal */}
      {isAddAthleteOpen && (
        <AddAthleteModal onClose={() => setIsAddAthleteOpen(false)} />
      )}
    </div>
  );
};
