import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Trophy, Calendar, MapPin, CheckCircle2, Clock, Users, Plus, X } from 'lucide-react';
import { AddCompetitionModal } from '../../components/modals/AddCompetitionModal';
import { formatRussianDate } from '../../utils/calendarEngine';

export const CompetitionsView: React.FC = () => {
  const { competitions, athletes, setSelectedAthleteId, setActiveNav, addCompetitionParticipants } = useApp();
  const [isAddCompOpen, setIsAddCompOpen] = useState(false);
  const [addParticipantCompId, setAddParticipantCompId] = useState<string | null>(null);
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<string[]>([]);
  const [partCategory, setPartCategory] = useState<string>('Юноши до 42 кг');
  const [partNextGoal, setPartNextGoal] = useState<string>('');
  const [isSubmittingPart, setIsSubmittingPart] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && addParticipantCompId) {
        setAddParticipantCompId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addParticipantCompId]);

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
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> {formatRussianDate(comp.date, false)}{comp.endDate && comp.endDate !== comp.date ? ` — ${formatRussianDate(comp.endDate, false)}` : ''}
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
                      const available = athletes.filter(a => a.isActive && !comp.participants.some(p => p.athleteId === a.id));
                      setSelectedAthleteIds(available.length > 0 ? [available[0].id] : []);
                      setPartCategory('Юноши до 42 кг');
                      setPartNextGoal('');
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Заявить участников</span>
                  </button>
                </div>

                {comp.participants.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                    Нет заявленных спортсменов на этот турнир. Нажмите «+ Заявить участников».
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
                              {athlete?.shortName || 'Спортсмен'}
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
      {addParticipantCompId && (() => {
        const targetComp = competitions.find(c => c.id === addParticipantCompId);
        const availableAthletes = athletes.filter(
          a => a.isActive && !targetComp?.participants.some(p => p.athleteId === a.id)
        );

        const handleToggleAthlete = (athId: string) => {
          setSelectedAthleteIds(prev =>
            prev.includes(athId) ? prev.filter(id => id !== athId) : [...prev, athId]
          );
        };

        const handleSelectAll = () => {
          if (selectedAthleteIds.length === availableAthletes.length) {
            setSelectedAthleteIds([]);
          } else {
            setSelectedAthleteIds(availableAthletes.map(a => a.id));
          }
        };

        const handleSubmitParticipants = (e: React.FormEvent) => {
          e.preventDefault();
          if (selectedAthleteIds.length === 0) return;
          setIsSubmittingPart(true);
          try {
            addCompetitionParticipants(
              addParticipantCompId,
              selectedAthleteIds.map(id => ({
                athleteId: id,
                category: partCategory.trim() || 'Основная категория',
                nextGoal: partNextGoal.trim() || undefined
              }))
            );
            setAddParticipantCompId(null);
          } finally {
            setIsSubmittingPart(false);
          }
        };

        return (
          <div
            onClick={e => {
              if (e.target === e.currentTarget) setAddParticipantCompId(null);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center text-white">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Заявить спортсменов на турнир</h3>
                    <p className="text-xs text-slate-300">
                      {targetComp?.title}
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

              <form onSubmit={handleSubmitParticipants} className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Выберите спортсменов ({selectedAthleteIds.length} из {availableAthletes.length}) *
                    </label>
                    {availableAthletes.length > 0 && (
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className="text-xs font-semibold text-red-600 hover:text-red-700"
                      >
                        {selectedAthleteIds.length === availableAthletes.length
                          ? 'Снять выбор'
                          : 'Выбрать всех'}
                      </button>
                    )}
                  </div>

                  {availableAthletes.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                      Все активные спортсмены уже заявлены на данный турнир.
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-48 overflow-y-auto p-1 bg-slate-50/50">
                      {availableAthletes.map(a => {
                        const isChecked = selectedAthleteIds.includes(a.id);
                        return (
                          <div
                            key={a.id}
                            onClick={() => handleToggleAthlete(a.id)}
                            className="flex items-center gap-3 p-2.5 hover:bg-white rounded-lg cursor-pointer transition select-none"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="w-4 h-4 rounded text-red-600 focus:ring-red-500 pointer-events-none"
                            />
                            <div className="w-7 h-7 rounded-md bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center shrink-0">
                              {a.avatarInitials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-slate-900 truncate">
                                {a.fullName}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {a.shortName} • {a.admissionDecision.status === 'admitted' ? 'Допущен' : 'Ожидает допуска'}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Весовая категория (для выбранных) *
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

                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setAddParticipantCompId(null)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPart || selectedAthleteIds.length === 0}
                    className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition"
                  >
                    {isSubmittingPart
                      ? 'Заявление...'
                      : `Заявить в состав (${selectedAthleteIds.length})`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
