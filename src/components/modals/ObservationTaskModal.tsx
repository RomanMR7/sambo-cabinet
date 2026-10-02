import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Award, CheckCircle } from 'lucide-react';

interface Props {
  athleteId: string;
  onClose: () => void;
}

export const ObservationTaskModal: React.FC<Props> = ({ athleteId, onClose }) => {
  const { athletes, skills, addObservationTask } = useApp();

  const [selectedAthleteId, setSelectedAthleteId] = useState(athleteId);
  const [observation, setObservation] = useState('При входе в захват теряет устойчивость опорной ноги');
  const [selectedSkillId, setSelectedSkillId] = useState(skills[0]?.id || 'sk-1');
  const selectedSkill = skills.find(s => s.id === selectedSkillId);
  const [exerciseTitle, setExerciseTitle] = useState(selectedSkill?.recommendedExercise || '');
  const [deadline, setDeadline] = useState('2026-10-12');
  const [publishedToFamily, setPublishedToFamily] = useState(true);

  const handleSkillChange = (newSkillId: string) => {
    setSelectedSkillId(newSkillId);
    const skill = skills.find(s => s.id === newSkillId);
    if (skill) {
      setExerciseTitle(skill.recommendedExercise);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSkill) return;

    addObservationTask({
      athleteId: selectedAthleteId,
      observation,
      skillId: selectedSkillId,
      skillTitle: selectedSkill.title,
      exerciseTitle: exerciseTitle || selectedSkill.recommendedExercise,
      deadline,
      status: 'active',
      publishedToFamily,
      coachFeedback: undefined
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center text-white">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Цепочка развития: Наблюдение → Задача</h3>
              <p className="text-xs text-slate-300">
                Фиксация методического задания спортсмену
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps visual flow */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] font-semibold text-slate-500 overflow-x-auto">
          <span className="text-red-600 font-bold">1. Наблюдение</span>
          <span>→</span>
          <span className="text-red-600 font-bold">2. Навык</span>
          <span>→</span>
          <span className="text-red-600 font-bold">3. Упражнение</span>
          <span>→</span>
          <span className="text-red-600 font-bold">4. Контроль</span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Спортсмен
            </label>
            <select
              value={selectedAthleteId}
              onChange={e => setSelectedAthleteId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-medium"
            >
              {athletes.map(a => (
                <option key={a.id} value={a.id}>
                  {a.shortName} ({a.fullName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              1. Наблюдение тренера в схватке / упражнении *
            </label>
            <textarea
              rows={2}
              value={observation}
              onChange={e => setObservation(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              placeholder="Что заметил тренер на татами..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              2. Навык из каталога самбо *
            </label>
            <select
              value={selectedSkillId}
              onChange={e => handleSkillChange(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-medium"
            >
              {skills.map(s => (
                <option key={s.id} value={s.id}>
                  [{s.category}] {s.title}
                </option>
              ))}
            </select>
            {selectedSkill && (
              <div className="mt-1 text-xs text-slate-500 italic">
                Критерий оценки: {selectedSkill.criteria}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              3. Рекомендуемое упражнение / задание *
            </label>
            <input
              type="text"
              value={exerciseTitle}
              onChange={e => setExerciseTitle(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                4. Срок контроля (дедлайн)
              </label>
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={publishedToFamily}
                  onChange={e => setPublishedToFamily(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                />
                <span>Опубликовать родителям и спортсмену</span>
              </label>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white shadow transition flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Создать задачу</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
