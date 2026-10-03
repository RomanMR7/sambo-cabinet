import { describe, it, expect } from 'vitest';
import {
  getDayOfWeekIndex,
  getDayOfWeekName,
  addDays,
  formatRussianDate,
  getMonthGrid,
  getWeekDays,
  isDateInCompetition,
  getCompetitionsForDate,
  getCompetitionsForMonth,
  filterSlotsForDay,
  calculateMonthKPI,
  getTodayDate
} from '../calendarEngine';
import { Competition, ScheduleSlot } from '../../types';

describe('calendarEngine', () => {
  const sampleComp: Competition = {
    id: 'cmp-1',
    title: 'Первенство города по самбо среди юношей',
    date: '2026-10-24',
    endDate: '2026-10-25',
    location: 'Дворец спорта «Самбо-70», Москва',
    requiredDocuments: ['medical', 'insurance', 'consent'],
    participants: []
  };

  const sampleSlots: ScheduleSlot[] = [
    {
      id: 'sch-1',
      day: 'Понедельник',
      time: '17:30–19:00',
      hall: 'Зал самбо №1',
      sport: 'karate',
      coach: 'Васильев К. М.',
      group: 'Карате (Юноши)'
    },
    {
      id: 'sch-2',
      day: 'Вторник',
      time: '18:00–19:00',
      hall: 'Зал самбо №1',
      sport: 'sambo',
      coach: 'Иванов А. В.',
      group: 'Группа 1'
    },
    {
      id: 'sch-3',
      day: 'Суббота',
      time: '10:00–11:30',
      hall: 'Зал самбо №2 (ОФП)',
      sport: 'fitness',
      coach: 'Петров С. Н.',
      group: 'ОФП'
    }
  ];

  it('generates today date dynamically in YYYY-MM-DD format', () => {
    const today = getTodayDate();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const now = new Date();
    const expectedYear = now.getFullYear();
    const expectedMonth = String(now.getMonth() + 1).padStart(2, '0');
    const expectedDay = String(now.getDate()).padStart(2, '0');
    expect(today).toBe(`${expectedYear}-${expectedMonth}-${expectedDay}`);
  });

  it('correctly maps day of week index and name', () => {
    // 2026-10-06 is Tuesday (index 1)
    expect(getDayOfWeekIndex('2026-10-06')).toBe(1);
    expect(getDayOfWeekName('2026-10-06')).toBe('Вторник');

    // 2026-10-05 is Monday (index 0)
    expect(getDayOfWeekIndex('2026-10-05')).toBe(0);
    expect(getDayOfWeekName('2026-10-05')).toBe('Понедельник');

    // 2026-10-11 is Sunday (index 6)
    expect(getDayOfWeekIndex('2026-10-11')).toBe(6);
    expect(getDayOfWeekName('2026-10-11')).toBe('Воскресенье');
  });

  it('adds and subtracts days correctly', () => {
    expect(addDays('2026-10-06', -1)).toBe('2026-10-05');
    expect(addDays('2026-10-06', 1)).toBe('2026-10-07');
    expect(addDays('2026-10-01', -1)).toBe('2026-09-30');
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
  });

  it('formats Russian dates correctly', () => {
    expect(formatRussianDate('2026-10-06', true)).toBe('6 октября 2026, вторник');
    expect(formatRussianDate('2026-10-06', false)).toBe('6 октября 2026');
  });

  it('generates 7-column month grid for October 2026', () => {
    // October is monthIndex 9
    const grid = getMonthGrid(2026, 9);
    expect(grid.length).toBeGreaterThanOrEqual(35);
    expect(grid.length % 7).toBe(0);

    const octDays = grid.filter(d => d.isCurrentMonth);
    expect(octDays.length).toBe(31);

    const oct6Cell = grid.find(d => d.date === '2026-10-06');
    expect(oct6Cell).toBeDefined();
    expect(oct6Cell?.dayNumber).toBe(6);
    expect(oct6Cell?.dayName).toBe('Вторник');
    expect(oct6Cell?.isToday).toBe(getTodayDate() === '2026-10-06');
  });

  it('dynamically highlights today in month grid for current month', () => {
    const todayStr = getTodayDate();
    const [y, m, d] = todayStr.split('-').map(Number);
    const grid = getMonthGrid(y, m - 1);
    const todayCell = grid.find(cell => cell.date === todayStr);
    expect(todayCell).toBeDefined();
    expect(todayCell?.isToday).toBe(true);
    expect(todayCell?.dayNumber).toBe(d);
  });

  it('generates week days for a given date and highlights today dynamically', () => {
    const todayStr = getTodayDate();
    const week = getWeekDays(todayStr);
    expect(week.length).toBe(7);
    const todayDay = week.find(d => d.date === todayStr);
    expect(todayDay).toBeDefined();
    expect(todayDay?.isToday).toBe(true);
    expect(week[6].isWeekend).toBe(true);
  });

  it('generates week days for the week containing 2026-10-06', () => {
    const week = getWeekDays('2026-10-06');
    expect(week.length).toBe(7);
    expect(week[0].date).toBe('2026-10-05'); // Monday
    expect(week[0].label).toBe('Пн, 5 окт');
    expect(week[1].date).toBe('2026-10-06'); // Tuesday
    expect(week[1].isToday).toBe(getTodayDate() === '2026-10-06');
    expect(week[6].date).toBe('2026-10-11'); // Sunday
    expect(week[6].isWeekend).toBe(true);
  });

  it('correctly detects competitions for dates', () => {
    expect(isDateInCompetition('2026-10-24', sampleComp)).toBe(true);
    expect(isDateInCompetition('2026-10-25', sampleComp)).toBe(true);
    expect(isDateInCompetition('2026-10-06', sampleComp)).toBe(false);

    const hits24 = getCompetitionsForDate('2026-10-24', [sampleComp]);
    expect(hits24.length).toBe(1);
    expect(hits24[0].title).toContain('Первенство города');

    const hits06 = getCompetitionsForDate('2026-10-06', [sampleComp]);
    expect(hits06.length).toBe(0);

    const monthComps = getCompetitionsForMonth(2026, 9, [sampleComp]);
    expect(monthComps.length).toBe(1);
  });

  it('filters schedule slots by day', () => {
    const tuesdaySlots = filterSlotsForDay('Вторник', sampleSlots);
    expect(tuesdaySlots.length).toBe(1);
    expect(tuesdaySlots[0].sport).toBe('sambo');

    const mondaySlots = filterSlotsForDay('понедельник', sampleSlots);
    expect(mondaySlots.length).toBe(1);
    expect(mondaySlots[0].sport).toBe('karate');
  });

  it('calculates monthly KPI correctly', () => {
    const kpi = calculateMonthKPI(2026, 9, sampleSlots, [sampleComp]);
    expect(kpi.competitionsCount).toBe(1);
    expect(kpi.samboCount).toBeGreaterThan(0);
    expect(kpi.karateCount).toBeGreaterThan(0);
    expect(kpi.fitnessCount).toBeGreaterThan(0);
    expect(kpi.totalTrainings).toBe(kpi.samboCount + kpi.karateCount + kpi.fitnessCount);
    expect(kpi.occupancyPercent).toBeGreaterThanOrEqual(0);
  });

  it('correctly handles leap years and non-leap years', () => {
    // 2024 is a leap year: Feb 28 + 1 day -> Feb 29
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2024-02-29', 1)).toBe('2024-03-01');

    // 2023 is non-leap year: Feb 28 + 1 day -> Mar 01
    expect(addDays('2023-02-28', 1)).toBe('2023-03-01');

    // February 2024 month grid should have 29 days in current month
    const leapFebGrid = getMonthGrid(2024, 1);
    const feb2024Days = leapFebGrid.filter(d => d.isCurrentMonth);
    expect(feb2024Days.length).toBe(29);

    // February 2023 month grid should have 28 days in current month
    const nonLeapFebGrid = getMonthGrid(2023, 1);
    const feb2023Days = nonLeapFebGrid.filter(d => d.isCurrentMonth);
    expect(feb2023Days.length).toBe(28);
  });

  it('handles year transition boundaries correctly', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('provides null-safety and defensive fallbacks on invalid inputs', () => {
    // getDayOfWeekIndex / getDayOfWeekName
    expect(getDayOfWeekIndex('')).toBe(0);
    // @ts-expect-error testing null input
    expect(getDayOfWeekIndex(null)).toBe(0);
    // @ts-expect-error testing undefined input
    expect(getDayOfWeekName(undefined)).toBe('Понедельник');

    // addDays
    expect(addDays('', 5)).toBe('');
    // @ts-expect-error testing null input
    expect(addDays(null, 5)).toBe('');

    // formatRussianDate
    expect(formatRussianDate('')).toBe('');
    // @ts-expect-error testing null input
    expect(formatRussianDate(null)).toBe('');
    expect(formatRussianDate('invalid-date')).toBe('invalid-date');

    // getWeekDays with invalid date falls back to getTodayDate()
    const fallbackWeek = getWeekDays('');
    expect(fallbackWeek.length).toBe(7);
    expect(fallbackWeek.some(d => d.date === getTodayDate())).toBe(true);

    // filterSlotsForDay with empty/null
    expect(filterSlotsForDay('', sampleSlots)).toEqual([]);
    // @ts-expect-error testing null slots
    expect(filterSlotsForDay('Вторник', null)).toEqual([]);

    // getCompetitionsForDate with null
    // @ts-expect-error testing null
    expect(getCompetitionsForDate('2026-10-06', null)).toEqual([]);
    expect(getCompetitionsForDate('', [sampleComp])).toEqual([]);

    // calculateMonthKPI with empty/null
    // @ts-expect-error testing null slots
    const nullKpi = calculateMonthKPI(2026, 9, null, null);
    expect(nullKpi.totalTrainings).toBe(0);
    expect(nullKpi.occupancyPercent).toBe(0);
  });

  it('handles multi-day competitions spanning month boundary and inverted dates', () => {
    const multiMonthComp: Competition = {
      id: 'cmp-cross',
      title: 'Межрегиональные сборы',
      date: '2026-09-28',
      endDate: '2026-10-04',
      location: 'База отдыха',
      requiredDocuments: ['medical', 'insurance'],
      participants: []
    };

    expect(isDateInCompetition('2026-09-30', multiMonthComp)).toBe(true);
    expect(isDateInCompetition('2026-10-02', multiMonthComp)).toBe(true);
    expect(isDateInCompetition('2026-10-05', multiMonthComp)).toBe(false);

    // Should appear in both September (8) and October (9)
    const sepComps = getCompetitionsForMonth(2026, 8, [multiMonthComp]);
    expect(sepComps.length).toBe(1);
    const octComps = getCompetitionsForMonth(2026, 9, [multiMonthComp]);
    expect(octComps.length).toBe(1);

    // Inverted dates defense: endDate before startDate
    const invertedComp: Competition = {
      id: 'cmp-inv',
      title: 'Турнир с инвертированной датой',
      date: '2026-10-25',
      endDate: '2026-10-20',
      location: 'Зал',
      requiredDocuments: [],
      participants: []
    };
    expect(isDateInCompetition('2026-10-22', invertedComp)).toBe(true);
    expect(isDateInCompetition('2026-10-26', invertedComp)).toBe(false);
  });

  it('safely handles extreme date values and century leap years', () => {
    // Extreme / malformed values do not throw and return safe fallback
    expect(getDayOfWeekIndex('999999999-99-99')).toBe(0);
    expect(addDays('999999999-99-99', 5)).toBe('999999999-99-99');
    expect(addDays('2026-10-06', NaN)).toBe('2026-10-06');

    // Century leap year 2000 (divisible by 400 -> leap year)
    const feb2000 = getMonthGrid(2000, 1).filter(d => d.isCurrentMonth);
    expect(feb2000.length).toBe(29);
  });
});
