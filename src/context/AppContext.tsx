import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Role,
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
  ScheduleSlot
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
  initialScheduleSlots
} from '../data/seedData';

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
  selectedAthleteId: string;
  selectedSessionId: string;
  activeNav: string;
}

export interface AppContextType extends AppState {
  storageError: string | null;
  clearStorageError: () => void;
  setRole: (role: Role) => void;
  setActiveNav: (nav: string) => void;
  setSelectedAthleteId: (id: string) => void;
  setSelectedSessionId: (id: string) => void;
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
  addScheduleSlot: (slot: Omit<ScheduleSlot, 'id'>) => void;
  updateScheduleSlot: (slotId: string, slot: Partial<ScheduleSlot>) => void;
  deleteScheduleSlot: (slotId: string) => void;
  resetToDemo: () => void;
  exportData: () => string;
  downloadBackup: () => void;
  importData: (jsonData: string) => { success: boolean; error?: string };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function getDefaultState(): AppState {
  return {
    role: 'coach',
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

  // Validate athletes
  const athletes = (Array.isArray(raw.athletes) && raw.athletes.length > 0)
    ? raw.athletes.filter((a: any) => a && typeof a === 'object' && typeof a.id === 'string' && typeof a.fullName === 'string')
    : defaults.athletes;
  const safeAthletes: Athlete[] = athletes.length > 0 ? athletes : defaults.athletes;

  // Validate documents
  const documents = (Array.isArray(raw.documents) && raw.documents.length > 0)
    ? raw.documents.filter((d: any) => d && typeof d === 'object' && typeof d.id === 'string' && typeof d.title === 'string')
    : defaults.documents;
  const safeDocuments: DocumentRecord[] = documents.length > 0 ? documents : defaults.documents;

  // Validate sessions
  const sessions = (Array.isArray(raw.sessions) && raw.sessions.length > 0)
    ? raw.sessions.filter((s: any) => s && typeof s === 'object' && typeof s.id === 'string').map((s: any) => ({
        ...s,
        attendance: (s.attendance && typeof s.attendance === 'object') ? s.attendance : {},
        exceptions: (s.exceptions && typeof s.exceptions === 'object') ? s.exceptions : {},
        notes: Array.isArray(s.notes) ? s.notes : []
      }))
    : defaults.sessions;
  const safeSessions: TrainingSession[] = sessions.length > 0 ? sessions : defaults.sessions;

  // Validate tasks
  const tasks = Array.isArray(raw.tasks)
    ? raw.tasks.filter((t: any) => t && typeof t === 'object' && typeof t.id === 'string')
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
        participants: Array.isArray(c.participants) ? c.participants : []
      }))
    : defaults.competitions;

  // Validate groupInfo
  const groupInfo = (raw.groupInfo && typeof raw.groupInfo === 'object')
    ? { ...defaults.groupInfo, ...raw.groupInfo }
    : defaults.groupInfo;

  // Validate scheduleSlots
  const scheduleSlots = (Array.isArray(raw.scheduleSlots) && raw.scheduleSlots.length > 0)
    ? raw.scheduleSlots.filter((sl: any) => sl && typeof sl === 'object' && typeof sl.id === 'string')
    : defaults.scheduleSlots;

  return {
    role,
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
    selectedAthleteId: typeof raw.selectedAthleteId === 'string' ? raw.selectedAthleteId : defaults.selectedAthleteId,
    selectedSessionId: typeof raw.selectedSessionId === 'string' ? raw.selectedSessionId : defaults.selectedSessionId,
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

  const setRole = (role: Role) => {
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
      activeNav: defaultNavForRole[role] || 'today'
    }));
  };

  const setActiveNav = (nav: string) => {
    if (typeof nav !== 'string' || !nav) return;
    setState(prev => ({ ...prev, activeNav: nav }));
  };

  const setSelectedAthleteId = (id: string) => {
    if (!id || typeof id !== 'string') return;
    setState(prev => ({ ...prev, selectedAthleteId: id }));
  };

  const setSelectedSessionId = (id: string) => {
    if (!id || typeof id !== 'string') return;
    setState(prev => ({ ...prev, selectedSessionId: id }));
  };

  const updateAttendance = (sessionId: string, athleteId: string, status: AttendanceStatus) => {
    if (!sessionId || !athleteId || !status) return;
    setState(prev => {
      if (!Array.isArray(prev.sessions)) return prev;
      const updatedSessions: TrainingSession[] = prev.sessions.map(s => {
        if (s && s.id === sessionId) {
          return {
            ...s,
            attendance: {
              ...(s.attendance || {}),
              [athleteId]: status
            }
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

      const newAttendance: Record<string, AttendanceStatus> = { ...(session.attendance || {}) };
      prev.athletes.forEach(a => {
        if (a && a.id) {
          newAttendance[a.id] = 'present';
        }
      });

      const updatedSessions: TrainingSession[] = prev.sessions.map(s => {
        if (s && s.id === sessionId) {
          return { ...s, attendance: newAttendance };
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

  const uploadDocument = (athleteId: string, doc: Partial<DocumentRecord>) => {
    if (!athleteId || !doc) return;
    setState(prev => {
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
  };

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

  const updateAthlete = (athleteId: string, data: Partial<Athlete>) => {
    if (!athleteId || !data) return;
    setState(prev => ({
      ...prev,
      athletes: (Array.isArray(prev.athletes) ? prev.athletes : []).map(a =>
        a && a.id === athleteId ? { ...a, ...data } : a
      )
    }));
  };

  const addAthlete = (athleteData: Omit<Athlete, 'id' | 'avatarInitials'>) => {
    if (!athleteData || !athleteData.fullName) return;
    const parts = athleteData.fullName.trim().split(/\s+/);
    const initials = parts.map(p => p[0]?.toUpperCase() || '').slice(0, 2).join('') || 'СА';
    const newAthlete: Athlete = {
      ...athleteData,
      id: `ath-${Date.now()}`,
      avatarInitials: initials
    };
    setState(prev => ({
      ...prev,
      athletes: [...(Array.isArray(prev.athletes) ? prev.athletes : []), newAthlete],
      groupInfo: {
        ...prev.groupInfo,
        athleteCount: (prev.groupInfo?.athleteCount || 0) + 1
      }
    }));
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
        setActiveNav,
        setSelectedAthleteId,
        setSelectedSessionId,
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
        addScheduleSlot,
        updateScheduleSlot,
        deleteScheduleSlot,
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
