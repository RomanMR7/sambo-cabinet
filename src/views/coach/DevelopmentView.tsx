import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { evaluateS3Rule } from '../../utils/rules';
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Plus,
  ExternalLink,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { ObservationTaskModal } from '../../components/modals/ObservationTaskModal';

export const DevelopmentView: React.FC = () => {
  const {
    skills,
    skillChecks,
    athletes,
    tasks,
    weights,
    videoNotes,
    recordSkillCheck,
    toggleTaskStatus,
    addWeight,
    addVideoNote
  } = useApp();

  const [activeTab, setActiveTab] = useState<'s3' | 'catalog' | 'tasks' | 'weights' | 'video'>('s3');
  const [isObsModalOpen, setIsObsModalOpen] = useState(false);
  const [modalSkillId, setModalSkillId] = useState<string | undefined>(undefined);

  // Form states for Weight
  const [weightAthleteId, setWeightAthleteId] = useState('ath-1');
  const [weightKg, setWeightKg] = useState('38.5');
  const [weightContext, setWeightContext] = useState('Перед вечерней тренировкой');

  // Form states for Video
  const [videoAthleteId, setVideoAthleteId] = useState('ath-1');
  const [videoTitle, setVideoTitle] = useState('Разбор контратаки');
  const [videoUrl, setVideoUrl] = useState('https://rutube.ru/video/sambo-example');
  const [videoTimestamp, setVideoTimestamp] = useState('02:15');
  const [videoNoteText, setVideoNoteText] = useState('Своевременный подворот таза при срыве захвата соперника');

  const handleAddWeight = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(weightKg);
    if (isNaN(val) || val <= 0) return;

    addWeight({
      athleteId: weightAthleteId,
      date: '2026-10-06',
      weightKg: val,
      context: weightContext.trim() || 'Взвешивание в зале'
    });
    setWeightContext('');
  };

  const handleAddVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoTitle.trim()) return;

    addVideoNote({
      athleteId: videoAthleteId,
      title: videoTitle.trim(),
      videoUrl: videoUrl.trim(),
      timestamp: videoTimestamp.trim() || '00:00',
      note: videoNoteText.trim()
    });
    setVideoTitle('');
    setVideoNoteText('');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider">
            <Award className="w-3.5 h-3.5" />
            <span>Методический блок</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Развитие и Навыки
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Правило S/3S • Индивидуальные траектории • Каталог приемов самбо
          </p>
        </div>

        <button
          onClick={() => {
            setModalSkillId(undefined);
            setIsObsModalOpen(true);
          }}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-sm transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>+ Создать задачу из наблюдения</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('s3')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 's3' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Модуль S/3S (Контроль проверок)
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'catalog' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Каталог приёмов
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'tasks' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Индивидуальные задачи ({tasks.length})
        </button>
        <button
          onClick={() => setActiveTab('weights')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'weights' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Дневник веса (Этический стандарт)
        </button>
        <button
          onClick={() => setActiveTab('video')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'video' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Видеоразбор с таймкодами
        </button>
      </div>

      {/* TAB 1: S/3S MODULE */}
      {activeTab === 's3' && (
        <div className="space-y-6">
          {/* Rule banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-red-900 via-slate-900 to-slate-900 text-white shadow-md flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-red-200 uppercase tracking-wider">
                Алгоритм оценки прогресса — «Правило S/3S»
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                <span className="font-bold text-white">S</span> — количество успешных проверок одного конкретного критерия.
                Требуется строго <span className="font-bold text-white">3 проверки на разных занятиях</span>.
                <span className="text-amber-300 font-semibold"> Неизвестное (null) не равно нулю:</span> итоговый зачет по навыку выносится только тогда, когда известны результаты всех трёх проверок.
                Результат является исключительно личным прогрессом ребёнка без межличностного публичного ранжирования.
              </p>
            </div>
          </div>

          {/* Cards of S/3S per athlete and skill */}
          {skillChecks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
              Записи проверок навыков отсутствуют.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {skillChecks.map(sc => {
              const athlete = athletes.find(a => a.id === sc.athleteId);
              const evaluation = evaluateS3Rule(sc.checks);

              return (
                <div
                  key={`${sc.athleteId}-${sc.skillId}`}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between"
                >
                  <div>
                    {/* Athlete & Skill Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center">
                          {athlete?.avatarInitials || 'СП'}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900">{athlete?.shortName}</div>
                          <div className="text-[11px] text-slate-500 font-medium">{sc.skillTitle}</div>
                        </div>
                      </div>

                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${evaluation.badgeColor}`}>
                        {evaluation.statusText}
                      </span>
                    </div>

                    {/* 3 Checks Indicator with Interactive Controls */}
                    <div className="mt-4 space-y-2">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        3 контрольные проверки на занятиях:
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {sc.checks.map((chk, idx) => {
                          const isSuccess = chk.success === true;
                          const isFail = chk.success === false;
                          const isUnknown = chk.success === null;

                          return (
                            <div
                              key={idx}
                              className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-between gap-1.5 ${
                                isSuccess
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                  : isFail
                                  ? 'bg-red-50 border-red-300 text-red-800'
                                  : 'bg-amber-50 border-amber-300 text-amber-800'
                              }`}
                            >
                              <div className="text-[10px] font-bold uppercase tracking-wider">
                                Проверка {idx + 1}
                              </div>

                              <div className="my-1">
                                {isSuccess && <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />}
                                {isFail && <XCircle className="w-6 h-6 text-red-600 mx-auto" />}
                                {isUnknown && <HelpCircle className="w-6 h-6 text-amber-500 mx-auto" />}
                              </div>

                              <div className="text-[10px] font-mono text-slate-500">
                                {chk.date}
                              </div>

                              {/* Coach quick toggle buttons */}
                              <div className="flex items-center gap-1 mt-1 pt-1 border-t border-slate-200/60 w-full justify-center">
                                <button
                                  onClick={() => recordSkillCheck(sc.athleteId, sc.skillId, idx, true)}
                                  title="Успех (выполнено)"
                                  className={`p-1 rounded text-xs ${
                                    isSuccess ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-200/60 text-slate-600 hover:bg-emerald-200'
                                  }`}
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => recordSkillCheck(sc.athleteId, sc.skillId, idx, false)}
                                  title="Не выполнено"
                                  className={`p-1 rounded text-xs ${
                                    isFail ? 'bg-red-600 text-white font-bold' : 'bg-slate-200/60 text-slate-600 hover:bg-red-200'
                                  }`}
                                >
                                  ✕
                                </button>
                                <button
                                  onClick={() => recordSkillCheck(sc.athleteId, sc.skillId, idx, null)}
                                  title="Неизвестно / не проверялось"
                                  className={`p-1 rounded text-xs ${
                                    isUnknown ? 'bg-amber-500 text-slate-900 font-bold' : 'bg-slate-200/60 text-slate-600 hover:bg-amber-200'
                                  }`}
                                >
                                  ?
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Личный прогресс</span>
                    <span className="font-semibold text-slate-700">
                      Успешно: {evaluation.successCount} из 3
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
      )}

      {/* TAB 2: CATALOG */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {skills.map(skill => (
              <div key={skill.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                      {skill.category}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-base mt-1.5">{skill.title}</h3>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
                  <div>
                    <strong className="text-slate-800">Критерий освоения: </strong>
                    {skill.criteria}
                  </div>
                  <div>
                    <strong className="text-slate-800">Рекомендуемое упражнение: </strong>
                    {skill.recommendedExercise}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setModalSkillId(skill.id);
                    setIsObsModalOpen(true);
                  }}
                  className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1"
                >
                  <span>Назначить спортсмену</span>
                  <span>→</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TASKS */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
              Индивидуальные задачи отсутствуют.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tasks.map(t => {
                const athlete = athletes.find(a => a.id === t.athleteId);
                return (
                  <div key={t.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-500">
                          {athlete?.shortName} • Навык: {t.skillTitle}
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm mt-0.5">{t.exerciseTitle}</h3>
                      </div>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        t.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {t.status === 'completed' ? 'Зачтено' : 'В работе'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div><span className="font-semibold text-slate-700">Наблюдение: </span>{t.observation}</div>
                      <div className="mt-1 text-slate-500">Срок: {t.deadline}</div>
                      {t.coachFeedback && (
                        <div className="mt-1.5 pt-1.5 border-t border-slate-200 font-medium text-emerald-800">
                          Отзыв: {t.coachFeedback}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-400">
                        {t.publishedToFamily ? '✓ Опубликовано родителям' : 'Внутренняя заметка'}
                      </span>

                      <button
                        onClick={() => toggleTaskStatus(t.id, t.status === 'completed' ? 'active' : 'completed')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          t.status === 'completed'
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                        }`}
                      >
                        {t.status === 'completed' ? 'Вернуть в работу' : 'Зачесть выполнение'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ETHICAL WEIGHT DIARY */}
      {activeTab === 'weights' && (
        <div className="space-y-6">
          {/* Ethical Warning Box (Requirement 4.4) */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 shadow-sm flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <span className="font-extrabold block text-sm text-amber-900 mb-0.5">
                Этическое ограничение стандарта ведения дневника веса:
              </span>
              Запись веса содержит строго: дату, числовое значение в килограммах и нейтральный спортивный контекст (например: «Перед утренней тренировкой»).
              <span className="font-bold underline block mt-0.5">
                Строго запрещены автоматические советы, предупреждения о наборе/снижении веса, оценка внешности или расчет дефицита калорий.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Weight Log */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-base">Журнал взвешиваний</h3>
              <div className="divide-y divide-slate-100">
                {weights.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    Записи взвешиваний отсутствуют.
                  </div>
                ) : (
                  weights.map(w => {
                    const athlete = athletes.find(a => a.id === w.athleteId);
                    return (
                      <div key={w.id} className="py-3.5 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-sm text-slate-900">
                            {athlete?.shortName} • {w.date}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">{w.context}</div>
                        </div>
                        <div className="text-base font-black text-slate-900 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200">
                          {w.weightKg} кг
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: Add Weight Form */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-base">Внести взвешивание</h3>
              <form onSubmit={handleAddWeight} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Спортсмен
                  </label>
                  <select
                    value={weightAthleteId}
                    onChange={e => setWeightAthleteId(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300"
                  >
                    {athletes.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.shortName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Вес (кг)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={weightKg}
                    onChange={e => setWeightKg(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm font-bold rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Нейтральный контекст
                  </label>
                  <input
                    type="text"
                    value={weightContext}
                    onChange={e => setWeightContext(e.target.value)}
                    placeholder="Перед тренировкой..."
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow transition"
                >
                  Зафиксировать запись
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: VIDEO ANALYSIS */}
      {activeTab === 'video' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs">
            <span className="font-bold">Видеоразбор: </span>
            Система сохраняет URL-ссылку на внешнее видео и текстовую заметку тренера к конкретному таймкоду (файл не дублируется в локальное хранилище).
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              {videoNotes.map(vn => {
                const athlete = athletes.find(a => a.id === vn.athleteId);
                return (
                  <div key={vn.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-500">
                          {athlete?.shortName} • {vn.createdAt}
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mt-0.5">{vn.title}</h4>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 font-mono font-bold text-xs">
                        Таймкод {vn.timestamp}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <strong className="text-slate-800">Заметка тренера: </strong>
                      {vn.note}
                    </div>

                    <div className="pt-2 flex justify-end">
                      <a
                        href={vn.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Открыть видео по ссылке</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
              <h3 className="font-extrabold text-slate-900 text-base">Добавить разбор схватки</h3>
              <form onSubmit={handleAddVideo} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Спортсмен
                  </label>
                  <select
                    value={videoAthleteId}
                    onChange={e => setVideoAthleteId(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300"
                  >
                    {athletes.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.shortName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Тема / Название разбора
                  </label>
                  <input
                    type="text"
                    value={videoTitle}
                    onChange={e => setVideoTitle(e.target.value)}
                    required
                    placeholder="Например: Срыв захвата в четвертьфинале"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Ссылка на видео (URL)
                  </label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={e => setVideoUrl(e.target.value)}
                    required
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Таймкод (мин:сек)
                  </label>
                  <input
                    type="text"
                    value={videoTimestamp}
                    onChange={e => setVideoTimestamp(e.target.value)}
                    placeholder="01:24"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Текстовая заметка к таймкоду
                  </label>
                  <textarea
                    rows={2}
                    value={videoNoteText}
                    onChange={e => setVideoNoteText(e.target.value)}
                    required
                    placeholder="Что произошло на этой секунде..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow transition"
                >
                  Сохранить разбор
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {isObsModalOpen && (
        <ObservationTaskModal
          athleteId={athletes[0]?.id || 'ath-1'}
          initialSkillId={modalSkillId}
          onClose={() => {
            setIsObsModalOpen(false);
            setModalSkillId(undefined);
          }}
        />
      )}
    </div>
  );
};
