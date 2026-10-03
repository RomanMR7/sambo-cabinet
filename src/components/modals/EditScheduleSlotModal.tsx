import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ScheduleSlot, SportDiscipline } from '../../types';
import { X, Calendar, Save, Trash2, AlertTriangle, AlertCircle } from 'lucide-react';
import { checkScheduleConflict, getCoachShortName, parseTimeInterval, canonicalizeDay, canonicalizeHall } from '../../utils/rules';

interface Props {
  slot?: ScheduleSlot | null; // null = adding new slot
  initialDay?: string;
  initialHall?: string;
  initialTime?: string;
  onClose: () => void;
  onSaved?: () => void;
}

const SPORT_OPTIONS: Array<{
  id: SportDiscipline;
  label: string;
  colorTheme: 'red' | 'emerald' | 'amber';
  badgeClass: string;
  description: string;
}> = [
  {
    id: 'sambo',
    label: 'Самбо',
    colorTheme: 'red',
    badgeClass: 'bg-red-50 text-red-700 border-red-200',
    description: 'Борьба в одежде: стойка, партер, броски'
  },
  {
    id: 'karate',
    label: 'Карате Кёкусинкай',
    colorTheme: 'emerald',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Ударная техника, ката, кумитэ'
  },
  {
    id: 'fitness',
    label: 'ОФП и акробатика',
    colorTheme: 'amber',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'Силовая подготовка, гибкость, баланс'
  }
];

const PRESET_HALLS = ['Зал самбо №1', 'Зал самбо №2 (ОФП)'];

export const PRESET_SCHEDULE_TIMES = [
  '17:00–18:30',
  '17:30–19:00',
  '18:00–19:00',
  '18:45–20:30',
  '19:15–20:45',
  '10:00–11:30',
  '12:00–14:00'
];

export const PRESET_SCHEDULE_NOTES = [
  'Техника в стойке и броски',
  'Борьба в партере и болевые',
  'Спарринги и схватки',
  'Ката и кихон',
  'Круговая ОФП',
  'День борьбы'
];

export interface AutoLinkScheduleResult {
  group: string;
  coach?: string;
  sport?: SportDiscipline;
  sportLabel?: string;
  hall?: string;
}

export function autoLinkScheduleByGroup(
  selectedGroup?: string | null,
  defaultCoachName: string = 'Иванов А. В.',
  groups: Array<{ name: string; coachName?: string }> = []
): AutoLinkScheduleResult {
  if (!selectedGroup || typeof selectedGroup !== 'string') {
    return { group: '' };
  }
  const cleanGroup = selectedGroup.trim();
  if (!cleanGroup) {
    return { group: '' };
  }
  const lower = cleanGroup.toLowerCase();

  // 1. OFP / Fitness preset (must be checked before generic "Группа 1" to avoid greedy match on "Группа 1 (ОФП)")
  if (lower.includes('офп')) {
    return {
      group: cleanGroup,
      sport: 'fitness',
      sportLabel: 'ОФП и акробатика',
      hall: 'Зал самбо №2 (ОФП)'
    };
  }

  // 2. Karate presets
  if (lower.includes('карат')) {
    return {
      group: cleanGroup,
      coach: 'Васильев К. М.',
      sport: 'karate',
      sportLabel: 'Карате Кёкусинкай'
    };
  }

  // 3. Open mat / Day of wrestling
  if (lower.includes('день борьбы') || lower.includes('открытый ковёр') || lower.includes('открытый ковер')) {
    return {
      group: cleanGroup,
      sport: 'sambo',
      sportLabel: 'Самбо',
      hall: 'Зал самбо №1',
      coach: defaultCoachName
    };
  }

  // 4. Registered club groups from context (exact match)
  const safeGroups = Array.isArray(groups)
    ? groups.filter((g): g is { name: string; coachName?: string } => !!(g && typeof g.name === 'string'))
    : [];
  const found = safeGroups.find(
    g => g.name.toLowerCase().trim() === lower
  );
  if (found) {
    return {
      group: cleanGroup,
      coach: found.coachName ? getCoachShortName(found.coachName) : defaultCoachName,
      sport: 'sambo',
      sportLabel: 'Самбо',
      hall: 'Зал самбо №1'
    };
  }

  // 5. Group 2 (Sambo - Petrov, Hall 1)
  if (cleanGroup === 'Группа 2' || /^группа\s*2\b/i.test(cleanGroup)) {
    return {
      group: cleanGroup,
      coach: 'Петров С. Н.',
      sport: 'sambo',
      sportLabel: 'Самбо',
      hall: 'Зал самбо №1'
    };
  }

  // 6. Group 1 or Group 3 (Sambo - Ivanov, Hall 1)
  if (
    cleanGroup === 'Группа 1' ||
    cleanGroup === 'Группа 3' ||
    /^группа\s*[13]\b/i.test(cleanGroup)
  ) {
    return {
      group: cleanGroup,
      coach: 'Иванов А. В.',
      sport: 'sambo',
      sportLabel: 'Самбо',
      hall: 'Зал самбо №1'
    };
  }

  return { group: cleanGroup };
}

export const EditScheduleSlotModal: React.FC<Props> = ({
  slot,
  initialDay,
  initialHall,
  initialTime,
  onClose,
  onSaved
}) => {
  const {
    scheduleSlots,
    addScheduleSlot,
    updateScheduleSlot,
    deleteScheduleSlot,
    clubUsers,
    activeCoachId,
    groups
  } = useApp();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [day, setDay] = useState(slot?.day || initialDay || 'Понедельник');
  const [time, setTime] = useState(slot?.time || initialTime || '18:00–19:30');
  const [hall, setHall] = useState(slot?.hall || initialHall || 'Зал самбо №1');

  // Active coach helper
  const currentCoachUser = clubUsers.find(u => u.id === activeCoachId) || clubUsers.find(u => u.role === 'coach');
  const defaultCoachName = currentCoachUser ? getCoachShortName(currentCoachUser.fullName) : 'Иванов А. В.';

  const [coach, setCoach] = useState(slot?.coach || defaultCoachName);
  const [group, setGroup] = useState(slot?.group || 'Группа 1');
  const [sport, setSport] = useState<SportDiscipline>(slot?.sport || 'sambo');
  const [sportLabel, setSportLabel] = useState(
    slot?.sportLabel || (slot?.sport === 'karate' ? 'Карате Кёкусинкай' : slot?.sport === 'fitness' ? 'ОФП и акробатика' : 'Самбо')
  );
  const [notes, setNotes] = useState(slot?.notes || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Close on Escape (only when not submitting)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isSubmitting]);

  // Real-time conflict detection against other slots
  const conflict = useMemo(() => {
    return checkScheduleConflict(scheduleSlots, {
      id: slot?.id,
      day,
      time,
      hall
    });
  }, [scheduleSlots, slot?.id, day, time, hall]);

  const daysOfWeek = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

  const groupPresets = useMemo(() => {
    const samboGroupNames = (groups || [])
      .filter(g => g && typeof g.name === 'string')
      .map(g => g.name);
    const extraPresets = [
      'Карате (Юноши, Кёкусинкай)',
      'Карате (Взрослые, ката и кумитэ)',
      'Группа 1 (ОФП)',
      'Открытый ковёр / День борьбы'
    ];
    return Array.from(new Set([...samboGroupNames, ...extraPresets]));
  }, [groups]);

  const coachPresets = useMemo(() => {
    const clubCoaches = (clubUsers || [])
      .filter(u => u && u.role === 'coach' && u.fullName)
      .map(u => getCoachShortName(u.fullName))
      .filter(Boolean);
    const list = clubCoaches.length > 0
      ? [...clubCoaches, 'Васильев К. М.']
      : ['Иванов А. В.', 'Петров С. Н.', 'Васильев К. М.'];
    return Array.from(new Set(list));
  }, [clubUsers]);

  const handleGroupSelect = (selectedGroup: string) => {
    const linked = autoLinkScheduleByGroup(selectedGroup, defaultCoachName, groups);
    setGroup(linked.group);
    if (linked.coach) setCoach(linked.coach);
    if (linked.sport) setSport(linked.sport);
    if (linked.sportLabel) setSportLabel(linked.sportLabel);
    if (linked.hall) setHall(linked.hall);
    setErrorMsg(null);
  };

  const handleSportSelect = (selectedSport: SportDiscipline) => {
    setSport(selectedSport);
    const isKnownKaratePreset =
      group === 'Карате (Юноши, Кёкусинкай)' ||
      group === 'Карате (Взрослые, ката и кумитэ)';
    const isKnownOfpPreset = group === 'Группа 1 (ОФП)';
    const isStandardSamboPreset =
      group === 'Группа 1' ||
      group === 'Группа 2' ||
      group === 'Группа 3' ||
      group === 'Группа 1 (Начальная подготовка)' ||
      group === 'Группа 2 (Учебно-тренировочная)' ||
      group === 'Группа 3 (Спортивное совершенствование)' ||
      group === 'Открытый ковёр / День борьбы';

    if (selectedSport === 'karate') {
      setSportLabel('Карате Кёкусинкай');
      if (isStandardSamboPreset || isKnownOfpPreset || !group) {
        setGroup('Карате (Юноши, Кёкусинкай)');
      }
      if (
        coach === defaultCoachName ||
        coach === 'Иванов А. В.' ||
        coach === 'Иванов А.В.' ||
        coach === 'Петров С. Н.' ||
        coach === 'Петров С.Н.'
      ) {
        setCoach('Васильев К. М.');
      }
    } else if (selectedSport === 'fitness') {
      setSportLabel('ОФП и акробатика');
      if (isStandardSamboPreset || isKnownKaratePreset || !group) {
        setGroup('Группа 1 (ОФП)');
      }
      if (canonicalizeHall(hall) === 'зал 1' || hall === 'Зал самбо №1') {
        setHall('Зал самбо №2 (ОФП)');
      }
    } else {
      setSportLabel('Самбо');
      if (isKnownKaratePreset || isKnownOfpPreset || !group) {
        setGroup('Группа 1');
      }
      if (coach === 'Васильев К. М.' || coach === 'Васильев К.М.') {
        setCoach(defaultCoachName);
      }
      if (canonicalizeHall(hall) === 'зал 2' || hall === 'Зал самбо №2 (ОФП)') {
        setHall('Зал самбо №1');
      }
    }
    setErrorMsg(null);
  };

  const validate = (): string | null => {
    if (!day.trim() || !canonicalizeDay(day)) {
      return 'Выберите день недели проведения занятия.';
    }

    const trimmedTime = time.trim();
    if (!trimmedTime) {
      return 'Укажите время проведения занятия (например, "18:00–19:30").';
    }

    const interval = parseTimeInterval(trimmedTime);
    if (!interval) {
      return 'Некорректный формат времени. Используйте формат ЧЧ:ММ–ЧЧ:ММ (например, "18:00–19:30"), где время начала строго раньше времени окончания.';
    }

    const trimmedHall = hall.trim();
    if (!trimmedHall || trimmedHall.length < 2) {
      return 'Укажите зал проведения тренировки.';
    }

    const trimmedCoach = coach.trim();
    if (!trimmedCoach || trimmedCoach.length < 3) {
      return 'Укажите ФИО тренера занятия.';
    }

    const trimmedGroup = group.trim();
    if (!trimmedGroup || trimmedGroup.length < 2) {
      return 'Укажите название группы.';
    }

    if (conflict.hasConflict && conflict.message) {
      return conflict.message;
    }

    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const err = validate();
    if (err) {
      setErrorMsg(err);
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedSportMeta = SPORT_OPTIONS.find(s => s.id === sport);
      const colorTheme = selectedSportMeta?.colorTheme || 'red';

      const payload = {
        day: day.trim(),
        time: time.trim(),
        hall: hall.trim(),
        coach: coach.trim(),
        group: group.trim(),
        sport,
        sportLabel: sportLabel.trim() || selectedSportMeta?.label || 'Самбо',
        colorTheme,
        notes: notes.trim() || undefined
      };

      if (slot) {
        updateScheduleSlot(slot.id, payload);
      } else {
        addScheduleSlot(payload);
      }

      if (onSaved) onSaved();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (isSubmitting) return;
    if (slot && confirm(`Удалить слот «${slot.group || 'Занятие'}» (${slot.time})?`)) {
      setIsSubmitting(true);
      try {
        deleteScheduleSlot(slot.id);
        if (onSaved) onSaved();
        onClose();
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div
      onClick={e => {
        if (!isSubmitting && e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                sport === 'karate'
                  ? 'bg-emerald-600'
                  : sport === 'fitness'
                  ? 'bg-amber-500'
                  : 'bg-red-600'
              }`}
            >
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {slot ? 'Редактировать занятие в зале' : 'Добавить занятие в сетку'}
              </h3>
              <p className="text-xs text-slate-400">Планировщик залов и совместного использования</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Закрыть модальное окно"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Conflict Alert Banner */}
        {conflict.hasConflict && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-start gap-2.5 text-xs text-amber-900 animate-fadeIn">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold block text-amber-950">Обнаружено пересечение залов (Double Booking):</span>
              <span className="text-amber-800 leading-relaxed block">{conflict.message}</span>
            </div>
          </div>
        )}

        {/* Validation Error Banner */}
        {errorMsg && !conflict.hasConflict && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-start gap-2.5 text-xs text-red-800 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-slate-800">
          {/* Discipline Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Дисциплина / Секция *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {SPORT_OPTIONS.map(opt => {
                const isSelected = sport === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSportSelect(opt.id)}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? opt.id === 'karate'
                          ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20 shadow-sm'
                          : opt.id === 'fitness'
                          ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-500/20 shadow-sm'
                          : 'border-red-500 bg-red-50/80 ring-2 ring-red-500/20 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className="text-xs font-extrabold text-slate-900 block">{opt.label}</span>
                    <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{opt.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Group / Section */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Группа / Секция *
            </label>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {groupPresets.map(grp => {
                const isMatchGroup1 = (s: string) => /^группа\s*1\b/i.test(s.trim());
                const isMatchGroup2 = (s: string) => /^группа\s*2\b/i.test(s.trim());
                const isMatchGroup3 = (s: string) => /^группа\s*3\b/i.test(s.trim());

                const isActive =
                  group.trim().toLowerCase() === grp.trim().toLowerCase() ||
                  (!group.includes('ОФП') &&
                    !grp.includes('ОФП') &&
                    ((isMatchGroup1(group) && isMatchGroup1(grp)) ||
                      (isMatchGroup2(group) && isMatchGroup2(grp)) ||
                      (isMatchGroup3(group) && isMatchGroup3(grp))));
                return (
                  <button
                    key={grp}
                    type="button"
                    onClick={() => handleGroupSelect(grp)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition border ${
                      isActive
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                    }`}
                  >
                    {grp}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              required
              value={group}
              onChange={e => {
                setGroup(e.target.value);
                setErrorMsg(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              placeholder="Группа 1"
            />
          </div>

          {/* Coach */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Тренер *
            </label>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {coachPresets.map(c => {
                const isSelected =
                  coach.trim().toLowerCase() === c.toLowerCase() ||
                  coach.trim().replace(/\.\s*/g, '.') === c.replace(/\.\s*/g, '.');
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setCoach(c);
                      setErrorMsg(null);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition border ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              required
              value={coach}
              onChange={e => {
                setCoach(e.target.value);
                setErrorMsg(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              placeholder="Иванов А. В."
            />
          </div>

          {/* Day & Hall Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                День недели *
              </label>
              <select
                value={day}
                onChange={e => {
                  setDay(e.target.value);
                  setErrorMsg(null);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white"
              >
                {daysOfWeek.map(d => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Спортивный зал *
              </label>
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {PRESET_HALLS.map(h => {
                  const isSelected =
                    canonicalizeHall(hall) === canonicalizeHall(h) ||
                    hall.trim().toLowerCase() === h.toLowerCase();
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => {
                        setHall(h);
                        setErrorMsg(null);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition border ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                      }`}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                required
                value={hall}
                onChange={e => {
                  setHall(e.target.value);
                  setErrorMsg(null);
                }}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                placeholder="Зал самбо №1"
              />
            </div>
          </div>

          {/* Time Slot */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Время проведения *
            </label>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {PRESET_SCHEDULE_TIMES.map(t => {
                const isSelected =
                  time === t ||
                  time.trim().replace(/\./g, ':').replace(/\s*[\-\u2010-\u2015\u2212\uFE58\uFF0D–—]\s*/, '–') === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setTime(t);
                      setErrorMsg(null);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition border font-mono ${
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
              value={time}
              onChange={e => {
                setTime(e.target.value);
                setErrorMsg(null);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 ${
                conflict.hasConflict
                  ? 'border-amber-400 bg-amber-50/30 focus:ring-amber-500/20 focus:border-amber-500'
                  : 'border-slate-300 focus:ring-red-500/20 focus:border-red-500'
              }`}
              placeholder="18:00–19:30"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Формат: ЧЧ:ММ–ЧЧ:ММ (напр. 17:30–19:00)</span>
          </div>

          {/* Notes / Special Focus */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Примечание (направленность занятия)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {PRESET_SCHEDULE_NOTES.map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setNotes(n);
                    setErrorMsg(null);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition border ${
                    notes.trim() === n
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              placeholder="Напр., Базовая техника кихон и ката, ОФП, спарринги"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            {slot ? (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDelete}
                className={`px-3.5 py-2 rounded-xl text-red-600 hover:bg-red-50 text-xs font-bold transition flex items-center gap-1.5 ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Удаление...' : 'Удалить слот'}</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onClose}
                className={`px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isSubmitting || conflict.hasConflict}
                className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition flex items-center gap-2 ${
                  conflict.hasConflict
                    ? 'bg-slate-400 cursor-not-allowed'
                    : isSubmitting
                    ? 'bg-red-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 shadow-red-900/20'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'Сохранение...' : slot ? 'Сохранить изменения' : 'Добавить в сетку'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
