import {
  AttendanceStatus,
  ExpiryStatus,
  TrainingSession,
  Athlete,
  DocType,
  DocumentRecord,
  Role,
  IndividualTask,
  ScheduleSlot
} from '../types';

/**
 * Returns current date formatted as YYYY-MM-DD using local system time.
 */
export function getTodayDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const DEMO_TODAY = '2026-10-06';

export type DocumentStatusType = 'valid' | 'expiring_soon' | 'expired' | 'perpetual' | 'unknown';

/**
 * Safely parses a date string in YYYY-MM-DD or ISO format into UTC timestamp.
 * Eliminates local timezone offsets and daylight saving anomalies.
 */
export function parseDateUtc(dateStr?: string | null): number | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    return Date.UTC(year, month, day);
  }
  const timestamp = new Date(trimmed).getTime();
  return isNaN(timestamp) ? null : timestamp;
}

/**
 * Calculates days difference until document expiry against reference date.
 * Returns null if no expiry date is set (e.g. perpetual consent) or invalid date.
 * Timezone-neutral: compares exact calendar days in UTC.
 */
export function getDaysUntilExpiry(
  expiryDate?: string | null,
  refDateStr: string = getTodayDate()
): number | null {
  if (!expiryDate || typeof expiryDate !== 'string') return null;
  const expUtc = parseDateUtc(expiryDate);
  const refUtc = parseDateUtc(refDateStr);
  if (expUtc === null || refUtc === null) return null;
  return Math.ceil((expUtc - refUtc) / (1000 * 60 * 60 * 24));
}

/**
 * Calculates document expiry status based on date difference against reference date.
 * <= 14 days is expiring_soon.
 */
export function getDocumentExpiryStatus(
  expiryDate?: string,
  refDateStr: string = getTodayDate()
): ExpiryStatus {
  if (!expiryDate) return 'unknown';

  const diffDays = getDaysUntilExpiry(expiryDate, refDateStr);
  if (diffDays === null) return 'unknown';

  if (diffDays < 0) return 'expired';
  if (diffDays <= 14) return 'expiring_soon';
  return 'valid';
}

/**
 * Enhanced document status evaluation supporting perpetual consent documents.
 * Accepts either:
 * - (doc: { expiryDate?: string; type?: DocType }, refDateStr?: string)
 * - (expiryDate?: string, refDateStr?: string, docType?: DocType)
 */
export function getDocumentStatus(
  docOrExpiry?: string | { expiryDate?: string; type?: DocType; [key: string]: any },
  refDateStr: string = getTodayDate(),
  docType?: DocType
): DocumentStatusType {
  let expiryDate: string | undefined;
  let type: DocType | undefined = docType;

  if (typeof docOrExpiry === 'object' && docOrExpiry !== null) {
    expiryDate = docOrExpiry.expiryDate;
    type = docOrExpiry.type ?? type;
  } else if (typeof docOrExpiry === 'string') {
    expiryDate = docOrExpiry;
  }

  if (type === 'consent') {
    return 'perpetual';
  }

  if (!expiryDate) {
    return 'unknown';
  }

  const diffDays = getDaysUntilExpiry(expiryDate, refDateStr);
  if (diffDays === null) return 'unknown';

  if (diffDays < 0) return 'expired';
  if (diffDays <= 14) return 'expiring_soon';
  return 'valid';
}

export interface FourWeekReportRow {
  athlete: Athlete;
  totalSessions: number;
  excusedCount: number;
  effectiveBaseE: number;
  presentCount: number;
  absentCount: number;
  unmarkedCount: number;
  ratePercent: number;
  rankText: string;
  rankNumber: number | null; // null if unranked or blocked
  isBlockedByUnmarked: boolean;
  hasUnmarked: boolean;
  statusBadge: 'ranked' | 'unranked' | 'blocked';
}

/**
 * Calculates the "4-Week Rule" attendance table and ranking.
 * Window: last 4 calendar weeks (all sessions provided).
 * E = total - excused
 * Rate = (present / E) * 100%
 * Rank calculated ONLY if E >= 4 AND unmarkedCount === 0
 * If E < 4 -> "Без места (E < 4)"
 * If unmarkedCount > 0 -> "Заблокировано (не отмечено)"
 * Athletes with same rate share the same rank (e.g., 1, 1, 3...)
 * Tie-breaker ordering:
 * 1. ratePercent descending
 * 2. presentCount descending (more total attendances)
 * 3. absentCount ascending (fewer unexcused absences)
 * 4. athlete fullName alphabetical (stable deterministic order)
 */
export function calculateFourWeekAttendance(
  athletes: Athlete[],
  sessions: TrainingSession[]
): FourWeekReportRow[] {
  if (!Array.isArray(athletes) || athletes.length === 0) return [];
  const safeSessions = Array.isArray(sessions) ? sessions : [];

  // 1. Compute stats per athlete
  const rows = athletes.map(athlete => {
    let presentCount = 0;
    let absentCount = 0;
    let excusedCount = 0;
    let unmarkedCount = 0;

    // Filter sessions belonging to this athlete's group (or global sessions without groupId)
    const athleteSessions = safeSessions.filter(
      s => !s.groupId || !athlete.groupId || s.groupId === athlete.groupId
    );

    athleteSessions.forEach(session => {
      const attendanceMap = session?.attendance || {};
      const status: AttendanceStatus = attendanceMap[athlete.id] ?? 'unmarked';
      if (status === 'present') presentCount++;
      else if (status === 'absent') absentCount++;
      else if (status === 'excused') excusedCount++;
      else if (status === 'unmarked') unmarkedCount++;
    });

    const totalSessions = athleteSessions.length;
    // Effective base E: sessions minus excused
    const effectiveBaseE = Math.max(0, totalSessions - excusedCount);
    const safePresent = Math.max(0, presentCount);
    const ratePercent = effectiveBaseE > 0 ? Math.round((safePresent / effectiveBaseE) * 100) : 0;
    const isBlockedByUnmarked = unmarkedCount > 0;
    const hasUnmarked = isBlockedByUnmarked;

    return {
      athlete,
      totalSessions,
      excusedCount,
      effectiveBaseE,
      presentCount: safePresent,
      absentCount: Math.max(0, absentCount),
      unmarkedCount: Math.max(0, unmarkedCount),
      ratePercent,
      isBlockedByUnmarked,
      hasUnmarked,
      rankText: '',
      rankNumber: null as number | null,
      statusBadge: 'unranked' as 'ranked' | 'unranked' | 'blocked'
    };
  });

  // 2. Filter candidates who qualify for ranking (E >= 4 and unmarked === 0)
  const rankable = rows.filter(r => r.effectiveBaseE >= 4 && !r.isBlockedByUnmarked);

  // Deterministic multi-level sort
  rankable.sort((a, b) => {
    if (b.ratePercent !== a.ratePercent) {
      return b.ratePercent - a.ratePercent;
    }
    // Tie-breaker 1: More attended sessions
    if (b.presentCount !== a.presentCount) {
      return b.presentCount - a.presentCount;
    }
    // Tie-breaker 2: Fewer unexcused absences
    if (a.absentCount !== b.absentCount) {
      return a.absentCount - b.absentCount;
    }
    // Tie-breaker 3: Deterministic alphabetical ordering
    return a.athlete.fullName.localeCompare(b.athlete.fullName, 'ru');
  });

  // Assign standard competition ranks (1, 1, 3, etc.)
  let currentRank = 1;
  for (let i = 0; i < rankable.length; i++) {
    if (i > 0 && rankable[i].ratePercent < rankable[i - 1].ratePercent) {
      currentRank = i + 1;
    }
    rankable[i].rankNumber = currentRank;
    rankable[i].rankText = `${currentRank} место`;
    rankable[i].statusBadge = 'ranked';
  }

  // 3. Set text for non-rankable
  rows.forEach(r => {
    if (r.isBlockedByUnmarked) {
      r.rankText = 'Заблокировано (не отмечено)';
      r.statusBadge = 'blocked';
    } else if (r.effectiveBaseE < 4) {
      r.rankText = 'Без места (E < 4)';
      r.statusBadge = 'unranked';
    }
  });

  // 4. Return sorted list: ranked leaders first, followed by unranked and blocked
  return [
    ...rankable,
    ...rows.filter(r => r.statusBadge === 'unranked'),
    ...rows.filter(r => r.statusBadge === 'blocked')
  ];
}

/**
 * Alias for calculateFourWeekAttendance per architectural specification
 */
export const calculateFourWeekStats = calculateFourWeekAttendance;

/**
 * Generates CSV export with UTF-8 BOM for Russian spreadsheet software (Excel, LibreOffice)
 */
export function generateAttendanceCSV(rows: FourWeekReportRow[]): string {
  const headers = [
    'Спортсмен',
    'Всего занятий',
    'Уважительных (исключено)',
    'Эффективная база E',
    'Присутствовал',
    'Пропусков',
    'Не отмечено',
    'Доля посещений (%)',
    'Итоговое место'
  ];

  const csvLines = rows.map(r => [
    `"${r.athlete.fullName}"`,
    r.totalSessions,
    r.excusedCount,
    r.effectiveBaseE,
    r.presentCount,
    r.absentCount,
    r.unmarkedCount,
    `${r.ratePercent}%`,
    `"${r.rankText}"`
  ].join(';'));

  return '\uFEFF' + [headers.join(';'), ...csvLines].join('\r\n');
}

export type SkillStatusType = 'Освоено' | 'В процессе' | 'Требуется доработка';
export type SkillCheckInput =
  | Array<{ success: boolean | null }>
  | Array<boolean | null>
  | number;

/**
 * Calculates progress for the "S/3S" skill verification rule.
 * - 3 successful checks -> 'Освоено' (mastered)
 * - 1-2 successful checks -> 'В процессе' (in_progress)
 * - 0 successful checks or all failures -> 'Требуется доработка' (failed)
 */
export function calculateSkillProgress(checks: SkillCheckInput): {
  status: 'mastered' | 'in_progress' | 'failed';
  statusTitle: SkillStatusType;
  statusText: string;
  badgeColor: string;
  successCount: number;
  totalChecks: number;
} {
  let successCount = 0;
  let totalChecks = 3;
  let hasUnknown = false;
  let failureCount = 0;

  if (typeof checks === 'number') {
    successCount = Math.max(0, isNaN(checks) ? 0 : Math.min(3, Math.floor(checks)));
    totalChecks = 3;
    hasUnknown = successCount > 0 && successCount < 3;
  } else if (Array.isArray(checks)) {
    totalChecks = Math.max(checks.length, 3);
    const normalized = checks.map(c => (typeof c === 'object' && c !== null ? c.success : c));
    successCount = normalized.filter(s => s === true).length;
    failureCount = normalized.filter(s => s === false).length;
    hasUnknown = normalized.some(s => s === null) || checks.length < 3;
  } else {
    totalChecks = 3;
    successCount = 0;
  }

  if (successCount >= 3) {
    return {
      status: 'mastered',
      statusTitle: 'Освоено',
      statusText: 'Освоено (Зачёт 3/3)',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      successCount,
      totalChecks
    };
  }

  // If there are 1 or 2 successes and either checks are incomplete (hasUnknown or totalChecks < 3)
  // or explicitly 1-2 successful attempts in progress
  if (successCount >= 1 && successCount <= 2) {
    if (totalChecks >= 3 && failureCount > 0 && !hasUnknown && (successCount + failureCount === totalChecks)) {
      // 3 checks completed with failure (e.g., [true, false, false])
      return {
        status: 'failed',
        statusTitle: 'Требуется доработка',
        statusText: `Требуется доработка (${successCount}/3)`,
        badgeColor: 'bg-red-100 text-red-800 border-red-300',
        successCount,
        totalChecks
      };
    }
    return {
      status: 'in_progress',
      statusTitle: 'В процессе',
      statusText: `В процессе (${successCount}/3)`,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      successCount,
      totalChecks
    };
  }

  // 0 successful attempts or failures
  return {
    status: 'failed',
    statusTitle: 'Требуется доработка',
    statusText: `Требуется доработка (${successCount}/3)`,
    badgeColor: 'bg-red-100 text-red-800 border-red-300',
    successCount,
    totalChecks
  };
}

/**
 * Returns skill status title: 'Освоено' | 'В процессе' | 'Требуется доработка'
 */
export function getSkillStatus(checks: SkillCheckInput): SkillStatusType {
  return calculateSkillProgress(checks).statusTitle;
}

/**
 * Backward-compatible S/3S rule evaluation for UI views
 */
export function evaluateS3Rule(checks: Array<{ success: boolean | null }>): {
  status: 'mastered' | 'in_progress' | 'failed';
  statusText: string;
  badgeColor: string;
  successCount: number;
  totalChecks: number;
} {
  const safeChecks = Array.isArray(checks) ? checks : [];
  const total = safeChecks.length;
  const successCount = safeChecks.filter(c => c && c.success === true).length;
  const hasUnknown = safeChecks.some(c => !c || c.success === null);

  if (hasUnknown) {
    return {
      status: 'in_progress',
      statusText: `В процессе (${successCount}/3 проверок)`,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      successCount,
      totalChecks: total
    };
  }

  if (successCount === 3) {
    return {
      status: 'mastered',
      statusText: 'Освоено (Зачёт 3/3)',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      successCount,
      totalChecks: total
    };
  }

  return {
    status: 'failed',
    statusText: `Требуется доработка (${successCount}/3)`,
    badgeColor: 'bg-red-100 text-red-800 border-red-300',
    successCount,
    totalChecks: total
  };
}

/**
 * ----------------------------------------------------
 * Role-Based Security & Data Isolation (152-FZ)
 * ----------------------------------------------------
 */

/**
 * Checks if a given role has medical clearance to view medical scans.
 * According to 152-FZ & medical secrecy laws:
 * - Admin has NO medical clearance (returns false)
 * - Coach and Verifier have system clearance (returns true)
 */
export function canRoleAccessMedicalData(role: Role): boolean {
  return role !== 'admin';
}

/**
 * Checks whether a document record is accessible to a user of a given role.
 */
export function isDocumentAccessibleForRole(
  document: Pick<DocumentRecord, 'type' | 'isRestrictedMedical' | 'athleteId'> | null | undefined,
  role: Role,
  currentAthleteId?: string
): boolean {
  if (!document) return false;

  // 152-FZ: Admin cannot access restricted medical records
  if (role === 'admin') {
    if (document.isRestrictedMedical || document.type === 'medical') {
      return false;
    }
    return true;
  }

  // Parent / Athlete: strict isolation to their own records
  if (role === 'parent' || role === 'athlete') {
    if (!currentAthleteId) return false;
    return document.athleteId === currentAthleteId;
  }

  // Coach & Verifier have operational access
  return true;
}

/**
 * Filters document list for a specific role and current athlete context.
 */
export function filterDocumentsForRole(
  documents: DocumentRecord[],
  role: Role,
  currentAthleteId?: string
): DocumentRecord[] {
  if (!Array.isArray(documents)) return [];
  return documents.filter(doc => isDocumentAccessibleForRole(doc, role, currentAthleteId));
}

/**
 * Filters athlete roster based on role.
 * Parent and Athlete only see their own profile.
 * Coach, Admin, Verifier see all group athletes.
 */
export function filterAthletesForRole(
  athletes: Athlete[],
  role: Role,
  currentAthleteId?: string
): Athlete[] {
  if (!Array.isArray(athletes)) return [];
  if (role === 'parent' || role === 'athlete') {
    if (!currentAthleteId) return [];
    return athletes.filter(a => a && a.id === currentAthleteId);
  }
  return athletes;
}

/**
 * Filters tasks for role:
 * Parent and Athlete ONLY see tasks assigned to them AND explicitly marked publishedToFamily.
 */
export function filterTasksForRole(
  tasks: IndividualTask[],
  role: Role,
  currentAthleteId?: string
): IndividualTask[] {
  if (!Array.isArray(tasks)) return [];
  if (role === 'parent' || role === 'athlete') {
    if (!currentAthleteId) return [];
    return tasks.filter(t => t && t.athleteId === currentAthleteId && t.publishedToFamily);
  }
  return tasks;
}

/**
 * Returns formatted short name for coach (e.g. "Иванов Алексей Васильевич" -> "Иванов А. В.")
 */
export function getCoachShortName(fullName?: string): string {
  if (!fullName || typeof fullName !== 'string') return '';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 3) {
    return `${parts[0]} ${parts[1][0]}. ${parts[2][0]}.`;
  }
  if (parts.length === 2) {
    return `${parts[0]} ${parts[1][0]}.`;
  }
  return fullName;
}

/**
 * Robustly matches a coach with a group based on fullName, short name, or surname.
 */
export function isCoachForGroup(
  coach: { fullName: string },
  group: { coachName?: string }
): boolean {
  if (!coach || !coach.fullName || !group || !group.coachName) return false;
  const target = group.coachName.trim();
  if (target === coach.fullName.trim()) return true;

  const coachShort = getCoachShortName(coach.fullName);
  if (coachShort && target === coachShort) return true;

  const noSpaceShort = coachShort.replace(/\. /g, '.');
  if (target === noSpaceShort) return true;

  const parts = coach.fullName.trim().split(/\s+/);
  const surname = parts[0];
  if (surname && target.startsWith(surname)) {
    if (target === surname) return true;
    // Check initial if available
    const init = parts[1]?.[0];
    if (init) {
      return target.includes(init);
    }
    return true;
  }
  return false;
}

/**
 * Checks whether a schedule slot is assigned to a specific coach.
 */
export function isCoachForSlot(
  coach?: { fullName: string } | null,
  slot?: ScheduleSlot | null
): boolean {
  if (!coach || !coach.fullName || !slot || !slot.coach) return false;
  return isCoachForGroup(coach, { coachName: slot.coach });
}

// ==========================================
// SCHEDULE & HALL CONFLICT DETECTION
// ==========================================

export interface TimeIntervalMinutes {
  start: number;
  end: number;
}

/**
 * Parses time range string (e.g., "18:00–19:30", "18.00-19.30", "17:30 - 19:00") into minutes from midnight.
 * Handles diverse unicode dashes, hyphens, and colon or dot time separators.
 * Returns null for any invalid, malformed, or inverted intervals (start >= end).
 */
export function parseTimeInterval(timeStr?: string | null): TimeIntervalMinutes | null {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const trimmed = timeStr.trim();
  if (!trimmed) return null;

  // Supports hyphen-minus, en-dash, em-dash, figure dash, horizontal bar, minus sign, etc.
  const parts = trimmed.split(/\s*[\-\u2010-\u2015\u2212\uFE58\uFF0D–—]\s*/);
  if (parts.length !== 2) return null;

  const parsePart = (val: string): number | null => {
    if (!val) return null;
    // Supports both HH:MM and HH.MM formats
    const match = /^(\d{1,2})[:.](\d{2})$/.exec(val.trim());
    if (!match) return null;
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
    return h * 60 + m;
  };

  const start = parsePart(parts[0]);
  const end = parsePart(parts[1]);

  if (start === null || end === null || start >= end) return null;
  return { start, end };
}

const RUSSIAN_DAY_CANONICAL: Record<string, string> = {
  пн: 'понедельник',
  понедельник: 'понедельник',
  mon: 'понедельник',
  monday: 'понедельник',
  вт: 'вторник',
  вторник: 'вторник',
  tue: 'вторник',
  tuesday: 'вторник',
  ср: 'среда',
  среда: 'среда',
  wed: 'среда',
  wednesday: 'среда',
  чт: 'четверг',
  четверг: 'четверг',
  thu: 'четверг',
  thursday: 'четверг',
  пт: 'пятница',
  пятница: 'пятница',
  fri: 'пятница',
  friday: 'пятница',
  сб: 'суббота',
  суббота: 'суббота',
  sat: 'суббота',
  saturday: 'суббота',
  вс: 'воскресенье',
  воскресенье: 'воскресенье',
  sun: 'воскресенье',
  sunday: 'воскресенье'
};

export function canonicalizeDay(day?: string | null): string {
  if (!day || typeof day !== 'string') return '';
  const clean = day.trim().toLowerCase().replace(/[^а-яёa-z]/gi, '');
  return RUSSIAN_DAY_CANONICAL[clean] || clean;
}

export function canonicalizeHall(hall?: string | null): string {
  if (!hall || typeof hall !== 'string') return '';
  const clean = hall.trim().toLowerCase().replace(/\s+/g, ' ');

  // Hall 1 matching (№1, 1, первый, основной ковер, главный зал)
  if (/(?:№\s*1(?!\d)|\b1\b|перв|основн|главн)/i.test(clean)) {
    return 'зал 1';
  }
  // Hall 2 matching (№2, 2, второй, офп, акробатика)
  if (/(?:№\s*2(?!\d)|\b2\b|втор|офп|акробат)/i.test(clean)) {
    return 'зал 2';
  }
  return clean;
}

export interface ScheduleConflictResult {
  hasConflict: boolean;
  conflictingSlot?: ScheduleSlot;
  message?: string;
}

/**
 * Checks if a candidate schedule slot causes a double booking conflict in the specified hall.
 * Evaluates overlapping time intervals on the same weekday and same hall.
 * Ignores the slot being edited if candidate.id is provided.
 * Fully null-safe: handles empty lists, undefined fields, and invalid candidates without throwing.
 */
export function checkScheduleConflict(
  existingSlots: ScheduleSlot[],
  candidate: { id?: string; day: string; time: string; hall: string }
): ScheduleConflictResult {
  if (!Array.isArray(existingSlots) || existingSlots.length === 0) {
    return { hasConflict: false };
  }

  if (!candidate || typeof candidate !== 'object') {
    return { hasConflict: false };
  }

  if (!candidate.day || !candidate.time || !candidate.hall) {
    return { hasConflict: false };
  }

  const candInterval = parseTimeInterval(candidate.time);
  if (!candInterval) {
    return { hasConflict: false };
  }

  const candDay = canonicalizeDay(candidate.day);
  const candHall = canonicalizeHall(candidate.hall);
  if (!candDay || !candHall) {
    return { hasConflict: false };
  }

  for (const slot of existingSlots) {
    if (!slot || !slot.day || !slot.time || !slot.hall) continue;

    // Ignore slot with candidate.id when editing
    if (candidate.id && slot.id === candidate.id) {
      continue;
    }

    const slotDay = canonicalizeDay(slot.day);
    if (slotDay !== candDay) {
      continue;
    }

    const slotHall = canonicalizeHall(slot.hall);
    if (slotHall !== candHall) {
      continue;
    }

    const slotInterval = parseTimeInterval(slot.time);
    if (!slotInterval) {
      continue;
    }

    // Interval overlap: [start, end)
    const isOverlapping = candInterval.start < slotInterval.end && candInterval.end > slotInterval.start;

    if (isOverlapping) {
      const sportName =
        slot.sportLabel ||
        (slot.sport === 'karate'
          ? 'Карате Кёкусинкай'
          : slot.sport === 'fitness'
          ? 'ОФП и акробатика'
          : 'Самбо');

      const groupName = slot.group || 'Занятие';
      const coachName = slot.coach || 'Тренер не указан';

      return {
        hasConflict: true,
        conflictingSlot: slot,
        message: `Конфликт расписания в «${slot.hall}» (${slot.day}): время пересекается со слотом «${groupName}» (${sportName}, тренер ${coachName}, ${slot.time}).`
      };
    }
  }

  return { hasConflict: false };
}


