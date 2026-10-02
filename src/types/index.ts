export type Role = 'coach' | 'athlete' | 'parent' | 'admin' | 'verifier';

export type AttendanceStatus = 'present' | 'absent' | 'excused' | 'unmarked';

export type DocType = 'medical' | 'insurance' | 'consent';
export type VerificationStatus = 'unverified' | 'verified' | 'has_remarks';
export type ExpiryStatus = 'valid' | 'expiring_soon' | 'expired' | 'unknown';
export type AdmissionStatus = 'admitted' | 'not_admitted' | 'pending';

export interface DocumentRecord {
  id: string;
  athleteId: string;
  type: DocType;
  title: string;
  fileName: string;
  uploadDate: string; // ISO format (e.g. "2026-10-02")
  expiryDate?: string;
  version: number;
  verificationStatus: VerificationStatus;
  verifierComment?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  isRestrictedMedical: boolean; // Медкопии скрыты для Admin
}

export interface AdmissionDecision {
  status: AdmissionStatus;
  basis: string;
  reviewedAt: string;
  reviewedBy: string;
  validUntil?: string;
}

export interface WeightRecord {
  id: string;
  athleteId: string;
  date: string;
  weightKg: number;
  context: string;
}

export interface VideoNote {
  id: string;
  athleteId: string;
  title: string;
  videoUrl: string;
  timestamp: string; // e.g. "01:24"
  note: string;
  createdAt: string;
}

export interface SkillItem {
  id: string;
  category: string;
  title: string;
  criteria: string;
  recommendedExercise: string;
}

export interface IndividualTask {
  id: string;
  athleteId: string;
  observation: string;
  skillId: string;
  skillTitle: string;
  exerciseTitle: string;
  deadline: string;
  status: 'active' | 'completed' | 'needs_review';
  publishedToFamily: boolean;
  coachFeedback?: string;
  completedAt?: string;
}

export interface SkillVerificationRuleS3 {
  athleteId: string;
  skillId: string;
  skillTitle: string;
  checks: Array<{
    sessionId: string;
    date: string;
    success: boolean | null; // null = неизвестно (не равно 0)
  }>;
}

export interface TrainingSession {
  id: string;
  groupId: string;
  date: string; // "2026-10-06"
  timeRange: string; // "18:00–19:00"
  topic: string; // "Техника и учебные схватки"
  isCompleted: boolean;
  plan: Array<{
    order: number;
    title: string;
    timeRange: string;
  }>;
  attendance: Record<string, AttendanceStatus>; // athleteId -> status
  exceptions: Record<string, string>; // athleteId -> причина пропуска
  notes: Array<{
    id: string;
    athleteId: string;
    text: string;
    createdAt: string;
  }>;
}

export interface Competition {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  location: string;
  requiredDocuments: DocType[];
  participants: Array<{
    athleteId: string;
    category: string;
    admissionDecision: AdmissionStatus;
    resultBouts?: string;
    nextGoal?: string;
  }>;
}

export interface Athlete {
  id: string;
  fullName: string;
  shortName: string; // "Антон К."
  groupId: string;
  avatarInitials: string;
  isActive: boolean;
  birthDate?: string;
  admissionDecision: AdmissionDecision;
  parentName: string;
  parentPhone: string;
  athletePhone: string;
}

export interface GroupInfo {
  id: string;
  name: string;
  coachName: string;
  schedule: string;
  athleteCount: number;
}

export interface ScheduleSlot {
  id: string;
  day: string;
  time: string;
  hall: string;
  coach: string;
  group: string;
}

export interface ClubUser {
  id: string;
  fullName: string;
  role: 'admin' | 'coach' | 'verifier';
  phone: string;
  email: string;
  title: string;
  isHeadManager: boolean;
  isVerifierAssigned: boolean;
}

export type ExerciseCategory = 'warmup' | 'throws' | 'groundwork' | 'sfp';

export interface ExerciseItem {
  id: string;
  category: ExerciseCategory;
  categoryLabel: string;
  title: string;
  description: string;
  durationMinutes: number;
  intensity: 'low' | 'medium' | 'high';
}
