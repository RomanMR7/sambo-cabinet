import { AttendanceStatus, ExpiryStatus, TrainingSession, Athlete } from '../types';

export const DEMO_TODAY = '2026-10-06';

/**
 * Calculates document expiry status based on date difference against DEMO_TODAY
 * <= 14 days is expiring_soon
 */
export function getDocumentExpiryStatus(expiryDate?: string, refDateStr: string = DEMO_TODAY): ExpiryStatus {
  if (!expiryDate) return 'unknown';

  const ref = new Date(refDateStr).getTime();
  const exp = new Date(expiryDate).getTime();
  const diffDays = Math.ceil((exp - ref) / (1000 * 60 * 60 * 24));

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
  statusBadge: 'ranked' | 'unranked' | 'blocked';
}

/**
 * Calculates the "4-Week Rule" attendance table and ranking.
 * Window: last 4 calendar weeks (all sessions provided).
 * E = total - excused
 * Rate = (present / E) * 100%
 * Rank calculated ONLY if E >= 4 AND unmarkedCount === 0
 * If E < 4 -> "Без места"
 * Athletes with same rate share the same rank (e.g., 1, 1, 3...)
 */
export function calculateFourWeekAttendance(
  athletes: Athlete[],
  sessions: TrainingSession[]
): FourWeekReportRow[] {
  // 1. Compute stats per athlete
  const rows = athletes.map(athlete => {
    let presentCount = 0;
    let absentCount = 0;
    let excusedCount = 0;
    let unmarkedCount = 0;

    sessions.forEach(session => {
      const status: AttendanceStatus = session.attendance[athlete.id] ?? 'unmarked';
      if (status === 'present') presentCount++;
      else if (status === 'absent') absentCount++;
      else if (status === 'excused') excusedCount++;
      else if (status === 'unmarked') unmarkedCount++;
    });

    const totalSessions = sessions.length;
    // Effective base E: sessions minus excused
    const effectiveBaseE = totalSessions - excusedCount;
    const ratePercent = effectiveBaseE > 0 ? Math.round((presentCount / effectiveBaseE) * 100) : 0;
    const isBlockedByUnmarked = unmarkedCount > 0;

    return {
      athlete,
      totalSessions,
      excusedCount,
      effectiveBaseE,
      presentCount,
      absentCount,
      unmarkedCount,
      ratePercent,
      isBlockedByUnmarked,
      rankText: '',
      rankNumber: null as number | null,
      statusBadge: 'unranked' as 'ranked' | 'unranked' | 'blocked'
    };
  });

  // 2. Filter candidates who qualify for ranking (E >= 4 and unmarked === 0)
  const rankable = rows.filter(r => r.effectiveBaseE >= 4 && !r.isBlockedByUnmarked);
  // Sort rankable by ratePercent descending
  rankable.sort((a, b) => b.ratePercent - a.ratePercent);

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

  return rows;
}

/**
 * S/3S rule evaluation
 */
export function evaluateS3Rule(checks: Array<{ success: boolean | null }>): {
  status: 'mastered' | 'in_progress' | 'failed';
  statusText: string;
  badgeColor: string;
  successCount: number;
  totalChecks: number;
} {
  const total = checks.length;
  const successCount = checks.filter(c => c.success === true).length;
  const hasUnknown = checks.some(c => c.success === null);

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
