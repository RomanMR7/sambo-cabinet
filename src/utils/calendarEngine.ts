import { Competition, ScheduleSlot } from '../types';
import { canonicalizeDay, parseTimeInterval, getTodayDate } from './rules';

export { getTodayDate };

export const DAYS_OF_WEEK = [
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
  'Воскресенье'
];

export const SHORT_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export const SHORT_DAYS_MAP: Record<string, string> = {
  'Понедельник': 'Пн',
  'Вторник': 'Вт',
  'Среда': 'Ср',
  'Четверг': 'Чт',
  'Пятница': 'Пт',
  'Суббота': 'Сб',
  'Воскресенье': 'Вс'
};

export const MONTH_NAMES = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь'
];

export const MONTH_NAMES_GENITIVE = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря'
];

export const SHORT_MONTH_NAMES = [
  'янв',
  'фев',
  'мар',
  'апр',
  'май',
  'июн',
  'июл',
  'авг',
  'сен',
  'окт',
  'ноя',
  'дек'
];

export interface CalendarMonthDay {
  date: string; // '2026-10-06'
  dayNumber: number; // 6
  dayName: string; // 'Вторник'
  dayShort: string; // 'Вт'
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
}

export interface CalendarWeekDay {
  date: string; // '2026-10-05'
  dayNumber: number; // 5
  dayName: string; // 'Понедельник'
  dayShort: string; // 'Пн'
  label: string; // 'Пн, 5 окт'
  isToday: boolean;
  isWeekend: boolean;
}

/**
 * Returns Monday=0, Tuesday=1, ..., Sunday=6 for a date string 'YYYY-MM-DD'.
 */
export function getDayOfWeekIndex(dateStr: string): number {
  if (!dateStr || typeof dateStr !== 'string') {
    return 0;
  }
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return 0;
  }
  const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  if (isNaN(date.getTime())) {
    return 0;
  }
  const rawDay = date.getUTCDay();
  if (isNaN(rawDay)) {
    return 0;
  }
  return (rawDay + 6) % 7;
}

/**
 * Returns full Russian day of week name for a date string 'YYYY-MM-DD'.
 */
export function getDayOfWeekName(dateStr: string): string {
  const idx = getDayOfWeekIndex(dateStr);
  return DAYS_OF_WEEK[idx] || 'Понедельник';
}

/**
 * Adds or subtracts days from a date string 'YYYY-MM-DD'.
 */
export function addDays(dateStr: string, n: number): string {
  if (!dateStr || typeof dateStr !== 'string') {
    return dateStr || '';
  }
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return dateStr;
  }
  const safeN = isNaN(n) ? 0 : n;
  const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + safeN));
  if (isNaN(date.getTime())) {
    return dateStr;
  }
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats date string into Russian readable string, e.g. "6 октября 2026, вторник" or "6 октября 2026".
 */
export function formatRussianDate(dateStr: string, includeDayOfWeek: boolean = true): string {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) return dateStr;
  const [y, m, d] = parts;
  if (!y || !m || !d || m < 1 || m > 12) return dateStr;
  const monthText = MONTH_NAMES_GENITIVE[m - 1];
  const dayName = getDayOfWeekName(dateStr).toLowerCase();
  if (includeDayOfWeek) {
    return `${d} ${monthText} ${y}, ${dayName}`;
  }
  return `${d} ${monthText} ${y}`;
}

/**
 * Generates the full 7-column calendar grid for a given year and month (0-11).
 * Pads with leading days from previous month and trailing days from next month.
 */
export function getMonthGrid(year: number, monthIndex: number): CalendarMonthDay[] {
  const safeYear = isNaN(year) || year < 1900 ? 2026 : year;
  const safeMonth = Math.max(0, Math.min(11, isNaN(monthIndex) ? 0 : monthIndex));
  const firstDayStr = `${safeYear}-${String(safeMonth + 1).padStart(2, '0')}-01`;
  const firstDayOfWeekIdx = getDayOfWeekIndex(firstDayStr); // 0 (Mon) .. 6 (Sun)

  // Start date of grid (Monday on or before the 1st of month)
  const gridStartDate = addDays(firstDayStr, -firstDayOfWeekIdx);

  // Days in this month
  const lastDateOfMonth = new Date(Date.UTC(safeYear, safeMonth + 1, 0)).getUTCDate();

  // We determine number of rows needed (usually 5 or 6 rows = 35 or 42 days)
  const totalDaysSoFar = firstDayOfWeekIdx + lastDateOfMonth;
  const totalCells = totalDaysSoFar > 35 ? 42 : 35;

  const result: CalendarMonthDay[] = [];

  for (let i = 0; i < totalCells; i++) {
    const curDateStr = addDays(gridStartDate, i);
    const [y, m, d] = curDateStr.split('-').map(Number);
    const isCurrentMonth = y === safeYear && m === safeMonth + 1;
    const dayOfWeekIdx = getDayOfWeekIndex(curDateStr);
    const isWeekend = dayOfWeekIdx === 5 || dayOfWeekIdx === 6;

    result.push({
      date: curDateStr,
      dayNumber: d,
      dayName: DAYS_OF_WEEK[dayOfWeekIdx],
      dayShort: SHORT_DAYS[dayOfWeekIdx],
      isCurrentMonth,
      isToday: curDateStr === getTodayDate(),
      isWeekend
    });
  }

  return result;
}

/**
 * Generates the 7 days of the week containing dateStr (Monday to Sunday).
 */
export function getWeekDays(dateStr: string): CalendarWeekDay[] {
  const safeDateStr = (!dateStr || typeof dateStr !== 'string') ? getTodayDate() : dateStr;
  const dayIdx = getDayOfWeekIndex(safeDateStr);
  const mondayStr = addDays(safeDateStr, -dayIdx);

  const result: CalendarWeekDay[] = [];
  for (let i = 0; i < 7; i++) {
    const curDate = addDays(mondayStr, i);
    const [, m, d] = curDate.split('-').map(Number);
    const monthShort = SHORT_MONTH_NAMES[(m || 1) - 1] || '';
    const dayOfWeekIdx = i;

    result.push({
      date: curDate,
      dayNumber: d,
      dayName: DAYS_OF_WEEK[dayOfWeekIdx],
      dayShort: SHORT_DAYS[dayOfWeekIdx],
      label: `${SHORT_DAYS[dayOfWeekIdx]}, ${d} ${monthShort}`,
      isToday: curDate === getTodayDate(),
      isWeekend: dayOfWeekIdx === 5 || dayOfWeekIdx === 6
    });
  }

  return result;
}

/**
 * Checks whether a given calendar date falls inside a competition date range.
 */
export function isDateInCompetition(dateStr: string, comp: Competition): boolean {
  if (!comp || !comp.date || !dateStr || typeof dateStr !== 'string') return false;
  const start = comp.date;
  const end = comp.endDate || comp.date;
  const [safeStart, safeEnd] = start <= end ? [start, end] : [end, start];
  return dateStr >= safeStart && dateStr <= safeEnd;
}

/**
 * Returns competitions that fall on a specific date.
 */
export function getCompetitionsForDate(dateStr: string, competitions: Competition[]): Competition[] {
  if (!Array.isArray(competitions) || !dateStr || typeof dateStr !== 'string') return [];
  return competitions.filter(comp => comp && isDateInCompetition(dateStr, comp));
}

/**
 * Returns competitions occurring within a specific month.
 */
export function getCompetitionsForMonth(
  year: number,
  monthIndex: number,
  competitions: Competition[]
): Competition[] {
  if (!Array.isArray(competitions)) return [];
  const safeYear = isNaN(year) || year < 1900 ? 2026 : year;
  const safeMonth = Math.max(0, Math.min(11, isNaN(monthIndex) ? 0 : monthIndex));
  const monthStart = `${safeYear}-${String(safeMonth + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(Date.UTC(safeYear, safeMonth + 1, 0)).getUTCDate();
  const monthEnd = `${safeYear}-${String(safeMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  return competitions.filter(comp => {
    if (!comp || !comp.date) return false;
    const start = comp.date;
    const end = comp.endDate || comp.date;
    const [safeStart, safeEnd] = start <= end ? [start, end] : [end, start];
    // Overlaps if not completely before or completely after
    return !(safeEnd < monthStart || safeStart > monthEnd);
  });
}

/**
 * Returns slots for a given day name (e.g. 'Вторник').
 */
export function filterSlotsForDay(dayName: string, slots: ScheduleSlot[]): ScheduleSlot[] {
  if (!dayName || !Array.isArray(slots)) return [];
  const targetCanon = canonicalizeDay(dayName);
  return slots.filter(slot => slot && canonicalizeDay(slot.day) === targetCanon);
}

/**
 * Calculates monthly KPI: total workouts per sport, hall utilization, and competitions.
 */
export interface MonthKPIStats {
  samboCount: number;
  karateCount: number;
  fitnessCount: number;
  totalTrainings: number;
  competitionsCount: number;
  competitions: Competition[];
  occupancyPercent: number;
}

export function calculateMonthKPI(
  year: number,
  monthIndex: number,
  slots: ScheduleSlot[],
  competitions: Competition[]
): MonthKPIStats {
  const safeYear = isNaN(year) || year < 1900 ? 2026 : year;
  const safeMonth = Math.max(0, Math.min(11, isNaN(monthIndex) ? 0 : monthIndex));
  const safeSlots = Array.isArray(slots) ? slots : [];
  const safeComps = Array.isArray(competitions) ? competitions : [];

  const lastDay = new Date(Date.UTC(safeYear, safeMonth + 1, 0)).getUTCDate();
  let sambo = 0;
  let karate = 0;
  let fitness = 0;
  let total = 0;
  let totalMinutesBooked = 0;

  for (let day = 1; day <= lastDay; day++) {
    const curDateStr = `${safeYear}-${String(safeMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayName = getDayOfWeekName(curDateStr);
    const daySlots = filterSlotsForDay(dayName, safeSlots);

    for (const slot of daySlots) {
      if (!slot) continue;
      total++;
      const sport = slot.sport || 'sambo';
      if (sport === 'sambo') sambo++;
      else if (sport === 'karate') karate++;
      else if (sport === 'fitness') fitness++;

      const interval = parseTimeInterval(slot.time);
      if (interval) {
        totalMinutesBooked += Math.max(0, interval.end - interval.start);
      }
    }
  }

  // Hall capacity approximation: 2 halls open 09:00 - 21:00 (12 hrs / day * 2 halls * days)
  const totalCapacityMinutes = 2 * 12 * 60 * lastDay;
  const occupancyPercent = totalCapacityMinutes > 0
    ? Math.min(100, Math.max(0, Math.round((totalMinutesBooked / totalCapacityMinutes) * 100)))
    : 0;

  const monthComps = getCompetitionsForMonth(safeYear, safeMonth, safeComps);

  return {
    samboCount: sambo,
    karateCount: karate,
    fitnessCount: fitness,
    totalTrainings: total,
    competitionsCount: monthComps.length,
    competitions: monthComps,
    occupancyPercent
  };
}
