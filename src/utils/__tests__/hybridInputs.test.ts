import { describe, it, expect } from 'vitest';
import {
  PRESET_SCHEDULE_TIMES,
  PRESET_SCHEDULE_NOTES,
  autoLinkScheduleByGroup
} from '../../components/modals/EditScheduleSlotModal';
import {
  PRESET_COMPETITION_LOCATIONS,
  PRESET_WEIGHT_CATEGORIES
} from '../../components/modals/AddCompetitionModal';
import {
  PRESET_TRAINING_TIMES,
  PRESET_TRAINING_TOPICS
} from '../../views/coach/TrainingPlansView';
import { checkScheduleConflict } from '../rules';
import { ScheduleSlot } from '../../types';

describe('Hybrid Input Presets and Auto-linking', () => {
  describe('EditScheduleSlotModal presets & auto-linking', () => {
    it('contains all required schedule time interval presets', () => {
      expect(PRESET_SCHEDULE_TIMES).toContain('17:00–18:30');
      expect(PRESET_SCHEDULE_TIMES).toContain('17:30–19:00');
      expect(PRESET_SCHEDULE_TIMES).toContain('18:00–19:00');
      expect(PRESET_SCHEDULE_TIMES).toContain('18:45–20:30');
      expect(PRESET_SCHEDULE_TIMES).toContain('19:15–20:45');
      expect(PRESET_SCHEDULE_TIMES).toContain('10:00–11:30');
      expect(PRESET_SCHEDULE_TIMES).toContain('12:00–14:00');
      expect(PRESET_SCHEDULE_TIMES.length).toBe(7);
    });

    it('contains all required schedule note presets', () => {
      expect(PRESET_SCHEDULE_NOTES).toContain('Техника в стойке и броски');
      expect(PRESET_SCHEDULE_NOTES).toContain('Борьба в партере и болевые');
      expect(PRESET_SCHEDULE_NOTES).toContain('Спарринги и схватки');
      expect(PRESET_SCHEDULE_NOTES).toContain('Ката и кихон');
      expect(PRESET_SCHEDULE_NOTES).toContain('Круговая ОФП');
      expect(PRESET_SCHEDULE_NOTES).toContain('День борьбы');
      expect(PRESET_SCHEDULE_NOTES.length).toBe(6);
    });

    it('auto-links «Группа 2» to coach Petrov, discipline sambo, hall Зал самбо №1', () => {
      const result = autoLinkScheduleByGroup('Группа 2');
      expect(result.group).toBe('Группа 2');
      expect(result.coach).toBe('Петров С. Н.');
      expect(result.sport).toBe('sambo');
      expect(result.sportLabel).toBe('Самбо');
      expect(result.hall).toBe('Зал самбо №1');
    });

    it('auto-links «Группа 1» and «Группа 3» to coach Ivanov, discipline sambo', () => {
      const res1 = autoLinkScheduleByGroup('Группа 1');
      expect(res1.coach).toBe('Иванов А. В.');
      expect(res1.sport).toBe('sambo');
      expect(res1.sportLabel).toBe('Самбо');

      const res3 = autoLinkScheduleByGroup('Группа 3');
      expect(res3.coach).toBe('Иванов А. В.');
      expect(res3.sport).toBe('sambo');
      expect(res3.sportLabel).toBe('Самбо');
    });

    it('auto-links karate presets to coach Vasilyev, discipline karate', () => {
      const resKarateYouth = autoLinkScheduleByGroup('Карате (Юноши, Кёкусинкай)');
      expect(resKarateYouth.coach).toBe('Васильев К. М.');
      expect(resKarateYouth.sport).toBe('karate');
      expect(resKarateYouth.sportLabel).toBe('Карате Кёкусинкай');

      const resKarateAdults = autoLinkScheduleByGroup('Карате (Взрослые, ката и кумитэ)');
      expect(resKarateAdults.coach).toBe('Васильев К. М.');
      expect(resKarateAdults.sport).toBe('karate');
      expect(resKarateAdults.sportLabel).toBe('Карате Кёкусинкай');
    });

    it('auto-links OFP preset to discipline fitness and hall Зал самбо №2 (ОФП)', () => {
      const resOfp = autoLinkScheduleByGroup('Группа 1 (ОФП)');
      expect(resOfp.sport).toBe('fitness');
      expect(resOfp.sportLabel).toBe('ОФП и акробатика');
      expect(resOfp.hall).toBe('Зал самбо №2 (ОФП)');
    });

    it('auto-links open mat / day of wrestling preset', () => {
      const resOpenMat = autoLinkScheduleByGroup('Открытый ковёр / День борьбы');
      expect(resOpenMat.sport).toBe('sambo');
      expect(resOpenMat.sportLabel).toBe('Самбо');
      expect(resOpenMat.hall).toBe('Зал самбо №1');
    });

    it('supports registered custom groups from groups list', () => {
      const customGroups = [
        { name: 'Группа Ветеранов', coachName: 'Сидоров Иван Петрович' }
      ];
      const resCustom = autoLinkScheduleByGroup('Группа Ветеранов', 'Иванов А. В.', customGroups);
      expect(resCustom.group).toBe('Группа Ветеранов');
      expect(resCustom.coach).toBe('Сидоров И. П.');
    });

    it('supports arbitrary free-text group input without errors', () => {
      const resFree = autoLinkScheduleByGroup('Секция бокса для взрослых');
      expect(resFree.group).toBe('Секция бокса для взрослых');
    });

    it('handles null, undefined, whitespace, and empty inputs with full null safety', () => {
      expect(autoLinkScheduleByGroup(undefined)).toEqual({ group: '' });
      expect(autoLinkScheduleByGroup(null)).toEqual({ group: '' });
      expect(autoLinkScheduleByGroup('')).toEqual({ group: '' });
      expect(autoLinkScheduleByGroup('   ')).toEqual({ group: '' });
      expect(autoLinkScheduleByGroup('\t\n')).toEqual({ group: '' });
    });

    it('does not falsely auto-link «Группа 10» or «Группа 20» to Group 1 or 2 presets', () => {
      const resG10 = autoLinkScheduleByGroup('Группа 10');
      expect(resG10.group).toBe('Группа 10');
      expect(resG10.coach).toBeUndefined();
      expect(resG10.sport).toBeUndefined();

      const resG20 = autoLinkScheduleByGroup('Группа 20');
      expect(resG20.group).toBe('Группа 20');
      expect(resG20.coach).toBeUndefined();
      expect(resG20.sport).toBeUndefined();
    });

    it('prioritizes registered club group coach over default fallbacks', () => {
      const customGroups = [
        { name: 'Группа 1 (Начальная подготовка)', coachName: 'Сидоров И. П.' }
      ];
      const res = autoLinkScheduleByGroup('Группа 1 (Начальная подготовка)', 'Иванов А. В.', customGroups);
      expect(res.group).toBe('Группа 1 (Начальная подготовка)');
      expect(res.coach).toBe('Сидоров И. П.');
      expect(res.sport).toBe('sambo');
    });

    it('safely handles malformed groups arrays with nulls or missing names', () => {
      const malformedGroups = [
        null as any,
        undefined as any,
        {} as any,
        { name: null as any },
        { name: 'Группа Ветеранов', coachName: 'Смирнов А. А.' }
      ];
      expect(() => autoLinkScheduleByGroup('Группа Ветеранов', 'Иванов А. В.', malformedGroups)).not.toThrow();
      const res = autoLinkScheduleByGroup('Группа Ветеранов', 'Иванов А. В.', malformedGroups);
      expect(res.group).toBe('Группа Ветеранов');
      expect(res.coach).toBe('Смирнов А. А.');
    });

    it('auto-links full descriptive names for Sambo groups', () => {
      const resG2 = autoLinkScheduleByGroup('Группа 2 (Учебно-тренировочная)');
      expect(resG2.group).toBe('Группа 2 (Учебно-тренировочная)');
      expect(resG2.coach).toBe('Петров С. Н.');
      expect(resG2.sport).toBe('sambo');
      expect(resG2.sportLabel).toBe('Самбо');
      expect(resG2.hall).toBe('Зал самбо №1');

      const resG1 = autoLinkScheduleByGroup('Группа 1 (Начальная подготовка)');
      expect(resG1.group).toBe('Группа 1 (Начальная подготовка)');
      expect(resG1.coach).toBe('Иванов А. В.');
      expect(resG1.sport).toBe('sambo');
      expect(resG1.sportLabel).toBe('Самбо');
      expect(resG1.hall).toBe('Зал самбо №1');

      const resG3 = autoLinkScheduleByGroup('Группа 3 (Спортивное совершенствование)');
      expect(resG3.group).toBe('Группа 3 (Спортивное совершенствование)');
      expect(resG3.coach).toBe('Иванов А. В.');
      expect(resG3.sport).toBe('sambo');
      expect(resG3.sportLabel).toBe('Самбо');
      expect(resG3.hall).toBe('Зал самбо №1');
    });

    it('detects and resolves conflicts dynamically when switching time and hall/group presets', () => {
      const existingSlots: ScheduleSlot[] = [
        {
          id: 'slot-existing-1',
          day: 'Понедельник',
          time: '18:00–19:30',
          hall: 'Зал самбо №1',
          sport: 'sambo',
          sportLabel: 'Самбо',
          coach: 'Иванов А. В.',
          group: 'Группа 1',
          colorTheme: 'red'
        }
      ];

      // 1. Same time and hall -> conflict detected
      const conflictResult1 = checkScheduleConflict(existingSlots, {
        day: 'Понедельник',
        time: '18:00–19:30',
        hall: 'Зал самбо №1'
      });
      expect(conflictResult1.hasConflict).toBe(true);

      // 1b. Same time with ASCII hyphen and dot separator -> still detects conflict
      const conflictResultHyphen = checkScheduleConflict(existingSlots, {
        day: 'Понедельник',
        time: '18.00 - 19.30',
        hall: 'Зал 1' // canonical alias for Зал самбо №1
      });
      expect(conflictResultHyphen.hasConflict).toBe(true);

      // 2. Switching to non-overlapping time preset -> conflict resolved
      const conflictResult2 = checkScheduleConflict(existingSlots, {
        day: 'Понедельник',
        time: '10:00–11:30',
        hall: 'Зал самбо №1'
      });
      expect(conflictResult2.hasConflict).toBe(false);

      // 3. Switching group to OFP (auto-linked to Зал самбо №2) -> conflict resolved
      const ofpLink = autoLinkScheduleByGroup('Группа 1 (ОФП)');
      const conflictResult3 = checkScheduleConflict(existingSlots, {
        day: 'Понедельник',
        time: '18:00–19:30',
        hall: ofpLink.hall || 'Зал самбо №2 (ОФП)'
      });
      expect(conflictResult3.hasConflict).toBe(false);
    });
  });

  describe('AddCompetitionModal presets', () => {
    it('contains all official VFS sambo weight categories', () => {
      expect(PRESET_WEIGHT_CATEGORIES).toContain('до 35 кг');
      expect(PRESET_WEIGHT_CATEGORIES).toContain('до 38 кг');
      expect(PRESET_WEIGHT_CATEGORIES).toContain('до 42 кг');
      expect(PRESET_WEIGHT_CATEGORIES).toContain('до 46 кг');
      expect(PRESET_WEIGHT_CATEGORIES).toContain('до 50 кг');
      expect(PRESET_WEIGHT_CATEGORIES).toContain('до 54 кг');
      expect(PRESET_WEIGHT_CATEGORIES).toContain('до 59 кг');
      expect(PRESET_WEIGHT_CATEGORIES).toContain('до 65 кг');
      expect(PRESET_WEIGHT_CATEGORIES).toContain('свыше 71 кг');
      expect(PRESET_WEIGHT_CATEGORIES.length).toBe(9);
    });

    it('contains all standard competition location presets', () => {
      expect(PRESET_COMPETITION_LOCATIONS).toContain('Дворец спорта «Самбо-70», Москва');
      expect(PRESET_COMPETITION_LOCATIONS).toContain('СК «Олимпийская деревня-80»');
      expect(PRESET_COMPETITION_LOCATIONS).toContain('ФОК «Торпедо», Москва');
      expect(PRESET_COMPETITION_LOCATIONS).toContain('Зал самбо №1 клуба');
      expect(PRESET_COMPETITION_LOCATIONS.length).toBe(4);
    });
  });

  describe('TrainingPlansView presets', () => {
    it('contains all typical training plan topics', () => {
      expect(PRESET_TRAINING_TOPICS).toContain('Броски через спину и бедро');
      expect(PRESET_TRAINING_TOPICS).toContain('Борьба в партере: болевые и удержания');
      expect(PRESET_TRAINING_TOPICS).toContain('Подсечки и зацепы');
      expect(PRESET_TRAINING_TOPICS).toContain('Учебные схватки в стойке');
      expect(PRESET_TRAINING_TOPICS).toContain('Акробатика и самостраховка');
      expect(PRESET_TRAINING_TOPICS.length).toBe(5);
    });

    it('contains all typical training time presets', () => {
      expect(PRESET_TRAINING_TIMES).toContain('17:00–18:30');
      expect(PRESET_TRAINING_TIMES).toContain('18:00–19:00');
      expect(PRESET_TRAINING_TIMES).toContain('19:00–21:00');
      expect(PRESET_TRAINING_TIMES.length).toBe(3);
    });
  });
});
