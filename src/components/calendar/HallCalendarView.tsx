import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ScheduleSlot } from '../../types';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Shield,
  Layers
} from 'lucide-react';
import { parseTimeInterval, canonicalizeHall, canonicalizeDay, getCoachShortName } from '../../utils/rules';
import { EditScheduleSlotModal } from '../modals/EditScheduleSlotModal';

const DAYS_OF_WEEK = [
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
  'Воскресенье'
];

const SHORT_DAYS: Record<string, string> = {
  'Понедельник': 'Пн',
  'Вторник': 'Вт',
  'Среда': 'Ср',
  'Четверг': 'Чт',
  'Пятница': 'Пт',
  'Суббота': 'Сб',
  'Воскресенье': 'Вс'
};

function formatMinutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export const HallCalendarView: React.FC = () => {
  const {
    role,
    activeCoachId,
    clubUsers,
    groups,
    scheduleSlots,
    deleteScheduleSlot,
    setSelectedGroupId,
    setActiveNav
  } = useApp();

  // Filters
  const [selectedHall, setSelectedHall] = useState<string>('all'); // 'all' | 'Зал самбо №1' | 'Зал самбо №2 (ОФП)'
  const [selectedSport, setSelectedSport] = useState<string>('all'); // 'all' | 'sambo' | 'karate' | 'fitness'
  const [onlyMyTrainings, setOnlyMyTrainings] = useState<boolean>(false);

  // Modal State
  const [modalSlot, setModalSlot] = useState<ScheduleSlot | null | undefined>(undefined);
  const [prefill, setPrefill] = useState<{ day?: string; hall?: string; time?: string }>({});

  // Active coach user
  const activeCoach = clubUsers.find(u => u.id === activeCoachId) || clubUsers.find(u => u.role === 'coach');
  const activeCoachShort = activeCoach ? getCoachShortName(activeCoach.fullName) : '';

  // Filter slots
  const filteredSlots = useMemo(() => {
    const safeSlots = Array.isArray(scheduleSlots) ? scheduleSlots : [];
    return safeSlots.filter(slot => {
      if (!slot) return false;

      // Hall filter
      if (selectedHall !== 'all') {
        const slotHallCanon = canonicalizeHall(slot.hall);
        const filterHallCanon = canonicalizeHall(selectedHall);
        if (slotHallCanon !== filterHallCanon) return false;
      }

      // Sport filter
      if (selectedSport !== 'all') {
        const slotSport = slot.sport || 'sambo';
        if (slotSport !== selectedSport) return false;
      }

      // Coach only filter
      if (onlyMyTrainings && activeCoachShort) {
        const coachStr = (slot.coach || '').toLowerCase();
        if (!coachStr.includes(activeCoachShort.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [scheduleSlots, selectedHall, selectedSport, onlyMyTrainings, activeCoachShort]);

  // Statistics
  const stats = useMemo(() => {
    const safeSlots = Array.isArray(scheduleSlots) ? scheduleSlots : [];
    const samboCount = safeSlots.filter(s => s && (s.sport || 'sambo') === 'sambo').length;
    const karateCount = safeSlots.filter(s => s && s.sport === 'karate').length;
    const fitnessCount = safeSlots.filter(s => s && s.sport === 'fitness').length;
    const hall1Count = safeSlots.filter(s => s && canonicalizeHall(s.hall) === 'зал 1').length;
    const hall2Count = safeSlots.filter(s => s && canonicalizeHall(s.hall) === 'зал 2').length;

    return {
      total: safeSlots.length,
      sambo: samboCount,
      karate: karateCount,
      fitness: fitnessCount,
      hall1: hall1Count,
      hall2: hall2Count
    };
  }, [scheduleSlots]);

  // Handle open modal for new slot
  const handleAddNewSlot = (day?: string, time?: string, hall?: string) => {
    setModalSlot(null);
    setPrefill({
      day: day || 'Понедельник',
      time: time || '18:00–19:30',
      hall: hall || (selectedHall !== 'all' ? selectedHall : 'Зал самбо №1')
    });
  };

  // Quick navigation for coach to training journal
  const handleJumpToJournal = (slot: ScheduleSlot) => {
    if (!slot) return;
    const slotGroupName = (slot.group || '').toLowerCase();
    const safeGroups = Array.isArray(groups) ? groups : [];
    const matchedGroup = safeGroups.find(
      g =>
        g &&
        g.name &&
        (slotGroupName.includes(g.name.toLowerCase()) ||
          g.name.toLowerCase().includes(slotGroupName))
    );
    if (matchedGroup) {
      setSelectedGroupId(matchedGroup.id);
    }
    setActiveNav('today');
  };

  // Group slots by day
  const slotsByDay = useMemo(() => {
    const map: Record<string, ScheduleSlot[]> = {};
    for (const day of DAYS_OF_WEEK) {
      map[day] = [];
    }

    for (const slot of filteredSlots) {
      if (!slot) continue;
      const canon = canonicalizeDay(slot.day);
      const targetDay = DAYS_OF_WEEK.find(d => canonicalizeDay(d) === canon) || DAYS_OF_WEEK[0];
      if (!map[targetDay]) {
        map[targetDay] = [];
      }
      map[targetDay].push(slot);
    }

    // Sort each day chronologically by start time
    for (const day of DAYS_OF_WEEK) {
      map[day].sort((a, b) => {
        const intA = parseTimeInterval(a.time)?.start ?? 0;
        const intB = parseTimeInterval(b.time)?.start ?? 0;
        return intA - intB;
      });
    }

    return map;
  }, [filteredSlots]);

  // Compute free time windows for a day in a given hall (operational window: 09:00 - 21:30)
  const getFreeWindows = (daySlots: ScheduleSlot[], currentHall: string) => {
    const targetHallCanon = canonicalizeHall(currentHall);
    const hallSlots = daySlots
      .filter(s => canonicalizeHall(s.hall) === targetHallCanon)
      .map(s => parseTimeInterval(s.time))
      .filter((int): int is { start: number; end: number } => int !== null)
      .sort((a, b) => a.start - b.start);

    if (hallSlots.length === 0) return [];

    const freeWindows: Array<{ start: number; end: number; label: string }> = [];
    let currentPointer = 9 * 60; // 09:00
    const endOfDay = 21 * 60 + 30; // 21:30

    for (const slot of hallSlots) {
      if (slot.start > currentPointer + 30) {
        // Gap of at least 30 minutes
        freeWindows.push({
          start: currentPointer,
          end: slot.start,
          label: `${formatMinutesToTime(currentPointer)}–${formatMinutesToTime(slot.start)}`
        });
      }
      currentPointer = Math.max(currentPointer, slot.end);
    }

    if (currentPointer + 45 < endOfDay) {
      freeWindows.push({
        start: currentPointer,
        end: endOfDay,
        label: `${formatMinutesToTime(currentPointer)}–${formatMinutesToTime(endOfDay)}`
      });
    }

    return freeWindows;
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/30 border border-red-500/40 text-red-300 text-xs font-bold tracking-wide uppercase">
              <Calendar className="w-3.5 h-3.5" />
              <span>Расписание залов и татами клуба</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Планировщик совместного использования залов
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Координация ковра для школы самбо, секции карате Кёкусинкай и групп ОФП. Автоматический контроль
              накладок (Double Booking) и прозрачный график занятости ковров.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => handleAddNewSlot()}
              className="px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-red-900/40 transition flex items-center justify-center gap-2 group"
            >
              <Plus className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span>+ Добавить занятие в сетку</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-700/60">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Всего тренировок</div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">{stats.total}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">В неделю в расписании</div>
          </div>

          <div className="bg-red-500/10 rounded-2xl p-3 border border-red-500/20">
            <div className="text-[11px] font-bold text-red-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Самбо
            </div>
            <div className="text-xl sm:text-2xl font-black text-red-200 mt-1">{stats.sambo}</div>
            <div className="text-[10px] text-red-300/80 mt-0.5">Группы 1, 2, 3 и день борьбы</div>
          </div>

          <div className="bg-emerald-500/10 rounded-2xl p-3 border border-emerald-500/20">
            <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Карате Кёкусинкай
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-200 mt-1">{stats.karate}</div>
            <div className="text-[10px] text-emerald-300/80 mt-0.5">Юноши и взрослые (Зал №1)</div>
          </div>

          <div className="bg-amber-500/10 rounded-2xl p-3 border border-amber-500/20">
            <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              ОФП и акробатика
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-200 mt-1">{stats.fitness}</div>
            <div className="text-[10px] text-amber-300/80 mt-0.5">Зал самбо №2 (ОФП)</div>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Hall Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          <span className="text-xs font-bold text-slate-500 mr-1.5 shrink-0 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            Зал:
          </span>
          <button
            onClick={() => setSelectedHall('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedHall === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Все залы ({stats.total})
          </button>
          <button
            onClick={() => setSelectedHall('Зал самбо №1')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedHall === 'Зал самбо №1'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Зал самбо №1 ({stats.hall1})
          </button>
          <button
            onClick={() => setSelectedHall('Зал самбо №2 (ОФП)')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedHall === 'Зал самбо №2 (ОФП)'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Зал самбо №2 (ОФП) ({stats.hall2})
          </button>
        </div>

        {/* Discipline and Coach Filter */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setSelectedSport('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                selectedSport === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Все виды
            </button>
            <button
              onClick={() => setSelectedSport('sambo')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                selectedSport === 'sambo'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-red-700'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Самбо
            </button>
            <button
              onClick={() => setSelectedSport('karate')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                selectedSport === 'karate'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Карате
            </button>
            <button
              onClick={() => setSelectedSport('fitness')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                selectedSport === 'fitness'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              ОФП
            </button>
          </div>

          {role === 'coach' && (
            <button
              onClick={() => setOnlyMyTrainings(!onlyMyTrainings)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border shrink-0 flex items-center gap-1.5 ${
                onlyMyTrainings
                  ? 'bg-red-50 border-red-300 text-red-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Только мои занятия</span>
            </button>
          )}
        </div>
      </div>

      {/* Hall Shared Legend */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-bold text-slate-800">Дисциплины ковра:</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-red-600 inline-block" />
            <strong className="text-slate-900">Самбо</strong> (Школа самбо)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-emerald-600 inline-block" />
            <strong className="text-slate-900">Карате Кёкусинкай</strong> (Васильев К. М.)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-amber-500 inline-block" />
            <strong className="text-slate-900">ОФП и акробатика</strong> (Зал №2)
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>Контроль пересечений активен: система блокирует накладки в одном зале</span>
        </div>
      </div>

      {/* Zero filter results banner */}
      {filteredSlots.length === 0 && scheduleSlots.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center space-y-2.5 animate-fadeIn">
          <p className="text-xs text-amber-900 font-bold">
            По выбранным фильтрам занятий не найдено (всего в базе {scheduleSlots.length} занятий).
          </p>
          <button
            onClick={() => {
              setSelectedHall('all');
              setSelectedSport('all');
              setOnlyMyTrainings(false);
            }}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition shadow-sm"
          >
            Сбросить фильтры
          </button>
        </div>
      )}

      {/* Calendar Grid: 7 days columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
        {DAYS_OF_WEEK.map((dayName) => {
          const slots = slotsByDay[dayName] || [];
          const isWeekend = dayName === 'Суббота' || dayName === 'Воскресенье';
          const freeWindows = selectedHall !== 'all' ? getFreeWindows(slots, selectedHall) : [];

          return (
            <div
              key={dayName}
              className={`rounded-2xl border flex flex-col transition ${
                isWeekend ? 'bg-slate-50/70 border-slate-200' : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              {/* Day Header */}
              <div
                className={`p-3.5 border-b flex items-center justify-between ${
                  isWeekend
                    ? 'bg-slate-100/80 border-slate-200 text-slate-900'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                <div>
                  <div className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                      {SHORT_DAYS[dayName]}
                    </span>
                    <span>{dayName}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                    {slots.length === 0
                      ? 'Нет занятий'
                      : `${slots.length} ${slots.length === 1 ? 'занятие' : slots.length < 5 ? 'занятия' : 'занятий'}`}
                  </div>
                </div>

                <button
                  onClick={() => handleAddNewSlot(dayName)}
                  title={`Добавить занятие на ${dayName}`}
                  className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:border-red-300 hover:text-red-600 hover:bg-red-50 text-slate-600 flex items-center justify-center transition shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Day Slots List */}
              <div className="p-2.5 flex-1 space-y-2.5">
                {slots.length === 0 ? (
                  <div className="py-8 px-2 text-center text-slate-400 space-y-2">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-300 mx-auto flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                    <p className="text-[11px] leading-tight">Ковёр свободен весь день</p>
                    <button
                      onClick={() => handleAddNewSlot(dayName)}
                      className="text-[10px] font-bold text-red-600 hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      <Plus className="w-3 h-3" />
                      Занять ковёр
                    </button>
                  </div>
                ) : (
                  slots.map(slot => {
                    const isKarate = slot.sport === 'karate';
                    const isFitness = slot.sport === 'fitness';

                    const isMyTraining =
                      role === 'coach' &&
                      activeCoachShort &&
                      (slot.coach || '').toLowerCase().includes(activeCoachShort.toLowerCase());

                    return (
                      <div
                        key={slot.id}
                        className={`rounded-xl p-3 border transition flex flex-col justify-between group relative ${
                          isKarate
                            ? 'bg-emerald-50/50 hover:bg-emerald-50 border-emerald-200 shadow-2xs'
                            : isFitness
                            ? 'bg-amber-50/50 hover:bg-amber-50 border-amber-200 shadow-2xs'
                            : 'bg-red-50/40 hover:bg-red-50 border-red-200 shadow-2xs'
                        }`}
                      >
                        {/* Time & Sport Badge */}
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-900 shadow-xs flex items-center gap-1 shrink-0">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {slot.time}
                          </span>

                          <span
                            className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                              isKarate
                                ? 'bg-emerald-600 text-white'
                                : isFitness
                                ? 'bg-amber-500 text-white'
                                : 'bg-red-600 text-white'
                            }`}
                          >
                            {slot.sportLabel || (isKarate ? 'Карате' : isFitness ? 'ОФП' : 'Самбо')}
                          </span>
                        </div>

                        {/* Group Name & Hall */}
                        <div className="space-y-1 mb-2">
                          <div className="font-extrabold text-xs text-slate-900 leading-tight">
                            {slot.group || 'Занятие'}
                          </div>

                          <div className="text-[10px] text-slate-600 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{slot.hall || 'Зал не указан'}</span>
                          </div>

                          <div className="text-[10px] text-slate-600 flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="font-semibold text-slate-700 truncate">{slot.coach || 'Тренер не назначен'}</span>
                          </div>

                          {slot.notes && (
                            <div className="text-[10px] text-slate-500 italic bg-white/70 rounded p-1 border border-slate-100 line-clamp-2">
                              {slot.notes}
                            </div>
                          )}
                        </div>

                        {/* Actions Row */}
                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-1 mt-auto">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setModalSlot(slot)}
                              className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-white transition"
                              title="Редактировать занятие"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Удалить слот «${slot.group || 'Занятие'}» (${slot.time})?`)) {
                                  deleteScheduleSlot(slot.id);
                                }
                              }}
                              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-white transition"
                              title="Удалить слот"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          {isMyTraining && (
                            <button
                              onClick={() => handleJumpToJournal(slot)}
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-red-700 hover:bg-red-600 hover:text-white border border-red-200 transition shadow-2xs flex items-center gap-1"
                              title="Перейти к журналу тренировок этой группы"
                            >
                              <span>Журнал</span>
                              <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Free Time Windows Highlight (if hall is filtered) */}
                {selectedHall !== 'all' && freeWindows.length > 0 && (
                  <div className="pt-2 mt-2 border-t border-dashed border-slate-200">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      Свободные окна ({selectedHall}):
                    </div>
                    <div className="space-y-1">
                      {freeWindows.map((win, idx) => (
                        <div
                          key={idx}
                          className="p-1.5 rounded-lg border border-dashed border-slate-300 bg-slate-50/50 hover:bg-slate-100 text-[10px] flex items-center justify-between group transition"
                        >
                          <span className="font-mono font-medium text-slate-600">{win.label}</span>
                          <button
                            onClick={() => handleAddNewSlot(dayName, win.label, selectedHall)}
                            className="text-[9px] font-bold text-red-600 hover:underline opacity-80 group-hover:opacity-100"
                          >
                            + Занять
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Shared Hall Utilization & Guidelines Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Регламент совместного использования борцовских ковров
              </h3>
              <p className="text-xs text-slate-500">
                Правила пересменки и гигиены татами между секциями самбо и карате
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              Интервал пересменки: <strong>15 минут</strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs text-slate-600">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Влажная уборка и проветривание
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              В 15-минутный перерыв между занятиями карате и самбо проводится санитарная дезинфекция ковра и
              проветривание зала.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Дисциплина формы и обуви
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Вход на ковер самбистов — строго в борцовках или босиком; каратисты тренируются босиком (в доги), без
              твердых предметов на татами.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Зал №2 для ОФП и гимнастики
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Разгрузка основного татами в субботу: утренний блок ОФП вынесен в Зал №2, освобождая Зал №1 под Открытый
              ковёр самбо.
            </p>
          </div>
        </div>
      </div>

      {/* Edit/Create Modal */}
      {modalSlot !== undefined && (
        <EditScheduleSlotModal
          slot={modalSlot}
          initialDay={prefill.day}
          initialTime={prefill.time}
          initialHall={prefill.hall}
          onClose={() => setModalSlot(undefined)}
        />
      )}
    </div>
  );
};
