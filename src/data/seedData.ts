import {
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
  ScheduleSlot,
  ClubUser,
  ExerciseItem
} from '../types';

export const initialAthletes: Athlete[] = [
  {
    id: 'ath-1',
    fullName: 'Антон Кузнецов',
    shortName: 'Антон К.',
    groupId: 'grp-1',
    avatarInitials: 'АК',
    isActive: true,
    birthDate: '2014-05-12',
    admissionDecision: {
      status: 'pending',
      basis: 'Ожидает повторного медицинского допуска',
      reviewedAt: '2026-10-01',
      reviewedBy: 'Тренер 1',
      validUntil: '2026-10-15'
    },
    parentName: 'Ольга Кузнецова',
    parentPhone: '+7 (999) 111-22-33',
    athletePhone: '+7 (999) 111-22-34'
  },
  {
    id: 'ath-2',
    fullName: 'Елизавета Алексеева',
    shortName: 'Лиза А.',
    groupId: 'grp-1',
    avatarInitials: 'ЛА',
    isActive: true,
    birthDate: '2015-08-20',
    admissionDecision: {
      status: 'admitted',
      basis: 'Диспансеризация пройдена',
      reviewedAt: '2026-09-20',
      reviewedBy: 'Тренер 1',
      validUntil: '2026-12-31'
    },
    parentName: 'Михаил Алексеев',
    parentPhone: '+7 (999) 222-33-44',
    athletePhone: '+7 (999) 222-33-45'
  },
  {
    id: 'ath-3',
    fullName: 'Никита Смирнов',
    shortName: 'Никита С.',
    groupId: 'grp-1',
    avatarInitials: 'НС',
    isActive: true,
    birthDate: '2014-02-14',
    admissionDecision: {
      status: 'admitted',
      basis: 'Полный пакет документов',
      reviewedAt: '2026-09-15',
      reviewedBy: 'Тренер 1',
      validUntil: '2026-11-30'
    },
    parentName: 'Ирина Смирнова',
    parentPhone: '+7 (999) 333-44-55',
    athletePhone: '+7 (999) 333-44-56'
  },
  {
    id: 'ath-4',
    fullName: 'Максим Васильев',
    shortName: 'Максим В.',
    groupId: 'grp-1',
    avatarInitials: 'МВ',
    isActive: true,
    birthDate: '2013-11-03',
    admissionDecision: {
      status: 'admitted',
      basis: 'Допущен',
      reviewedAt: '2026-09-01',
      reviewedBy: 'Тренер 1',
      validUntil: '2026-11-15'
    },
    parentName: 'Сергей Васильев',
    parentPhone: '+7 (999) 444-55-66',
    athletePhone: '+7 (999) 444-55-67'
  },
  {
    id: 'ath-5',
    fullName: 'Дарья Николаева',
    shortName: 'Даша Н.',
    groupId: 'grp-1',
    avatarInitials: 'ДН',
    isActive: true,
    birthDate: '2015-03-27',
    admissionDecision: {
      status: 'pending',
      basis: 'Не сдано согласие',
      reviewedAt: '2026-09-01',
      reviewedBy: 'Тренер 1',
      validUntil: '2026-10-10'
    },
    parentName: 'Елена Николаева',
    parentPhone: '+7 (999) 555-66-77',
    athletePhone: '+7 (999) 555-66-78'
  },
  {
    id: 'ath-6',
    fullName: 'Егор Морозов',
    shortName: 'Егор М.',
    groupId: 'grp-2',
    avatarInitials: 'ЕМ',
    isActive: true,
    birthDate: '2014-07-19',
    admissionDecision: {
      status: 'admitted',
      basis: 'Медицинский допуск получен',
      reviewedAt: '2026-09-18',
      reviewedBy: 'Петров С. Н.',
      validUntil: '2026-12-31'
    },
    parentName: 'Анна Морозова',
    parentPhone: '+7 (999) 666-77-88',
    athletePhone: '+7 (999) 666-77-89'
  },
  {
    id: 'ath-7',
    fullName: 'Артём Соколов',
    shortName: 'Артём С.',
    groupId: 'grp-2',
    avatarInitials: 'АС',
    isActive: true,
    birthDate: '2013-09-14',
    admissionDecision: {
      status: 'admitted',
      basis: 'Полный пакет документов',
      reviewedAt: '2026-09-10',
      reviewedBy: 'Петров С. Н.',
      validUntil: '2027-01-15'
    },
    parentName: 'Дмитрий Соколов',
    parentPhone: '+7 (999) 777-88-99',
    athletePhone: '+7 (999) 777-88-00'
  },
  {
    id: 'ath-8',
    fullName: 'Илья Федоров',
    shortName: 'Илья Ф.',
    groupId: 'grp-3',
    avatarInitials: 'ИФ',
    isActive: true,
    birthDate: '2012-04-05',
    admissionDecision: {
      status: 'admitted',
      basis: 'УМО пройдено',
      reviewedAt: '2026-08-25',
      reviewedBy: 'Иванов А. В.',
      validUntil: '2026-12-25'
    },
    parentName: 'Татьяна Федорова',
    parentPhone: '+7 (999) 888-99-00',
    athletePhone: '+7 (999) 888-99-11'
  },
  {
    id: 'ath-9',
    fullName: 'Матвей Попов',
    shortName: 'Матвей П.',
    groupId: 'grp-1',
    avatarInitials: 'МП',
    isActive: true,
    birthDate: '2014-12-01',
    admissionDecision: {
      status: 'pending',
      basis: 'Ожидает полис ОМС',
      reviewedAt: '2026-10-02',
      reviewedBy: 'Иванов А. В.',
      validUntil: '2026-10-16'
    },
    parentName: 'Олег Попов',
    parentPhone: '+7 (999) 999-00-11',
    athletePhone: '+7 (999) 999-00-22'
  },
  {
    id: 'ath-10',
    fullName: 'София Лебедева',
    shortName: 'София Л.',
    groupId: 'grp-3',
    avatarInitials: 'СЛ',
    isActive: true,
    birthDate: '2013-06-30',
    admissionDecision: {
      status: 'admitted',
      basis: 'Допущена к стартам',
      reviewedAt: '2026-09-05',
      reviewedBy: 'Иванов А. В.',
      validUntil: '2027-02-01'
    },
    parentName: 'Марина Лебедева',
    parentPhone: '+7 (999) 123-45-67',
    athletePhone: '+7 (999) 123-45-68'
  }
];

export const initialDocuments: DocumentRecord[] = [
  {
    id: 'doc-1',
    athleteId: 'ath-1',
    type: 'medical',
    title: 'Медицинский документ',
    fileName: 'Медицинский_документ.pdf',
    uploadDate: '2026-10-02',
    version: 1,
    verificationStatus: 'unverified',
    isRestrictedMedical: true
  },
  {
    id: 'doc-2',
    athleteId: 'ath-1',
    type: 'insurance',
    title: 'Страховой полис',
    fileName: 'Полис_спорт.pdf',
    uploadDate: '2025-10-15',
    expiryDate: '2026-10-14',
    version: 1,
    verificationStatus: 'verified',
    verifiedAt: '2025-10-16',
    verifiedBy: 'Проверяющий 1',
    isRestrictedMedical: false
  },
  {
    id: 'doc-3',
    athleteId: 'ath-1',
    type: 'consent',
    title: 'Согласие на участие',
    fileName: 'Согласие_на_участие.pdf',
    uploadDate: '2026-09-15',
    version: 1,
    verificationStatus: 'verified',
    verifiedAt: '2026-09-16',
    verifiedBy: 'Проверяющий 1',
    isRestrictedMedical: false
  },
  {
    id: 'doc-4',
    athleteId: 'ath-2',
    type: 'insurance',
    title: 'Страховой полис',
    fileName: 'Полис_Лиза.pdf',
    uploadDate: '2026-10-04',
    expiryDate: '2027-10-04',
    version: 1,
    verificationStatus: 'unverified',
    isRestrictedMedical: false
  }
];

export const initialSkills: SkillItem[] = [
  {
    id: 'sk-1',
    category: 'Стойка и дистанция',
    title: 'Стойка и вход в захват',
    criteria: 'Устойчивое положение ног, контроль дистанции, срыв захвата соперника',
    recommendedExercise: 'Парная отработка срыва захвата и постановки опорной ноги'
  },
  {
    id: 'sk-2',
    category: 'Захваты',
    title: 'Плотность захвата',
    criteria: 'Фиксация отворота и рукава без провисания при движении',
    recommendedExercise: 'Удержание захвата двумя руками при динамическом сопротивлении'
  },
  {
    id: 'sk-3',
    category: 'Подножки и подсечки',
    title: 'Подсечка в темп шага',
    criteria: 'Согласованное выведение из равновесия и подсечка подошвой стопы',
    recommendedExercise: 'Отработка подсечки в движении по кругу и в темп шага партнера'
  },
  {
    id: 'sk-4',
    category: 'Броски',
    title: 'Бросок через бедро (О-госи)',
    criteria: 'Плотный подворот таза ниже центра тяжести партнера, сброс с тягой',
    recommendedExercise: 'Входы в бросок с резиновым эспандером и партнером'
  }
];

export const initialSkillChecks: SkillVerificationRuleS3[] = [
  {
    athleteId: 'ath-1',
    skillId: 'sk-1',
    skillTitle: 'Стойка и вход в захват',
    checks: [
      { sessionId: 'ses-1', date: '2026-09-22', success: true },
      { sessionId: 'ses-3', date: '2026-09-29', success: true },
      { sessionId: 'ses-today', date: '2026-10-06', success: null }
    ]
  },
  {
    athleteId: 'ath-2',
    skillId: 'sk-2',
    skillTitle: 'Плотность захвата',
    checks: [
      { sessionId: 'ses-2', date: '2026-09-24', success: true },
      { sessionId: 'ses-4', date: '2026-10-01', success: false },
      { sessionId: 'ses-today', date: '2026-10-06', success: true }
    ]
  },
  {
    athleteId: 'ath-3',
    skillId: 'sk-3',
    skillTitle: 'Подсечка в темп шага',
    checks: [
      { sessionId: 'ses-1', date: '2026-09-15', success: true },
      { sessionId: 'ses-2', date: '2026-09-22', success: true },
      { sessionId: 'ses-3', date: '2026-09-29', success: true }
    ]
  }
];

export const initialSessions: TrainingSession[] = [
  // Session 1: 4 weeks ago (2026-09-15)
  {
    id: 'ses-1',
    groupId: 'grp-1',
    date: '2026-09-15',
    timeRange: '18:00–19:00',
    topic: 'Основы стойки и перемещения',
    isCompleted: true,
    plan: [
      { order: 1, title: 'Разминка и страховка', timeRange: '18:00–18:15' },
      { order: 2, title: 'Стойка и перемещения', timeRange: '18:15–18:45' },
      { order: 3, title: 'ОФП', timeRange: '18:45–19:00' }
    ],
    attendance: {
      'ath-1': 'present',
      'ath-2': 'excused', // excluded from Liza's E
      'ath-3': 'present',
      'ath-4': 'present',
      'ath-5': 'absent'
    },
    exceptions: {
      'ath-2': 'Заявление родителя (семейная поездка)'
    },
    notes: []
  },
  // Session 2: (2026-09-17)
  {
    id: 'ses-2',
    groupId: 'grp-1',
    date: '2026-09-17',
    timeRange: '18:00–19:00',
    topic: 'Захваты и выведение из равновесия',
    isCompleted: true,
    plan: [
      { order: 1, title: 'Разминка', timeRange: '18:00–18:15' },
      { order: 2, title: 'Борьба за захват', timeRange: '18:15–18:45' },
      { order: 3, title: 'Заминка', timeRange: '18:45–19:00' }
    ],
    attendance: {
      'ath-1': 'present',
      'ath-2': 'excused', // excluded
      'ath-3': 'present',
      'ath-4': 'present',
      'ath-5': 'absent'
    },
    exceptions: {
      'ath-2': 'Справка о болезни'
    },
    notes: []
  },
  // Session 3: (2026-09-22)
  {
    id: 'ses-3',
    groupId: 'grp-1',
    date: '2026-09-22',
    timeRange: '18:00–19:00',
    topic: 'Подсечки и зацепы',
    isCompleted: true,
    plan: [
      { order: 1, title: 'Разминка', timeRange: '18:00–18:15' },
      { order: 2, title: 'Отработка подсечки', timeRange: '18:15–18:45' },
      { order: 3, title: 'Учебные схватки', timeRange: '18:45–19:00' }
    ],
    attendance: {
      'ath-1': 'present',
      'ath-2': 'excused', // excluded
      'ath-3': 'present',
      'ath-4': 'absent',
      'ath-5': 'present'
    },
    exceptions: {
      'ath-2': 'Справка о болезни'
    },
    notes: []
  },
  // Session 4: (2026-09-24)
  {
    id: 'ses-4',
    groupId: 'grp-1',
    date: '2026-09-24',
    timeRange: '18:00–19:00',
    topic: 'Броски через бедро',
    isCompleted: true,
    plan: [
      { order: 1, title: 'Разминка', timeRange: '18:00–18:15' },
      { order: 2, title: 'Техника О-госи', timeRange: '18:15–18:45' },
      { order: 3, title: 'Заминка', timeRange: '18:45–19:00' }
    ],
    attendance: {
      'ath-1': 'present',
      'ath-2': 'excused', // excluded -> total 4 excluded for Liza!
      'ath-3': 'present',
      'ath-4': 'present',
      'ath-5': 'present'
    },
    exceptions: {
      'ath-2': 'Справка о болезни'
    },
    notes: []
  },
  // Session 5: (2026-09-29)
  {
    id: 'ses-5',
    groupId: 'grp-1',
    date: '2026-09-29',
    timeRange: '18:00–19:00',
    topic: 'Комбинации бросков',
    isCompleted: true,
    plan: [
      { order: 1, title: 'Разминка', timeRange: '18:00–18:15' },
      { order: 2, title: 'Связки приемов', timeRange: '18:15–18:45' },
      { order: 3, title: 'Схватки в партере', timeRange: '18:45–19:00' }
    ],
    attendance: {
      'ath-1': 'present',
      'ath-2': 'present', // Liza attends
      'ath-3': 'present',
      'ath-4': 'present',
      'ath-5': 'present'
    },
    exceptions: {},
    notes: []
  },
  // Session 6: (2026-10-01)
  {
    id: 'ses-6',
    groupId: 'grp-1',
    date: '2026-10-01',
    timeRange: '18:00–19:00',
    topic: 'Борьба в партере: удержания и болевые',
    isCompleted: true,
    plan: [
      { order: 1, title: 'Разминка', timeRange: '18:00–18:15' },
      { order: 2, title: 'Удержания', timeRange: '18:15–18:45' },
      { order: 3, title: 'Схватки', timeRange: '18:45–19:00' }
    ],
    attendance: {
      'ath-1': 'present',
      'ath-2': 'present',
      'ath-3': 'present',
      'ath-4': 'present',
      'ath-5': 'unmarked' // Dasha has unmarked here, so blocked ranking until marked!
    },
    exceptions: {},
    notes: []
  },
  // Session 7: Today's session (2026-10-06)
  {
    id: 'ses-today',
    groupId: 'grp-1',
    date: '2026-10-06',
    timeRange: '18:00–19:00',
    topic: 'Техника и учебные схватки',
    isCompleted: false,
    plan: [
      { order: 1, title: 'Разминка', timeRange: '18:00–18:15' },
      { order: 2, title: 'Техника', timeRange: '18:15–18:40' },
      { order: 3, title: 'Учебные схватки', timeRange: '18:40–19:00' }
    ],
    attendance: {
      'ath-1': 'present',
      'ath-2': 'present',
      'ath-3': 'present',
      'ath-4': 'absent',
      'ath-5': 'present'
    },
    exceptions: {},
    notes: [
      {
        id: 'n-1',
        athleteId: 'ath-1',
        text: 'При входе в захват теряет устойчивость',
        createdAt: '2026-10-06T18:25:00'
      }
    ]
  },
  // Session 8: Session within 4w window (2026-10-08) upcoming
  {
    id: 'ses-next',
    groupId: 'grp-1',
    date: '2026-10-08',
    timeRange: '18:00–19:00',
    topic: 'Техника и соревновательные схватки',
    isCompleted: false,
    plan: [
      { order: 1, title: 'Разминка', timeRange: '18:00–18:15' },
      { order: 2, title: 'Отработка коронных бросков', timeRange: '18:15–18:40' },
      { order: 3, title: 'Контрольные схватки', timeRange: '18:40–19:00' }
    ],
    attendance: {
      'ath-1': 'present',
      'ath-2': 'present',
      'ath-3': 'present',
      'ath-4': 'present',
      'ath-5': 'present'
    },
    exceptions: {},
    notes: []
  }
];

export const initialTasks: IndividualTask[] = [
  {
    id: 'tsk-1',
    athleteId: 'ath-1',
    observation: 'При входе в захват теряет устойчивость',
    skillId: 'sk-1',
    skillTitle: 'Стойка и вход в захват',
    exerciseTitle: 'Сохранить положение в упражнении (парная отработка)',
    deadline: '2026-10-08',
    status: 'active',
    publishedToFamily: true,
    coachFeedback: 'Есть улучшения, продолжай в том же духе.'
  },
  {
    id: 'tsk-2',
    athleteId: 'ath-2',
    observation: 'Срыв захвата при контратаке',
    skillId: 'sk-2',
    skillTitle: 'Плотность захвата',
    exerciseTitle: 'Удержание захвата двумя руками',
    deadline: '2026-10-09',
    status: 'active',
    publishedToFamily: false
  },
  {
    id: 'tsk-3',
    athleteId: 'ath-1',
    observation: 'Баланс при выведении из равновесия',
    skillId: 'sk-3',
    skillTitle: 'Подсечка в темп шага',
    exerciseTitle: 'Отработка баланса на одной ноге',
    deadline: '2026-10-05',
    status: 'completed',
    publishedToFamily: true,
    coachFeedback: 'Отлично выполнено, задача зачтена.',
    completedAt: '2026-10-06'
  }
];

export const initialWeights: WeightRecord[] = [
  {
    id: 'w-1',
    athleteId: 'ath-1',
    date: '2026-09-20',
    weightKg: 38.2,
    context: 'Перед утренней тренировкой'
  },
  {
    id: 'w-2',
    athleteId: 'ath-1',
    date: '2026-09-27',
    weightKg: 38.4,
    context: 'Контрольное взвешивание перед сбором'
  },
  {
    id: 'w-3',
    athleteId: 'ath-1',
    date: '2026-10-04',
    weightKg: 38.3,
    context: 'Взвешивание перед тренировкой'
  }
];

export const initialVideoNotes: VideoNote[] = [
  {
    id: 'vn-1',
    athleteId: 'ath-1',
    title: 'Разбор полуфинальной схватки',
    videoUrl: 'https://rutube.ru/video/sambo-bout-102/',
    timestamp: '01:24',
    note: 'Срыв захвата левой рукой при атаке соперника, потеря баланса при отшаге назад.',
    createdAt: '2026-10-03'
  }
];

export const initialCompetitions: Competition[] = [
  {
    id: 'cmp-1',
    title: 'Первенство города по самбо среди юношей',
    date: '2026-10-24',
    endDate: '2026-10-25',
    location: 'Дворец спорта «Самбо-70», Москва',
    requiredDocuments: ['medical', 'insurance', 'consent'],
    participants: [
      {
        athleteId: 'ath-1',
        category: 'Юноши до 42 кг',
        admissionDecision: 'pending',
        nextGoal: 'Выход в полуфинал'
      },
      {
        athleteId: 'ath-2',
        category: 'Девушки до 38 кг',
        admissionDecision: 'admitted',
        nextGoal: 'Отработка коронного приема в соревновательном темпе'
      },
      {
        athleteId: 'ath-3',
        category: 'Юноши до 46 кг',
        admissionDecision: 'admitted',
        nextGoal: 'Выполнение 2-го юношеского разряда'
      }
    ]
  }
];

export const initialGroupInfo: GroupInfo = {
  id: 'grp-1',
  name: 'Группа 1 (Начальная подготовка)',
  coachName: 'Иванов А. В.',
  schedule: 'Вт, Чт 18:00–19:00',
  athleteCount: 4
};

export const initialGroups: GroupInfo[] = [
  {
    id: 'grp-1',
    name: 'Группа 1 (Начальная подготовка)',
    coachName: 'Иванов А. В.',
    schedule: 'Вт, Чт 18:00–19:00',
    athleteCount: 4
  },
  {
    id: 'grp-2',
    name: 'Группа 2 (Учебно-тренировочная)',
    coachName: 'Петров С. Н.',
    schedule: 'Пн, Ср, Пт 17:00–18:30',
    athleteCount: 3
  },
  {
    id: 'grp-3',
    name: 'Группа 3 (Спортивное совершенствование)',
    coachName: 'Иванов А. В.',
    schedule: 'Пн, Ср, Пт 19:00–21:00',
    athleteCount: 3
  }
];

export const initialClubUsers: ClubUser[] = [
  {
    id: 'usr-1',
    fullName: 'Михайлов Дмитрий Павлович',
    role: 'admin',
    phone: '+7 (999) 001-11-22',
    email: 'd.mikhailov@sambo-club.ru',
    title: 'Администратор школы самбо',
    isHeadManager: true,
    isVerifierAssigned: false
  },
  {
    id: 'usr-2',
    fullName: 'Иванов Алексей Васильевич',
    role: 'coach',
    phone: '+7 (999) 002-33-44',
    email: 'a.ivanov@sambo-club.ru',
    title: 'Старший тренер, Мастер спорта России',
    isHeadManager: false,
    isVerifierAssigned: false
  },
  {
    id: 'usr-3',
    fullName: 'Смирнова Вероника Александровна',
    role: 'verifier',
    phone: '+7 (999) 003-55-66',
    email: 'v.smirnova@sambo-club.ru',
    title: 'Спортивный врач, контролёр медкомиссии',
    isHeadManager: false,
    isVerifierAssigned: true
  },
  {
    id: 'usr-4',
    fullName: 'Петров Сергей Николаевич',
    role: 'coach',
    phone: '+7 (999) 004-77-88',
    email: 's.petrov@sambo-club.ru',
    title: 'Тренер юношеских групп, КМС по самбо',
    isHeadManager: false,
    isVerifierAssigned: false
  },
  {
    id: 'usr-5',
    fullName: 'Кузнецов Роман Викторович',
    role: 'admin',
    phone: '+7 (999) 005-99-00',
    email: 'r.kuznetsov@sambo-club.ru',
    title: 'Зам. директора по спортивной работе',
    isHeadManager: false,
    isVerifierAssigned: false
  }
];

export const initialExercises: ExerciseItem[] = [
  // Разминка
  {
    id: 'ex-1',
    category: 'warmup',
    categoryLabel: 'Разминка',
    title: 'Специальная самбистская разминка и страховка',
    description: 'Перекаты, самостраховка при падениях (на бок, спину, через плечо), борцовский мост и забегания на голове.',
    durationMinutes: 15,
    intensity: 'medium'
  },
  {
    id: 'ex-2',
    category: 'warmup',
    categoryLabel: 'Разминка',
    title: 'Акробатика на ковре и кувырки через препятствия',
    description: 'Кувырки вперед/назад в парах, колесо, полет-кувырок через партнера, перевороты на татами.',
    durationMinutes: 10,
    intensity: 'medium'
  },
  {
    id: 'ex-3',
    category: 'warmup',
    categoryLabel: 'Разминка',
    title: 'Суставная гимнастика и растяжка связок',
    description: 'Вращения в плечевых, локтевых и коленных суставах, растяжка паховых связок и позвоночника.',
    durationMinutes: 10,
    intensity: 'low'
  },
  // Приёмы и броски
  {
    id: 'ex-4',
    category: 'throws',
    categoryLabel: 'Приёмы и броски',
    title: 'Бросок через бедро (О-госи) с плотным поясом',
    description: 'Отработка входа в бросок, подворот таза ниже центра тяжести соперника, сброс с фиксацией руки.',
    durationMinutes: 20,
    intensity: 'high'
  },
  {
    id: 'ex-5',
    category: 'throws',
    categoryLabel: 'Приёмы и броски',
    title: 'Передняя подножка (Тай-отоси)',
    description: 'Срыв захвата, выставление атакующей ноги, скручивание плечевого пояса партнера по дуге.',
    durationMinutes: 20,
    intensity: 'high'
  },
  {
    id: 'ex-6',
    category: 'throws',
    categoryLabel: 'Приёмы и броски',
    title: 'Задняя подножка (О-сото-гари)',
    description: 'Захват отворота и рукава, загрузка опорной ноги оппонента, мощный подбив с толчком грудью.',
    durationMinutes: 15,
    intensity: 'high'
  },
  {
    id: 'ex-7',
    category: 'throws',
    categoryLabel: 'Приёмы и броски',
    title: 'Бросок через спину с колен (Сэойнагэ)',
    description: 'Быстрый подсед на два колена под центр тяжести, плотная фиксация руки на плече, амплитудный сброс.',
    durationMinutes: 20,
    intensity: 'high'
  },
  {
    id: 'ex-8',
    category: 'throws',
    categoryLabel: 'Приёмы и броски',
    title: 'Подхват под две ноги (Харай-госи)',
    description: 'Выведение из равновесия на носки, мах ногой с одновременной тягой обеими руками вперед-вниз.',
    durationMinutes: 20,
    intensity: 'high'
  },
  // Партер
  {
    id: 'ex-9',
    category: 'groundwork',
    categoryLabel: 'Борьба в партере',
    title: 'Удержание сбоку (Хон-кэса-гатамэ)',
    description: 'Плотный захват шеи и руки соперника, опора на широко расставленные ноги, распределение массы.',
    durationMinutes: 15,
    intensity: 'medium'
  },
  {
    id: 'ex-10',
    category: 'groundwork',
    categoryLabel: 'Борьба в партере',
    title: 'Болевой приём: рычаг локтя через бедро',
    description: 'Переход на руку из удержания сбоку, фиксация запястья двумя руками, перегиб локтевого сустава.',
    durationMinutes: 20,
    intensity: 'medium'
  },
  {
    id: 'ex-11',
    category: 'groundwork',
    categoryLabel: 'Борьба в партере',
    title: 'Удержание поперек (Йоко-сихо-гатамэ)',
    description: 'Контроль пояса и дальней руки партнера, прижим грудью, блокировка попыток переворота мостом.',
    durationMinutes: 15,
    intensity: 'medium'
  },
  {
    id: 'ex-12',
    category: 'groundwork',
    categoryLabel: 'Борьба в партере',
    title: 'Учебно-тренировочные схватки в партере',
    description: 'Отработка переходов от защиты к атакующим действиям и болевым приемам по 3 минуты в парах.',
    durationMinutes: 20,
    intensity: 'high'
  },
  // СФП
  {
    id: 'ex-13',
    category: 'sfp',
    categoryLabel: 'СФП и ОФП',
    title: 'Отработка входов в приёмы с борцовской резиной',
    description: 'Имитация подворотов на броски через бедро и спину с резиновым эспандером на скорость и взрыв.',
    durationMinutes: 15,
    intensity: 'high'
  },
  {
    id: 'ex-14',
    category: 'sfp',
    categoryLabel: 'СФП и ОФП',
    title: 'Круговая силовая подготовка борца',
    description: 'Подтягивания на куртках самбо (хват за отвороты), отжимания на кулаках, приседания с партнером.',
    durationMinutes: 20,
    intensity: 'high'
  },
  {
    id: 'ex-15',
    category: 'sfp',
    categoryLabel: 'СФП и ОФП',
    title: 'Челночный бег и спурты на ковре',
    description: 'Развитие анаэробной выносливости для финальных минут соревновательных схваток.',
    durationMinutes: 15,
    intensity: 'high'
  },
  {
    id: 'ex-16',
    category: 'sfp',
    categoryLabel: 'СФП и ОФП',
    title: 'Заминка, растяжка и дыхательное восстановление',
    description: 'Плавное снижение частоты пульса, расслабление мышц спины и шеи, статические асаны на растяжку.',
    durationMinutes: 10,
    intensity: 'low'
  }
];

export const initialScheduleSlots: ScheduleSlot[] = [
  { id: 'sch-1', day: 'Вторник', time: '18:00–19:00', hall: 'Зал самбо №1', coach: 'Иванов А. В.', group: 'Группа 1' },
  { id: 'sch-2', day: 'Четверг', time: '18:00–19:00', hall: 'Зал самбо №1', coach: 'Иванов А. В.', group: 'Группа 1' },
  { id: 'sch-3', day: 'Суббота', time: '10:00–11:30', hall: 'Зал самбо №2', coach: 'Иванов А. В.', group: 'Группа 1 (ОФП)' },
];

