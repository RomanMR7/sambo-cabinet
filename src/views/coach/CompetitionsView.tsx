import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Trophy, Calendar, MapPin, CheckCircle2, Clock, Users, Plus, X } from 'lucide-react';
import { AddCompetitionModal } from '../../components/modals/AddCompetitionModal';

export const CompetitionsView: React.FC = () => {
  const { competitions, athletes, setSelectedAthleteId, setActiveNav, addCompetitionParticipant } = useApp();
  const [isAddCompOpen, setIsAddCompOpen] = useState(false);
  const [addParticipantCompId, setAddParticipantCompId] = useState<string | null>(null);
  const [partAthleteId, setPartAthleteId] = useState<string>('');
  const [partCategory, setPartCategory] = useState<string>('Юноши до 42 кг');
  const [partNextGoal, setPartNextGoal] = useState<string>('');

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
        {competitions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 text-sm">
            В календаре соревнований пока нет запланированных стартов. Нажмите «+ Добавить соревнование», чтобы внести турнир.
          </div>
        ) : (
          competitions.map(comp => (
            <div key={comp.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200 uppercase">
                    Официальный старт
                  </span>
                  <h2 className="text-xl font-black text-slate-900 mt-1">{comp.title}</h2>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 flex-wrap">
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> {comp.date}{comp.endDate && comp.endDate !== comp.date ? ` — ${comp.endDate}` : ''}
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
                  <button
                    onClick={() => {
                      setAddParticipantCompId(comp.id);
                      // Select first athlete not in this comp
                      const available = athletes.find(a => !comp.participants.some(p => p.athleteId === a.id));
                      setPartAthleteId(available?.id || athletes[0]?.id || '');
                      setPartCategory('Юноши до 42 кг');
                      setPartNextGoal('');
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Заявить участника</span>
                  </button>
                </div>

                {comp.participants.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                    Нет заявленных спортсменов на этот турнир. Нажмите «+ Заявить участника».
                  </div>
                ) : (
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
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {isAddCompOpen && (
        <AddCompetitionModal onClose={() => setIsAddCompOpen(false)} />
      )}

      {/* Add Participant Modal Dialog */}
      {addParticipantCompId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center text-white">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Заявить спортсмена на турнир</h3>
                  <p className="text-xs text-slate-300">
                    {competitions.find(c => c.id === addParticipantCompId)?.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAddParticipantCompId(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                if (!partAthleteId) return;
                addCompetitionParticipant(addParticipantCompId, partAthleteId, partCategory, partNextGoal.trim() || undefined);
                setAddParticipantCompId(null);
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Спортсмен группы *
                </label>
                <select
                  value={partAthleteId}
                  onChange={e => setPartAthleteId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white"
                >
                  {athletes.map(a => {
                    const comp = competitions.find(c => c.id === addParticipantCompId);
                    const alreadyIn = comp?.participants.some(p => p.athleteId === a.id);
                    return (
                      <option key={a.id} value={a.id} disabled={alreadyIn}>
                        {a.shortName} ({a.fullName}) {alreadyIn ? '— уже заявлен' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Весовая категория *
                </label>
                <input
                  type="text"
                  required
                  value={partCategory}
                  onChange={e => setPartCategory(e.target.value)}
                  placeholder="Юноши до 42 кг"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Индивидуальная задача на схватки
                </label>
                <input
                  type="text"
                  value={partNextGoal}
                  onChange={e => setPartNextGoal(e.target.value)}
                  placeholder="Отработка плотного захвата, бросок через спину"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAddParticipantCompId(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition"
                >
                  Заявить в состав
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
