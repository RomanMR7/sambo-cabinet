import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Trophy, Save, AlertCircle, Users } from 'lucide-react';
import { DocType } from '../../types';

interface Props {
  onClose: () => void;
  onSaved?: () => void;
}

export const PRESET_COMPETITION_LOCATIONS = [
  'Дворец спорта «Самбо-70», Москва',
  'СК «Олимпийская деревня-80»',
  'ФОК «Торпедо», Москва',
  'Зал самбо №1 клуба'
];

export const PRESET_WEIGHT_CATEGORIES = [
  'до 35 кг',
  'до 38 кг',
  'до 42 кг',
  'до 46 кг',
  'до 50 кг',
  'до 54 кг',
  'до 59 кг',
  'до 65 кг',
  'свыше 71 кг'
];

export const AddCompetitionModal: React.FC<Props> = ({ onClose, onSaved }) => {
  const { addCompetition, athletes } = useApp();

  const activeAthletes = athletes.filter(a => a && a.isActive);

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('2026-11-15');
  const [endDate, setEndDate] = useState('2026-11-16');
  const [location, setLocation] = useState('Дворец спорта «Самбо-70», Москва');
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<string[]>(
    activeAthletes.length > 0 ? [activeAthletes[0].id] : []
  );
  const [category, setCategory] = useState('Юноши до 42 кг');
  const [nextGoal, setNextGoal] = useState('Выход в полуфинал, чистый бросок через бедро');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isSubmitting]);

  const handleToggleAthlete = (id: string) => {
    setSelectedAthleteIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
    setErrorMsg(null);
  };

  const handleSelectAll = () => {
    if (selectedAthleteIds.length === activeAthletes.length) {
      setSelectedAthleteIds([]);
    } else {
      setSelectedAthleteIds(activeAthletes.map(a => a.id));
    }
    setErrorMsg(null);
  };

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

    if (selectedAthleteIds.length === 0) {
      return 'Выберите хотя бы одного спортсмена для участия в турнире.';
    }

    if (!category.trim()) {
      return 'Укажите весовую категорию участников.';
    }

    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const err = validate();
    if (err) {
      setErrorMsg(err);
      return;
    }

    setIsSubmitting(true);
    try {
      addCompetition({
        title: title.trim(),
        date: startDate,
        endDate: endDate || startDate,
        location: location.trim(),
        requiredDocuments: ['medical', 'insurance', 'consent'] as DocType[],
        participants: selectedAthleteIds.map(athId => ({
          athleteId: athId,
          category: category.trim(),
          admissionDecision: 'pending',
          nextGoal: nextGoal.trim() || undefined
        }))
      });

      if (onSaved) onSaved();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={e => {
        if (!isSubmitting && e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Добавить соревнование</h3>
              <p className="text-xs text-slate-400">Календарный план и заявка команды</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Закрыть модальное окно"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Error Banner */}
        {errorMsg && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-start gap-2.5 text-xs text-red-800 shrink-0">
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
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {PRESET_COMPETITION_LOCATIONS.map(loc => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => {
                    setLocation(loc);
                    setErrorMsg(null);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition border ${
                    location.trim() === loc.trim()
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
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
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-red-600" />
                <span>Заявленные участники ({selectedAthleteIds.length} выбрано) *</span>
              </h4>
              {activeAthletes.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs font-semibold text-red-600 hover:text-red-700"
                >
                  {selectedAthleteIds.length === activeAthletes.length
                    ? 'Снять выбор'
                    : 'Выбрать всех'}
                </button>
              )}
            </div>

            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-44 overflow-y-auto p-1 bg-slate-50/50 mb-3">
              {activeAthletes.map(a => {
                const isChecked = selectedAthleteIds.includes(a.id);
                return (
                  <div
                    key={a.id}
                    onClick={() => handleToggleAthlete(a.id)}
                    className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition select-none"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      readOnly
                      className="w-4 h-4 rounded text-red-600 focus:ring-red-500 pointer-events-none"
                    />
                    <div className="w-7 h-7 rounded-md bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center shrink-0">
                      {a.avatarInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {a.fullName}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {a.shortName} • {a.admissionDecision.status === 'admitted' ? 'Допущен' : 'Ожидает допуска'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Весовая категория *
              </label>
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {PRESET_WEIGHT_CATEGORIES.map(cat => {
                  const isSelected =
                    category.trim() === cat ||
                    category.trim().toLowerCase().endsWith(cat.toLowerCase());
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setCategory(cat);
                        setErrorMsg(null);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition border ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
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
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className={`px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedAthleteIds.length === 0}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-red-900/20 transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Сохранение...'
                  : `Сохранить турнир (${selectedAthleteIds.length})`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
