import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AttendanceStatus } from '../../types';
import {
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Save,
  CheckCheck,
  Plus,
  BookOpen,
  Award,
  MessageSquare
} from 'lucide-react';
import { ObservationTaskModal } from '../../components/modals/ObservationTaskModal';
import { isCoachForGroup } from '../../utils/rules';

export const SessionView: React.FC = () => {
  const {
    sessions,
    selectedSessionId,
    setSelectedSessionId,
    athletes,
    groups,
    activeCoachId,
    clubUsers,
    updateAttendance,
    reportAbsence,
    markAllPresent,
    addSessionNote
  } = useApp();

  const activeCoach =
    (Array.isArray(clubUsers) ? clubUsers : []).find(u => u && u.id === activeCoachId) ||
    (Array.isArray(clubUsers) ? clubUsers : []).find(u => u && u.role === 'coach');

  const coachGroups = (Array.isArray(groups) ? groups : []).filter(g =>
    activeCoach && isCoachForGroup(activeCoach, g)
  );

  const coachGroupIds = new Set(coachGroups.map(g => g.id));

  const mySessions = sessions.filter(s => coachGroupIds.has(s.groupId));
  const otherSessions = sessions.filter(s => !coachGroupIds.has(s.groupId));

  const currentSession = sessions.find(s => s && s.id === selectedSessionId) || mySessions[0] || sessions[0];

  const currentSessionAthletes = (Array.isArray(athletes) ? athletes : []).filter(
    a => a && a.groupId === currentSession?.groupId && a.isActive
  );

  const [activeTab, setActiveTab] = useState<'plan' | 'attendance' | 'fact' | 'observations'>('attendance');
  const [selectedAthleteForNote, setSelectedAthleteForNote] = useState<string>(
    currentSessionAthletes[0]?.id || ''
  );
  const [noteInput, setNoteInput] = useState('');
  const [isObsModalOpen, setIsObsModalOpen] = useState(false);
  const [saveBanner, setSaveBanner] = useState(false);
  const saveBannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Synchronize note athlete when session / group changes
  useEffect(() => {
    if (currentSessionAthletes.length > 0) {
      if (!currentSessionAthletes.some(a => a.id === selectedAthleteForNote)) {
        setSelectedAthleteForNote(currentSessionAthletes[0].id);
      }
    } else {
      setSelectedAthleteForNote('');
    }
  }, [currentSession?.id, currentSession?.groupId, currentSessionAthletes]);

  useEffect(() => {
    return () => {
      if (saveBannerTimerRef.current) {
        clearTimeout(saveBannerTimerRef.current);
      }
    };
  }, []);

  const [excuseTargetAthlete, setExcuseTargetAthlete] = useState<typeof athletes[0] | null>(null);
  const [excuseReasonInput, setExcuseReasonInput] = useState('Болезнь (справка от врача)');
  const [isSubmittingExcuse, setIsSubmittingExcuse] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && excuseTargetAthlete) {
        setExcuseTargetAthlete(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [excuseTargetAthlete]);

  if (!currentSession) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Занятие не найдено</h2>
        <p className="text-sm text-slate-500">В расписании группы нет запланированных тренировочных занятий.</p>
      </div>
    );
  }

  const handleStatusChange = (athleteId: string, status: AttendanceStatus) => {
    if (!currentSession) return;
    updateAttendance(currentSession.id, athleteId, status);
  };

  const handleSave = () => {
    if (saveBannerTimerRef.current) {
      clearTimeout(saveBannerTimerRef.current);
    }
    setSaveBanner(true);
    saveBannerTimerRef.current = setTimeout(() => {
      setSaveBanner(false);
      saveBannerTimerRef.current = null;
    }, 3000);
  };

  const handleAddQuickNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSession || !noteInput.trim()) return;
    addSessionNote(currentSession.id, selectedAthleteForNote, noteInput.trim());
    setNoteInput('');
  };

  const selectedAthleteObj = athletes.find(a => a.id === selectedAthleteForNote);

  return (
    <div className="space-y-6 animate-fadeIn">
      {saveBanner && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-md text-sm font-semibold flex items-center justify-between animate-fadeIn">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Данные занятия успешно сохранены в локальное хранилище!
          </span>
          <button onClick={() => setSaveBanner(false)} className="underline text-xs font-bold">
            ОК
          </button>
        </div>
      )}

      {/* Header (Slide 07) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            <span>Тренировочное занятие</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              Занятие: {currentSession.topic}
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Тренировка:</span>
              <select
                value={currentSession.id}
                onChange={e => setSelectedSessionId(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
              >
                {mySessions.length > 0 && (
                  <optgroup label="Занятия моих групп">
                    {mySessions.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.date} ({s.timeRange}) — {s.topic}
                      </option>
                    ))}
                  </optgroup>
                )}
                {otherSessions.length > 0 && (
                  <optgroup label="Другие группы клуба">
                    {otherSessions.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.date} ({s.timeRange}) — {s.topic}
                      </option>
                    ))}
                  </optgroup>
                )}
                {mySessions.length === 0 && otherSessions.length === 0 && (
                  sessions.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.date} ({s.timeRange}) — {s.topic}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Дата: <span className="font-bold text-slate-700">{currentSession.date}</span> • Время: <span className="font-mono text-slate-700">{currentSession.timeRange}</span> • Зал самбо №1
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => markAllPresent(currentSession.id)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center gap-1.5"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            <span>Отметить группу</span>
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-900/20 transition flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Сохранить</span>
          </button>
        </div>
      </div>

      {/* Horizontal Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('plan')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 ${
            activeTab === 'plan' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          План
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 ${
            activeTab === 'attendance' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Посещаемость (активна)
        </button>
        <button
          onClick={() => setActiveTab('fact')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 ${
            activeTab === 'fact' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Факт
        </button>
        <button
          onClick={() => setActiveTab('observations')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 ${
            activeTab === 'observations' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Наблюдения
        </button>
      </div>

      {/* Main Grid: Attendance Table on Left, Widgets on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Attendance Content */}
        <div className="lg:col-span-2 space-y-4">
          {activeTab === 'attendance' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Журнал группы</h3>
                  <p className="text-[11px] text-slate-500">
                    3-позиционный переключатель статуса присутствия спортсмена
                  </p>
                </div>
                <button
                  onClick={() => markAllPresent(currentSession.id)}
                  className="text-xs font-bold text-red-600 hover:underline"
                >
                  Отметить всех
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {currentSessionAthletes.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    В данной группе пока нет активных спортсменов
                  </div>
                ) : (
                  currentSessionAthletes.map(athlete => {
                    const status: AttendanceStatus = (currentSession.attendance && currentSession.attendance[athlete.id]) || 'unmarked';
                    const exceptionReason = currentSession.exceptions && currentSession.exceptions[athlete.id];

                  return (
                    <div
                      key={athlete.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 font-bold text-sm flex items-center justify-center shrink-0">
                          {athlete.avatarInitials}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">
                            {athlete.shortName}
                          </div>
                          <div className="text-xs text-slate-500">{athlete.fullName}</div>
                          {status === 'excused' && exceptionReason && (
                            <div className="text-[11px] text-blue-700 font-medium bg-blue-50 px-2 py-0.5 rounded mt-0.5 border border-blue-200 inline-block">
                              Уважительная причина: {exceptionReason}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 4-Position Interactive Switcher */}
                      <div className="grid grid-cols-4 sm:flex items-center bg-slate-100 p-1 rounded-xl gap-1 w-full sm:w-auto shrink-0">
                        {/* Present */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(athlete.id, 'present')}
                          className={`px-2 sm:px-3 py-2 sm:py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 touch-manipulation ${
                            status === 'present'
                              ? 'bg-emerald-500 text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Был</span>
                        </button>

                        {/* Absent */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(athlete.id, 'absent')}
                          className={`px-2 sm:px-3 py-2 sm:py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 touch-manipulation ${
                            status === 'absent'
                              ? 'bg-red-500 text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Н/Я</span>
                        </button>

                        {/* Excused */}
                        <button
                          type="button"
                          onClick={() => {
                            setExcuseTargetAthlete(athlete);
                            setExcuseReasonInput('Болезнь (справка от врача)');
                          }}
                          className={`px-2 sm:px-3 py-2 sm:py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 touch-manipulation ${
                            status === 'excused'
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                          }`}
                          title="Уважительный пропуск (исключается из базы E)"
                        >
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Уваж.</span>
                        </button>

                        {/* Unmarked */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(athlete.id, 'unmarked')}
                          className={`px-2 sm:px-3 py-2 sm:py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 touch-manipulation ${
                            status === 'unmarked'
                              ? 'bg-amber-400 text-slate-900 shadow-sm'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                          }`}
                          title="Не отмечено (блокирует рейтинг 4 недель)"
                        >
                          <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Не отм.</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
              </div>
            </div>
          )}

          {activeTab === 'plan' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-base">План занятия: {currentSession.topic}</h3>
              <div className="space-y-3">
                {currentSession.plan.map(p => (
                  <div key={p.order} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-red-600 text-white font-bold text-xs flex items-center justify-center">
                        {p.order}
                      </span>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{p.title}</div>
                        <div className="text-xs text-slate-500">Время: {p.timeRange}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'fact' && (() => {
            const currentGroupObj = groups.find(g => g.id === currentSession.groupId);
            const coachDisplay = currentGroupObj?.coachName || activeCoach?.fullName || 'Иванов А. В.';
            const presentCount = currentSessionAthletes.filter(
              a => currentSession.attendance?.[a.id] === 'present'
            ).length;

            return (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h3 className="font-extrabold text-slate-900 text-base">Фактическое выполнение занятия</h3>
                <p className="text-xs text-slate-500">
                  Занятие проведено в полном объёме согласно учебно-тренировочному плану группы {currentGroupObj?.name || 'самбо'}.
                </p>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                  <div>Зал: <strong>Самбо №1</strong></div>
                  <div>Тренер: <strong>{coachDisplay}</strong></div>
                  <div>
                    Количество явившихся: <strong>{presentCount}</strong> из {currentSessionAthletes.length}
                  </div>
                </div>
              </div>
            );
          })()}

          {activeTab === 'observations' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 text-base">Заметки и наблюдения на татами</h3>
                <button
                  onClick={() => setIsObsModalOpen(true)}
                  className="text-xs font-bold text-red-600 hover:underline"
                >
                  + Создать задачу из наблюдения
                </button>
              </div>

              <div className="space-y-3">
                {currentSession.notes.map(n => {
                  const ath = athletes.find(a => a.id === n.athleteId);
                  return (
                    <div key={n.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span>{ath?.shortName || 'Спортсмен'}</span>
                        <span className="text-[11px] text-slate-400 font-normal">{n.createdAt}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{n.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Plan Widget & Individual Observation (Slide 07) */}
        <div className="space-y-6">
          {/* Widget «План занятия» */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-red-600" />
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  План занятия
                </h3>
              </div>
            </div>

            <div className="space-y-2">
              {currentSession.plan.map(p => (
                <div key={p.order} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{p.order}. {p.title}</span>
                  <span className="font-mono text-slate-500">{p.timeRange}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setActiveTab('plan')}
              className="w-full py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              Открыть план
            </button>
          </div>

          {/* Widget «Индивидуальная запись» */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-red-600" />
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Индивидуальная запись
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Оперативная фиксация ошибок и успехов на ковре
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Выбор спортсмена
              </label>
              <select
                value={selectedAthleteForNote}
                onChange={e => setSelectedAthleteForNote(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              >
                {currentSessionAthletes.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.shortName} ({a.fullName})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Note input */}
            <form onSubmit={handleAddQuickNote} className="space-y-2">
              <textarea
                rows={2}
                value={noteInput}
                onChange={e => setNoteInput(e.target.value)}
                placeholder={`Заметка по спортсмену ${selectedAthleteObj?.shortName}...`}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
              <button
                type="submit"
                disabled={!noteInput.trim()}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Добавить быструю заметку</span>
              </button>
            </form>

            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsObsModalOpen(true)}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>+ Добавить наблюдение в развитие</span>
              </button>
              <div className="text-[10px] text-slate-400 text-center mt-1.5">
                Цепочка: Наблюдение → Навык → Упражнение → Задача
              </div>
            </div>
          </div>
        </div>
      </div>

      {isObsModalOpen && (
        <ObservationTaskModal
          athleteId={selectedAthleteForNote}
          onClose={() => setIsObsModalOpen(false)}
        />
      )}

      {/* Coach Excuse Absence Reason Modal */}
      {excuseTargetAthlete && (
        <div
          onClick={e => {
            if (e.target === e.currentTarget) setExcuseTargetAthlete(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden flex flex-col p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Уважительный пропуск</h3>
                <p className="text-xs text-slate-500">
                  {excuseTargetAthlete.fullName} • {currentSession.date}
                </p>
              </div>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                Исключается из базы E
              </span>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Причина отсутствия
              </label>
              <input
                type="text"
                value={excuseReasonInput}
                onChange={e => setExcuseReasonInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Болезнь (справка от врача), заявление от родителей..."
              />

              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  'Болезнь (справка от врача)',
                  'Заявление родителей по семейным обстоятельствам',
                  'Участие в соревнованиях по самбо',
                  'Плановая диспансеризация'
                ].map(reason => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setExcuseReasonInput(reason)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setExcuseTargetAthlete(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={isSubmittingExcuse}
                onClick={() => {
                  setIsSubmittingExcuse(true);
                  try {
                    reportAbsence(excuseTargetAthlete.id, currentSession.id, excuseReasonInput.trim() || 'Уважительная причина');
                    setExcuseTargetAthlete(null);
                  } finally {
                    setIsSubmittingExcuse(false);
                  }
                }}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition"
              >
                {isSubmittingExcuse ? 'Сохранение...' : 'Подтвердить пропуск'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
