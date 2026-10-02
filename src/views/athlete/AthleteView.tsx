import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Clock,
  Award,
  Trophy,
  CheckCircle2,
  ChevronRight,
  BookOpen,
  UserCheck,
  Dumbbell,
  ShieldCheck,
  CheckSquare
} from 'lucide-react';

export const AthleteView: React.FC = () => {
  const { athletes, sessions, tasks, competitions, activeNav, setActiveNav, toggleTaskStatus } = useApp();

  // Anton K. ('ath-1')
  const me = athletes.find(a => a.id === 'ath-1') || athletes[0];

  if (!me) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Данные спортсмена не найдены</h2>
        <p className="text-sm text-slate-500">Пожалуйста, используйте кнопку «Сбросить демо-данные к исходным» в верхней панели.</p>
      </div>
    );
  }

  const myTasks = tasks.filter(t => t.athleteId === me.id && t.publishedToFamily);
  const activeTask = myTasks.find(t => t.status === 'active') || myTasks[0];
  const completedTask = myTasks.find(t => t.status === 'completed');

  const nextSession = sessions.find(s => s.id === 'ses-next') || sessions[sessions.length - 1];
  const upcomingCompetition = competitions[0];

  const [activeModalText, setActiveModalText] = useState<{ title: string; content: string } | null>(null);
  const [taskFeedbackToast, setTaskFeedbackToast] = useState<string | null>(null);

  const navTab = activeNav.startsWith('athlete_') ? activeNav : 'athlete_main';

  const handleTaskToggle = (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'completed' ? 'active' : 'completed';
    toggleTaskStatus(taskId, nextStatus);
    setTaskFeedbackToast(
      nextStatus === 'completed'
        ? 'Отлично! Задание отмечено выполненным.'
        : 'Задание возвращено в активные.'
    );
    setTimeout(() => setTaskFeedbackToast(null), 3000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {taskFeedbackToast && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-md text-sm font-semibold flex items-center justify-between animate-fadeIn">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            {taskFeedbackToast}
          </span>
          <button onClick={() => setTaskFeedbackToast(null)} className="underline text-xs font-bold">
            ОК
          </button>
        </div>
      )}

      {activeModalText && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">{activeModalText.title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{activeModalText.content}</p>
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
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 text-white font-black text-xl flex items-center justify-center shadow-md ring-4 ring-slate-100 shrink-0">
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

      {/* Sub Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveNav('athlete_main')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            navTab === 'athlete_main'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Мой кабинет</span>
        </button>

        <button
          onClick={() => setActiveNav('athlete_sessions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            navTab === 'athlete_sessions'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Dumbbell className="w-4 h-4" />
          <span>Мои тренировки</span>
        </button>

        <button
          onClick={() => setActiveNav('athlete_tasks')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            navTab === 'athlete_tasks'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Мои задачи ({myTasks.length})</span>
        </button>

        <button
          onClick={() => setActiveNav('athlete_competitions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            navTab === 'athlete_competitions'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Старты и допуск</span>
        </button>
      </div>

      {/* TAB 1: ATHLETE MAIN (OVERVIEW) */}
      {navTab === 'athlete_main' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Block: «Следующее занятие» */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-red-600" />
                <h2 className="font-extrabold text-slate-900 text-base">Следующее занятие</h2>
              </div>
              <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                {nextSession ? nextSession.date : 'Нет даты'}
              </span>
            </div>

            {nextSession ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{nextSession.topic}</span>
                  <span className="font-mono text-xs font-bold text-slate-700">{nextSession.timeRange}</span>
                </div>
                <div className="text-xs text-slate-500">
                  Место: Зал самбо №1 • Форма: красная самбовка / синяя самбовка
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 text-xs text-slate-400 text-center">
                Нет запланированных тренировок
              </div>
            )}

            <button
              disabled={!nextSession}
              onClick={() => {
                if (!nextSession) return;
                setActiveModalText({
                  title: 'План следующей тренировки',
                  content: `Дата: ${nextSession.date} (${nextSession.timeRange})\nТема: ${nextSession.topic}\n\n1. Разминка и акробатика на ковре\n2. Отработка захватов и выведения из равновесия\n3. Учебно-тренировочные схватки по заданию тренера\n4. Заминка и растяжка`
                });
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold text-xs shadow-md shadow-red-900/20 transition flex items-center justify-center gap-2"
            >
              <span>Открыть план занятия</span>
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
              <button
                onClick={() => setActiveNav('athlete_tasks')}
                className="text-xs font-bold text-red-600 hover:underline"
              >
                Все задачи →
              </button>
            </div>

            {activeTask ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-start justify-between">
                  <span className="font-bold text-sm text-slate-900">
                    «{activeTask.exerciseTitle}»
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    activeTask.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border-amber-200'
                  }`}>
                    {activeTask.status === 'completed' ? 'Выполнено' : 'В процессе'}
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  Навык: <strong>{activeTask.skillTitle}</strong>
                </div>
                <div className="text-xs text-slate-500">
                  Следующая проверка тренером: {activeTask.deadline}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 text-xs text-slate-400 text-center">
                Нет активных задач
              </div>
            )}

            <button
              onClick={() => setActiveModalText({
                title: 'Методическое задание',
                content: `Упражнение: ${activeTask ? activeTask.exerciseTitle : 'Отработка захватов'}\n\nИнструкция: Встать в правостороннюю стойку, захватить отворот и рукав партнера. При срыве захвата удерживать устойчивую позицию и не наклонять корпус вперед. Повторить по 10 раз с каждой стороны.`
              })}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-slate-600" />
              <span>Инструкция к упражнению</span>
            </button>
          </div>

          {/* Block: «Личный зачет и достижения» */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h2 className="font-extrabold text-slate-900 text-base">Личный зачёт навыка</h2>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950 text-sm">
                  {completedTask ? completedTask.skillTitle : 'Срыв захвата с контролем дистанции'}
                </span>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded">
                  Освоено (Правило S/3S)
                </span>
              </div>
              <p className="text-xs text-emerald-900">
                3 успешных проверки тренером на разных тренировках зафиксированы. Навык внесен в личный актив!
              </p>
            </div>
          </div>

          {/* Block: «Ближайший турнир» */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h2 className="font-extrabold text-slate-900 text-base">Ближайший старт</h2>
              </div>
              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                {upcomingCompetition?.date || '24 октября 2026'}
              </span>
            </div>

            {upcomingCompetition ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 text-sm">{upcomingCompetition.title}</div>
                <div className="text-xs text-slate-600">Место: {upcomingCompetition.location}</div>
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-slate-500">Статус допуска:</span>
                  <span className={`font-bold px-2 py-0.5 rounded ${
                    me.admissionDecision.status === 'admitted'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {me.admissionDecision.status === 'admitted' ? 'Допущен тренером' : 'Ожидает решения'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 text-xs text-slate-400 text-center">
                Нет запланированных стартов
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ATHLETE SESSIONS */}
      {navTab === 'athlete_sessions' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">Расписание и тренировки</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              План занятий, время начала и история твоих посещений
            </p>
          </div>

          <div className="space-y-4">
            {sessions.map(s => {
              const status = s.attendance[me.id] || 'unmarked';

              return (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 text-base">{s.date}</span>
                      <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {s.timeRange}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-slate-800">{s.topic}</div>
                    <div className="text-xs text-slate-500">Зал самбо №1 • Форма самбо</div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {status === 'present' && (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Был на занятии
                      </span>
                    )}
                    {status === 'absent' && (
                      <span className="px-3 py-1.5 rounded-xl bg-red-100 text-red-800 text-xs font-bold">
                        Пропуск
                      </span>
                    )}
                    {status === 'excused' && (
                      <span className="px-3 py-1.5 rounded-xl bg-blue-100 text-blue-800 text-xs font-bold flex items-center gap-1.5">
                        <Clock className="w-4 h-4" /> Уважительный пропуск
                      </span>
                    )}
                    {status === 'unmarked' && (
                      <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">
                        Запланировано
                      </span>
                    )}

                    <button
                      onClick={() => setActiveModalText({
                        title: `План занятия: ${s.topic}`,
                        content: `Дата: ${s.date} (${s.timeRange})\n\nЭтапы занятия:\n${s.plan.map(p => `• ${p.timeRange}: ${p.title}`).join('\n')}`
                      })}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
                    >
                      План
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: ATHLETE TASKS */}
      {navTab === 'athlete_tasks' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">Индивидуальные задачи</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Задания тренера для отработки приемов и физической подготовки
            </p>
          </div>

          <div className="space-y-4">
            {myTasks.length > 0 ? (
              myTasks.map(task => {
                const isCompleted = task.status === 'completed';

                return (
                  <div
                    key={task.id}
                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div>
                        <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
                          Навык: {task.skillTitle}
                        </span>
                        <h3 className="text-base font-black text-slate-900 mt-0.5">
                          {task.exerciseTitle}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                          isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isCompleted ? 'Выполнено' : 'В работе'}
                        </span>

                        <button
                          onClick={() => handleTaskToggle(task.id, task.status)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                            isCompleted
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                          }`}
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>{isCompleted ? 'Сбросить' : 'Я выполнил!'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600">
                      <strong>Наблюдение тренера: </strong>{task.observation}
                    </div>

                    <div className="text-xs text-slate-500 flex items-center justify-between">
                      <span>Срок контроля: <strong>{task.deadline}</strong></span>
                      {task.completedAt && <span>Дата выполнения: {task.completedAt}</span>}
                    </div>

                    {task.coachFeedback && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950">
                        <span className="font-bold">Отзыв тренера: </span>{task.coachFeedback}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
                Нет назначенных задач
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: ATHLETE COMPETITIONS */}
      {navTab === 'athlete_competitions' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">Соревнования и допуск</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Календарь официальных стартов, категория участия и статус готовности
            </p>
          </div>

          <div className="space-y-4">
            {competitions.map(comp => {
              const myParticipation = comp.participants.find(p => p.athleteId === me.id);
              const isAdmitted = me.admissionDecision.status === 'admitted';

              return (
                <div
                  key={comp.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-xs font-bold text-red-600 uppercase">Официальный турнир</span>
                      <h3 className="text-lg font-black text-slate-900">{comp.title}</h3>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {comp.date} • {comp.location}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isAdmitted ? (
                        <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> Допуск подтвержден
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-800 text-xs font-bold flex items-center gap-1.5">
                          <Clock className="w-4 h-4" /> Ожидает решения тренера
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="font-bold text-slate-800">Весовая категория: </span>
                      {myParticipation ? myParticipation.category : 'Юноши до 42 кг'}
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="font-bold text-slate-800">Цель на старт: </span>
                      {myParticipation?.nextGoal || 'Выход в полуфинал, техничные броски'}
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Основание решения тренера: {me.admissionDecision.basis}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
