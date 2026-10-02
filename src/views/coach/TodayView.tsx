import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  Dumbbell,
  Award,
  FileWarning,
  Clock,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Flame,
  ChevronRight
} from 'lucide-react';

export const TodayView: React.FC = () => {
  const { setActiveNav, setSelectedAthleteId, setSelectedSessionId, tasks, documents } = useApp();

  const handleOpenAthleteDocs = (athleteId: string) => {
    setSelectedAthleteId(athleteId);
    setActiveNav('athlete_detail');
  };

  const handleOpenSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setActiveNav('sessions');
  };

  // Calculations for metric badges
  const pendingDocsCount = documents.filter(d => d.verificationStatus === 'unverified').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5" />
            <span>Цифровой кабинет тренера</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Сегодня
          </h1>
          <p className="text-sm text-slate-500 font-medium">6 октября 2026, вторник</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedSessionId('ses-today');
              setActiveNav('sessions');
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm shadow-sm shadow-red-900/20 transition"
          >
            <Dumbbell className="w-4 h-4" />
            <span>Начать тренировку (18:00)</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div
          onClick={() => setActiveNav('athletes')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-red-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Группа</span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-red-50 text-slate-700 group-hover:text-red-600 flex items-center justify-center transition">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">24 спортсмена</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 group-hover:text-red-600">
              <span>Перейти в список</span>
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div
          onClick={() => handleOpenSession('ses-today')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-red-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ближайшее</span>
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">Занятие в 18:00</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 group-hover:text-red-600">
              <span>Группа 1 • Зал самбо №1</span>
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div
          onClick={() => setActiveNav('development')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-red-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Задачи</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">3 задачи к проверке</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 group-hover:text-red-600">
              <span>Раздел Развитие и S/3S</span>
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div
          onClick={() => setActiveNav('documents')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-red-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Контроль</span>
            <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
              <FileWarning className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">{pendingDocsCount} на проверке</div>
            <div className="text-xs text-amber-600 font-semibold mt-1 flex items-center gap-1">
              <span>Требуют обновления / проверки</span>
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Widget «Ближайшее занятие» */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-900/40 shrink-0">
            <Flame className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                Группа 1
              </span>
              <span className="text-xs text-slate-400 font-medium">18:00–19:00 (сегодня)</span>
            </div>
            <h2 className="text-xl font-bold mt-1 text-white">Техника и учебные схватки</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              План занятия: Разминка (18:00–18:15) • Техника входа в захват (18:15–18:40) • Учебные схватки в стойке (18:40–19:00).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => handleOpenSession('ses-today')}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md shadow-red-900/40 transition flex items-center gap-2"
          >
            <span>Открыть занятие</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Two Columns Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: «Требует внимания» */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="font-extrabold text-slate-900 text-base">Требует внимания</h3>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              3 события
            </span>
          </div>

          <div className="space-y-3">
            {/* Item 1 */}
            <div
              onClick={() => handleOpenAthleteDocs('ath-1')}
              className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-50 transition cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                  АК
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>Полис: скоро истекает</span>
                    <span className="text-xs font-semibold px-2 py-0.2 rounded bg-amber-200 text-amber-800">
                      до 14 окт
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Антон К. • Требуется запросить продление у родителя
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            {/* Item 2 */}
            <div
              onClick={() => handleOpenAthleteDocs('ath-1')}
              className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 transition cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                  АК
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>Медицинский документ: на проверке</span>
                    <span className="text-xs font-semibold px-2 py-0.2 rounded bg-blue-200 text-blue-800">
                      Версия 1
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Антон К. • Ожидает подтверждения службы верификации
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            {/* Item 3 */}
            <div
              onClick={() => handleOpenAthleteDocs('ath-2')}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs">
                  ЛА
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>Индивидуальная задача: срок контроля</span>
                    <span className="text-xs font-semibold px-2 py-0.2 rounded bg-slate-200 text-slate-700">
                      9 окт
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Лиза А. • Плотность захвата двумя руками
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Right: «Задачи спортсменов» */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-red-600" />
              <h3 className="font-extrabold text-slate-900 text-base">Задачи спортсменов</h3>
            </div>
            <button
              onClick={() => setActiveNav('development')}
              className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline"
            >
              Все задачи
            </button>
          </div>

          <div className="space-y-3">
            {tasks.map(t => (
              <div
                key={t.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs mt-0.5">
                    {t.athleteId === 'ath-1' ? 'АК' : t.athleteId === 'ath-2' ? 'ЛА' : 'СП'}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {t.athleteId === 'ath-1' ? 'Антон К.' : 'Лиза А.'} — «{t.exerciseTitle}»
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Навык: <span className="font-semibold text-slate-700">{t.skillTitle}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] font-semibold text-slate-400">
                        Контроль: {t.deadline}
                      </span>
                      {t.publishedToFamily && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Доступно семье
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  {t.status === 'completed' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Зачтено
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">
                      В работе
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
