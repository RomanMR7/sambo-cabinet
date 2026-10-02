import React, { useState } from 'react';
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

export const SessionView: React.FC = () => {
  const {
    sessions,
    selectedSessionId,
    athletes,
    updateAttendance,
    markAllPresent,
    addSessionNote
  } = useApp();

  const currentSession = sessions.find(s => s.id === selectedSessionId) || sessions[0];
  const [activeTab, setActiveTab] = useState<'plan' | 'attendance' | 'fact' | 'observations'>('attendance');
  const [selectedAthleteForNote, setSelectedAthleteForNote] = useState<string>('ath-1');
  const [noteInput, setNoteInput] = useState('');
  const [isObsModalOpen, setIsObsModalOpen] = useState(false);
  const [saveBanner, setSaveBanner] = useState(false);

  const handleStatusChange = (athleteId: string, status: AttendanceStatus) => {
    updateAttendance(currentSession.id, athleteId, status);
  };

  const handleSave = () => {
    setSaveBanner(true);
    setTimeout(() => setSaveBanner(false), 3000);
  };

  const handleAddQuickNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim()) return;
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
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Занятие: Группа 1 • {currentSession.timeRange}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Дата: <span className="font-bold text-slate-700">{currentSession.date}</span> • Тема: «{currentSession.topic}»
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => markAllPresent(currentSession.id)}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center gap-1.5"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            <span>Отметить группу</span>
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-900/20 transition flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Сохранить</span>
          </button>
        </div>
      </div>

      {/* Horizontal Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('plan')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'plan' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          План
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'attendance' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Посещаемость (активна)
        </button>
        <button
          onClick={() => setActiveTab('fact')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'fact' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Факт
        </button>
        <button
          onClick={() => setActiveTab('observations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
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
                {athletes.map(athlete => {
                  const status: AttendanceStatus = currentSession.attendance[athlete.id] || 'unmarked';
                  const exceptionReason = currentSession.exceptions[athlete.id];

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

                      {/* 3-Position Interactive Switcher */}
                      <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 shrink-0">
                        {/* Present */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(athlete.id, 'present')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                            status === 'present'
                              ? 'bg-emerald-500 text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Присутствует</span>
                        </button>

                        {/* Absent */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(athlete.id, 'absent')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                            status === 'absent'
                              ? 'bg-red-500 text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Отсутствует</span>
                        </button>

                        {/* Unmarked */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(athlete.id, 'unmarked')}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                            status === 'unmarked'
                              ? 'bg-amber-400 text-slate-900 shadow-sm'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                          }`}
                          title="Не отмечено (блокирует рейтинг 4 недель)"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>Не отмечено</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
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

          {activeTab === 'fact' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-base">Фактическое выполнение занятия</h3>
              <p className="text-xs text-slate-500">
                Занятие проведено в полном объёме согласно учебно-тренировочному плану группы начальной подготовки.
              </p>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                <div>Зал: <strong>Самбо №1</strong></div>
                <div>Тренер: <strong>Иванов А. В.</strong></div>
                <div>Количество явившихся: <strong>{Object.values(currentSession.attendance).filter(v => v === 'present').length}</strong> из 5</div>
              </div>
            </div>
          )}

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
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">1. Разминка</span>
                <span className="font-mono text-slate-500">18:00–18:15</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">2. Техника</span>
                <span className="font-mono text-slate-500">18:15–18:40</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">3. Учебные схватки</span>
                <span className="font-mono text-slate-500">18:40–19:00</span>
              </div>
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
                {athletes.map(a => (
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
    </div>
  );
};
