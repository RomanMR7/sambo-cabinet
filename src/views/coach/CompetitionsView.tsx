import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Trophy, Calendar, MapPin, CheckCircle2, Clock, Users, Plus } from 'lucide-react';
import { AddCompetitionModal } from '../../components/modals/AddCompetitionModal';

export const CompetitionsView: React.FC = () => {
  const { competitions, athletes, setSelectedAthleteId, setActiveNav } = useApp();
  const [isAddCompOpen, setIsAddCompOpen] = useState(false);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5" />
            <span>Календарный план</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Соревнования и Турниры
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Заявки • Допуски участников • Весовые категории
          </p>
        </div>

        <button
          onClick={() => setIsAddCompOpen(true)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-sm transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>+ Добавить соревнование</span>
        </button>
      </div>

      <div className="space-y-6">
        {competitions.map(comp => (
          <div key={comp.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200 uppercase">
                  Официальный старт
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1">{comp.title}</h2>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> {comp.date}
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {comp.location}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold">Требуемый пакет документов: </span>
                <span>Медицинский допуск, страховой полис от НС, согласие родителя</span>
              </div>
            </div>

            {/* Participants Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-500" />
                  <span>Заявленные спортсмены группы ({comp.participants.length})</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {comp.participants.map(p => {
                  const athlete = athletes.find(a => a.id === p.athleteId);
                  const isAdmitted = p.admissionDecision === 'admitted';

                  return (
                    <div
                      key={p.athleteId}
                      onClick={() => {
                        setSelectedAthleteId(p.athleteId);
                        setActiveNav('athlete_detail');
                      }}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">
                          {athlete?.shortName}
                        </span>
                        {isAdmitted ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Допущен
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Ожидает
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-600">
                        Категория: <strong className="text-slate-800">{p.category}</strong>
                      </div>
                      {p.nextGoal && (
                        <div className="text-[11px] text-slate-500 italic">
                          Цель: {p.nextGoal}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isAddCompOpen && (
        <AddCompetitionModal onClose={() => setIsAddCompOpen(false)} />
      )}
    </div>
  );
};
