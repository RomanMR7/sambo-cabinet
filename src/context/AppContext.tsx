import React, { createContext, useContext, useState, useEffect } from 'react';
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
  AdmissionDecision
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
  initialGroupInfo
} from '../data/seedData';

const STORAGE_KEY = 'sambo_cabinet_state_v1';

interface AppState {
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
  selectedAthleteId: string;
  selectedSessionId: string;
  activeNav: string;
}

interface AppContextType extends AppState {
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
  resetToDemo: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function getInitialState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        role: parsed.role || 'coach',
        athletes: parsed.athletes || initialAthletes,
        documents: parsed.documents || initialDocuments,
        sessions: parsed.sessions || initialSessions,
        tasks: parsed.tasks || initialTasks,
        skills: parsed.skills || initialSkills,
        skillChecks: parsed.skillChecks || initialSkillChecks,
        weights: parsed.weights || initialWeights,
        videoNotes: parsed.videoNotes || initialVideoNotes,
        competitions: parsed.competitions || initialCompetitions,
        groupInfo: parsed.groupInfo || initialGroupInfo,
        selectedAthleteId: parsed.selectedAthleteId || 'ath-1',
        selectedSessionId: parsed.selectedSessionId || 'ses-today',
        activeNav: parsed.activeNav || 'today'
      };
    }
  } catch (err) {
    console.warn('Error reading from localStorage:', err);
  }

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
    selectedAthleteId: 'ath-1',
    selectedSessionId: 'ses-today',
    activeNav: 'today'
  };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(getInitialState);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('Error saving to localStorage:', err);
    }
  }, [state]);

  const setRole = (role: Role) => {
    // When switching roles, reset activeNav appropriately
    const defaultNavForRole: Record<Role, string> = {
      coach: 'today',
      athlete: 'athlete_main',
      parent: 'parent_main',
      admin: 'admin_main',
      verifier: 'queue'
    };
    setState(prev => ({ ...prev, role, activeNav: defaultNavForRole[role] || 'today' }));
  };

  const setActiveNav = (nav: string) => {
    setState(prev => ({ ...prev, activeNav: nav }));
  };

  const setSelectedAthleteId = (id: string) => {
    setState(prev => ({ ...prev, selectedAthleteId: id }));
  };

  const setSelectedSessionId = (id: string) => {
    setState(prev => ({ ...prev, selectedSessionId: id }));
  };

  const updateAttendance = (sessionId: string, athleteId: string, status: AttendanceStatus) => {
    setState(prev => {
      const updatedSessions: TrainingSession[] = prev.sessions.map(s => {
        if (s.id === sessionId) {
          return {
            ...s,
            attendance: {
              ...s.attendance,
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
    setState(prev => {
      const updatedSessions: TrainingSession[] = prev.sessions.map(s => {
        if (s.id === sessionId) {
          const newAttendance: Record<string, AttendanceStatus> = {
            ...s.attendance,
            [athleteId]: 'excused'
          };
          return {
            ...s,
            attendance: newAttendance,
            exceptions: {
              ...s.exceptions,
              [athleteId]: reason
            }
          };
        }
        return s;
      });
      return { ...prev, sessions: updatedSessions };
    });
  };

  const markAllPresent = (sessionId: string) => {
    setState(prev => {
      const session = prev.sessions.find(s => s.id === sessionId);
      if (!session) return prev;

      const newAttendance: Record<string, AttendanceStatus> = { ...session.attendance };
      prev.athletes.forEach(a => {
        newAttendance[a.id] = 'present';
      });

      const updatedSessions: TrainingSession[] = prev.sessions.map(s => {
        if (s.id === sessionId) {
          return { ...s, attendance: newAttendance };
        }
        return s;
      });

      return { ...prev, sessions: updatedSessions };
    });
  };

  const verifyDocument = (docId: string, status: VerificationStatus, comment?: string) => {
    setState(prev => {
      const updatedDocs = prev.documents.map(d => {
        if (d.id === docId) {
          return {
            ...d,
            verificationStatus: status,
            verifierComment: comment || d.verifierComment,
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
    setState(prev => {
      const updatedAthletes = prev.athletes.map(a => {
        if (a.id === athleteId) {
          return {
            ...a,
            admissionDecision: decision
          };
        }
        return a;
      });

      // Also sync competition participant admission status
      const updatedCompetitions = prev.competitions.map(comp => ({
        ...comp,
        participants: comp.participants.map(p => {
          if (p.athleteId === athleteId) {
            return {
              ...p,
              admissionDecision: decision.status
            };
          }
          return p;
        })
      }));

      return { ...prev, athletes: updatedAthletes, competitions: updatedCompetitions };
    });
  };

  const uploadDocument = (athleteId: string, doc: Partial<DocumentRecord>) => {
    setState(prev => {
      // Find existing document of same type
      const existingIndex = prev.documents.findIndex(
        d => d.athleteId === athleteId && d.type === doc.type
      );

      let nextVersion = 1;
      let newDocList = [...prev.documents];

      if (existingIndex !== -1) {
        nextVersion = (prev.documents[existingIndex].version || 1) + 1;
        // Updating existing document creates a new version and resets verificationStatus to 'unverified'
        const updatedRecord: DocumentRecord = {
          ...prev.documents[existingIndex],
          title: doc.title || prev.documents[existingIndex].title,
          fileName: doc.fileName || `Документ_v${nextVersion}.pdf`,
          uploadDate: '2026-10-06',
          expiryDate: doc.expiryDate || prev.documents[existingIndex].expiryDate,
          version: nextVersion,
          verificationStatus: 'unverified', // Critical requirement 4.1: resets to unverified
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
    const newTask: IndividualTask = {
      ...taskData,
      id: `tsk-${Date.now()}`
    };
    setState(prev => ({
      ...prev,
      tasks: [newTask, ...prev.tasks]
    }));
  };

  const toggleTaskStatus = (taskId: string, status: 'active' | 'completed' | 'needs_review') => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => {
        if (t.id === taskId) {
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
    setState(prev => {
      const updatedChecks = prev.skillChecks.map(sc => {
        if (sc.athleteId === athleteId && sc.skillId === skillId) {
          const newChecks = [...sc.checks];
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
    const newWeight: WeightRecord = {
      ...weight,
      id: `w-${Date.now()}`
    };
    setState(prev => ({
      ...prev,
      weights: [newWeight, ...prev.weights]
    }));
  };

  const addVideoNote = (note: Omit<VideoNote, 'id' | 'createdAt'>) => {
    const newNote: VideoNote = {
      ...note,
      id: `vn-${Date.now()}`,
      createdAt: '2026-10-06'
    };
    setState(prev => ({
      ...prev,
      videoNotes: [newNote, ...prev.videoNotes]
    }));
  };

  const addSessionNote = (sessionId: string, athleteId: string, noteText: string) => {
    setState(prev => {
      const updatedSessions = prev.sessions.map(s => {
        if (s.id === sessionId) {
          return {
            ...s,
            notes: [
              ...s.notes,
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

  const resetToDemo = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState({
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
      selectedAthleteId: 'ath-1',
      selectedSessionId: 'ses-today',
      activeNav: 'today'
    });
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
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
        resetToDemo
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
