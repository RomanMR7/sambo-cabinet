import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Trophy, Save, AlertCircle } from 'lucide-react';
import { DocType } from '../../types';

interface Props {
  onClose: () => void;
  onSaved?: () => void;
}

export const AddCompetitionModal: React.FC<Props> = ({ onClose, onSaved }) => {
  const { addCompetition, athletes } = useApp();

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('2026-11-15');
  const [endDate, setEndDate] = useState('2026-11-16');
  const [location, setLocation] = useState('Дворец спорта «Самбо-70», Москва');
  const [selectedAthleteId, setSelectedAthleteId] = useState(athletes[0]?.id || 'ath-1');
  const [category, setCategory] = useState('Юноши до 42 кг');
  const [nextGoal, setNextGoal] = useState('Выход в полуфинал, чистый бросок через бедро');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const validate = (): string | null => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || trimmedTitle.length < 3) {
      return 'Укажите название соревнования (не менее 3 символов).';
    }

    if (!startDate) {
      return 'Укажите дату начала соревнований.';
    }

    if (!endDate) {
      return 'Укажите дату окончания соревнований.';
    }

    if (endDate < startDate) {
      return 'Дата окончания соревнования не может быть раньше даты начала.';
    }

    const trimmedLocation = location.trim();
    if (!trimmedLocation || trimmedLocation.length < 3) {
      return 'Укажите место проведения соревнований.';
    }

    if (!selectedAthleteId) {
      return 'Выберите первого заявленного спортсмена.';
    }

    if (!category.trim()) {
      return 'Укажите весовую категорию участника.';
    }

    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setErrorMsg(err);
      return;
    }

    addCompetition({
      title: title.trim(),
      date: startDate,
      endDate: endDate || startDate,
      location: location.trim(),
      requiredDocuments: ['medical', 'insurance', 'consent'] as DocType[],
      participants: [
        {
          athleteId: selectedAthleteId,
          category: category.trim(),
          admissionDecision: 'pending',
          nextGoal: nextGoal.trim() || undefined
        }
      ]
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
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Добавить соревнование</h3>
              <p className="text-xs text-slate-400">Календарный план и допуск</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Error Banner */}
        {errorMsg && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-start gap-2.5 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Название турнира *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => {
                setTitle(e.target.value);
                setErrorMsg(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              placeholder="Кубок федерации самбо"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Дата начала *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  setErrorMsg(null);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Дата окончания *
              </label>
              <input
                type="date"
                required
                min={startDate}
                value={endDate}
                onChange={e => {
                  setEndDate(e.target.value);
                  setErrorMsg(null);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Место проведения *
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={e => {
                setLocation(e.target.value);
                setErrorMsg(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              placeholder="Москва, ДС Самбо-70"
            />
          </div>

          <div className="pt-2 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Первый заявленный участник
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Спортсмен *
                </label>
                <select
                  value={selectedAthleteId}
                  onChange={e => {
                    setSelectedAthleteId(e.target.value);
                    setErrorMsg(null);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white"
                >
                  {athletes.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.shortName} ({a.fullName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Весовая категория *
                </label>
                <input
                  type="text"
                  required
                  value={category}
                  onChange={e => {
                    setCategory(e.target.value);
                    setErrorMsg(null);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  placeholder="Юноши до 42 кг"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Индивидуальная цель на турнир
              </label>
              <input
                type="text"
                value={nextGoal}
                onChange={e => setNextGoal(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                placeholder="Выход в финальную часть, броски с колен"
              />
            </div>
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
              <span>Сохранить турнир</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
