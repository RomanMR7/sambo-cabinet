import React, { useState, useMemo, useEffect } from 'react';
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
  Layers,
  ChevronLeft,
  ChevronRight,
  Trophy,
  X,
  Grid,
  CalendarDays,
  Columns3
} from 'lucide-react';
import {
  parseTimeInterval,
  canonicalizeHall,
  getCoachShortName
} from '../../utils/rules';
import {
  DAYS_OF_WEEK,
  SHORT_DAYS,
  MONTH_NAMES,
  MONTH_NAMES_GENITIVE,
  SHORT_MONTH_NAMES,
  CalendarMonthDay,
  getDayOfWeekName,
  addDays,
  formatRussianDate,
  getMonthGrid,
  getWeekDays,
  getCompetitionsForDate,
  filterSlotsForDay,
  calculateMonthKPI,
  getTodayDate
} from '../../utils/calendarEngine';
import { EditScheduleSlotModal } from '../modals/EditScheduleSlotModal';

function formatMinutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const QUICK_MONTHS = [
  { label: 'Сентябрь 2026', date: '2026-09-15' },
  { label: 'Октябрь 2026', date: '2026-10-06' },
  { label: 'Ноябрь 2026', date: '2026-11-15' },
  { label: 'Декабрь 2026', date: '2026-12-15' }
];

export const HallCalendarView: React.FC = () => {
  const {
    role,
    activeCoachId,
    clubUsers,
    groups,
    scheduleSlots,
    competitions,
    deleteScheduleSlot,
    setSelectedGroupId,
    setActiveNav
  } = useApp();

  // View mode: 'month' | 'week' | 'day'
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  // Time navigation state (default: dynamic getTodayDate())
  const [currentDate, setCurrentDate] = useState<string>(getTodayDate());

  // Filters
  const [selectedHall, setSelectedHall] = useState<string>('all'); // 'all' | 'Зал самбо №1' | 'Зал самбо №2 (ОФП)'
  const [selectedSport, setSelectedSport] = useState<string>('all'); // 'all' | 'sambo' | 'karate' | 'fitness'
  const [onlyMyTrainings, setOnlyMyTrainings] = useState<boolean>(false);

  // Modal State for Schedule Slot
  const [modalSlot, setModalSlot] = useState<ScheduleSlot | null | undefined>(undefined);
  const [prefill, setPrefill] = useState<{ day?: string; hall?: string; time?: string }>({});

  // Day Detail Modal State (for Month View click)
  const [selectedDayDetail, setSelectedDayDetail] = useState<CalendarMonthDay | null>(null);

  // Close Day Detail modal on Escape
  useEffect(() => {
    if (!selectedDayDetail) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedDayDetail(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDayDetail]);

  // Active coach user
  const activeCoach = clubUsers.find(u => u.id === activeCoachId) || clubUsers.find(u => u.role === 'coach');
  const activeCoachShort = activeCoach ? getCoachShortName(activeCoach.fullName) : '';

  // Extract year and month index from currentDate
  const { currentYear, currentMonthIndex } = useMemo(() => {
    const [y, m] = currentDate.split('-').map(Number);
    return {
      currentYear: y || 2026,
      currentMonthIndex: (m || 10) - 1
    };
  }, [currentDate]);

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
      if (role === 'coach' && onlyMyTrainings && activeCoachShort) {
        const coachStr = (slot.coach || '').toLowerCase();
        if (!coachStr.includes(activeCoachShort.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [scheduleSlots, selectedHall, selectedSport, onlyMyTrainings, activeCoachShort]);

  // Monthly KPI Summary Stats
  const monthKpi = useMemo(() => {
    return calculateMonthKPI(currentYear, currentMonthIndex, filteredSlots, competitions || []);
  }, [currentYear, currentMonthIndex, filteredSlots, competitions]);

  // General Slot Statistics
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

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'month') {
      const prevDate = new Date(Date.UTC(currentYear, currentMonthIndex - 1, 1));
      const y = prevDate.getUTCFullYear();
      const m = String(prevDate.getUTCMonth() + 1).padStart(2, '0');
      setCurrentDate(`${y}-${m}-01`);
    } else if (viewMode === 'week') {
      setCurrentDate(prev => addDays(prev, -7));
    } else {
      setCurrentDate(prev => addDays(prev, -1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      const nextDate = new Date(Date.UTC(currentYear, currentMonthIndex + 1, 1));
      const y = nextDate.getUTCFullYear();
      const m = String(nextDate.getUTCMonth() + 1).padStart(2, '0');
      setCurrentDate(`${y}-${m}-01`);
    } else if (viewMode === 'week') {
      setCurrentDate(prev => addDays(prev, 7));
    } else {
      setCurrentDate(prev => addDays(prev, 1));
    }
  };

  const handleJumpToToday = () => {
    setCurrentDate(getTodayDate());
  };

  // Period title for header
  const periodTitle = useMemo(() => {
    if (viewMode === 'month') {
      return `${MONTH_NAMES[currentMonthIndex]} ${currentYear}`;
    }
    if (viewMode === 'week') {
      const week = getWeekDays(currentDate);
      const first = week[0];
      const last = week[6];
      const [y1, m1, d1] = first.date.split('-').map(Number);
      const [y2, m2, d2] = last.date.split('-').map(Number);
      if (m1 === m2) {
        return `${d1} – ${d2} ${MONTH_NAMES_GENITIVE[m1 - 1]} ${y1}`;
      }
      return `${d1} ${SHORT_MONTH_NAMES[m1 - 1]} – ${d2} ${SHORT_MONTH_NAMES[m2 - 1]} ${y2}`;
    }
    return formatRussianDate(currentDate, true);
  }, [viewMode, currentDate, currentYear, currentMonthIndex]);

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

  // Month grid items
  const monthGrid = useMemo(() => {
    return getMonthGrid(currentYear, currentMonthIndex);
  }, [currentYear, currentMonthIndex]);

  // Week days items
  const weekDays = useMemo(() => {
    return getWeekDays(currentDate);
  }, [currentDate]);

  // Quick Month dropdown options ensuring the currently displayed month is always represented
  const monthDropdownOptions = useMemo(() => {
    const currentMonthPrefix = currentDate.slice(0, 7);
    const existing = QUICK_MONTHS.find(qm => qm.date.startsWith(currentMonthPrefix));
    if (existing) return QUICK_MONTHS;
    return [
      ...QUICK_MONTHS,
      {
        label: `${MONTH_NAMES[currentMonthIndex]} ${currentYear}`,
        date: `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-01`
      }
    ].sort((a, b) => a.date.localeCompare(b.date));
  }, [currentDate, currentMonthIndex, currentYear]);

  // Day timeline renderer for Day Matrix View (eliminates duplicated slots and highlights free windows)
  const renderHallTimeline = (hallName: string, hallCanon: string, themeColor: 'red' | 'amber') => {
    const dayName = getDayOfWeekName(currentDate);
    const slots = filterSlotsForDay(dayName, filteredSlots)
      .filter(s => canonicalizeHall(s.hall) === hallCanon)
      .sort((a, b) => {
        const intA = parseTimeInterval(a.time);
        const intB = parseTimeInterval(b.time);
        return (intA?.start || 0) - (intB?.start || 0);
      });

    const freeWins = getFreeWindows(slots, hallName);

    return (
      <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-md ${
                themeColor === 'red' ? 'bg-red-600' : 'bg-amber-500'
              } inline-block`}
            />
            <h3 className="font-extrabold text-sm text-slate-900">{hallName}</h3>
            <span className="text-[11px] text-slate-500 font-medium">
              {themeColor === 'red' ? '(Главный ковёр)' : '(Гимнастика и разминка)'}
            </span>
          </div>
          <button
            onClick={() => handleAddNewSlot(dayName, '18:00–19:30', hallName)}
            className={`text-xs font-bold ${
              themeColor === 'red' ? 'text-red-600' : 'text-amber-700'
            } hover:underline`}
          >
            + Занять ковёр
          </button>
        </div>

        {slots.length === 0 ? (
          <div className="py-8 px-4 text-center bg-white rounded-xl border border-dashed border-slate-200 space-y-2">
            <Clock className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="font-extrabold text-xs text-slate-700">
              Ковёр свободен весь день (09:00–21:30)
            </div>
            <p className="text-[11px] text-slate-400">
              Нет запланированных тренировок на {dayName.toLowerCase()}
            </p>
            <button
              onClick={() => handleAddNewSlot(dayName, '18:00–19:30', hallName)}
              className={`px-3 py-1.5 rounded-lg text-white font-bold text-xs shadow-sm transition mt-1 ${
                themeColor === 'red'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              + Занять ковёр на этот день
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {slots.map((slot, sIdx) => {
              const isKarate = slot.sport === 'karate';
              const isFitness = slot.sport === 'fitness';
              const isMyTraining =
                role === 'coach' &&
                activeCoachShort &&
                (slot.coach || '').toLowerCase().includes(activeCoachShort.toLowerCase());

              const intCur = parseTimeInterval(slot.time);
              const prevSlot = sIdx > 0 ? slots[sIdx - 1] : null;
              const intPrev = prevSlot ? parseTimeInterval(prevSlot.time) : null;
              const gapBefore = intPrev && intCur ? intCur.start - intPrev.end : 0;

              return (
                <React.Fragment key={slot.id}>
                  {gapBefore >= 30 && (
                    <div className="p-2 rounded-xl border border-dashed border-slate-300 bg-white/70 text-[11px] flex items-center justify-between text-slate-500">
                      <span className="font-mono text-slate-600 font-medium">
                        Свободное окно: {formatMinutesToTime(intPrev!.end)}–{formatMinutesToTime(intCur!.start)}
                      </span>
                      <button
                        onClick={() =>
                          handleAddNewSlot(
                            dayName,
                            `${formatMinutesToTime(intPrev!.end)}–${formatMinutesToTime(intCur!.start)}`,
                            hallName
                          )
                        }
                        className="font-bold text-red-600 hover:underline text-[10px]"
                      >
                        + Занять
                      </button>
                    </div>
                  )}
                  {gapBefore > 0 && gapBefore < 30 && (
                    <div className="py-1 px-2.5 rounded-lg bg-slate-100 text-[10px] text-slate-500 font-medium flex items-center gap-1.5 justify-center">
                      <Sparkles className="w-3 h-3 text-slate-400" />
                      <span>Пересменка и проветривание ({gapBefore} мин)</span>
                    </div>
                  )}

                  <div
                    className={`p-3.5 rounded-xl border transition flex flex-col gap-2 ${
                      isKarate
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : isFitness
                        ? 'bg-amber-50/70 border-amber-200'
                        : 'bg-red-50/60 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-sm">
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

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setModalSlot(slot)}
                          className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-white transition"
                          title="Редактировать"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
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
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="font-extrabold text-xs text-slate-900">{slot.group}</div>
                      <div className="text-[10px] text-slate-600 mt-0.5 flex items-center gap-2">
                        <span>{slot.coach || 'Тренер не назначен'}</span>
                        {slot.notes && <span className="text-slate-400 italic">• {slot.notes}</span>}
                      </div>
                    </div>

                    {isMyTraining && (
                      <div className="pt-2 border-t border-slate-200/50 flex justify-end">
                        <button
                          onClick={() => handleJumpToJournal(slot)}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-red-700 hover:bg-red-600 hover:text-white border border-red-200 transition shadow-sm flex items-center gap-1"
                        >
                          <span>Журнал группы</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </React.Fragment>
              );
            })}

            {freeWins.length > 0 && (
              <div className="pt-2 border-t border-dashed border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Свободные окна ковра:
                </div>
                <div className="space-y-1">
                  {freeWins.map((win, wIdx) => (
                    <div
                      key={wIdx}
                      className="p-1.5 rounded-lg border border-dashed border-slate-300 bg-white/70 hover:bg-white text-[10px] flex items-center justify-between transition"
                    >
                      <span className="font-mono text-slate-600">{win.label}</span>
                      <button
                        onClick={() => handleAddNewSlot(dayName, win.label, hallName)}
                        className="text-[10px] font-bold text-red-600 hover:underline"
                      >
                        + Занять
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
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
              накладок, календарная сетка месяца и интеграция турниров.
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

        {/* Monthly KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-700/60">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Всего в месяце</div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">{monthKpi.totalTrainings}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Тренировок за месяц</div>
          </div>

          <div className="bg-red-500/10 rounded-2xl p-3 border border-red-500/20">
            <div className="text-[11px] font-bold text-red-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Самбо
            </div>
            <div className="text-xl sm:text-2xl font-black text-red-200 mt-1">{monthKpi.samboCount}</div>
            <div className="text-[10px] text-red-300/80 mt-0.5">Группы 1, 2, 3 и спарринги</div>
          </div>

          <div className="bg-emerald-500/10 rounded-2xl p-3 border border-emerald-500/20">
            <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Карате Кёкусинкай
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-200 mt-1">{monthKpi.karateCount}</div>
            <div className="text-[10px] text-emerald-300/80 mt-0.5">Юноши и взрослые (Зал №1)</div>
          </div>

          <div className="bg-amber-500/10 rounded-2xl p-3 border border-amber-500/20">
            <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              ОФП и акробатика
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-200 mt-1">{monthKpi.fitnessCount}</div>
            <div className="text-[10px] text-amber-300/80 mt-0.5">Зал №2 ({monthKpi.occupancyPercent}% загрузка)</div>
          </div>

          <div className="bg-yellow-500/10 rounded-2xl p-3 border border-yellow-500/30 col-span-2 sm:col-span-1">
            <div className="text-[11px] font-bold text-yellow-300 uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="w-3 h-3 text-yellow-400" />
              Турниры месяца
            </div>
            <div className="text-xl sm:text-2xl font-black text-yellow-200 mt-1">{monthKpi.competitionsCount}</div>
            <div className="text-[10px] text-yellow-300/80 mt-0.5 truncate">
              {monthKpi.competitions[0]?.title ? '24–25 окт: Первенство' : 'Стартов нет'}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation and View Mode Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Time Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition"
              title="Назад"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleJumpToToday}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                currentDate === getTodayDate()
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-white text-slate-800 hover:bg-slate-50'
              }`}
              title={`Перейти к Сегодня (${formatRussianDate(getTodayDate(), false)})`}
            >
              Сегодня
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition"
              title="Вперед"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight px-1">
            {periodTitle}
          </span>
        </div>

        {/* Quick Month Switcher & View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Month Dropdown */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 font-bold hidden sm:inline">Месяц:</span>
            <select
              value={monthDropdownOptions.find(qm => qm.date.startsWith(currentDate.slice(0, 7)))?.date || monthDropdownOptions[0]?.date}
              onChange={e => setCurrentDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs text-slate-800 focus:outline-none cursor-pointer"
            >
              {monthDropdownOptions.map(qm => (
                <option key={qm.date} value={qm.date}>
                  {qm.label}
                </option>
              ))}
            </select>
          </div>

          {/* View Modes (Month / Week / Day) */}
          <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'month'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Месяц</span>
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'week'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Неделя</span>
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'day'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>День (Залы)</span>
            </button>
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
                selectedSport === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Все виды
            </button>
            <button
              onClick={() => setSelectedSport('sambo')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                selectedSport === 'sambo'
                  ? 'bg-red-600 text-white shadow-sm'
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
                  ? 'bg-emerald-600 text-white shadow-sm'
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
                  ? 'bg-amber-600 text-white shadow-sm'
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
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-yellow-500 inline-block text-white text-[9px] text-center font-bold">🏆</span>
            <strong className="text-amber-800">Турниры и первенства</strong>
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

      {/* ========================================================= */}
      {/* 1. MONTH VIEW (7 columns grid for the entire month)       */}
      {/* ========================================================= */}
      {viewMode === 'month' && (
        <div className="space-y-2">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-2 text-center">
            {DAYS_OF_WEEK.map((dName, idx) => (
              <div
                key={dName}
                className={`py-2 px-1 text-xs font-extrabold uppercase tracking-wider rounded-xl ${
                  idx >= 5 ? 'bg-slate-100 text-slate-600' : 'bg-slate-900 text-white'
                }`}
              >
                <span className="hidden sm:inline">{dName}</span>
                <span className="sm:hidden">{SHORT_DAYS[idx]}</span>
              </div>
            ))}
          </div>

          {/* Month Calendar Cells */}
          <div className="grid grid-cols-7 gap-2">
            {monthGrid.map(cell => {
              const dayComps = getCompetitionsForDate(cell.date, competitions || []);
              const daySlots = filterSlotsForDay(cell.dayName, filteredSlots);
              const isToday = cell.date === getTodayDate();

              return (
                <div
                  key={cell.date}
                  onClick={() => setSelectedDayDetail(cell)}
                  className={`min-h-[110px] sm:min-h-[140px] rounded-2xl border p-2 flex flex-col justify-between transition cursor-pointer group ${
                    isToday
                      ? 'border-red-500 bg-red-50/30 ring-2 ring-red-400/40 shadow-sm'
                      : cell.isCurrentMonth
                      ? 'bg-white border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-sm'
                      : 'bg-slate-50/60 border-slate-100 text-slate-400 opacity-60 hover:opacity-100'
                  }`}
                >
                  {/* Cell Top Header */}
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span
                      className={`text-xs sm:text-sm font-black ${
                        isToday
                          ? 'w-6 h-6 rounded-lg bg-red-600 text-white flex items-center justify-center'
                          : cell.isCurrentMonth
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {isToday && (
                      <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-600 text-white">
                        Сегодня
                      </span>
                    )}

                    {!isToday && dayComps.length > 0 && (
                      <span className="text-[10px]" title="Соревнование в этот день">🏆</span>
                    )}
                  </div>

                  {/* Competitions Banner */}
                  {dayComps.length > 0 && (
                    <div className="mb-1 space-y-1">
                      {dayComps.map(c => (
                        <div
                          key={c.id}
                          className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-sm truncate"
                          title={`Турнир: ${c.title}`}
                        >
                          <span className="shrink-0">🏆</span>
                          <span className="truncate">{c.title}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Workouts Badges Stack */}
                  <div className="space-y-1 flex-1 overflow-hidden">
                    {daySlots.slice(0, 3).map(slot => {
                      const isKarate = slot.sport === 'karate';
                      const isFitness = slot.sport === 'fitness';

                      return (
                        <div
                          key={slot.id}
                          className={`text-[9px] sm:text-[10px] font-bold p-1 rounded-md border truncate leading-tight flex items-center justify-between gap-1 ${
                            isKarate
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : isFitness
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-red-50 text-red-800 border-red-200'
                          }`}
                        >
                          <span className="font-mono text-[9px] shrink-0 font-extrabold">
                            {slot.time.split('–')[0]}
                          </span>
                          <span className="truncate flex-1 font-semibold">{slot.group}</span>
                        </div>
                      );
                    })}

                    {daySlots.length > 3 && (
                      <div className="text-[9px] text-slate-500 font-bold px-1 text-right">
                        +{daySlots.length - 3} ещё...
                      </div>
                    )}
                  </div>

                  {/* Cell Bottom / Click to View / Add */}
                  <div className="pt-1 mt-1 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 group-hover:text-red-600 transition">
                    <span className="truncate">
                      {daySlots.length === 0 ? 'Ковёр свободен' : `${daySlots.length} зан.`}
                    </span>
                    <span className="opacity-0 group-hover:opacity-100 font-bold">+ Занять</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. WEEK VIEW (7 days with exact calendar dates)           */}
      {/* ========================================================= */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
          {weekDays.map(wDay => {
            const slots = filterSlotsForDay(wDay.dayName, filteredSlots);
            const isToday = wDay.date === getTodayDate();
            const dayComps = getCompetitionsForDate(wDay.date, competitions || []);
            const freeWindows = selectedHall !== 'all' ? getFreeWindows(slots, selectedHall) : [];

            return (
              <div
                key={wDay.date}
                className={`rounded-2xl border flex flex-col transition ${
                  isToday
                    ? 'border-red-400 bg-red-50/20 shadow-md ring-2 ring-red-300/50'
                    : wDay.isWeekend
                    ? 'bg-slate-50/70 border-slate-200'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                {/* Day Header with exact calendar date */}
                <div
                  className={`p-3.5 border-b flex items-center justify-between ${
                    isToday
                      ? 'bg-red-600 text-white'
                      : wDay.isWeekend
                      ? 'bg-slate-100/80 border-slate-200 text-slate-900'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                      <span
                        className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                          isToday ? 'bg-white text-red-600' : 'bg-slate-900 text-white'
                        }`}
                      >
                        {wDay.dayShort}
                      </span>
                      <span>{wDay.label}</span>
                    </div>
                    <div
                      className={`text-[10px] font-semibold mt-0.5 ${
                        isToday ? 'text-red-100' : 'text-slate-500'
                      }`}
                    >
                      {isToday
                        ? `Сегодня • ${formatRussianDate(wDay.date, false)}`
                        : slots.length === 0
                        ? 'Нет занятий'
                        : `${slots.length} ${slots.length === 1 ? 'занятие' : slots.length < 5 ? 'занятия' : 'занятий'}`}
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddNewSlot(wDay.dayName)}
                    title={`Добавить занятие на ${wDay.label}`}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition shadow-sm ${
                      isToday
                        ? 'bg-white/20 text-white hover:bg-white hover:text-red-600'
                        : 'bg-white border border-slate-200 hover:border-red-300 hover:text-red-600 hover:bg-red-50 text-slate-600'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Competition banner if on this week day */}
                {dayComps.length > 0 && (
                  <div className="p-2.5 bg-amber-500/10 border-b border-amber-300/40 space-y-1">
                    {dayComps.map(c => (
                      <div
                        key={c.id}
                        className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-2 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
                      >
                        <Trophy className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{c.title}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Day Slots List */}
                <div className="p-2.5 flex-1 space-y-2.5">
                  {slots.length === 0 ? (
                    <div className="py-8 px-2 text-center text-slate-400 space-y-2">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-300 mx-auto flex items-center justify-center">
                        <Clock className="w-4 h-4" />
                      </div>
                      <p className="text-[11px] leading-tight">Ковёр свободен весь день</p>
                      <button
                        onClick={() => handleAddNewSlot(wDay.dayName)}
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
                              ? 'bg-emerald-50/50 hover:bg-emerald-50 border-emerald-200 shadow-sm'
                              : isFitness
                              ? 'bg-amber-50/50 hover:bg-amber-50 border-amber-200 shadow-sm'
                              : 'bg-red-50/40 hover:bg-red-50 border-red-200 shadow-sm'
                          }`}
                        >
                          {/* Time & Sport Badge */}
                          <div className="flex items-center justify-between gap-1 mb-2">
                            <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-900 shadow-sm flex items-center gap-1 shrink-0">
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
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-red-700 hover:bg-red-600 hover:text-white border border-red-200 transition shadow-sm flex items-center gap-1"
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

                  {/* Free Time Windows Highlight */}
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
                              onClick={() => handleAddNewSlot(wDay.dayName, win.label, selectedHall)}
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
      )}

      {/* ========================================================= */}
      {/* 3. DAY MATRIX VIEW (Hourly scale for Hall 1 & Hall 2)     */}
      {/* ========================================================= */}
      {viewMode === 'day' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          {/* Day Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Почасовая матрица залов татами</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                {formatRussianDate(currentDate, true)}
                {currentDate === getTodayDate() && (
                  <span className="ml-2 px-2 py-0.5 rounded-md bg-red-600 text-white text-xs uppercase font-extrabold">
                    Сегодня
                  </span>
                )}
              </h2>
            </div>

            <button
              onClick={() => handleAddNewSlot(getDayOfWeekName(currentDate))}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5 self-start sm:self-center"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Занять ковёр на этот день</span>
            </button>
          </div>

          {/* Competitions Banner for this day if any */}
          {getCompetitionsForDate(currentDate, competitions || []).length > 0 && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl shrink-0">
                  🏆
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">
                    {getCompetitionsForDate(currentDate, competitions || [])[0].title}
                  </h3>
                  <p className="text-xs text-amber-100 mt-0.5">
                    {getCompetitionsForDate(currentDate, competitions || [])[0].location}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Two Halls Parallel Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hall 1: Зал самбо №1 */}
            {renderHallTimeline('Зал самбо №1', 'зал 1', 'red')}

            {/* Hall 2: Зал самбо №2 (ОФП) */}
            {renderHallTimeline('Зал самбо №2 (ОФП)', 'зал 2', 'amber')}
          </div>
        </div>
      )}

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

      {/* Day Details Modal (Opens when clicking any day in Month View) */}
      {selectedDayDetail && (
        <div
          onClick={e => {
            if (e.target === e.currentTarget) setSelectedDayDetail(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scaleUp max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Детализация расписания дня</span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">
                  {formatRussianDate(selectedDayDetail.date, true)}
                </h3>
                {selectedDayDetail.date === getTodayDate() && (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-black uppercase">
                    Сегодня ({formatRussianDate(getTodayDate(), false)})
                  </span>
                )}
              </div>

              <button
                onClick={() => setSelectedDayDetail(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Competitions on this day */}
            {getCompetitionsForDate(selectedDayDetail.date, competitions || []).map(comp => (
              <div
                key={comp.id}
                className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md space-y-1"
              >
                <div className="flex items-center gap-2 font-black text-xs sm:text-sm">
                  <span>🏆</span>
                  <span>{comp.title}</span>
                </div>
                <div className="text-[11px] text-amber-100">
                  Место проведения: {comp.location}
                </div>
              </div>
            ))}

            {/* Slots on this day */}
            <div className="space-y-3">
              <div className="text-xs font-extrabold text-slate-900 flex items-center justify-between">
                <span>Занятия в сетке ({filterSlotsForDay(selectedDayDetail.dayName, filteredSlots).length}):</span>
                <span className="text-[11px] text-slate-400 font-semibold">{selectedDayDetail.dayName}</span>
              </div>

              {filterSlotsForDay(selectedDayDetail.dayName, filteredSlots).length === 0 ? (
                <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs space-y-2">
                  <Clock className="w-6 h-6 mx-auto text-slate-300" />
                  <p>В этот день недели нет запланированных тренировок.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filterSlotsForDay(selectedDayDetail.dayName, filteredSlots).map(slot => {
                    const isKarate = slot.sport === 'karate';
                    const isFitness = slot.sport === 'fitness';

                    return (
                      <div
                        key={slot.id}
                        className={`p-3.5 rounded-2xl border flex items-start justify-between gap-3 ${
                          isKarate
                            ? 'bg-emerald-50/50 border-emerald-200'
                            : isFitness
                            ? 'bg-amber-50/50 border-amber-200'
                            : 'bg-red-50/50 border-red-200'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-900 shadow-sm">
                              {slot.time}
                            </span>
                            <span
                              className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
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

                          <div className="font-extrabold text-xs text-slate-900">
                            {slot.group}
                          </div>

                          <div className="text-[11px] text-slate-600 flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {slot.hall}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" />
                              {slot.coach}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => {
                              setSelectedDayDetail(null);
                              setModalSlot(slot);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white transition"
                            title="Редактировать"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <button
                onClick={() => {
                  const date = selectedDayDetail.date;
                  setSelectedDayDetail(null);
                  setCurrentDate(date);
                  setViewMode('day');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition text-center"
              >
                Открыть матрицу дня
              </button>

              <button
                onClick={() => {
                  const dayName = selectedDayDetail.dayName;
                  setSelectedDayDetail(null);
                  handleAddNewSlot(dayName);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Занять ковёр на {selectedDayDetail.dayName}</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
