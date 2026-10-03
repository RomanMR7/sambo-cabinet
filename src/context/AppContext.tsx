import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Role,
  DocType,
  Athlete,
  DocumentRecord,
  TrainingSession,
  IndividualTask,
  SkillItem,
  SkillVerificationRuleS3,
  WeightRecord,
  VideoNote,
  Competition,
  GroupInfo,
  AttendanceStatus,
  VerificationStatus,
  AdmissionDecision,
  ScheduleSlot,
  ClubUser,
  ExerciseItem
} from '../types';
import {
  initialAthletes,
  initialDocuments,
  initialSessions,
  initialTasks,
  initialSkills,
  initialSkillChecks,
  initialWeights,
  initialVideoNotes,
  initialCompetitions,
  initialGroupInfo,
  initialScheduleSlots,
  initialGroups,
  initialClubUsers,
  initialExercises
} from '../data/seedData';
import { isCoachForGroup, getCoachShortName } from '../utils/rules';

const STORAGE_KEY = 'sambo_cabinet_state_v1';

// --- Safe LocalStorage Utility ---
function isStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const testKey = '__sambo_storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function safeGetItem(key: string): string | null {
  try {
    if (!isStorageAvailable()) return null;
    return window.localStorage.getItem(key);
  } catch (err) {
    console.warn('[Storage] Error reading from localStorage (e.g. private browsing restriction):', err);
    return null;
  }
}

function safeSetItem(key: string, value: string): { success: boolean; error?: string } {
  try {
    if (!isStorageAvailable()) {
      return { success: false, error: 'Локальное хранилище недоступно (приватный режим или блокировка в браузере).' };
    }
    window.localStorage.setItem(key, value);
    return { success: true };
  } catch (err: any) {
    let errorMsg = 'Ошибка записи в локальное хранилище';
    if (
      err?.name === 'QuotaExceededError' ||
      err?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err?.code === 22 ||
      err?.code === 1014
    ) {
      errorMsg = 'Превышена квота памяти браузера (QuotaExceededError). Экспортируйте резервную копию и очистите кэш.';
      console.error('[Storage QuotaExceededError]', errorMsg, err);
    } else {
      console.warn('[Storage] Error saving to localStorage:', err);
    }
    return { success: false, error: errorMsg };
  }
}

function safeRemoveItem(key: string): void {
  try {
    if (isStorageAvailable()) {
      window.localStorage.removeItem(key);
    }
  } catch (err) {
    console.warn('[Storage] Failed to remove key from localStorage:', err);
  }
}

export interface AppState {
  role: Role;
  activeCoachId: string;
  athletes: Athlete[];
  documents: DocumentRecord[];
  sessions: TrainingSession[];
  tasks: IndividualTask[];
  skills: SkillItem[];
  skillChecks: SkillVerificationRuleS3[];
  weights: WeightRecord[];
  videoNotes: VideoNote[];
  competitions: Competition[];
  groupInfo: GroupInfo;
  scheduleSlots: ScheduleSlot[];
  groups: GroupInfo[];
  selectedGroupId: string;
  clubUsers: ClubUser[];
  exercises: ExerciseItem[];
  selectedAthleteId: string;
  selectedSessionId: string;
  activeNav: string;
}

export interface AppContextType extends AppState {
  storageError: string | null;
  clearStorageError: () => void;
  setRole: (role: Role) => void;
  setActiveCoachId: (coachId: string) => void;
  setActiveNav: (nav: string) => void;
  setSelectedAthleteId: (id: string) => void;
  setSelectedSessionId: (id: string) => void;
  setSelectedGroupId: (groupId: string) => void;
  updateAttendance: (sessionId: string, athleteId: string, status: AttendanceStatus) => void;
  reportAbsence: (athleteId: string, sessionId: string, reason: string) => void;
  markAllPresent: (sessionId: string) => void;
  verifyDocument: (docId: string, status: VerificationStatus, comment?: string) => void;
  updateAdmissionDecision: (athleteId: string, decision: AdmissionDecision) => void;
  uploadDocument: (athleteId: string, doc: Partial<DocumentRecord>) => void;
  addObservationTask: (task: Omit<IndividualTask, 'id'>) => void;
  toggleTaskStatus: (taskId: string, status: 'active' | 'completed' | 'needs_review') => void;
  recordSkillCheck: (athleteId: string, skillId: string, checkIndex: number, success: boolean | null) => void;
  addWeight: (weight: Omit<WeightRecord, 'id'>) => void;
  addVideoNote: (note: Omit<VideoNote, 'id' | 'createdAt'>) => void;
  addSessionNote: (sessionId: string, athleteId: string, noteText: string) => void;
  updateAthlete: (athleteId: string, data: Partial<Athlete>) => void;
  addAthlete: (athlete: Omit<Athlete, 'id' | 'avatarInitials'>) => void;
  updateGroupInfo: (info: Partial<GroupInfo>) => void;
  addCompetition: (comp: Omit<Competition, 'id'>) => void;
  addCompetitionParticipant: (competitionId: string, athleteId: string, category: string, nextGoal?: string) => void;
  addCompetitionParticipants: (
    competitionId: string,
    participants: Array<{ athleteId: string; category: string; nextGoal?: string }>
  ) => void;
  addScheduleSlot: (slot: Omit<ScheduleSlot, 'id'>) => void;
  updateScheduleSlot: (slotId: string, slot: Partial<ScheduleSlot>) => void;
  deleteScheduleSlot: (slotId: string) => void;
  // Staff & Role Management
  addClubUser: (user: Omit<ClubUser, 'id'>) => void;
  updateClubUser: (userId: string, data: Partial<ClubUser>) => void;
  deleteClubUser: (userId: string) => void;
  setHeadManager: (userId: string) => void;
  toggleVerifierRole: (userId: string) => void;
  // Group & Athlete Composition
  addGroup: (group: Omit<GroupInfo, 'id' | 'athleteCount'>) => void;
  updateGroup: (groupId: string, data: Partial<GroupInfo>) => void;
  deleteGroup: (groupId: string) => void;
  moveAthleteToGroup: (athleteId: string, targetGroupId: string) => void;
  expelAthlete: (athleteId: string) => void;
  addAthleteToGroup: (athlete: Omit<Athlete, 'id' | 'avatarInitials'>) => void;
  // Exercise catalog & Training Session Constructor
  addExercise: (exercise: Omit<ExerciseItem, 'id'>) => void;
  deleteExercise: (exerciseId: string) => void;
  createTrainingSessionFromPlan: (data: {
    groupId: string;
    date: string;
    timeRange: string;
    topic: string;
    exercises: Array<{ title: string; durationMinutes: number }>;
  }) => void;
  resetToDemo: () => void;
  exportData: () => string;
  downloadBackup: () => void;
  importData: (jsonData: string) => { success: boolean; error?: string };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function getDefaultState(): AppState {
  return {
    role: 'coach',
    activeCoachId: 'usr-2',
    athletes: initialAthletes,
    documents: initialDocuments,
    sessions: initialSessions,
    tasks: initialTasks,
    skills: initialSkills,
    skillChecks: initialSkillChecks,
    weights: initialWeights,
    videoNotes: initialVideoNotes,
    competitions: initialCompetitions,
    groupInfo: initialGroupInfo,
    scheduleSlots: initialScheduleSlots,
    groups: initialGroups,
    selectedGroupId: 'grp-1',
    clubUsers: initialClubUsers,
    exercises: initialExercises,
    selectedAthleteId: 'ath-1',
    selectedSessionId: 'ses-today',
    activeNav: 'today'
  };
}

/**
 * Validates and sanitizes raw state, providing fallback to seedData for missing/corrupted fields.
 */
function getValidatedState(raw: any): AppState {
  const defaults = getDefaultState();
  if (!raw || typeof raw !== 'object') {
    return defaults;
  }

  const validRoles: Role[] = ['coach', 'athlete', 'parent', 'admin', 'verifier'];
  const role: Role = validRoles.includes(raw.role) ? raw.role : defaults.role;

  // Validate athletes with deep object sanitization
  const athletes = (Array.isArray(raw.athletes) && raw.athletes.length > 0)
    ? raw.athletes
        .filter((a: any) => a && typeof a === 'object' && typeof a.id === 'string' && typeof a.fullName === 'string')
        .map((a: any) => ({
          ...a,
          groupId: typeof a.groupId === 'string' && a.groupId ? a.groupId : 'grp-1',
          isActive: typeof a.isActive === 'boolean' ? a.isActive : true,
          parentName: typeof a.parentName === 'string' ? a.parentName : '',
          parentPhone: typeof a.parentPhone === 'string' ? a.parentPhone : '',
          athletePhone: typeof a.athletePhone === 'string' ? a.athletePhone : '',
          shortName: typeof a.shortName === 'string' && a.shortName ? a.shortName : (a.fullName || '').slice(0, 10),
          avatarInitials: typeof a.avatarInitials === 'string' && a.avatarInitials ? a.avatarInitials : 'СА',
          admissionDecision: (a.admissionDecision && typeof a.admissionDecision === 'object' && typeof a.admissionDecision.status === 'string')
            ? a.admissionDecision
            : { status: 'pending', basis: 'Ожидает повторного медицинского допуска', reviewedAt: '2026-10-01', reviewedBy: 'Тренер 1' }
        }))
    : defaults.athletes;
  const safeAthletes: Athlete[] = athletes.length > 0 ? athletes : defaults.athletes;

  // Validate documents with deep sanitization
  const documents = (Array.isArray(raw.documents) && raw.documents.length > 0)
    ? raw.documents
        .filter((d: any) => d && typeof d === 'object' && typeof d.id === 'string' && typeof d.title === 'string')
        .map((d: any) => ({
          ...d,
          athleteId: typeof d.athleteId === 'string' ? d.athleteId : 'ath-1',
          type: (['medical', 'insurance', 'consent'].includes(d.type) ? d.type : 'medical') as DocType,
          fileName: typeof d.fileName === 'string' ? d.fileName : 'Документ.pdf',
          uploadDate: typeof d.uploadDate === 'string' ? d.uploadDate : '2026-10-06',
          version: typeof d.version === 'number' && d.version > 0 ? d.version : 1,
          verificationStatus: (['unverified', 'verified', 'has_remarks'].includes(d.verificationStatus)
            ? d.verificationStatus
            : 'unverified') as VerificationStatus,
          isRestrictedMedical: typeof d.isRestrictedMedical === 'boolean'
            ? d.isRestrictedMedical
            : (d.type === 'medical')
        }))
    : defaults.documents;
  const safeDocuments: DocumentRecord[] = documents.length > 0 ? documents : defaults.documents;

  // Validate sessions
  const sessions = (Array.isArray(raw.sessions) && raw.sessions.length > 0)
    ? raw.sessions.filter((s: any) => s && typeof s === 'object' && typeof s.id === 'string').map((s: any) => ({
        ...s,
        groupId: typeof s.groupId === 'string' ? s.groupId : 'grp-1',
        date: typeof s.date === 'string' ? s.date : '2026-10-06',
        timeRange: typeof s.timeRange === 'string' ? s.timeRange : '18:00–19:30',
        topic: typeof s.topic === 'string' ? s.topic : 'Тренировочное занятие',
        isCompleted: typeof s.isCompleted === 'boolean' ? s.isCompleted : false,
        plan: Array.isArray(s.plan) ? s.plan : [],
        attendance: (s.attendance && typeof s.attendance === 'object') ? s.attendance : {},
        exceptions: (s.exceptions && typeof s.exceptions === 'object') ? s.exceptions : {},
        notes: Array.isArray(s.notes) ? s.notes : []
      }))
    : defaults.sessions;
  const safeSessions: TrainingSession[] = sessions.length > 0 ? sessions : defaults.sessions;

  // Validate tasks
  const tasks = Array.isArray(raw.tasks)
    ? raw.tasks
        .filter((t: any) => t && typeof t === 'object' && typeof t.id === 'string')
        .map((t: any) => ({
          ...t,
          status: ['active', 'completed', 'needs_review'].includes(t.status) ? t.status : 'active',
          publishedToFamily: typeof t.publishedToFamily === 'boolean' ? t.publishedToFamily : false
        }))
    : defaults.tasks;

  // Validate skills
  const skills = (Array.isArray(raw.skills) && raw.skills.length > 0)
    ? raw.skills.filter((sk: any) => sk && typeof sk === 'object' && typeof sk.id === 'string')
    : defaults.skills;

  // Validate skillChecks
  const skillChecks = (Array.isArray(raw.skillChecks) && raw.skillChecks.length > 0)
    ? raw.skillChecks.filter((sc: any) => sc && typeof sc === 'object' && typeof sc.athleteId === 'string' && Array.isArray(sc.checks))
    : defaults.skillChecks;

  // Validate weights
  const weights = Array.isArray(raw.weights)
    ? raw.weights.filter((w: any) => w && typeof w === 'object' && typeof w.id === 'string' && typeof w.weightKg === 'number')
    : defaults.weights;

  // Validate videoNotes
  const videoNotes = Array.isArray(raw.videoNotes)
    ? raw.videoNotes.filter((vn: any) => vn && typeof vn === 'object' && typeof vn.id === 'string')
    : defaults.videoNotes;

  // Validate competitions
  const competitions = (Array.isArray(raw.competitions) && raw.competitions.length > 0)
    ? raw.competitions.filter((c: any) => c && typeof c === 'object' && typeof c.id === 'string' && typeof c.title === 'string').map((c: any) => ({
        ...c,
        participants: Array.isArray(c.participants)
          ? c.participants
              .filter((p: any) => p && typeof p === 'object' && typeof p.athleteId === 'string')
              .map((p: any) => ({
                athleteId: p.athleteId,
                category: typeof p.category === 'string' && p.category.trim() ? p.category.trim() : 'Основная категория',
                admissionDecision: ['admitted', 'not_admitted', 'pending'].includes(p.admissionDecision)
                  ? p.admissionDecision
                  : 'pending',
                nextGoal: typeof p.nextGoal === 'string' && p.nextGoal.trim() ? p.nextGoal.trim() : undefined
              }))
          : []
      }))
    : defaults.competitions;

  // Validate groupInfo
  const groupInfo = (raw.groupInfo && typeof raw.groupInfo === 'object')
    ? { ...defaults.groupInfo, ...raw.groupInfo }
    : defaults.groupInfo;

  // Validate scheduleSlots
  let scheduleSlots: ScheduleSlot[] = defaults.scheduleSlots;
  if (Array.isArray(raw.scheduleSlots) && raw.scheduleSlots.length > 0) {
    const isLegacySeed =
      raw.scheduleSlots.length === 3 &&
      raw.scheduleSlots.every((s: any) => ['sch-1', 'sch-2', 'sch-3'].includes(s?.id) && !s?.sport);

    if (isLegacySeed) {
      scheduleSlots = defaults.scheduleSlots;
    } else {
      scheduleSlots = raw.scheduleSlots
        .filter((sl: any) => sl && typeof sl === 'object' && typeof sl.id === 'string')
        .map((sl: any) => ({
          id: String(sl.id),
          day: typeof sl.day === 'string' && sl.day.trim() ? sl.day.trim() : 'Понедельник',
          time: typeof sl.time === 'string' && sl.time.trim() ? sl.time.trim() : '18:00–19:00',
          hall: typeof sl.hall === 'string' && sl.hall.trim() ? sl.hall.trim() : 'Зал самбо №1',
          coach: typeof sl.coach === 'string' && sl.coach.trim() ? sl.coach.trim() : 'Иванов А. В.',
          group: typeof sl.group === 'string' && sl.group.trim() ? sl.group.trim() : 'Группа 1',
          sport: ['sambo', 'karate', 'fitness'].includes(sl.sport) ? sl.sport : undefined,
          sportLabel: typeof sl.sportLabel === 'string' && sl.sportLabel.trim() ? sl.sportLabel.trim() : undefined,
          colorTheme: ['red', 'emerald', 'blue', 'amber'].includes(sl.colorTheme) ? sl.colorTheme : undefined,
          notes: typeof sl.notes === 'string' && sl.notes.trim() ? sl.notes.trim() : undefined
        }));
    }
  }

  // Validate groups
  const groups = (Array.isArray(raw.groups) && raw.groups.length > 0)
    ? raw.groups.filter((g: any) => g && typeof g === 'object' && typeof g.id === 'string' && typeof g.name === 'string')
    : defaults.groups;
  const safeGroups: GroupInfo[] = groups.length > 0 ? groups : defaults.groups;

  // Validate clubUsers
  const clubUsers = (Array.isArray(raw.clubUsers) && raw.clubUsers.length > 0)
    ? raw.clubUsers.filter((u: any) => u && typeof u === 'object' && typeof u.id === 'string' && typeof u.fullName === 'string')
    : defaults.clubUsers;
  const safeClubUsers: ClubUser[] = clubUsers.length > 0 ? clubUsers : defaults.clubUsers;

  // Validate activeCoachId: must belong to a coach in clubUsers, fallback to first coach or defaults
  const coachUsers = safeClubUsers.filter(u => u.role === 'coach');
  const safeActiveCoachId = (typeof raw?.activeCoachId === 'string' && coachUsers.some(u => u.id === raw.activeCoachId))
    ? raw.activeCoachId
    : (coachUsers[0]?.id || defaults.activeCoachId || 'usr-2');

  // Validate exercises
  const exercises = (Array.isArray(raw.exercises) && raw.exercises.length > 0)
    ? raw.exercises.filter((e: any) => e && typeof e === 'object' && typeof e.id === 'string' && typeof e.title === 'string')
    : defaults.exercises;
  const safeExercises: ExerciseItem[] = exercises.length > 0 ? exercises : defaults.exercises;

  const safeSelectedAthleteId = safeAthletes.some(a => a.id === raw.selectedAthleteId)
    ? raw.selectedAthleteId
    : (safeAthletes[0]?.id || defaults.selectedAthleteId);

  const safeSelectedSessionId = safeSessions.some(s => s.id === raw.selectedSessionId)
    ? raw.selectedSessionId
    : (safeSessions[0]?.id || defaults.selectedSessionId);

  const safeSelectedGroupId = safeGroups.some(g => g.id === raw.selectedGroupId)
    ? raw.selectedGroupId
    : (safeGroups[0]?.id || 'grp-1');

  return {
    role,
    activeCoachId: safeActiveCoachId,
    athletes: safeAthletes,
    documents: safeDocuments,
    sessions: safeSessions,
    tasks,
    skills,
    skillChecks,
    weights,
    videoNotes,
    competitions,
    groupInfo,
    scheduleSlots,
    groups: safeGroups,
    selectedGroupId: safeSelectedGroupId,
    clubUsers: safeClubUsers,
    exercises: safeExercises,
    selectedAthleteId: safeSelectedAthleteId,
    selectedSessionId: safeSelectedSessionId,
    activeNav: typeof raw.activeNav === 'string' ? raw.activeNav : defaults.activeNav
  };
}

function getInitialState(): AppState {
  try {
    const raw = safeGetItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return getValidatedState(parsed);
    }
  } catch (err) {
    console.warn('[Storage] Corrupted localStorage state, fallback to seedData:', err);
  }
  return getDefaultState();
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(getInitialState);
  const [storageError, setStorageError] = useState<string | null>(null);

  const clearStorageError = useCallback(() => {
    setStorageError(null);
  }, []);

  // Sync to localStorage safely with error handling
  useEffect(() => {
    try {
      const jsonStr = JSON.stringify(state);
      const res = safeSetItem(STORAGE_KEY, jsonStr);
      if (!res.success && res.error) {
        setStorageError(res.error);
      } else {
        setStorageError(null);
      }
    } catch (err: any) {
      console.warn('[Storage] Unexpected error while serializing state:', err);
      setStorageError('Не удалось синхронизировать состояние в хранилище.');
    }
  }, [state]);

  // Synchronize state across browser tabs via storage event listener
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        if (e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            const validated = getValidatedState(parsed);
            setState(prev => ({
              ...validated,
              activeNav: prev.activeNav,
              selectedAthleteId: validated.athletes.some(a => a.id === prev.selectedAthleteId)
                ? prev.selectedAthleteId
                : validated.selectedAthleteId,
              selectedSessionId: validated.sessions.some(s => s.id === prev.selectedSessionId)
                ? prev.selectedSessionId
                : validated.selectedSessionId
            }));
          } catch {
            // Ignore unparseable external changes
          }
        } else {
          // Storage was cleared/reset in another tab: reset to defaults cleanly
          setState(getDefaultState());
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const setRole = useCallback((role: Role) => {
    if (!role) return;
    const defaultNavForRole: Record<Role, string> = {
      coach: 'today',
      athlete: 'athlete_main',
      parent: 'parent_main',
      admin: 'admin_main',
      verifier: 'queue'
    };
    setState(prev => ({
      ...prev,
      role,
      // 152-FZ: strictly reset to personal athlete profile on switching to athlete/parent
      selectedAthleteId: (role === 'athlete' || role === 'parent') ? 'ath-1' : prev.selectedAthleteId,
      activeNav: defaultNavForRole[role] || 'today'
    }));
  }, []);

  const setActiveCoachId = useCallback((coachId: string) => {
    if (!coachId) return;
    setState(prev => {
      const coach = (Array.isArray(prev.clubUsers) ? prev.clubUsers : []).find(u => u && u.id === coachId);
      if (!coach) return prev;
      const coachGroup = (Array.isArray(prev.groups) ? prev.groups : []).find(g =>
        g && isCoachForGroup(coach, g)
      );
      const coachSession = coachGroup
        ? (Array.isArray(prev.sessions) ? prev.sessions : []).find(s => s && s.groupId === coachGroup.id)
        : null;
      return {
        ...prev,
        activeCoachId: coachId,
        selectedGroupId: coachGroup ? coachGroup.id : prev.selectedGroupId,
        selectedSessionId: coachSession ? coachSession.id : prev.selectedSessionId
      };
    });
  }, []);

  const setActiveNav = useCallback((nav: string) => {
    if (typeof nav !== 'string' || !nav) return;
    setState(prev => ({ ...prev, activeNav: nav }));
  }, []);

  const setSelectedAthleteId = useCallback((id: string) => {
    if (!id || typeof id !== 'string') return;
    setState(prev => {
      // 152-FZ: Parent and Athlete roles are strictly isolated to their own child/profile
      if ((prev.role === 'athlete' || prev.role === 'parent') && id !== 'ath-1') {
        return prev;
      }
      return { ...prev, selectedAthleteId: id };
    });
  }, []);

  const setSelectedSessionId = useCallback((id: string) => {
    if (!id || typeof id !== 'string') return;
    setState(prev => ({ ...prev, selectedSessionId: id }));
  }, []);

  const updateAttendance = (sessionId: string, athleteId: string, status: AttendanceStatus) => {
    if (!sessionId || !athleteId || !status) return;
    setState(prev => {
      if (!Array.isArray(prev.sessions)) return prev;
      const updatedSessions: TrainingSession[] = prev.sessions.map(s => {
        if (s && s.id === sessionId) {
          const newAttendance = {
            ...(s.attendance || {}),
            [athleteId]: status
          };
          const newExceptions = { ...(s.exceptions || {}) };
          if (status !== 'excused') {
            delete newExceptions[athleteId];
          }
          return {
            ...s,
            attendance: newAttendance,
            exceptions: newExceptions
          };
        }
        return s;
      });
      return { ...prev, sessions: updatedSessions };
    });
  };

  const reportAbsence = (athleteId: string, sessionId: string, reason: string) => {
    if (!athleteId || !sessionId) return;
    setState(prev => {
      if (!Array.isArray(prev.sessions)) return prev;
      const updatedSessions: TrainingSession[] = prev.sessions.map(s => {
        if (s && s.id === sessionId) {
          const newAttendance: Record<string, AttendanceStatus> = {
            ...(s.attendance || {}),
            [athleteId]: 'excused'
          };
          return {
            ...s,
            attendance: newAttendance,
            exceptions: {
              ...(s.exceptions || {}),
              [athleteId]: reason || 'Уважительная причина'
            }
          };
        }
        return s;
      });
      return { ...prev, sessions: updatedSessions };
    });
  };

  const markAllPresent = (sessionId: string) => {
    if (!sessionId) return;
    setState(prev => {
      if (!Array.isArray(prev.sessions) || !Array.isArray(prev.athletes)) return prev;
      const session = prev.sessions.find(s => s && s.id === sessionId);
      if (!session) return prev;

      const targetAthletes = prev.athletes.filter(
        a => a && a.id && (!session.groupId || a.groupId === session.groupId) && a.isActive !== false
      );

      const newAttendance: Record<string, AttendanceStatus> = { ...(session.attendance || {}) };
      const newExceptions: Record<string, string> = { ...(session.exceptions || {}) };

      targetAthletes.forEach(a => {
        newAttendance[a.id] = 'present';
        delete newExceptions[a.id];
      });

      const updatedSessions: TrainingSession[] = prev.sessions.map(s => {
        if (s && s.id === sessionId) {
          return { ...s, attendance: newAttendance, exceptions: newExceptions };
        }
        return s;
      });

      return { ...prev, sessions: updatedSessions };
    });
  };

  const verifyDocument = (docId: string, status: VerificationStatus, comment?: string) => {
    if (!docId || !status) return;
    setState(prev => {
      if (!Array.isArray(prev.documents)) return prev;
      const updatedDocs = prev.documents.map(d => {
        if (d && d.id === docId) {
          return {
            ...d,
            verificationStatus: status,
            verifierComment: comment !== undefined ? comment : d.verifierComment,
            verifiedAt: '2026-10-06',
            verifiedBy: 'Проверяющий 1'
          };
        }
        return d;
      });
      return { ...prev, documents: updatedDocs };
    });
  };

  const updateAdmissionDecision = (athleteId: string, decision: AdmissionDecision) => {
    if (!athleteId || !decision) return;
    setState(prev => {
      if (!Array.isArray(prev.athletes)) return prev;
      const updatedAthletes = prev.athletes.map(a => {
        if (a && a.id === athleteId) {
          return {
            ...a,
            admissionDecision: decision
          };
        }
        return a;
      });

      // Also sync competition participant admission status safely
      const comps = Array.isArray(prev.competitions) ? prev.competitions : [];
      const updatedCompetitions = comps.map(comp => {
        if (!comp || !Array.isArray(comp.participants)) return comp;
        return {
          ...comp,
          participants: comp.participants.map(p => {
            if (p && p.athleteId === athleteId) {
              return {
                ...p,
                admissionDecision: decision.status
              };
            }
            return p;
          })
        };
      });

      return { ...prev, athletes: updatedAthletes, competitions: updatedCompetitions };
    });
  };

  const uploadDocument = useCallback((athleteId: string, doc: Partial<DocumentRecord>) => {
    if (!athleteId || !doc) return;
    setState(prev => {
      // 152-FZ: Parent and Athlete can only upload documents for their own athlete ('ath-1')
      if ((prev.role === 'parent' || prev.role === 'athlete') && athleteId !== 'ath-1') {
        return prev;
      }
      // 152-FZ: Admin has no clearance to manage medical files
      if (prev.role === 'admin' && doc.type === 'medical') {
        return prev;
      }

      const docs = Array.isArray(prev.documents) ? prev.documents : [];
      const existingIndex = docs.findIndex(
        d => d && d.athleteId === athleteId && d.type === doc.type
      );

      let nextVersion = 1;
      const newDocList = [...docs];

      if (existingIndex !== -1 && docs[existingIndex]) {
        const existingDoc = docs[existingIndex];
        nextVersion = (existingDoc.version || 1) + 1;
        const updatedRecord: DocumentRecord = {
          ...existingDoc,
          title: doc.title || existingDoc.title,
          fileName: doc.fileName || `Документ_v${nextVersion}.pdf`,
          uploadDate: '2026-10-06',
          expiryDate: doc.expiryDate || existingDoc.expiryDate,
          version: nextVersion,
          verificationStatus: 'unverified',
          verifierComment: undefined,
          verifiedAt: undefined,
          verifiedBy: undefined,
          isRestrictedMedical: doc.type === 'medical'
        };
        newDocList[existingIndex] = updatedRecord;
      } else {
        const newRecord: DocumentRecord = {
          id: `doc-${Date.now()}`,
          athleteId,
          type: doc.type || 'medical',
          title: doc.title || 'Новый документ',
          fileName: doc.fileName || 'Документ.pdf',
          uploadDate: '2026-10-06',
          expiryDate: doc.expiryDate,
          version: 1,
          verificationStatus: 'unverified',
          isRestrictedMedical: doc.type === 'medical'
        };
        newDocList.push(newRecord);
      }

      return { ...prev, documents: newDocList };
    });
  }, []);

  const addObservationTask = (taskData: Omit<IndividualTask, 'id'>) => {
    if (!taskData) return;
    const newTask: IndividualTask = {
      ...taskData,
      id: `tsk-${Date.now()}`
    };
    setState(prev => ({
      ...prev,
      tasks: [newTask, ...(Array.isArray(prev.tasks) ? prev.tasks : [])]
    }));
  };

  const toggleTaskStatus = (taskId: string, status: 'active' | 'completed' | 'needs_review') => {
    if (!taskId || !status) return;
    setState(prev => ({
      ...prev,
      tasks: (Array.isArray(prev.tasks) ? prev.tasks : []).map(t => {
        if (t && t.id === taskId) {
          return {
            ...t,
            status,
            completedAt: status === 'completed' ? '2026-10-06' : undefined
          };
        }
        return t;
      })
    }));
  };

  const recordSkillCheck = (
    athleteId: string,
    skillId: string,
    checkIndex: number,
    success: boolean | null
  ) => {
    if (!athleteId || !skillId || checkIndex < 0) return;
    setState(prev => {
      const currentSkillChecks = Array.isArray(prev.skillChecks) ? prev.skillChecks : [];
      const updatedChecks = currentSkillChecks.map(sc => {
        if (sc && sc.athleteId === athleteId && sc.skillId === skillId) {
          const newChecks = Array.isArray(sc.checks) ? [...sc.checks] : [];
          if (newChecks[checkIndex]) {
            newChecks[checkIndex] = {
              ...newChecks[checkIndex],
              success
            };
          }
          return { ...sc, checks: newChecks };
        }
        return sc;
      });
      return { ...prev, skillChecks: updatedChecks };
    });
  };

  const addWeight = (weight: Omit<WeightRecord, 'id'>) => {
    if (!weight || !weight.athleteId || typeof weight.weightKg !== 'number') return;
    const newWeight: WeightRecord = {
      ...weight,
      id: `w-${Date.now()}`
    };
    setState(prev => ({
      ...prev,
      weights: [newWeight, ...(Array.isArray(prev.weights) ? prev.weights : [])]
    }));
  };

  const addVideoNote = (note: Omit<VideoNote, 'id' | 'createdAt'>) => {
    if (!note || !note.athleteId) return;
    const newNote: VideoNote = {
      ...note,
      id: `vn-${Date.now()}`,
      createdAt: '2026-10-06'
    };
    setState(prev => ({
      ...prev,
      videoNotes: [newNote, ...(Array.isArray(prev.videoNotes) ? prev.videoNotes : [])]
    }));
  };

  const addSessionNote = (sessionId: string, athleteId: string, noteText: string) => {
    if (!sessionId || !athleteId || !noteText) return;
    setState(prev => {
      const currentSessions = Array.isArray(prev.sessions) ? prev.sessions : [];
      const updatedSessions = currentSessions.map(s => {
        if (s && s.id === sessionId) {
          return {
            ...s,
            notes: [
              ...(Array.isArray(s.notes) ? s.notes : []),
              {
                id: `n-${Date.now()}`,
                athleteId,
                text: noteText,
                createdAt: new Date().toISOString()
              }
            ]
          };
        }
        return s;
      });
      return { ...prev, sessions: updatedSessions };
    });
  };

  const updateAthlete = useCallback((athleteId: string, data: Partial<Athlete>) => {
    if (!athleteId || !data) return;
    setState(prev => {
      // 152-FZ: Parent and Athlete cannot edit other athletes
      if ((prev.role === 'parent' || prev.role === 'athlete') && athleteId !== 'ath-1') {
        return prev;
      }
      return {
        ...prev,
        athletes: (Array.isArray(prev.athletes) ? prev.athletes : []).map(a =>
          a && a.id === athleteId ? { ...a, ...data } : a
        )
      };
    });
  }, []);

  const addAthlete = (athleteData: Omit<Athlete, 'id' | 'avatarInitials'>) => {
    if (!athleteData || !athleteData.fullName) return;
    const parts = athleteData.fullName.trim().split(/\s+/);
    const initials = parts.map(p => p[0]?.toUpperCase() || '').slice(0, 2).join('') || 'СА';
    setState(prev => {
      const targetGroupId = athleteData.groupId || prev.selectedGroupId || prev.groups[0]?.id || 'grp-1';
      const newAthlete: Athlete = {
        ...athleteData,
        groupId: targetGroupId,
        id: `ath-${Date.now()}`,
        avatarInitials: initials,
        isActive: athleteData.isActive ?? true,
        admissionDecision: athleteData.admissionDecision || {
          status: 'pending',
          basis: 'Новый спортсмен, требуется медкомиссия',
          reviewedAt: new Date().toISOString().slice(0, 10),
          reviewedBy: 'Тренер'
        }
      };
      const updatedAthletes = [...(Array.isArray(prev.athletes) ? prev.athletes : []), newAthlete];
      const updatedGroups = (Array.isArray(prev.groups) ? prev.groups : []).map(g => ({
        ...g,
        athleteCount: updatedAthletes.filter(a => a && a.groupId === g.id && a.isActive).length
      }));
      return {
        ...prev,
        athletes: updatedAthletes,
        groups: updatedGroups,
        groupInfo: {
          ...prev.groupInfo,
          athleteCount: updatedAthletes.filter(a => a && a.groupId === prev.groupInfo?.id && a.isActive).length
        }
      };
    });
  };

  const updateGroupInfo = (info: Partial<GroupInfo>) => {
    if (!info) return;
    setState(prev => ({
      ...prev,
      groupInfo: {
        ...prev.groupInfo,
        ...info
      }
    }));
  };

  const addCompetition = (compData: Omit<Competition, 'id'>) => {
    if (!compData || !compData.title) return;
    const newComp: Competition = {
      ...compData,
      id: `cmp-${Date.now()}`
    };
    setState(prev => ({
      ...prev,
      competitions: [...(Array.isArray(prev.competitions) ? prev.competitions : []), newComp]
    }));
  };

  const addCompetitionParticipant = (
    competitionId: string,
    athleteId: string,
    category: string,
    nextGoal?: string
  ) => {
    if (!competitionId || !athleteId) return;
    setState(prev => ({
      ...prev,
      competitions: (Array.isArray(prev.competitions) ? prev.competitions : []).map(c => {
        if (c && c.id === competitionId) {
          const participants = Array.isArray(c.participants) ? c.participants : [];
          const exists = participants.some(p => p && p.athleteId === athleteId);
          if (exists) return c;
          const athlete = (Array.isArray(prev.athletes) ? prev.athletes : []).find(a => a && a.id === athleteId);
          return {
            ...c,
            participants: [
              ...participants,
              {
                athleteId,
                category: category || 'Основная категория',
                admissionDecision: athlete?.admissionDecision?.status || 'pending',
                nextGoal
              }
            ]
          };
        }
        return c;
      })
    }));
  };

  const addCompetitionParticipants = (
    competitionId: string,
    newParticipants: Array<{ athleteId: string; category: string; nextGoal?: string }>
  ) => {
    if (!competitionId || !Array.isArray(newParticipants) || newParticipants.length === 0) return;
    setState(prev => ({
      ...prev,
      competitions: (Array.isArray(prev.competitions) ? prev.competitions : []).map(c => {
        if (c && c.id === competitionId) {
          const existing = Array.isArray(c.participants) ? c.participants : [];
          const seenIds = new Set(existing.map(p => p && p.athleteId));
          const toAdd: any[] = [];
          for (const np of newParticipants) {
            if (np && np.athleteId && !seenIds.has(np.athleteId)) {
              seenIds.add(np.athleteId);
              const athlete = (Array.isArray(prev.athletes) ? prev.athletes : []).find(a => a && a.id === np.athleteId);
              toAdd.push({
                athleteId: np.athleteId,
                category: np.category?.trim() || 'Основная категория',
                admissionDecision: athlete?.admissionDecision?.status || 'pending',
                nextGoal: np.nextGoal?.trim() || undefined
              });
            }
          }
          return {
            ...c,
            participants: [...existing, ...toAdd]
          };
        }
        return c;
      })
    }));
  };

  const addScheduleSlot = (slot: Omit<ScheduleSlot, 'id'>) => {
    if (!slot) return;
    const newSlot: ScheduleSlot = {
      ...slot,
      id: `sch-${Date.now()}`
    };
    setState(prev => ({
      ...prev,
      scheduleSlots: [...(Array.isArray(prev.scheduleSlots) ? prev.scheduleSlots : []), newSlot]
    }));
  };

  const updateScheduleSlot = (slotId: string, slotData: Partial<ScheduleSlot>) => {
    if (!slotId || !slotData) return;
    setState(prev => ({
      ...prev,
      scheduleSlots: (Array.isArray(prev.scheduleSlots) ? prev.scheduleSlots : []).map(s =>
        s && s.id === slotId ? { ...s, ...slotData } : s
      )
    }));
  };

  const deleteScheduleSlot = (slotId: string) => {
    if (!slotId) return;
    setState(prev => ({
      ...prev,
      scheduleSlots: (Array.isArray(prev.scheduleSlots) ? prev.scheduleSlots : []).filter(s => s && s.id !== slotId)
    }));
  };

  const setSelectedGroupId = (groupId: string) => {
    setState(prev => ({ ...prev, selectedGroupId: groupId }));
  };

  const addClubUser = (userData: Omit<ClubUser, 'id'>) => {
    if (!userData || !userData.fullName) return;
    const newUser: ClubUser = {
      ...userData,
      id: `usr-${Date.now()}`
    };
    setState(prev => ({
      ...prev,
      clubUsers: [...(Array.isArray(prev.clubUsers) ? prev.clubUsers : []), newUser]
    }));
  };

  const updateClubUser = (userId: string, data: Partial<ClubUser>) => {
    if (!userId || !data) return;
    setState(prev => ({
      ...prev,
      clubUsers: (Array.isArray(prev.clubUsers) ? prev.clubUsers : []).map(u =>
        u && u.id === userId ? { ...u, ...data } : u
      )
    }));
  };

  const deleteClubUser = (userId: string) => {
    if (!userId) return;
    setState(prev => {
      const userToDelete = (Array.isArray(prev.clubUsers) ? prev.clubUsers : []).find(u => u && u.id === userId);
      const updatedClubUsers = (Array.isArray(prev.clubUsers) ? prev.clubUsers : []).filter(u => u && u.id !== userId);

      // If deleted user was a coach, update groups they coached to 'Не назначен'
      let updatedGroups = Array.isArray(prev.groups) ? prev.groups : [];
      let updatedGroupInfo = prev.groupInfo;
      let updatedSlots = Array.isArray(prev.scheduleSlots) ? prev.scheduleSlots : [];

      if (userToDelete && userToDelete.role === 'coach') {
        updatedGroups = updatedGroups.map(g => {
          if (isCoachForGroup(userToDelete, g)) {
            return { ...g, coachName: 'Не назначен' };
          }
          return g;
        });

        if (prev.groupInfo && isCoachForGroup(userToDelete, prev.groupInfo)) {
          updatedGroupInfo = { ...prev.groupInfo, coachName: 'Не назначен' };
        }

        const coachShort = getCoachShortName(userToDelete.fullName);
        updatedSlots = updatedSlots.map(sl => {
          if (
            sl &&
            (sl.coach === userToDelete.fullName ||
              sl.coach === coachShort ||
              sl.coach === userToDelete.id)
          ) {
            return { ...sl, coach: 'Не назначен' };
          }
          return sl;
        });
      }

      // If deleted user was head manager, transfer to remaining admin or first user
      let finalClubUsers = updatedClubUsers;
      if (userToDelete?.isHeadManager) {
        const adminIndex = finalClubUsers.findIndex(u => u.role === 'admin');
        if (adminIndex !== -1) {
          finalClubUsers = finalClubUsers.map((u, idx) =>
            idx === adminIndex ? { ...u, isHeadManager: true } : u
          );
        } else if (finalClubUsers.length > 0) {
          finalClubUsers = [{ ...finalClubUsers[0], isHeadManager: true }, ...finalClubUsers.slice(1)];
        }
      }

      // If deleted user was activeCoachId, switch activeCoachId to remaining coach
      let newActiveCoachId = prev.activeCoachId;
      let newSelectedGroupId = prev.selectedGroupId;
      if (prev.activeCoachId === userId) {
        const remainingCoaches = finalClubUsers.filter(u => u.role === 'coach');
        newActiveCoachId = remainingCoaches[0]?.id || '';
        if (remainingCoaches[0]) {
          const coachFirstGroup = updatedGroups.find(g => isCoachForGroup(remainingCoaches[0], g));
          if (coachFirstGroup) {
            newSelectedGroupId = coachFirstGroup.id;
          }
        }
      }

      return {
        ...prev,
        clubUsers: finalClubUsers,
        groups: updatedGroups,
        groupInfo: updatedGroupInfo,
        scheduleSlots: updatedSlots,
        activeCoachId: newActiveCoachId,
        selectedGroupId: newSelectedGroupId
      };
    });
  };

  const setHeadManager = (userId: string) => {
    if (!userId) return;
    setState(prev => ({
      ...prev,
      clubUsers: (Array.isArray(prev.clubUsers) ? prev.clubUsers : []).map(u => ({
        ...u,
        isHeadManager: u.id === userId
      }))
    }));
  };

  const toggleVerifierRole = (userId: string) => {
    if (!userId) return;
    setState(prev => ({
      ...prev,
      clubUsers: (Array.isArray(prev.clubUsers) ? prev.clubUsers : []).map(u =>
        u.id === userId ? { ...u, isVerifierAssigned: !u.isVerifierAssigned } : u
      )
    }));
  };

  const addGroup = (groupData: Omit<GroupInfo, 'id' | 'athleteCount'>) => {
    if (!groupData || !groupData.name) return;
    const newId = `grp-${Date.now()}`;
    const newGroup: GroupInfo = {
      ...groupData,
      id: newId,
      athleteCount: 0
    };
    setState(prev => ({
      ...prev,
      groups: [...(Array.isArray(prev.groups) ? prev.groups : []), newGroup]
    }));
  };

  const updateGroup = (groupId: string, data: Partial<GroupInfo>) => {
    if (!groupId || !data) return;
    setState(prev => {
      const updatedGroups = (Array.isArray(prev.groups) ? prev.groups : []).map(g =>
        g && g.id === groupId ? { ...g, ...data } : g
      );
      const updatedGroupInfo = (prev.groupInfo && prev.groupInfo.id === groupId)
        ? { ...prev.groupInfo, ...data }
        : prev.groupInfo;
      return {
        ...prev,
        groups: updatedGroups,
        groupInfo: updatedGroupInfo
      };
    });
  };

  const deleteGroup = (groupId: string) => {
    if (!groupId) return;
    setState(prev => {
      const targetGroup = (Array.isArray(prev.groups) ? prev.groups : []).find(g => g && g.id === groupId);
      const targetGroupName = targetGroup?.name || '';

      const updatedGroups = (Array.isArray(prev.groups) ? prev.groups : []).filter(g => g && g.id !== groupId);
      const fallbackGroupId = updatedGroups[0]?.id || '';

      // Reassign athletes of deleted group to fallback group (or empty string if no groups left)
      const updatedAthletes = (Array.isArray(prev.athletes) ? prev.athletes : []).map(a => {
        if (a && a.groupId === groupId) {
          return { ...a, groupId: fallbackGroupId };
        }
        return a;
      });

      // Recalculate athleteCount for all remaining groups
      const recalculatedGroups = updatedGroups.map(g => ({
        ...g,
        athleteCount: updatedAthletes.filter(a => a && a.groupId === g.id && a.isActive).length
      }));

      // Clean up sessions and scheduleSlots of deleted group
      const baseGroupName = targetGroupName.split('(')[0]?.trim();
      const updatedSessions = (Array.isArray(prev.sessions) ? prev.sessions : []).filter(
        s => s && s.groupId !== groupId
      );
      const updatedSlots = (Array.isArray(prev.scheduleSlots) ? prev.scheduleSlots : []).filter(
        sl => {
          if (!sl) return false;
          if (sl.group === targetGroupName || sl.group === groupId) return false;
          if (baseGroupName && (sl.group === baseGroupName || sl.group.startsWith(baseGroupName + ' '))) return false;
          return true;
        }
      );

      // Reset selectedGroupId if it was deleted
      const newSelectedGroupId = prev.selectedGroupId === groupId
        ? fallbackGroupId
        : (recalculatedGroups.some(g => g.id === prev.selectedGroupId) ? prev.selectedGroupId : fallbackGroupId);

      // Reset selectedSessionId if it belonged to deleted sessions
      const newSelectedSessionId = updatedSessions.some(s => s.id === prev.selectedSessionId)
        ? prev.selectedSessionId
        : (updatedSessions[0]?.id || '');

      const newGroupInfo = (prev.groupInfo && prev.groupInfo.id === groupId)
        ? (recalculatedGroups[0] || getDefaultState().groupInfo)
        : prev.groupInfo;

      return {
        ...prev,
        groups: recalculatedGroups,
        athletes: updatedAthletes,
        sessions: updatedSessions,
        scheduleSlots: updatedSlots,
        selectedGroupId: newSelectedGroupId,
        selectedSessionId: newSelectedSessionId,
        groupInfo: newGroupInfo
      };
    });
  };

  const moveAthleteToGroup = (athleteId: string, targetGroupId: string) => {
    if (!athleteId || !targetGroupId) return;
    setState(prev => {
      const updatedAthletes = (Array.isArray(prev.athletes) ? prev.athletes : []).map(a =>
        a && a.id === athleteId ? { ...a, groupId: targetGroupId } : a
      );
      const updatedGroups = (Array.isArray(prev.groups) ? prev.groups : []).map(g => ({
        ...g,
        athleteCount: updatedAthletes.filter(a => a && a.groupId === g.id && a.isActive).length
      }));
      return {
        ...prev,
        athletes: updatedAthletes,
        groups: updatedGroups,
        groupInfo: {
          ...prev.groupInfo,
          athleteCount: updatedAthletes.filter(a => a && a.groupId === prev.groupInfo?.id && a.isActive).length
        }
      };
    });
  };

  const expelAthlete = (athleteId: string) => {
    if (!athleteId) return;
    setState(prev => {
      const updatedAthletes = (Array.isArray(prev.athletes) ? prev.athletes : []).map(a =>
        a && a.id === athleteId ? { ...a, isActive: false } : a
      );
      const updatedGroups = (Array.isArray(prev.groups) ? prev.groups : []).map(g => ({
        ...g,
        athleteCount: updatedAthletes.filter(a => a && a.groupId === g.id && a.isActive).length
      }));
      return {
        ...prev,
        athletes: updatedAthletes,
        groups: updatedGroups,
        groupInfo: {
          ...prev.groupInfo,
          athleteCount: updatedAthletes.filter(a => a && a.groupId === prev.groupInfo?.id && a.isActive).length
        }
      };
    });
  };

  const addAthleteToGroup = (athleteData: Omit<Athlete, 'id' | 'avatarInitials'>) => {
    if (!athleteData || !athleteData.fullName) return;
    const parts = athleteData.fullName.trim().split(/\s+/);
    const initials = parts.map(p => p[0]?.toUpperCase() || '').slice(0, 2).join('') || 'СА';
    const newAthlete: Athlete = {
      ...athleteData,
      id: `ath-${Date.now()}`,
      avatarInitials: initials,
      isActive: true,
      admissionDecision: athleteData.admissionDecision || {
        status: 'pending',
        basis: 'Новый спортсмен, требуется медкомиссия',
        reviewedAt: new Date().toISOString().slice(0, 10),
        reviewedBy: 'Тренер'
      }
    };
    setState(prev => {
      const updatedAthletes = [...(Array.isArray(prev.athletes) ? prev.athletes : []), newAthlete];
      const updatedGroups = (Array.isArray(prev.groups) ? prev.groups : []).map(g => ({
        ...g,
        athleteCount: updatedAthletes.filter(a => a && a.groupId === g.id && a.isActive).length
      }));
      return {
        ...prev,
        athletes: updatedAthletes,
        groups: updatedGroups,
        groupInfo: {
          ...prev.groupInfo,
          athleteCount: updatedAthletes.filter(a => a && a.groupId === prev.groupInfo?.id && a.isActive).length
        }
      };
    });
  };

  const addExercise = (exerciseData: Omit<ExerciseItem, 'id'>) => {
    if (!exerciseData || !exerciseData.title) return;
    const newEx: ExerciseItem = {
      ...exerciseData,
      id: `ex-${Date.now()}`
    };
    setState(prev => ({
      ...prev,
      exercises: [...(Array.isArray(prev.exercises) ? prev.exercises : []), newEx]
    }));
  };

  const deleteExercise = (exerciseId: string) => {
    if (!exerciseId) return;
    setState(prev => ({
      ...prev,
      exercises: (Array.isArray(prev.exercises) ? prev.exercises : []).filter(e => e && e.id !== exerciseId)
    }));
  };

  const createTrainingSessionFromPlan = useCallback((data: {
    groupId: string;
    date: string;
    timeRange: string;
    topic: string;
    exercises: Array<{ title: string; durationMinutes: number }>;
  }) => {
    if (!data || !data.topic) return;
    const newSessionId = `ses-${Date.now()}`;
    const planItems = (data.exercises || []).map((ex, idx) => ({
      order: idx + 1,
      title: `${ex.title} (${ex.durationMinutes} мин)`,
      timeRange: `${ex.durationMinutes} мин`
    }));

    setState(prev => {
      const groupAthletes = (Array.isArray(prev.athletes) ? prev.athletes : []).filter(
        a => a && a.groupId === data.groupId && a.isActive
      );
      const initialAttendance: Record<string, AttendanceStatus> = {};
      groupAthletes.forEach(a => {
        initialAttendance[a.id] = 'unmarked';
      });

      const newSession: TrainingSession = {
        id: newSessionId,
        groupId: data.groupId,
        date: data.date,
        timeRange: data.timeRange,
        topic: data.topic,
        isCompleted: false,
        plan: planItems,
        attendance: initialAttendance,
        exceptions: {},
        notes: []
      };

      return {
        ...prev,
        sessions: [newSession, ...(Array.isArray(prev.sessions) ? prev.sessions : [])],
        selectedSessionId: newSessionId
      };
    });
  }, []);

  const resetToDemo = () => {
    safeRemoveItem(STORAGE_KEY);
    const defaults = getDefaultState();
    setState(defaults);
    setStorageError(null);
  };

  const exportData = useCallback((): string => {
    const payload = {
      app: 'sambo-digital-cabinet',
      version: 1,
      exportedAt: new Date().toISOString(),
      state
    };
    return JSON.stringify(payload, null, 2);
  }, [state]);

  const downloadBackup = useCallback(() => {
    try {
      const dataStr = exportData();
      const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const nowStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      link.href = url;
      link.download = `sambo_cabinet_backup_${nowStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[Backup] Failed to download JSON backup:', err);
    }
  }, [exportData]);

  const importData = useCallback((jsonData: string): { success: boolean; error?: string } => {
    if (!jsonData || typeof jsonData !== 'string' || !jsonData.trim()) {
      return { success: false, error: 'Данные для импорта пусты.' };
    }

    try {
      const parsed = JSON.parse(jsonData);
      const candidate = (parsed && typeof parsed === 'object' && parsed.state) ? parsed.state : parsed;

      if (!candidate || typeof candidate !== 'object') {
        return { success: false, error: 'Неверная структура резервной копии.' };
      }

      if (!Array.isArray(candidate.athletes) && !Array.isArray(candidate.sessions)) {
        return { success: false, error: 'Резервная копия не содержит обязательных массивов (спортсмены или занятия).' };
      }

      const validatedState = getValidatedState(candidate);
      setState(validatedState);
      const saveRes = safeSetItem(STORAGE_KEY, JSON.stringify(validatedState));
      if (!saveRes.success && saveRes.error) {
        setStorageError(saveRes.error);
      } else {
        setStorageError(null);
      }
      return { success: true };
    } catch (err: any) {
      console.error('[Import] Failed to import state from JSON:', err);
      return { success: false, error: `Синтаксическая ошибка JSON: ${err?.message || 'некорректные данные'}` };
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        ...state,
        storageError,
        clearStorageError,
        setRole,
        setActiveCoachId,
        setActiveNav,
        setSelectedAthleteId,
        setSelectedSessionId,
        setSelectedGroupId,
        updateAttendance,
        reportAbsence,
        markAllPresent,
        verifyDocument,
        updateAdmissionDecision,
        uploadDocument,
        addObservationTask,
        toggleTaskStatus,
        recordSkillCheck,
        addWeight,
        addVideoNote,
        addSessionNote,
        updateAthlete,
        addAthlete,
        updateGroupInfo,
        addCompetition,
        addCompetitionParticipant,
        addCompetitionParticipants,
        addScheduleSlot,
        updateScheduleSlot,
        deleteScheduleSlot,
        addClubUser,
        updateClubUser,
        deleteClubUser,
        setHeadManager,
        toggleVerifierRole,
        addGroup,
        updateGroup,
        deleteGroup,
        moveAthleteToGroup,
        expelAthlete,
        addAthleteToGroup,
        addExercise,
        deleteExercise,
        createTrainingSessionFromPlan,
        resetToDemo,
        exportData,
        downloadBackup,
        importData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
