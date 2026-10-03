import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ExerciseCategory, ExerciseItem } from '../../types';
import {
  BookOpen,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Dumbbell,
  CheckCircle2,
  Search,
  Sparkles,
  ArrowRight,
  Flame,
  X
} from 'lucide-react';
import { getTodayDate } from '../../utils/calendarEngine';

export const PRESET_TRAINING_TIMES = [
  '17:00–18:30',
  '18:00–19:00',
  '19:00–21:00'
];

export const PRESET_TRAINING_TOPICS = [
  'Броски через спину и бедро',
  'Борьба в партере: болевые и удержания',
  'Подсечки и зацепы',
  'Учебные схватки в стойке',
  'Акробатика и самостраховка'
];

export const TrainingPlansView: React.FC = () => {
  const {
    groups,
    selectedGroupId,
    setSelectedGroupId,
    exercises,
    addExercise,
    createTrainingSessionFromPlan,
    setActiveNav,
    sessions
  } = useApp();

  const [activeTab, setActiveTab] = useState<'builder' | 'catalog'>('builder');

  // Builder state
  const [builderGroupId, setBuilderGroupId] = useState(selectedGroupId || groups[0]?.id || 'grp-1');
  const [builderDate, setBuilderDate] = useState<string>(getTodayDate());
  const [builderTime, setBuilderTime] = useState('18:00–19:30');
  const [builderTopic, setBuilderTopic] = useState('Отработка бросков и тактика борьбы в партере');
  const [planExercises, setPlanExercises] = useState<Array<{ id: string; title: string; durationMinutes: number }>>([
    { id: 'ex-1', title: 'Специальная самбистская разминка и страховка', durationMinutes: 15 },
    { id: 'ex-4', title: 'Бросок через бедро (О-госи) с плотным поясом', durationMinutes: 20 },
    { id: 'ex-10', title: 'Болевой приём: рычаг локтя через бедро', durationMinutes: 20 },
    { id: 'ex-16', title: 'Заминка, растяжка и дыхательное восстановление', durationMinutes: 10 }
  ]);

  // Catalog filter state
  const [catalogCategory, setCatalogCategory] = useState<string>('all');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [builderFilter, setBuilderFilter] = useState<string>('all');
  const [builderSearch, setBuilderSearch] = useState('');

  // Add Exercise Modal state
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  const [isSubmittingExercise, setIsSubmittingExercise] = useState(false);
  const [isSubmittingSession, setIsSubmittingSession] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<ExerciseCategory>('throws');
  const [newIntensity, setNewIntensity] = useState<'low' | 'medium' | 'high'>('high');
  const [newDuration, setNewDuration] = useState('15');
  const [newDescription, setNewDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Success message toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAddExerciseOpen) {
        setIsAddExerciseOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddExerciseOpen]);

  const showToast = (msg: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMsg(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMsg(null);
      toastTimerRef.current = null;
    }, 4000);
  };

  // Add exercise to builder plan
  const handleAddToPlan = (ex: ExerciseItem) => {
    setPlanExercises(prev => [
      ...prev,
      { id: `${ex.id}-${Date.now()}`, title: ex.title, durationMinutes: ex.durationMinutes }
    ]);
    showToast(`Упражнение «${ex.title}» добавлено в план`);
  };

  const handleRemoveFromPlan = (index: number) => {
    setPlanExercises(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateDuration = (index: number, delta: number) => {
    setPlanExercises(prev =>
      prev.map((item, idx) => {
        if (idx === index) {
          const nextVal = Math.max(5, item.durationMinutes + delta);
          return { ...item, durationMinutes: nextVal };
        }
        return item;
      })
    );
  };

  const totalDuration = planExercises.reduce((sum, item) => sum + item.durationMinutes, 0);

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingSession) return;
    if (planExercises.length === 0) {
      alert('Добавьте хотя бы одно упражнение в план занятия.');
      return;
    }
    if (!builderTime.trim()) {
      alert('Укажите время проведения занятия.');
      return;
    }
    if (!builderTopic.trim()) {
      alert('Укажите тему занятия.');
      return;
    }

    setIsSubmittingSession(true);
    try {
      createTrainingSessionFromPlan({
        groupId: builderGroupId,
        date: builderDate,
        timeRange: builderTime.trim(),
        topic: builderTopic.trim(),
        exercises: planExercises.map(pe => ({
          title: pe.title,
          durationMinutes: pe.durationMinutes
        }))
      });

      showToast('Тренировочное занятие успешно создано и добавлено в электронный журнал!');
    } finally {
      setIsSubmittingSession(false);
    }
  };

  const handleSaveNewExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingExercise) return;
    if (!newTitle.trim() || newTitle.trim().length < 3) {
      setFormError('Укажите название упражнения (не менее 3 символов).');
      return;
    }
    if (!newDescription.trim() || newDescription.trim().length < 5) {
      setFormError('Укажите подробное описание техники и методические указания.');
      return;
    }

    const categoryLabels: Record<ExerciseCategory, string> = {
      warmup: 'Разминка',
      throws: 'Приёмы и броски',
      groundwork: 'Борьба в партере',
      sfp: 'СФП и ОФП'
    };

    setIsSubmittingExercise(true);
    try {
      addExercise({
        title: newTitle.trim(),
        category: newCategory,
        categoryLabel: categoryLabels[newCategory],
        intensity: newIntensity,
        durationMinutes: parseInt(newDuration, 10) || 15,
        description: newDescription.trim()
      });

      setNewTitle('');
      setNewDescription('');
      setIsAddExerciseOpen(false);
      setFormError(null);
      showToast('Новое упражнение успешно внесено в банк элементов самбо!');
    } finally {
      setIsSubmittingExercise(false);
    }
  };

  // Filtered exercises for Catalog tab
  const filteredCatalogExercises = exercises.filter(ex => {
    if (catalogCategory !== 'all' && ex.category !== catalogCategory) return false;
    if (catalogSearch.trim()) {
      const q = catalogSearch.toLowerCase();
      return ex.title.toLowerCase().includes(q) || ex.description.toLowerCase().includes(q);
    }
    return true;
  });

  // Filtered exercises for Builder tab selection
  const filteredBuilderExercises = exercises.filter(ex => {
    if (builderFilter !== 'all' && ex.category !== builderFilter) return false;
    if (builderSearch.trim()) {
      const q = builderSearch.toLowerCase();
      return ex.title.toLowerCase().includes(q) || ex.description.toLowerCase().includes(q);
    }
    return true;
  });

  const getIntensityBadge = (intensity: 'low' | 'medium' | 'high') => {
    switch (intensity) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800">
            <Flame className="w-3 h-3 text-red-600" />
            Высокая
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
            Средняя
          </span>
        );
      case 'low':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
            Низкая
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast */}
      {toastMsg && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-md text-sm font-semibold flex items-center justify-between animate-fadeIn">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            {toastMsg}
          </span>
          <button onClick={() => setToastMsg(null)} className="underline text-xs font-bold">
            ОК
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Методический отдел тренера</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Планы тренировок и банк упражнений
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Конструктор тренировочных сессий • Каталог приемов и нормативов по самбо
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddExerciseOpen(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-sm shadow-red-900/20 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить упражнение</span>
          </button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('builder')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'builder'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Конструктор плана занятия</span>
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'catalog'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Банк упражнений самбо ({exercises.length})</span>
        </button>
      </div>

      {/* TAB 1: BUILDER */}
      {activeTab === 'builder' && (
        <div className="space-y-6">
          {/* Builder Top Settings Card */}
          <form onSubmit={handleCreateSession} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-red-600" />
                <span>Параметры планируемой тренировки</span>
              </div>
              <div className="text-xs font-bold text-slate-500">
                Итоговый хронометраж: <span className="text-red-600 font-black">{totalDuration} мин</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Группа самбо *
                  </label>
                  <select
                    value={builderGroupId}
                    onChange={e => {
                      setBuilderGroupId(e.target.value);
                      setSelectedGroupId(e.target.value);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium focus:outline-none focus:border-red-500"
                  >
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Дата занятия *
                  </label>
                  <input
                    type="date"
                    required
                    value={builderDate}
                    onChange={e => setBuilderDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Время проведения *
                  </label>
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {PRESET_TRAINING_TIMES.map(t => {
                      const isSelected =
                        builderTime === t ||
                        builderTime.trim().replace(/\s*[\-\u2010-\u2015\u2212\uFE58\uFF0D–—]\s*/, '–') === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setBuilderTime(t)}
                          className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition border font-mono ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                          }`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    required
                    value={builderTime}
                    onChange={e => setBuilderTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:border-red-500 font-mono"
                    placeholder="18:00–19:30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Тема занятия *
                </label>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {PRESET_TRAINING_TOPICS.map(top => (
                    <button
                      key={top}
                      type="button"
                      onClick={() => setBuilderTopic(top)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition border ${
                        builderTopic.trim() === top
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                      }`}
                    >
                      {top}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  value={builderTopic}
                  onChange={e => setBuilderTopic(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:border-red-500"
                  placeholder="Броски через спину и болевые приемы"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmittingSession}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-red-900/20 transition flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmittingSession ? 'Создание...' : 'Создать занятие в электронном журнале'}</span>
              </button>
            </div>
          </form>

          {/* Builder Two-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Exercise Source Catalog (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-red-600" />
                  <span>Каталог упражнений для включения в план</span>
                </div>
                <div className="text-xs text-slate-400">
                  Нажмите «+ В план» напротив нужного элемента
                </div>
              </div>

              {/* Source Filters */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => setBuilderFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                      builderFilter === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Все
                  </button>
                  <button
                    type="button"
                    onClick={() => setBuilderFilter('warmup')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                      builderFilter === 'warmup'
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Разминка
                  </button>
                  <button
                    type="button"
                    onClick={() => setBuilderFilter('throws')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                      builderFilter === 'throws'
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Броски
                  </button>
                  <button
                    type="button"
                    onClick={() => setBuilderFilter('groundwork')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                      builderFilter === 'groundwork'
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Партер
                  </button>
                  <button
                    type="button"
                    onClick={() => setBuilderFilter('sfp')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                      builderFilter === 'sfp'
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    СФП
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={builderSearch}
                    onChange={e => setBuilderSearch(e.target.value)}
                    placeholder="Поиск приема..."
                    className="pl-8 pr-3 py-1 rounded-lg border border-slate-300 text-xs w-full sm:w-44 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Source List */}
              <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto pr-1">
                {filteredBuilderExercises.map(ex => (
                  <div
                    key={ex.id}
                    className="py-3 px-2 hover:bg-slate-50 transition rounded-xl flex items-start justify-between gap-3 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 group-hover:text-red-700 transition">
                          {ex.title}
                        </span>
                        {getIntensityBadge(ex.intensity)}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {ex.description}
                      </p>
                      <div className="text-[10px] text-slate-400 font-medium">
                        Категория: {ex.categoryLabel} • Реком.: {ex.durationMinutes} мин
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddToPlan(ex)}
                      className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-600 text-red-700 hover:text-white text-xs font-bold transition shrink-0 border border-red-200 hover:border-red-600 flex items-center gap-1 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>В план</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Active Plan Sequence (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-red-600" />
                    <span>Тайминг занятия ({planExercises.length} эл.)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-extrabold text-xs">
                    {totalDuration} мин
                  </span>
                </div>

                {planExercises.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 border border-dashed border-slate-200 rounded-xl p-6">
                    <Dumbbell className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-semibold text-slate-600">В плане пока нет упражнений</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Выберите упражнения из каталога слева, чтобы сформировать тайминг.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                    {planExercises.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-red-300 transition shadow-xs flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-800 truncate" title={item.title}>
                            {item.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Duration adjustments */}
                          <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden text-xs">
                            <button
                              type="button"
                              onClick={() => handleUpdateDuration(idx, -5)}
                              className="px-2 py-1 hover:bg-slate-100 font-bold text-slate-600"
                              title="-5 минут"
                            >
                              -
                            </button>
                            <span className="px-2 font-mono font-bold text-slate-900 text-[11px]">
                              {item.durationMinutes}м
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateDuration(idx, 5)}
                              className="px-2 py-1 hover:bg-slate-100 font-bold text-slate-600"
                              title="+5 минут"
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveFromPlan(idx)}
                            className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Удалить из плана"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Quick Jump to Journal Sessions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Журнал занятий ({sessions.length})</span>
                <button
                  type="button"
                  onClick={() => setActiveNav('sessions')}
                  className="font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <span>Перейти к отметке посещаемости</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CATALOG */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {/* Catalog Controls */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <button
                type="button"
                onClick={() => setCatalogCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  catalogCategory === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Все категории ({exercises.length})
              </button>
              <button
                type="button"
                onClick={() => setCatalogCategory('warmup')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  catalogCategory === 'warmup'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Разминка и страховка
              </button>
              <button
                type="button"
                onClick={() => setCatalogCategory('throws')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  catalogCategory === 'throws'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Приёмы и броски
              </button>
              <button
                type="button"
                onClick={() => setCatalogCategory('groundwork')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  catalogCategory === 'groundwork'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Борьба в партере
              </button>
              <button
                type="button"
                onClick={() => setCatalogCategory('sfp')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  catalogCategory === 'sfp'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                СФП и ОФП
              </button>
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={catalogSearch}
                onChange={e => setCatalogSearch(e.target.value)}
                placeholder="Поиск по базе..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Catalog Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCatalogExercises.map(ex => (
              <div
                key={ex.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {ex.categoryLabel}
                    </span>
                    {getIntensityBadge(ex.intensity)}
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900 mt-1 leading-snug">
                    {ex.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {ex.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    Регламент: <strong className="text-slate-800">{ex.durationMinutes} мин</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      handleAddToPlan(ex);
                      setActiveTab('builder');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition"
                  >
                    В конструктор
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Exercise Modal */}
      {isAddExerciseOpen && (
        <div
          onClick={e => {
            if (e.target === e.currentTarget) setIsAddExerciseOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Добавить упражнение</h3>
                  <p className="text-xs text-slate-400">Пополнение справочника самбо</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddExerciseOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewExercise} className="p-6 overflow-y-auto space-y-4">
              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-semibold">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Название упражнения / приема *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => {
                    setNewTitle(e.target.value);
                    setFormError(null);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-red-500"
                  placeholder="Бросок с упором стопы в живот (Томоэ-нагэ)"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Категория *
                  </label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as ExerciseCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:border-red-500"
                  >
                    <option value="warmup">Разминка и страховка</option>
                    <option value="throws">Приёмы и броски</option>
                    <option value="groundwork">Борьба в партере</option>
                    <option value="sfp">СФП и ОФП</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Интенсивность *
                  </label>
                  <select
                    value={newIntensity}
                    onChange={e => setNewIntensity(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:border-red-500"
                  >
                    <option value="low">Низкая (разминка/заминка)</option>
                    <option value="medium">Средняя (отработка техники)</option>
                    <option value="high">Высокая (схватки/силовая)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Рекомендуемая длительность (минут) *
                </label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  required
                  value={newDuration}
                  onChange={e => setNewDuration(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-red-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Методические указания и техника *
                </label>
                <textarea
                  rows={3}
                  required
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-red-500"
                  placeholder="Опишите фазы захвата, выведения из равновесия, перемещения и контроля страховки..."
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddExerciseOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingExercise}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold"
                >
                  {isSubmittingExercise ? 'Сохранение...' : 'Сохранить в банк'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
