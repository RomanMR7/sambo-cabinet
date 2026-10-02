import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Clock,
  Award,
  Trophy,
  CheckCircle2,
  ChevronRight,
  Flame,
  BookOpen
} from 'lucide-react';

export const AthleteView: React.FC = () => {
  const { athletes, sessions, tasks } = useApp();

  // Anton K. ('ath-1')
  const me = athletes.find(a => a.id === 'ath-1') || athletes[0];
  const myTasks = tasks.filter(t => t.athleteId === me.id && t.publishedToFamily);
  const activeTask = myTasks.find(t => t.status === 'active') || myTasks[0];
  const completedTask = myTasks.find(t => t.status === 'completed');

  const nextSession = sessions.find(s => s.id === 'ses-next') || sessions[sessions.length - 1];

  const [activeModalText, setActiveModalText] = useState<string | null>(null);

  return (
    <div className="space-y-6 animate-fadeIn">
      {activeModalText && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">Методическая подсказка</h3>
            <p className="text-sm text-slate-600">{activeModalText}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setActiveModalText(null)}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold"
              >
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header (Slide 15) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 text-white font-black text-xl flex items-center justify-center shadow-md ring-4 ring-slate-100">
            {me.avatarInitials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
                Личный кабинет спортсмена
              </span>
              <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.2 rounded border border-emerald-200">
                12 лет • Самбо
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-0.5">
              Мой кабинет: {me.fullName}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Группа 1 • Весовая категория до 42 кг
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">
            Тренер: Иванов А. В.
          </span>
        </div>
      </div>

      {/* Grid of Blocks (Slide 15) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Block: «Следующее занятие» */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-600" />
              <h2 className="font-extrabold text-slate-900 text-base">Следующее занятие</h2>
            </div>
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
              {nextSession.date}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">{nextSession.topic}</span>
              <span className="font-mono text-xs font-bold text-slate-700">{nextSession.timeRange}</span>
            </div>
            <div className="text-xs text-slate-500">
              Место: Зал самбо №1 • Форма: красная самбовка / синяя самбовка
            </div>
          </div>

          <button
            onClick={() => setActiveModalText(`План тренировки на ${nextSession.date}: Разминка (страховка), отработка техники входа в захват, учебные схватки с контролем дистанции.`)}
            className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-900/20 transition flex items-center justify-center gap-2"
          >
            <span>Открыть занятие</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Block: «Моя задача» */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-red-600" />
              <h2 className="font-extrabold text-slate-900 text-base">Моя задача</h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              Индивидуальное задание
            </span>
          </div>

          {activeTask ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-start justify-between">
                <span className="font-bold text-sm text-slate-900">
                  «{activeTask.exerciseTitle}»
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  В процессе
                </span>
              </div>
              <div className="text-xs text-slate-600">
                Навык: <strong>{activeTask.skillTitle}</strong>
              </div>
              <div className="text-xs text-slate-500">
                Следующая проверка: {activeTask.deadline}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 text-xs text-slate-400 text-center">
              Нет активных задач
            </div>
          )}

          <button
            onClick={() => setActiveModalText('Инструкция к упражнению: Встать в правостороннюю стойку, захватить отворот и рукав партнера. При срыве захвата удерживать устойчивую позицию и не наклонять корпус.')}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4 text-slate-600" />
            <span>Открыть упражнение</span>
          </button>
        </div>

        {/* Block: «Личный прогресс» & «Мои достижения» */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-600" />
            <h2 className="font-extrabold text-slate-900 text-base">Личный прогресс</h2>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="font-bold text-xs text-emerald-950">
                Последняя проверка: Выполнено в упражнении
              </span>
            </div>
            <div className="text-xs text-emerald-900 font-medium pl-7">
              Оценка тренера: «Есть улучшения, продолжай в том же духе»
            </div>
          </div>

          {/* «Мои достижения» */}
          {completedTask && (
            <div className="pt-2 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Мои достижения:
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span className="font-bold text-slate-900">
                    Завершена индивидуальная задача ({completedTask.completedAt || '6 октября 2026'})
                  </span>
                </div>
                <span className="text-emerald-700 font-bold">Зачёт</span>
              </div>
            </div>
          )}
        </div>

        {/* Block: «Старты: участие уточняется» */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-red-600" />
            <h2 className="font-extrabold text-slate-900 text-base">Соревнования и старты</h2>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900">
                Первенство города по самбо
              </span>
              <span className="text-xs font-bold text-slate-500">24 октября 2026</span>
            </div>
            <div className="text-xs text-slate-600">
              Весовая категория: Юноши до 42 кг
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Статус спортивного допуска:</span>
              {me.admissionDecision.status === 'admitted' ? (
                <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  Допущен к участию
                </span>
              ) : (
                <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                  Старты: участие уточняется (ожидает решения)
                </span>
              )}
            </div>
          </div>

          <div className="text-[11px] text-slate-400">
            Основание: {me.admissionDecision.basis}
          </div>
        </div>
      </div>
    </div>
  );
};
