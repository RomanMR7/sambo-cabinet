import { describe, it, expect } from 'vitest';
import {
  calculateFourWeekAttendance,
  calculateFourWeekStats,
  generateAttendanceCSV,
  calculateSkillProgress,
  getSkillStatus,
  evaluateS3Rule,
  getDocumentStatus,
  getDaysUntilExpiry,
  getDocumentExpiryStatus,
  canRoleAccessMedicalData,
  isDocumentAccessibleForRole,
  filterDocumentsForRole,
  filterAthletesForRole,
  filterTasksForRole,
  parseDateUtc,
  DEMO_TODAY,
  getCoachShortName,
  isCoachForGroup,
  isCoachForSlot,
  getTodayDate,
  checkScheduleConflict,
  parseTimeInterval,
  canonicalizeDay,
  canonicalizeHall
} from '../rules';
import { Athlete, TrainingSession, DocumentRecord, IndividualTask, ScheduleSlot } from '../../types';

// --- Test Mock Factories ---

const createMockAthlete = (id: string, fullName: string, shortName: string): Athlete => ({
  id,
  fullName,
  shortName,
  groupId: 'grp-1',
  avatarInitials: fullName.slice(0, 2),
  isActive: true,
  admissionDecision: {
    status: 'admitted',
    basis: 'Справка №1',
    reviewedAt: '2026-09-01',
    reviewedBy: 'Тренер'
  },
  parentName: 'Родитель ' + shortName,
  parentPhone: '+7 (999) 000-00-00',
  athletePhone: '+7 (999) 111-11-11'
});

const createMockSession = (
  id: string,
  date: string,
  attendanceMap: Record<string, 'present' | 'absent' | 'excused' | 'unmarked'>
): TrainingSession => ({
  id,
  groupId: 'grp-1',
  date,
  timeRange: '18:00–19:30',
  topic: 'Тестовая тренировка',
  isCompleted: true,
  plan: [],
  attendance: attendanceMap,
  exceptions: {},
  notes: []
});

describe('Правило 4 недель (calculateFourWeekStats & calculateFourWeekAttendance)', () => {
  const athlete1 = createMockAthlete('ath-1', 'Антон Кузнецов', 'Антон К.');
  const athlete2 = createMockAthlete('ath-2', 'Дмитрий Смирнов', 'Дмитрий С.');
  const athlete3 = createMockAthlete('ath-3', 'Егор Новиков', 'Егор Н.');

  it('1. Расчет эффективной базы: E = Total - Excused', () => {
    // 6 тренировок: для ath-1 4 present, 2 excused -> E = 4
    const sessions: TrainingSession[] = [
      createMockSession('s1', '2026-09-10', { 'ath-1': 'present' }),
      createMockSession('s2', '2026-09-12', { 'ath-1': 'present' }),
      createMockSession('s3', '2026-09-15', { 'ath-1': 'present' }),
      createMockSession('s4', '2026-09-17', { 'ath-1': 'present' }),
      createMockSession('s5', '2026-09-20', { 'ath-1': 'excused' }),
      createMockSession('s6', '2026-09-22', { 'ath-1': 'excused' })
    ];

    const results = calculateFourWeekStats([athlete1], sessions);
    const row = results[0];

    expect(row.totalSessions).toBe(6);
    expect(row.excusedCount).toBe(2);
    expect(row.effectiveBaseE).toBe(4); // 6 - 2 = 4
    expect(row.presentCount).toBe(4);
  });

  it('2. Расчет процента посещений: Present / E * 100%', () => {
    // E = 4, present = 3 -> 3 / 4 * 100% = 75%
    const sessions: TrainingSession[] = [
      createMockSession('s1', '2026-09-10', { 'ath-1': 'present' }),
      createMockSession('s2', '2026-09-12', { 'ath-1': 'present' }),
      createMockSession('s3', '2026-09-15', { 'ath-1': 'present' }),
      createMockSession('s4', '2026-09-17', { 'ath-1': 'absent' }),
      createMockSession('s5', '2026-09-20', { 'ath-1': 'excused' })
    ];

    const results = calculateFourWeekAttendance([athlete1], sessions);
    const row = results[0];

    expect(row.effectiveBaseE).toBe(4); // 5 total - 1 excused
    expect(row.presentCount).toBe(3);
    expect(row.ratePercent).toBe(75);
  });

  it('3. Граничный случай: деление на ноль (когда E == 0) не возвращает NaN или Infinity', () => {
    // 3 тренировки, все 3 уважительные -> E = 0
    const sessions: TrainingSession[] = [
      createMockSession('s1', '2026-09-10', { 'ath-1': 'excused' }),
      createMockSession('s2', '2026-09-12', { 'ath-1': 'excused' }),
      createMockSession('s3', '2026-09-15', { 'ath-1': 'excused' })
    ];

    const results = calculateFourWeekStats([athlete1], sessions);
    const row = results[0];

    expect(row.effectiveBaseE).toBe(0);
    expect(row.ratePercent).toBe(0);
    expect(Number.isFinite(row.ratePercent)).toBe(true);
    expect(Number.isNaN(row.ratePercent)).toBe(false);
  });

  it('4. Граничный случай: все пропуски уважительные (E == 0) -> Без места (E < 4)', () => {
    const sessions: TrainingSession[] = [
      createMockSession('s1', '2026-09-10', { 'ath-1': 'excused' }),
      createMockSession('s2', '2026-09-12', { 'ath-1': 'excused' }),
      createMockSession('s3', '2026-09-15', { 'ath-1': 'excused' }),
      createMockSession('s4', '2026-09-17', { 'ath-1': 'excused' })
    ];

    const results = calculateFourWeekStats([athlete1], sessions);
    const row = results[0];

    expect(row.effectiveBaseE).toBe(0);
    expect(row.statusBadge).toBe('unranked');
    expect(row.rankNumber).toBeNull();
    expect(row.rankText).toBe('Без места (E < 4)');
  });

  it('5. Граничный случай: 0 тренировок (пустой список занятий)', () => {
    const results = calculateFourWeekStats([athlete1], []);
    const row = results[0];

    expect(row.totalSessions).toBe(0);
    expect(row.effectiveBaseE).toBe(0);
    expect(row.ratePercent).toBe(0);
    expect(row.rankNumber).toBeNull();
    expect(row.statusBadge).toBe('unranked');
    expect(row.rankText).toBe('Без места (E < 4)');
  });

  it('6. Блокировка ранжирования при наличии неотмеченных занятий (hasUnmarked)', () => {
    // 5 тренировок: 4 present, 1 unmarked -> E = 5 >= 4, 80%, но unmarkedCount = 1
    const sessions: TrainingSession[] = [
      createMockSession('s1', '2026-09-10', { 'ath-1': 'present' }),
      createMockSession('s2', '2026-09-12', { 'ath-1': 'present' }),
      createMockSession('s3', '2026-09-15', { 'ath-1': 'present' }),
      createMockSession('s4', '2026-09-17', { 'ath-1': 'present' }),
      createMockSession('s5', '2026-09-20', { 'ath-1': 'unmarked' })
    ];

    const results = calculateFourWeekStats([athlete1], sessions);
    const row = results[0];

    expect(row.unmarkedCount).toBe(1);
    expect(row.hasUnmarked).toBe(true);
    expect(row.isBlockedByUnmarked).toBe(true);
    expect(row.statusBadge).toBe('blocked');
    expect(row.rankNumber).toBeNull();
    expect(row.rankText).toBe('Заблокировано (не отмечено)');
  });

  it('7. Корректное присвоение мест: только атлетам с E >= 4 и без неотмеченных занятий', () => {
    const sessions: TrainingSession[] = [
      createMockSession('s1', '2026-09-10', { 'ath-1': 'present', 'ath-2': 'present', 'ath-3': 'present' }),
      createMockSession('s2', '2026-09-12', { 'ath-1': 'present', 'ath-2': 'present', 'ath-3': 'present' }),
      createMockSession('s3', '2026-09-15', { 'ath-1': 'present', 'ath-2': 'present', 'ath-3': 'present' }),
      createMockSession('s4', '2026-09-17', { 'ath-1': 'present', 'ath-2': 'present', 'ath-3': 'absent' }),
      createMockSession('s5', '2026-09-20', { 'ath-1': 'absent',  'ath-2': 'absent',  'ath-3': 'excused' })
    ];
    // ath-1: total 5, exc 0, E = 5, pres 4 -> 80%
    // ath-2: total 5, exc 0, E = 5, pres 4 -> 80% (shared 1st rank!)
    // ath-3: total 5, exc 1, E = 4, pres 3 -> 75% -> 3rd rank

    const results = calculateFourWeekStats([athlete1, athlete2, athlete3], sessions);

    const r1 = results.find(r => r.athlete.id === 'ath-1')!;
    const r2 = results.find(r => r.athlete.id === 'ath-2')!;
    const r3 = results.find(r => r.athlete.id === 'ath-3')!;

    // Leaders with identical rate share 1st place
    expect(r1.ratePercent).toBe(80);
    expect(r2.ratePercent).toBe(80);
    expect(r1.rankNumber).toBe(1);
    expect(r2.rankNumber).toBe(1);
    expect(r1.rankText).toBe('1 место');
    expect(r2.rankText).toBe('1 место');

    // Next athlete takes 3rd place (standard sport tie-breaking 1, 1, 3)
    expect(r3.ratePercent).toBe(75);
    expect(r3.rankNumber).toBe(3);
    expect(r3.rankText).toBe('3 место');
    expect(r3.statusBadge).toBe('ranked');
  });

  it('8. Атлет с E < 4 не ранжируется (Без места (E < 4)), даже если посещаемость 100%', () => {
    // ath-1: 3 тренировки, все присутствовал -> E = 3 (< 4)
    const sessions: TrainingSession[] = [
      createMockSession('s1', '2026-09-10', { 'ath-1': 'present' }),
      createMockSession('s2', '2026-09-12', { 'ath-1': 'present' }),
      createMockSession('s3', '2026-09-15', { 'ath-1': 'present' })
    ];

    const results = calculateFourWeekStats([athlete1], sessions);
    const row = results[0];

    expect(row.effectiveBaseE).toBe(3);
    expect(row.ratePercent).toBe(100);
    expect(row.rankNumber).toBeNull();
    expect(row.statusBadge).toBe('unranked');
    expect(row.rankText).toBe('Без места (E < 4)');
  });

  it('9. Экспорт в CSV (generateAttendanceCSV)', () => {
    const sessions: TrainingSession[] = [
      createMockSession('s1', '2026-09-10', { 'ath-1': 'present' }),
      createMockSession('s2', '2026-09-12', { 'ath-1': 'present' }),
      createMockSession('s3', '2026-09-15', { 'ath-1': 'present' }),
      createMockSession('s4', '2026-09-17', { 'ath-1': 'present' })
    ];

    const rows = calculateFourWeekStats([athlete1], sessions);
    const csv = generateAttendanceCSV(rows);

    // Must start with UTF-8 BOM
    expect(csv.startsWith('\uFEFF')).toBe(true);

    // Contains required headers separated by semicolon
    expect(csv).toContain('Спортсмен;Всего занятий;Уважительных (исключено);Эффективная база E');
    expect(csv).toContain('Присутствовал;Пропусков;Не отмечено;Доля посещений (%);Итоговое место');

    // Contains athlete row data
    expect(csv).toContain('"Антон Кузнецов"');
    expect(csv).toContain('100%');
    expect(csv).toContain('"1 место"');
  });
});

describe('Правило S/3S (calculateSkillProgress & getSkillStatus)', () => {
  it('1. 3 успешных попытки -> статус «Освоено» (3/3)', () => {
    const checks = [
      { success: true },
      { success: true },
      { success: true }
    ];

    const progress = calculateSkillProgress(checks);
    expect(progress.status).toBe('mastered');
    expect(progress.statusTitle).toBe('Освоено');
    expect(progress.successCount).toBe(3);
    expect(getSkillStatus(checks)).toBe('Освоено');

    // Also supports passing number of successful checks
    expect(getSkillStatus(3)).toBe('Освоено');
  });

  it('2. 1-2 успешные попытки -> «В процессе»', () => {
    // 2 успешные попытки (третья еще не оценена)
    const checks2 = [
      { success: true },
      { success: true },
      { success: null }
    ];
    const progress2 = calculateSkillProgress(checks2);
    expect(progress2.status).toBe('in_progress');
    expect(progress2.statusTitle).toBe('В процессе');
    expect(progress2.successCount).toBe(2);
    expect(getSkillStatus(checks2)).toBe('В процессе');
    expect(getSkillStatus(2)).toBe('В процессе');

    // 1 успешная попытка
    const checks1 = [
      { success: true },
      { success: null },
      { success: null }
    ];
    const progress1 = calculateSkillProgress(checks1);
    expect(progress1.status).toBe('in_progress');
    expect(progress1.statusTitle).toBe('В процессе');
    expect(progress1.successCount).toBe(1);
    expect(getSkillStatus(checks1)).toBe('В процессе');
    expect(getSkillStatus(1)).toBe('В процессе');
  });

  it('3. 0 успешных попыток или неудачи -> «Требуется доработка»', () => {
    // 0 успешных (все 3 неудачные)
    const checksFailed = [
      { success: false },
      { success: false },
      { success: false }
    ];
    const progress0 = calculateSkillProgress(checksFailed);
    expect(progress0.status).toBe('failed');
    expect(progress0.statusTitle).toBe('Требуется доработка');
    expect(progress0.successCount).toBe(0);
    expect(getSkillStatus(checksFailed)).toBe('Требуется доработка');
    expect(getSkillStatus(0)).toBe('Требуется доработка');

    // 3 попытки завершены, но только 1 успех и 2 неудачи (не сдал 3/3)
    const checksWithFails = [
      { success: true },
      { success: false },
      { success: false }
    ];
    expect(getSkillStatus(checksWithFails)).toBe('Требуется доработка');
  });

  it('4. Обратная совместимость с evaluateS3Rule', () => {
    const mastered = evaluateS3Rule([{ success: true }, { success: true }, { success: true }]);
    expect(mastered.status).toBe('mastered');
    expect(mastered.statusText).toContain('Освоено');

    const inProgress = evaluateS3Rule([{ success: true }, { success: true }, { success: null }]);
    expect(inProgress.status).toBe('in_progress');
    expect(inProgress.statusText).toContain('В процессе');

    const failed = evaluateS3Rule([{ success: true }, { success: false }, { success: false }]);
    expect(failed.status).toBe('failed');
    expect(failed.statusText).toContain('Требуется доработка');
  });
});

describe('Верификация документов и сроков (getDocumentStatus & getDaysUntilExpiry)', () => {
  const refDate = DEMO_TODAY; // '2026-10-06'

  it('1. Документ действителен (более 14 дней)', () => {
    // Срок действия: 2026-10-25 -> разница 19 дней
    const expiry = '2026-10-25';
    const days = getDaysUntilExpiry(expiry, refDate);

    expect(days).toBe(19);
    expect(days).toBeGreaterThan(14);
    expect(getDocumentStatus(expiry, refDate)).toBe('valid');
    expect(getDocumentExpiryStatus(expiry, refDate)).toBe('valid');
  });

  it('2. Документ истекает скоро (14 дней или меньше)', () => {
    // Ровно 14 дней: 2026-10-20
    const expiry14 = '2026-10-20';
    expect(getDaysUntilExpiry(expiry14, refDate)).toBe(14);
    expect(getDocumentStatus(expiry14, refDate)).toBe('expiring_soon');
    expect(getDocumentExpiryStatus(expiry14, refDate)).toBe('expiring_soon');

    // 5 дней: 2026-10-11
    const expiry5 = '2026-10-11';
    expect(getDaysUntilExpiry(expiry5, refDate)).toBe(5);
    expect(getDocumentStatus(expiry5, refDate)).toBe('expiring_soon');

    // День в день (0 дней): 2026-10-06
    const expiry0 = '2026-10-06';
    expect(getDaysUntilExpiry(expiry0, refDate)).toBe(0);
    expect(getDocumentStatus(expiry0, refDate)).toBe('expiring_soon');
  });

  it('3. Документ просрочен (отрицательное количество дней)', () => {
    // Вчера: 2026-10-05 (-1 день)
    const expiryYesterday = '2026-10-05';
    const days = getDaysUntilExpiry(expiryYesterday, refDate);

    expect(days).toBe(-1);
    expect(days!).toBeLessThan(0);
    expect(getDocumentStatus(expiryYesterday, refDate)).toBe('expired');
    expect(getDocumentExpiryStatus(expiryYesterday, refDate)).toBe('expired');

    // Месяц назад: 2026-09-01
    const expiryOld = '2026-09-01';
    expect(getDaysUntilExpiry(expiryOld, refDate)!).toBeLessThan(0);
    expect(getDocumentStatus(expiryOld, refDate)).toBe('expired');
  });

  it('4. Бессрочные документы (согласия)', () => {
    // Согласие на обработку ПДн не имеет даты окончания
    const consentDoc = {
      type: 'consent' as const,
      title: 'Согласие на ПДн'
    };

    expect(getDaysUntilExpiry(undefined, refDate)).toBeNull();
    expect(getDocumentStatus(consentDoc, refDate)).toBe('perpetual');
    expect(getDocumentStatus(undefined, refDate, 'consent')).toBe('perpetual');
  });
});

describe('Ролевая безопасность и изоляция данных (152-ФЗ, Родитель, Спортсмен)', () => {
  const mockDocs: DocumentRecord[] = [
    {
      id: 'doc-med-1',
      athleteId: 'ath-1',
      type: 'medical',
      title: 'Справка УМО (Антон К.)',
      fileName: 'umo_anton.pdf',
      uploadDate: '2026-09-01',
      expiryDate: '2026-12-01',
      version: 1,
      verificationStatus: 'verified',
      isRestrictedMedical: true
    },
    {
      id: 'doc-ins-1',
      athleteId: 'ath-1',
      type: 'insurance',
      title: 'Страховой полис (Антон К.)',
      fileName: 'ins_anton.pdf',
      uploadDate: '2026-09-01',
      expiryDate: '2026-12-01',
      version: 1,
      verificationStatus: 'verified',
      isRestrictedMedical: false
    },
    {
      id: 'doc-med-2',
      athleteId: 'ath-2',
      type: 'medical',
      title: 'Справка УМО (Дмитрий С.)',
      fileName: 'umo_dima.pdf',
      uploadDate: '2026-09-01',
      expiryDate: '2026-12-01',
      version: 1,
      verificationStatus: 'verified',
      isRestrictedMedical: true
    }
  ];

  const mockAthletes: Athlete[] = [
    createMockAthlete('ath-1', 'Антон Кузнецов', 'Антон К.'),
    createMockAthlete('ath-2', 'Дмитрий Смирнов', 'Дмитрий С.')
  ];

  const mockTasks: IndividualTask[] = [
    {
      id: 'tsk-1',
      athleteId: 'ath-1',
      observation: 'Срыв захвата',
      skillId: 'sk-1',
      skillTitle: 'Захват',
      exerciseTitle: 'Упражнение с резиной',
      deadline: '2026-10-10',
      status: 'active',
      publishedToFamily: true
    },
    {
      id: 'tsk-coach-secret',
      athleteId: 'ath-1',
      observation: 'Тренерская внутренняя заметка',
      skillId: 'sk-2',
      skillTitle: 'Тактика',
      exerciseTitle: 'Анализ',
      deadline: '2026-10-15',
      status: 'active',
      publishedToFamily: false // НЕ опубликовано родителям!
    },
    {
      id: 'tsk-2',
      athleteId: 'ath-2',
      observation: 'Задача Димы',
      skillId: 'sk-1',
      skillTitle: 'Захват',
      exerciseTitle: 'Упражнение',
      deadline: '2026-10-10',
      status: 'active',
      publishedToFamily: true
    }
  ];

  it('1. Проверка роли Администратора (152-ФЗ): медицинские справки скрыты/заблокированы', () => {
    // У администратора нет медицинского допуска
    expect(canRoleAccessMedicalData('admin')).toBe(false);

    // Доступ к медицинскому документу напрямую запрещен
    expect(isDocumentAccessibleForRole(mockDocs[0], 'admin')).toBe(false);

    // Доступ к немедицинскому документу (страховка) разрешен
    expect(isDocumentAccessibleForRole(mockDocs[1], 'admin')).toBe(true);

    // В выборке документов администратора отсутствуют медицинские файлы
    const adminDocs = filterDocumentsForRole(mockDocs, 'admin');
    expect(adminDocs.length).toBe(1);
    expect(adminDocs.some(d => d.type === 'medical')).toBe(false);
    expect(adminDocs.some(d => d.isRestrictedMedical)).toBe(false);
    expect(adminDocs[0].type).toBe('insurance');

    // Тренер и Контролёр имеют полный доступ к медкопиям
    expect(canRoleAccessMedicalData('coach')).toBe(true);
    expect(canRoleAccessMedicalData('verifier')).toBe(true);
    expect(filterDocumentsForRole(mockDocs, 'coach').length).toBe(3);
    expect(filterDocumentsForRole(mockDocs, 'verifier').length).toBe(3);
  });

  it('2. Проверка изоляции данных для Родителя: видит только своего ребенка и разрешенные данные', () => {
    // Список спортсменов изолирован только до 'ath-1'
    const parentAthletes = filterAthletesForRole(mockAthletes, 'parent', 'ath-1');
    expect(parentAthletes.length).toBe(1);
    expect(parentAthletes[0].id).toBe('ath-1');
    expect(parentAthletes.some(a => a.id === 'ath-2')).toBe(false);

    // Документы изолированы только для своего ребенка
    const parentDocs = filterDocumentsForRole(mockDocs, 'parent', 'ath-1');
    expect(parentDocs.length).toBe(2);
    expect(parentDocs.every(d => d.athleteId === 'ath-1')).toBe(true);

    // Прямой доступ к чужому документу строго запрещен
    expect(isDocumentAccessibleForRole(mockDocs[2], 'parent', 'ath-1')).toBe(false);
    expect(isDocumentAccessibleForRole(mockDocs[0], 'parent', 'ath-1')).toBe(true);
    expect(isDocumentAccessibleForRole(mockDocs[0], 'parent')).toBe(false);

    // Задания: видит ТОЛЬКО задания своего ребенка и ТОЛЬКО опубликованные для семьи
    const parentTasks = filterTasksForRole(mockTasks, 'parent', 'ath-1');
    expect(parentTasks.length).toBe(1);
    expect(parentTasks[0].id).toBe('tsk-1');
    expect(parentTasks[0].publishedToFamily).toBe(true);
    // Внутренняя тренерская заметка (publishedToFamily === false) скрыта
    expect(parentTasks.some(t => t.id === 'tsk-coach-secret')).toBe(false);
    // Чужие задачи скрыты
    expect(parentTasks.some(t => t.athleteId === 'ath-2')).toBe(false);
  });

  it('3. Проверка изоляции данных для Спортсмена: видит только свой профиль и задачи', () => {
    // Список спортсменов изолирован
    const athleteList = filterAthletesForRole(mockAthletes, 'athlete', 'ath-1');
    expect(athleteList.length).toBe(1);
    expect(athleteList[0].id).toBe('ath-1');

    // Документы изолированы
    const athleteDocs = filterDocumentsForRole(mockDocs, 'athlete', 'ath-1');
    expect(athleteDocs.every(d => d.athleteId === 'ath-1')).toBe(true);

    // Прямой доступ к чужим документам запрещен
    expect(isDocumentAccessibleForRole(mockDocs[2], 'athlete', 'ath-1')).toBe(false);
    expect(isDocumentAccessibleForRole(mockDocs[0], 'athlete', 'ath-1')).toBe(true);
    expect(isDocumentAccessibleForRole(mockDocs[0], 'athlete')).toBe(false);

    // Задачи изолированы
    const athleteTasks = filterTasksForRole(mockTasks, 'athlete', 'ath-1');
    expect(athleteTasks.length).toBe(1);
    expect(athleteTasks[0].id).toBe('tsk-1');
  });
});

describe('Надежность и граничные случаи (parseDateUtc, сортировка, поврежденные данные)', () => {
  it('1. parseDateUtc корректно разбирает даты и независим от локальной таймзоны', () => {
    const utc1 = parseDateUtc('2026-10-06');
    const utc2 = parseDateUtc('2026-10-07');
    expect(utc1).not.toBeNull();
    expect(utc2).not.toBeNull();
    // Разница между сутками ровно 86400000 мс (24 часа)
    expect(utc2! - utc1!).toBe(24 * 60 * 60 * 1000);

    // Некорректные значения
    expect(parseDateUtc(null)).toBeNull();
    expect(parseDateUtc(undefined)).toBeNull();
    expect(parseDateUtc('')).toBeNull();
    expect(parseDateUtc('not-a-date')).toBeNull();
  });

  it('2. Многоуровневая сортировка (tie-breaker) при одинаковом рейтинге посещаемости', () => {
    // 3 спортсмена с одинаковым процентом (75%), но разным числом посещений/пропусков и алфавитным порядком
    const athA = createMockAthlete('a1', 'Борисов Борис', 'Борис Б.');
    const athB = createMockAthlete('a2', 'Андреев Андрей', 'Андрей А.');
    const athC = createMockAthlete('a3', 'Васильев Василий', 'Василий В.');

    // 4 тренировки: у всех 3 present, 1 absent -> ratePercent 75%
    const sessions = [
      createMockSession('s1', '2026-09-01', { a1: 'present', a2: 'present', a3: 'present' }),
      createMockSession('s2', '2026-09-02', { a1: 'present', a2: 'present', a3: 'present' }),
      createMockSession('s3', '2026-09-03', { a1: 'present', a2: 'present', a3: 'present' }),
      createMockSession('s4', '2026-09-04', { a1: 'absent', a2: 'absent', a3: 'absent' })
    ];

    const result = calculateFourWeekAttendance([athA, athB, athC], sessions);

    // Все делят 1 место
    expect(result.every(r => r.rankNumber === 1)).toBe(true);

    // Вторичный тай-брейкер по алфавиту (Андреев -> Борисов -> Васильев)
    expect(result[0].athlete.fullName).toBe('Андреев Андрей');
    expect(result[1].athlete.fullName).toBe('Борисов Борис');
    expect(result[2].athlete.fullName).toBe('Васильев Василий');
  });

  it('3. Устойчивость к поврежденным тренировкам (null/undefined attendance)', () => {
    const ath = createMockAthlete('ath-1', 'Иван Иванов', 'Иван И.');
    const brokenSession = {
      id: 's-broken',
      groupId: 'grp-1',
      date: '2026-09-01',
      timeRange: '18:00',
      topic: 'Битый объект',
      isCompleted: true,
      plan: [],
      attendance: null as any,
      exceptions: null as any,
      notes: []
    } as TrainingSession;

    // Функция не должна выбросить TypeError при brokenSession.attendance === null
    expect(() => calculateFourWeekStats([ath], [brokenSession])).not.toThrow();
    const stats = calculateFourWeekStats([ath], [brokenSession]);
    expect(stats[0].unmarkedCount).toBe(1); // fallback to 'unmarked'
  });

  it('4. Обработка пустых массивов спортсменов и тренировок', () => {
    expect(calculateFourWeekAttendance([], [])).toEqual([]);
    const ath = createMockAthlete('ath-1', 'Иван Иванов', 'Иван И.');
    const emptyResult = calculateFourWeekAttendance([ath], []);
    expect(emptyResult.length).toBe(1);
    expect(emptyResult[0].effectiveBaseE).toBe(0);
    expect(emptyResult[0].ratePercent).toBe(0);
    expect(emptyResult[0].statusBadge).toBe('unranked');
  });

  it('5. Граничные случаи calculateSkillProgress (пустой массив, некорректные типы)', () => {
    const emptyProgress = calculateSkillProgress([]);
    expect(emptyProgress.totalChecks).toBe(3);
    expect(emptyProgress.successCount).toBe(0);
    expect(emptyProgress.status).toBe('failed');
    expect(emptyProgress.statusTitle).toBe('Требуется доработка');

    // undefined / null
    const nullProgress = calculateSkillProgress(undefined as any);
    expect(nullProgress.totalChecks).toBe(3);
    expect(nullProgress.successCount).toBe(0);
    expect(nullProgress.status).toBe('failed');

    // Обработка объектов с неизвестными значениями
    const checks = [
      { success: true },
      { success: null },
      { success: false }
    ];
    const progress = calculateSkillProgress(checks as any);
    expect(progress.totalChecks).toBe(3);
    expect(progress.successCount).toBe(1);
    expect(progress.status).toBe('in_progress');
    expect(progress.statusTitle).toBe('В процессе');
  });

  it('6. Устойчивость функций 152-ФЗ к null и undefined параметрам', () => {
    expect(isDocumentAccessibleForRole(null as any, 'admin')).toBe(false);
    expect(isDocumentAccessibleForRole(undefined as any, 'admin')).toBe(false);
    expect(filterDocumentsForRole(null as any, 'admin')).toEqual([]);
    expect(filterAthletesForRole(null as any, 'coach')).toEqual([]);
    expect(filterTasksForRole(null as any, 'coach')).toEqual([]);
  });

  it('7. Форматирование ФИО тренера и сопоставление с группами', () => {
    expect(getCoachShortName('Иванов Алексей Васильевич')).toBe('Иванов А. В.');
    expect(getCoachShortName('Петров Сергей Николаевич')).toBe('Петров С. Н.');
    expect(getCoachShortName('Сидоров Петр')).toBe('Сидоров П.');
    expect(getCoachShortName('')).toBe('');

    const coachIvanov = { fullName: 'Иванов Алексей Васильевич' };
    const coachPetrov = { fullName: 'Петров Сергей Николаевич' };

    expect(isCoachForGroup(coachIvanov, { coachName: 'Иванов А. В.' })).toBe(true);
    expect(isCoachForGroup(coachIvanov, { coachName: 'Иванов А.В.' })).toBe(true);
    expect(isCoachForGroup(coachIvanov, { coachName: 'Иванов Алексей Васильевич' })).toBe(true);
    expect(isCoachForGroup(coachIvanov, { coachName: 'Петров С. Н.' })).toBe(false);

    expect(isCoachForGroup(coachPetrov, { coachName: 'Петров С. Н.' })).toBe(true);
    expect(isCoachForGroup(coachPetrov, { coachName: 'Иванов А. В.' })).toBe(false);
  });

  it('8. Изоляция тренировок по группам в calculateFourWeekAttendance', () => {
    const athleteGrp1 = createMockAthlete('ath-1', 'Антон Кузнецов', 'Антон К.');
    athleteGrp1.groupId = 'grp-1';

    // 4 sessions in grp-1 (all present)
    const grp1Sessions: TrainingSession[] = [
      createMockSession('s1', '2026-09-10', { 'ath-1': 'present' }),
      createMockSession('s2', '2026-09-12', { 'ath-1': 'present' }),
      createMockSession('s3', '2026-09-15', { 'ath-1': 'present' }),
      createMockSession('s4', '2026-09-17', { 'ath-1': 'present' })
    ];

    // 2 sessions in grp-2 (where ath-1 is NOT marked)
    const grp2Sessions: TrainingSession[] = [
      { ...createMockSession('s5', '2026-09-20', {}), groupId: 'grp-2' },
      { ...createMockSession('s6', '2026-09-22', {}), groupId: 'grp-2' }
    ];

    // Combined sessions
    const allSessions = [...grp1Sessions, ...grp2Sessions];
    const results = calculateFourWeekAttendance([athleteGrp1], allSessions);
    const row = results[0];

    // ath-1 should only evaluate 4 sessions from grp-1, with 0 unmarked and 100% rate
    expect(row.totalSessions).toBe(4);
    expect(row.presentCount).toBe(4);
    expect(row.unmarkedCount).toBe(0);
    expect(row.isBlockedByUnmarked).toBe(false);
    expect(row.ratePercent).toBe(100);
    expect(row.statusBadge).toBe('ranked');
  });
});

describe('Контроль конфликтов расписания залов и совместного использования (checkScheduleConflict)', () => {
  it('1. parseTimeInterval корректно парсит различные форматы дефисов и пробелов', () => {
    expect(parseTimeInterval('18:00–19:30')).toEqual({ start: 1080, end: 1170 });
    expect(parseTimeInterval('18:00-19:30')).toEqual({ start: 1080, end: 1170 });
    expect(parseTimeInterval('18:00 — 19:30')).toEqual({ start: 1080, end: 1170 });
    expect(parseTimeInterval('18:00\u221219:30')).toEqual({ start: 1080, end: 1170 }); // unicode minus
    expect(parseTimeInterval('18.00–19.30')).toEqual({ start: 1080, end: 1170 }); // dot separator
    expect(parseTimeInterval('09.15 - 10.45')).toEqual({ start: 555, end: 645 });
    expect(parseTimeInterval(' 09:15 - 10:45 ')).toEqual({ start: 555, end: 645 });
    expect(parseTimeInterval('invalid')).toBeNull();
    expect(parseTimeInterval('')).toBeNull();
    expect(parseTimeInterval(null)).toBeNull();
    expect(parseTimeInterval(undefined)).toBeNull();
    expect(parseTimeInterval('20:00–19:00')).toBeNull(); // end before start
    expect(parseTimeInterval('18:00–18:00')).toBeNull(); // zero duration
    expect(parseTimeInterval('25:00–26:00')).toBeNull(); // invalid hours
    expect(parseTimeInterval('18:60–19:00')).toBeNull(); // invalid minutes
    expect(parseTimeInterval('18:00')).toBeNull(); // missing end
    expect(parseTimeInterval('18:00 - 19:00 - 20:00')).toBeNull(); // too many parts
  });

  it('2. canonicalizeDay корректно нормализует русские и английские дни недели, а также сокращения с точками', () => {
    expect(canonicalizeDay('Понедельник')).toBe('понедельник');
    expect(canonicalizeDay('пн')).toBe('понедельник');
    expect(canonicalizeDay('пн.')).toBe('понедельник');
    expect(canonicalizeDay('Mon')).toBe('понедельник');
    expect(canonicalizeDay('monday')).toBe('понедельник');
    expect(canonicalizeDay('Сб')).toBe('суббота');
    expect(canonicalizeDay('sat')).toBe('суббота');
    expect(canonicalizeDay('saturday')).toBe('суббота');
    expect(canonicalizeDay(null)).toBe('');
    expect(canonicalizeDay(undefined)).toBe('');
    expect(canonicalizeDay('')).toBe('');
  });

  it('3. canonicalizeHall корректно нормализует залы клуба и альтернативные обозначения', () => {
    expect(canonicalizeHall('Зал самбо №1')).toBe('зал 1');
    expect(canonicalizeHall('Зал 1')).toBe('зал 1');
    expect(canonicalizeHall('Первый зал')).toBe('зал 1');
    expect(canonicalizeHall('Основной ковёр')).toBe('зал 1');
    expect(canonicalizeHall('Зал самбо №2 (ОФП)')).toBe('зал 2');
    expect(canonicalizeHall('Зал 2')).toBe('зал 2');
    expect(canonicalizeHall('Зал ОФП')).toBe('зал 2');
    expect(canonicalizeHall('Второй зал')).toBe('зал 2');
    expect(canonicalizeHall('Зал №10')).toBe('зал №10');
    expect(canonicalizeHall('Зал №20')).toBe('зал №20');
    expect(canonicalizeHall(null)).toBe('');
    expect(canonicalizeHall(undefined)).toBe('');
  });

  const existingSlots: ScheduleSlot[] = [
    {
      id: 'slot-1',
      day: 'Понедельник',
      time: '17:30–19:00',
      hall: 'Зал самбо №1',
      sport: 'karate',
      sportLabel: 'Карате Кёкусинкай',
      coach: 'Васильев К. М.',
      group: 'Карате (Юноши, Кёкусинкай)'
    },
    {
      id: 'slot-2',
      day: 'Понедельник',
      time: '19:15–21:00',
      hall: 'Зал самбо №1',
      sport: 'sambo',
      sportLabel: 'Самбо',
      coach: 'Иванов А. В.',
      group: 'Группа 3'
    },
    {
      id: 'slot-3',
      day: 'Суббота',
      time: '10:00–11:30',
      hall: 'Зал самбо №2 (ОФП)',
      sport: 'fitness',
      sportLabel: 'ОФП и акробатика',
      coach: 'Иванов А. В.',
      group: 'Группа 1 (ОФП)'
    }
  ];

  it('4. Смежные слоты без наложения не вызывают конфликт (handover time 19:00 и 19:00)', () => {
    // 17:30–19:00 заканчивается в 19:00, кандидат начинается ровно в 19:00
    const res = checkScheduleConflict(existingSlots, {
      day: 'Понедельник',
      time: '19:00–19:15',
      hall: 'Зал самбо №1'
    });
    expect(res.hasConflict).toBe(false);

    // Слот перед slot-1: 16:00–17:30 заканчивается ровно в 17:30, когда начинается slot-1
    const res2 = checkScheduleConflict(existingSlots, {
      day: 'Понедельник',
      time: '16:00–17:30',
      hall: 'Зал самбо №1'
    });
    expect(res2.hasConflict).toBe(false);
  });

  it('5. Пересечение даже в 1 минуту вызывает конфликт', () => {
    // 18:59–19:30 пересекается со slot-1 на 1 минуту (18:59-19:00)
    const res1 = checkScheduleConflict(existingSlots, {
      day: 'Понедельник',
      time: '18:59–19:30',
      hall: 'Зал самбо №1'
    });
    expect(res1.hasConflict).toBe(true);
    expect(res1.conflictingSlot?.id).toBe('slot-1');

    // 17:00–17:31 пересекается со slot-1 на 1 минуту (17:30-17:31)
    const res2 = checkScheduleConflict(existingSlots, {
      day: 'Понедельник',
      time: '17:00–17:31',
      hall: 'Зал самбо №1'
    });
    expect(res2.hasConflict).toBe(true);
    expect(res2.conflictingSlot?.id).toBe('slot-1');
  });

  it('6. Прямое пересечение времени в одном зале и в один день вызывает конфликт', () => {
    // 18:00–19:30 пересекается со slot-1 (17:30–19:00)
    const res = checkScheduleConflict(existingSlots, {
      day: 'Понедельник',
      time: '18:00–19:30',
      hall: 'Зал самбо №1'
    });
    expect(res.hasConflict).toBe(true);
    expect(res.conflictingSlot?.id).toBe('slot-1');
    expect(res.message).toContain('Карате');
    expect(res.message).toContain('Васильев К. М.');
  });

  it('7. Полное поглощение интервала вызывает конфликт', () => {
    // 17:00–21:30 поглощает и slot-1 и slot-2
    const res = checkScheduleConflict(existingSlots, {
      day: 'Понедельник',
      time: '17:00–21:30',
      hall: 'Зал самбо №1'
    });
    expect(res.hasConflict).toBe(true);
    expect(res.conflictingSlot?.id).toBe('slot-1');
  });

  it('8. Кандидат целиком внутри существующего слота вызывает конфликт', () => {
    // 18:00–18:30 внутри slot-1 (17:30–19:00)
    const res = checkScheduleConflict(existingSlots, {
      day: 'Понедельник',
      time: '18:00–18:30',
      hall: 'Зал самбо №1'
    });
    expect(res.hasConflict).toBe(true);
    expect(res.conflictingSlot?.id).toBe('slot-1');
  });

  it('9. Разные залы в одно и то же время не вызывают конфликт', () => {
    // Понедельник 17:30–19:00, но в Зале №2
    const res = checkScheduleConflict(existingSlots, {
      day: 'Понедельник',
      time: '17:30–19:00',
      hall: 'Зал самбо №2'
    });
    expect(res.hasConflict).toBe(false);
  });

  it('10. Разные дни недели не вызывают конфликт', () => {
    // Вторник 17:30–19:00 в Зале №1
    const res = checkScheduleConflict(existingSlots, {
      day: 'Вторник',
      time: '17:30–19:00',
      hall: 'Зал самбо №1'
    });
    expect(res.hasConflict).toBe(false);
  });

  it('11. При редактировании собственный слот исключается из проверки конфликта', () => {
    // Редактируем slot-1 (17:30–19:00) с тем же временем и залом
    const res = checkScheduleConflict(existingSlots, {
      id: 'slot-1',
      day: 'Понедельник',
      time: '17:30–19:00',
      hall: 'Зал самбо №1'
    });
    expect(res.hasConflict).toBe(false);
  });

  it('12. Поддержка сокращенного названия дня (Пн) и нормализации залов', () => {
    const res = checkScheduleConflict(existingSlots, {
      day: 'Пн',
      time: '18:15–18:45',
      hall: 'Зал самбо № 1'
    });
    expect(res.hasConflict).toBe(true);
    expect(res.conflictingSlot?.id).toBe('slot-1');
  });

  it('13. Корректное сопоставление Зала №2 (ОФП) и Зала №2 / Зала ОФП', () => {
    const res1 = checkScheduleConflict(existingSlots, {
      day: 'Суббота',
      time: '10:30–12:00',
      hall: 'Зал самбо №2'
    });
    expect(res1.hasConflict).toBe(true);
    expect(res1.conflictingSlot?.id).toBe('slot-3');

    const res2 = checkScheduleConflict(existingSlots, {
      day: 'Суббота',
      time: '10:30–12:00',
      hall: 'Зал ОФП'
    });
    expect(res2.hasConflict).toBe(true);
    expect(res2.conflictingSlot?.id).toBe('slot-3');
  });

  it('14. Null safety: checkScheduleConflict не падает при некорректных входных данных', () => {
    expect(checkScheduleConflict([], { day: 'Пн', time: '18:00–19:00', hall: 'Зал 1' })).toEqual({ hasConflict: false });
    expect(checkScheduleConflict(null as any, { day: 'Пн', time: '18:00–19:00', hall: 'Зал 1' })).toEqual({ hasConflict: false });
    expect(checkScheduleConflict(undefined as any, { day: 'Пн', time: '18:00–19:00', hall: 'Зал 1' })).toEqual({ hasConflict: false });
    expect(checkScheduleConflict(existingSlots, null as any)).toEqual({ hasConflict: false });
    expect(checkScheduleConflict(existingSlots, { day: '', time: '', hall: '' })).toEqual({ hasConflict: false });
    expect(checkScheduleConflict(existingSlots, { day: 'Пн', time: 'invalid', hall: 'Зал 1' })).toEqual({ hasConflict: false });
  });
});

describe('Назначение тренера на слот расписания (isCoachForSlot) и динамическая дата getTodayDate', () => {
  const coach = { fullName: 'Иванов Алексей Васильевич' };

  it('1. Корректно определяет принадлежность слота тренеру по ФИО, инициалам или фамилии', () => {
    const slotFull: ScheduleSlot = {
      id: 's-1',
      day: 'Понедельник',
      time: '18:00–19:30',
      hall: 'Зал 1',
      sport: 'sambo',
      coach: 'Иванов Алексей Васильевич',
      group: 'Группа 1'
    };
    expect(isCoachForSlot(coach, slotFull)).toBe(true);

    const slotShort: ScheduleSlot = {
      ...slotFull,
      coach: 'Иванов А. В.'
    };
    expect(isCoachForSlot(coach, slotShort)).toBe(true);

    const slotNoSpace: ScheduleSlot = {
      ...slotFull,
      coach: 'Иванов А.В.'
    };
    expect(isCoachForSlot(coach, slotNoSpace)).toBe(true);

    const slotSurnameOnly: ScheduleSlot = {
      ...slotFull,
      coach: 'Иванов'
    };
    expect(isCoachForSlot(coach, slotSurnameOnly)).toBe(true);

    const slotOther: ScheduleSlot = {
      ...slotFull,
      coach: 'Петров С. Н.'
    };
    expect(isCoachForSlot(coach, slotOther)).toBe(false);
  });

  it('2. Безопасен при передаче undefined или null значений в isCoachForSlot', () => {
    expect(isCoachForSlot(null, null)).toBe(false);
    expect(isCoachForSlot(coach, null)).toBe(false);
    expect(isCoachForSlot(null, { id: 's-1', day: 'Пн', time: '10:00', hall: '1', sport: 'sambo', coach: 'Иванов А. В.', group: 'Г1' })).toBe(false);
    expect(isCoachForSlot({ fullName: '' }, { id: 's-1', day: 'Пн', time: '10:00', hall: '1', sport: 'sambo', coach: 'Иванов А. В.', group: 'Г1' })).toBe(false);
    expect(isCoachForSlot(coach, { id: 's-1', day: 'Пн', time: '10:00', hall: '1', sport: 'sambo', coach: '', group: 'Г1' })).toBe(false);
  });

  it('3. Экспортирует getTodayDate и использует динамическую дату как fallback в getDaysUntilExpiry', () => {
    const today = getTodayDate();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // Document expiring far in the future
    const futureDocDate = '2099-12-31';
    const daysUntil = getDaysUntilExpiry(futureDocDate);
    expect(daysUntil).toBeGreaterThan(14);
    expect(getDocumentStatus(futureDocDate)).toBe('valid');
    expect(getDocumentExpiryStatus(futureDocDate)).toBe('valid');

    // Document expired long ago
    const pastDocDate = '2000-01-01';
    expect(getDaysUntilExpiry(pastDocDate)!).toBeLessThan(0);
    expect(getDocumentStatus(pastDocDate)).toBe('expired');
    expect(getDocumentExpiryStatus(pastDocDate)).toBe('expired');
  });

  it('4. parseTimeInterval парсит различные виды тире одинаково (en-dash, em-dash, hyphen)', () => {
    const enDash = parseTimeInterval('18:00–19:30');
    const emDash = parseTimeInterval('18:00—19:30');
    const hyphen = parseTimeInterval('18:00-19:30');
    const spaces = parseTimeInterval('18:00 - 19:30');

    expect(enDash).toEqual({ start: 1080, end: 1170 });
    expect(emDash).toEqual({ start: 1080, end: 1170 });
    expect(hyphen).toEqual({ start: 1080, end: 1170 });
    expect(spaces).toEqual({ start: 1080, end: 1170 });
  });
});


