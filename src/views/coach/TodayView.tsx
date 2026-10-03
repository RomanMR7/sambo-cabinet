import React, { useState } from 'react';
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
  ChevronRight,
  FolderPlus,
  ChevronLeft,
  MapPin,
  User
} from 'lucide-react';
import {
  getDocumentExpiryStatus,
  calculateFourWeekAttendance,
  isCoachForGroup,
  isCoachForSlot,
  getCoachShortName,
  parseTimeInterval
} from '../../utils/rules';
import {
  addDays,
  formatRussianDate,
  getTodayDate,
  getDayOfWeekName,
  filterSlotsForDay
} from '../../utils/calendarEngine';
import { ScheduleSlot } from '../../types';

export const TodayView: React.FC = () => {
  const {
    setActiveNav,
    setSelectedAthleteId,
    setSelectedSessionId,
    setSelectedGroupId,
    createTrainingSessionFromPlan,
    scheduleSlots,
    tasks,
    documents,
    athletes,
    groups,
    sessions,
    activeCoachId,
    clubUsers
  } = useApp();

  const handleOpenAthleteDocs = (athleteId: string) => {
    setSelectedAthleteId(athleteId);
    setActiveNav('athlete_detail');
  };

  const handleOpenSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setActiveNav('sessions');
  };

  // Find active coach and his groups
  const activeCoach =
    (Array.isArray(clubUsers) ? clubUsers : []).find(u => u && u.id === activeCoachId) ||
    (Array.isArray(clubUsers) ? clubUsers : []).find(u => u && u.role === 'coach');

  const coachShort = activeCoach ? getCoachShortName(activeCoach.fullName) : 'Иванов А. В.';

  const coachGroups = (Array.isArray(groups) ? groups : []).filter(g =>
    activeCoach && isCoachForGroup(activeCoach, g)
  );

  const coachGroupIds = new Set(coachGroups.map(g => g.id));

  // Active athletes belonging to coach's groups
  const coachAthletes = (Array.isArray(athletes) ? athletes : []).filter(a =>
    a && a.isActive && coachGroupIds.has(a.groupId)
  );

  const coachAthleteIds = new Set(coachAthletes.map(a => a.id));

  // Dynamic today date state
  const todayDate = getTodayDate();
  const [selectedDate, setSelectedDate] = useState<string>(todayDate);
  const isSelectedToday = selectedDate === todayDate;
  const selectedDateFormatted = formatRussianDate(selectedDate, true);

  const handlePrevDay = () => setSelectedDate(prev => addDays(prev, -1));
  const handleNextDay = () => setSelectedDate(prev => addDays(prev, 1));
  const handleToday = () => setSelectedDate(todayDate);

  // Sessions for coach's groups
  const coachSessions = (Array.isArray(sessions) ? sessions : []).filter(s =>
    s && coachGroupIds.has(s.groupId)
  );

  // Day of week for selected date
  const selectedDayName = getDayOfWeekName(selectedDate);

  // Sessions conducted or saved on selected date
  const sessionsOnDate = coachSessions.filter(s => s.date === selectedDate);
  const sessionForSelectedDate = sessionsOnDate.find(s => !s.isCompleted) || sessionsOnDate[0] || null;

  // Planned mat schedule slots for active coach on this day of week
  const slotsOnDate = filterSlotsForDay(selectedDayName, scheduleSlots || []).filter(slot =>
    isCoachForSlot(activeCoach, slot)
  );

  // Pending planned slots that don't already have a session in journal on this date
  const pendingSlotsOnDate = slotsOnDate.filter(slot => {
    const slotInterval = parseTimeInterval(slot.time);
    return !sessionsOnDate.some(s => {
      if (s.timeRange === slot.time) return true;
      if (!slotInterval) return false;
      const sInterval = parseTimeInterval(s.timeRange);
      return (
        sInterval !== null &&
        sInterval.start === slotInterval.start &&
        sInterval.end === slotInterval.end
      );
    });
  });

  // Handler to start / open session from a planned carpet schedule slot
  const handleStartSlotSession = (slot: ScheduleSlot) => {
    if (!slot) return;
    const slotGroupName = (slot.group || '').toLowerCase();
    const matchedGroup = coachGroups.find(
      g =>
        g &&
        g.name &&
        (slotGroupName.includes(g.name.toLowerCase()) ||
          g.name.toLowerCase().includes(slotGroupName))
    ) || coachGroups[0];

    const targetGroupId = matchedGroup?.id || 'grp-1';
    setSelectedGroupId(targetGroupId);

    // If an existing session for this group and time exists on this date, navigate to it
    const slotInterval = parseTimeInterval(slot.time);
    const existing = sessionsOnDate.find(s => {
      if (s.groupId !== targetGroupId) return false;
      if (s.timeRange === slot.time) return true;
      const sInterval = parseTimeInterval(s.timeRange);
      return (
        slotInterval !== null &&
        sInterval !== null &&
        sInterval.start === slotInterval.start &&
        sInterval.end === slotInterval.end
      );
    });
    if (existing) {
      setSelectedSessionId(existing.id);
      setActiveNav('sessions');
      return;
    }

    // Otherwise create session from slot plan and navigate to session journal
    const sportName =
      slot.sportLabel ||
      (slot.sport === 'karate'
        ? 'Карате Кёкусинкай'
        : slot.sport === 'fitness'
        ? 'ОФП и акробатика'
        : 'Самбо');

    createTrainingSessionFromPlan({
      groupId: targetGroupId,
      date: selectedDate,
      timeRange: slot.time,
      topic: `${sportName}: ${slot.group}`,
      exercises: [
        { title: 'Разминка и специальная подготовка на татами', durationMinutes: 20 },
        { title: 'Отработка техники и приёмов на ковре', durationMinutes: 50 },
        { title: 'ОФП, растяжка и подведение итогов', durationMinutes: 20 }
      ]
    });
    setActiveNav('sessions');
  };

  // Next / upcoming session for coach's groups (compares >= todayDate)
  const sortedSessions = [...coachSessions].sort(
    (a, b) => a.date.localeCompare(b.date) || a.timeRange.localeCompare(b.timeRange)
  );
  const upcomingSession =
    sortedSessions.find(s => !s.isCompleted && s.date >= todayDate) ||
    sortedSessions.find(s => !s.isCompleted) ||
    (sortedSessions.length > 0 ? sortedSessions[sortedSessions.length - 1] : null);

  const upcomingGroup = upcomingSession
    ? coachGroups.find(g => g.id === upcomingSession.groupId)
    : null;

  // Filter tasks and documents strictly for coach's athletes
  const coachTasks = (Array.isArray(tasks) ? tasks : []).filter(t =>
    t && coachAthleteIds.has(t.athleteId)
  );

  const coachDocs = (Array.isArray(documents) ? documents : []).filter(d =>
    d && coachAthleteIds.has(d.athleteId)
  );

  const pendingDocsCount = coachDocs.filter(d => d.verificationStatus === 'unverified').length;
  const activeTasksCount = coachTasks.filter(t => t.status === 'active' || t.status === 'needs_review').length;

  const expiringDocs = coachDocs.filter(d => {
    const s = getDocumentExpiryStatus(d.expiryDate);
    return s === 'expiring_soon' || s === 'expired';
  });

  const unverifiedDocs = coachDocs.filter(d => d.verificationStatus === 'unverified');
  const activeTasks = coachTasks.filter(t => t.status === 'active');

  // Rule 4 weeks warnings: athletes with < 50% attendance rate
  const fourWeekAttendanceRows = calculateFourWeekAttendance(coachAthletes, coachSessions);
  const lowAttendanceAlerts = fourWeekAttendanceRows.filter(
    row => row.effectiveBaseE >= 2 && (row.ratePercent < 50 || row.statusBadge === 'blocked')
  );

  // Recent absences in the last week / recent completed sessions
  const recentSessions = [...coachSessions]
    .filter(s => s.isCompleted || s.date <= todayDate)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);

  const recentAbsenceAlerts: Array<{
    athleteId: string;
    athleteName: string;
    avatarInitials: string;
    sessionDate: string;
    sessionTopic: string;
    isExcused: boolean;
    reason?: string;
  }> = [];

  recentSessions.forEach(s => {
    coachAthletes.forEach(a => {
      const st = s.attendance?.[a.id];
      if (st === 'absent') {
        recentAbsenceAlerts.push({
          athleteId: a.id,
          athleteName: a.shortName,
          avatarInitials: a.avatarInitials,
          sessionDate: s.date,
          sessionTopic: s.topic,
          isExcused: false
        });
      } else if (st === 'excused') {
        recentAbsenceAlerts.push({
          athleteId: a.id,
          athleteName: a.shortName,
          avatarInitials: a.avatarInitials,
          sessionDate: s.date,
          sessionTopic: s.topic,
          isExcused: true,
          reason: s.exceptions?.[a.id] || 'Уважительная причина'
        });
      }
    });
  });

  const totalAttentionCount =
    expiringDocs.length +
    unverifiedDocs.length +
    lowAttendanceAlerts.length +
    recentAbsenceAlerts.length +
    activeTasks.length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5" />
            <span>Цифровой кабинет тренера: {coachShort}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            {isSelectedToday ? 'Сегодня' : 'Обзор расписания дня'}
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            {coachGroups.length > 0
              ? `Группы: ${coachGroups.map(g => g.name.replace(/ \(.*\)/, '')).join(', ')}`
              : 'Нет закреплённых групп'}
          </p>
        </div>

        {/* Interactive Day Switcher: [← Вчера] [Дата (Сегодня)] [Завтра →] */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
            <button
              onClick={handlePrevDay}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1"
              title="Переключить на вчерашний день"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Вчера</span>
            </button>

            <button
              onClick={handleToday}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                isSelectedToday
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
              }`}
              title={`Перейти к Сегодня (${formatRussianDate(todayDate, false)})`}
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{selectedDateFormatted}</span>
              <span className="sm:hidden">{formatRussianDate(selectedDate, false)}</span>
              {isSelectedToday && (
                <span className="ml-1 px-1.5 py-0.5 rounded-md bg-white/25 text-white text-[10px] uppercase font-black">
                  Сегодня
                </span>
              )}
            </button>

            <button
              onClick={handleNextDay}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1"
              title="Переключить на завтрашний день"
            >
              <span>Завтра</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {(sessionForSelectedDate || pendingSlotsOnDate[0] || upcomingSession) && (
            <button
              onClick={() => {
                if (sessionForSelectedDate) {
                  handleOpenSession(sessionForSelectedDate.id);
                } else if (pendingSlotsOnDate[0]) {
                  handleStartSlotSession(pendingSlotsOnDate[0]);
                } else if (upcomingSession) {
                  handleOpenSession(upcomingSession.id);
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-sm shadow-red-900/20 transition shrink-0"
            >
              <Dumbbell className="w-4 h-4" />
              <span>
                {sessionForSelectedDate
                  ? `Начать тренировку (${sessionForSelectedDate.timeRange.split(/[\–\-—]/)[0]?.trim() || '18:00'})`
                  : pendingSlotsOnDate[0]
                  ? `Начать тренировку (${pendingSlotsOnDate[0].time.split(/[\–\-—]/)[0]?.trim() || '18:00'})`
                  : `Ближайшая: ${upcomingSession ? formatRussianDate(upcomingSession.date, false) : ''}`}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Empty State: If coach has no groups */}
      {coachGroups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 sm:p-12 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
            <FolderPlus className="w-7 h-7 text-slate-500" />
          </div>
          <div className="max-w-md mx-auto">
            <h2 className="text-lg font-bold text-slate-900">У тренера пока нет назначенных групп</h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Тренер {activeCoach?.fullName || coachShort} не закреплён ни за одной учебной группой.
              Перейдите в раздел управления группой, чтобы создать группу или назначить ответственного.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => setActiveNav('athletes')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md transition"
            >
              <Users className="w-4 h-4" />
              <span>Перейти к группам и спортсменам</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1 */}
            <div
              onClick={() => setActiveNav('athletes')}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-red-300 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Спортсмены</span>
                <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-red-50 text-slate-700 group-hover:text-red-600 flex items-center justify-center transition">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-extrabold text-slate-900">{coachAthletes.length} спортсменов</div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 group-hover:text-red-600">
                  <span className="truncate">
                    {coachGroups.map(g => g.name.replace(/ \(.*\)/, '')).join(', ') || 'В группах тренера'}
                  </span>
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1 shrink-0" />
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div
              onClick={() => {
                if (sessionForSelectedDate) {
                  handleOpenSession(sessionForSelectedDate.id);
                } else if (pendingSlotsOnDate[0]) {
                  handleStartSlotSession(pendingSlotsOnDate[0]);
                } else if (upcomingSession) {
                  handleOpenSession(upcomingSession.id);
                } else {
                  setActiveNav('sessions');
                }
              }}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-red-300 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {sessionForSelectedDate || pendingSlotsOnDate[0] ? 'Текущее' : 'Ближайшее'}
                </span>
                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-extrabold text-slate-900">
                  {sessionForSelectedDate
                    ? `Занятие ${sessionForSelectedDate.timeRange.split(/[\–\-—]/)[0]?.trim() || '18:00'}`
                    : pendingSlotsOnDate[0]
                    ? `Занятие ${pendingSlotsOnDate[0].time.split(/[\–\-—]/)[0]?.trim() || '18:00'}`
                    : upcomingSession
                    ? `Занятие ${upcomingSession.timeRange.split(/[\–\-—]/)[0]?.trim() || '18:00'}`
                    : 'Нет занятий'}
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 group-hover:text-red-600">
                  <span className="truncate">
                    {sessionForSelectedDate
                      ? `${coachGroups.find(g => g.id === sessionForSelectedDate.groupId)?.name.replace(/ \(.*\)/, '') || 'Группа'} • ${isSelectedToday ? 'Сегодня' : selectedDateFormatted}`
                      : pendingSlotsOnDate[0]
                      ? `${pendingSlotsOnDate[0].group} • ${isSelectedToday ? 'Сегодня (Ковёр)' : selectedDateFormatted}`
                      : upcomingSession
                      ? `${upcomingGroup?.name.replace(/ \(.*\)/, '') || 'Группа'} • ${formatRussianDate(upcomingSession.date, false)}`
                      : 'Расписание свободно'}
                  </span>
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1 shrink-0" />
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
                <div className="text-2xl font-extrabold text-slate-900">{activeTasksCount} в работе</div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 group-hover:text-red-600">
                  <span>Раздел Развитие и S/3S</span>
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1 shrink-0" />
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
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1 shrink-0" />
                </div>
              </div>
            </div>
          </div>

          {/* Widget «Тренировки дня / Ближайшее занятие» */}
          {sessionsOnDate.length > 0 || pendingSlotsOnDate.length > 0 ? (
            <div className="space-y-4">
              {/* Conducted or Saved Sessions */}
              {sessionsOnDate.map(session => {
                const groupForSession = coachGroups.find(g => g.id === session.groupId);
                return (
                  <div
                    key={session.id}
                    className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-900/40 shrink-0">
                        <Flame className="w-8 h-8" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                            {groupForSession?.name || 'Группа'}
                          </span>
                          <span className="text-xs text-slate-300 font-medium">
                            {session.timeRange} • {isSelectedToday ? `Сегодня (${formatRussianDate(selectedDate, false)})` : selectedDateFormatted}
                          </span>
                          {session.isCompleted && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Завершено
                            </span>
                          )}
                        </div>
                        <h2 className="text-xl font-bold mt-1 text-white">{session.topic}</h2>
                        <p className="text-xs text-slate-300 mt-1 max-w-xl">
                          {session.plan && session.plan.length > 0
                            ? `План занятия: ${session.plan.map(p => `${p.title} (${p.timeRange})`).join(' • ')}`
                            : 'План занятия: Разминка и отработка базовой техники самбо.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => handleOpenSession(session.id)}
                        className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md shadow-red-900/40 transition flex items-center gap-2"
                      >
                        <span>Открыть занятие</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Planned Schedule Slots without recorded session yet */}
              {pendingSlotsOnDate.map(slot => {
                const isKarate = slot.sport === 'karate';
                const isFitness = slot.sport === 'fitness';
                const sportName =
                  slot.sportLabel ||
                  (isKarate ? 'Карате Кёкусинкай' : isFitness ? 'ОФП и акробатика' : 'Самбо');

                return (
                  <div
                    key={slot.id}
                    className="bg-white rounded-2xl p-6 text-slate-900 shadow-sm border border-slate-200 hover:border-red-300 flex flex-col md:flex-row md:items-center justify-between gap-6 transition"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0 ${
                          isKarate
                            ? 'bg-emerald-600 shadow-emerald-900/20'
                            : isFitness
                            ? 'bg-amber-500 shadow-amber-900/20'
                            : 'bg-red-600 shadow-red-900/20'
                        }`}
                      >
                        <Dumbbell className="w-8 h-8" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              isKarate
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isFitness
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                          >
                            {slot.group}
                          </span>
                          <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {slot.time} • {isSelectedToday ? `Сегодня (${formatRussianDate(selectedDate, false)})` : selectedDateFormatted}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Плановый слот ковра
                          </span>
                        </div>

                        <h2 className="text-xl font-bold mt-1.5 text-slate-900">{sportName}</h2>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1.5">
                          <span className="flex items-center gap-1 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {slot.hall}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="flex items-center gap-1 font-medium">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {slot.coach}
                          </span>
                          {slot.notes && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="italic text-slate-500">{slot.notes}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => handleStartSlotSession(slot)}
                        className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md shadow-red-900/30 transition flex items-center gap-2"
                      >
                        <span>Начать занятие / Открыть журнал</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Выходной день • Нет тренировок на этот день
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {upcomingSession && upcomingSession.date >= todayDate
                      ? `Ближайшая тренировка запланирована на ${formatRussianDate(upcomingSession.date, true)} (${upcomingSession.timeRange}, ${upcomingGroup?.name || 'Группа'}).`
                      : upcomingSession
                      ? `Последняя тренировка прошла ${formatRussianDate(upcomingSession.date, true)} (${upcomingSession.timeRange}, ${upcomingGroup?.name || 'Группа'}).`
                      : `Для групп тренера ${coachShort} в расписании нет предстоящих занятий.`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!isSelectedToday && (
                  <button
                    onClick={handleToday}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition"
                  >
                    Вернуться к Сегодня
                  </button>
                )}
                {upcomingSession && (
                  <button
                    onClick={() => {
                      setSelectedDate(upcomingSession.date);
                      handleOpenSession(upcomingSession.id);
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
                  >
                    {upcomingSession.date >= todayDate ? 'Ближайшее' : 'Журнал'} ({formatRussianDate(upcomingSession.date, false)})
                  </button>
                )}
              </div>
            </div>
          )}

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
                  {totalAttentionCount}{' '}
                  {totalAttentionCount === 1 ? 'событие' : totalAttentionCount < 5 ? 'события' : 'событий'}
                </span>
              </div>

              <div className="space-y-3">
                {totalAttentionCount === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    <span>Все документы актуальны, пропусков и задолженностей нет.</span>
                  </div>
                ) : (
                  <>
                    {/* Low 4-Week Attendance Alerts */}
                    {lowAttendanceAlerts.slice(0, 2).map(row => (
                      <div
                        key={`low-att-${row.athlete.id}`}
                        onClick={() => handleOpenAthleteDocs(row.athlete.id)}
                        className="p-3.5 rounded-xl border border-red-200 bg-red-50/50 hover:bg-red-50 transition cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs">
                            {row.athlete.avatarInitials}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                              <span>Низкая посещаемость: {row.ratePercent}%</span>
                              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-200 text-red-800">
                                Правило 4 недель
                              </span>
                            </div>
                            <div className="text-xs text-slate-500">
                              {row.athlete.shortName} • Посещено {row.presentCount} из {row.effectiveBaseE} тренировок
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    ))}

                    {/* Recent Absences Alerts */}
                    {recentAbsenceAlerts.slice(0, 2).map((abs, idx) => (
                      <div
                        key={`abs-${abs.athleteId}-${idx}`}
                        onClick={() => handleOpenAthleteDocs(abs.athleteId)}
                        className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                          abs.isExcused
                            ? 'border-blue-200 bg-blue-50/40 hover:bg-blue-50'
                            : 'border-amber-200 bg-amber-50/50 hover:bg-amber-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                              abs.isExcused
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {abs.avatarInitials}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                              <span>
                                {abs.isExcused ? 'Уважительный пропуск' : 'Пропуск без причины'}
                              </span>
                              <span
                                className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                  abs.isExcused
                                    ? 'bg-blue-200 text-blue-800'
                                    : 'bg-amber-200 text-amber-800'
                                }`}
                              >
                                {formatRussianDate(abs.sessionDate, false)}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500">
                              {abs.athleteName} • {abs.isExcused ? abs.reason : abs.sessionTopic}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    ))}

                    {/* Expiring Docs */}
                    {expiringDocs.slice(0, 2).map(doc => {
                      const ath = coachAthletes.find(a => a.id === doc.athleteId);
                      const isExpired = getDocumentExpiryStatus(doc.expiryDate) === 'expired';
                      return (
                        <div
                          key={doc.id}
                          onClick={() => handleOpenAthleteDocs(doc.athleteId)}
                          className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-50 transition cursor-pointer flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                              {ath?.avatarInitials || 'СП'}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <span>
                                  {doc.title}: {isExpired ? 'истёк' : 'скоро истекает'}
                                </span>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-200 text-amber-800">
                                  до {doc.expiryDate}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500">
                                {ath?.shortName} • Требуется запросить продление у родителя
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      );
                    })}

                    {/* Unverified Docs */}
                    {unverifiedDocs.slice(0, 2).map(doc => {
                      const ath = coachAthletes.find(a => a.id === doc.athleteId);
                      return (
                        <div
                          key={doc.id}
                          onClick={() => handleOpenAthleteDocs(doc.athleteId)}
                          className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 transition cursor-pointer flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                              {ath?.avatarInitials || 'СП'}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <span>{doc.title}: на проверке</span>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-200 text-blue-800">
                                  Версия {doc.version}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500">
                                {ath?.shortName} • Ожидает подтверждения службы верификации
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      );
                    })}

                    {/* Active Tasks */}
                    {activeTasks.slice(0, 2).map(t => {
                      const ath = coachAthletes.find(a => a.id === t.athleteId);
                      return (
                        <div
                          key={t.id}
                          onClick={() => handleOpenAthleteDocs(t.athleteId)}
                          className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition cursor-pointer flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs">
                              {ath?.avatarInitials || 'СП'}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <span>Задача: {t.exerciseTitle}</span>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                                  до {t.deadline}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500">
                                {ath?.shortName} • {t.skillTitle}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      );
                    })}
                  </>
                )}
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
                {coachTasks.length === 0 ? (
                  <div className="p-6 text-center text-slate-500">
                    <p className="font-medium text-sm">Активных задач нет</p>
                    <p className="text-xs text-slate-400 mt-1">Все задачи завершены или еще не назначены</p>
                  </div>
                ) : (
                  coachTasks.map(t => {
                    const ath = coachAthletes.find(a => a.id === t.athleteId);
                    return (
                      <div
                        key={t.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition flex items-start justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs mt-0.5">
                            {ath?.avatarInitials || 'СП'}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">
                              {ath?.shortName || 'Спортсмен'} — «{t.exerciseTitle}»
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
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
