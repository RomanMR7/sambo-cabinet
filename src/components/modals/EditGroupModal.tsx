import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Settings, Save } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSaved?: () => void;
}

export const EditGroupModal: React.FC<Props> = ({ onClose, onSaved }) => {
  const { groupInfo, updateGroupInfo } = useApp();

  const [name, setName] = useState(groupInfo.name);
  const [coachName, setCoachName] = useState(groupInfo.coachName);
  const [schedule, setSchedule] = useState(groupInfo.schedule);
  const [athleteCount, setAthleteCount] = useState(groupInfo.athleteCount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateGroupInfo({
      name: name.trim(),
      coachName: coachName.trim(),
      schedule: schedule.trim(),
      athleteCount: Number(athleteCount) || 24
    });

    if (onSaved) onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Настройки группы</h3>
              <p className="text-xs text-slate-400">Организационные параметры</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Название группы *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              placeholder="Группа начальной подготовки 1"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Назначенный тренер *
            </label>
            <input
              type="text"
              required
              value={coachName}
              onChange={e => setCoachName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              placeholder="Иванов А. В."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Расписание занятий
            </label>
            <input
              type="text"
              required
              value={schedule}
              onChange={e => setSchedule(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-mono"
              placeholder="Вт, Чт 18:00–19:00"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Лимит / Количество спортсменов
            </label>
            <input
              type="number"
              min="1"
              max="100"
              required
              value={athleteCount}
              onChange={e => setAthleteCount(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-900/20 transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Сохранить параметры</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
