import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Scale, Save, AlertCircle } from 'lucide-react';

interface Props {
  athleteId: string;
  athleteName: string;
  onClose: () => void;
  onSaved?: () => void;
}

export const AddWeightModal: React.FC<Props> = ({ athleteId, athleteName, onClose, onSaved }) => {
  const { addWeight } = useApp();

  const [date, setDate] = useState('2026-10-06');
  const [weightKg, setWeightKg] = useState('38.5');
  const [context, setContext] = useState('Перед утренней тренировкой');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const contextPresets = [
    'Перед утренней тренировкой',
    'Перед вечерней тренировкой',
    'После разминки',
    'Контрольное взвешивание перед турниром',
    'Взвешивание в медицинском кабинете'
  ];

  const validate = (): string | null => {
    if (!date) {
      return 'Укажите дату контрольного взвешивания.';
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    // Allow up to today in current demo or real life (using demo reference 2026-10-06 or current date)
    const maxDate = todayStr > '2026-10-06' ? todayStr : '2026-10-06';
    if (date > maxDate) {
      return 'Дата взвешивания не может быть в будущем.';
    }

    const val = parseFloat(weightKg);
    if (isNaN(val) || val < 15 || val > 200) {
      return 'Вес должен быть положительным числом в диапазоне от 15 до 200 кг.';
    }

    if (!context.trim()) {
      return 'Укажите нейтральный контекст взвешивания.';
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

    const val = parseFloat(weightKg);
    addWeight({
      athleteId,
      date,
      weightKg: Math.round(val * 10) / 10,
      context: context.trim() || 'Взвешивание в зале'
    });

    if (onSaved) onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Внести запись веса</h3>
              <p className="text-xs text-slate-400">{athleteName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ethical Standard Banner */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-3 flex items-start gap-2.5 text-xs text-slate-600">
          <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <span>
            <strong>Этическое ограничение:</strong> Запись веса фиксирует дату, килограммы и нейтральный спортивный контекст. Советы по диетам и оценка внешности запрещены.
          </span>
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
              Дата взвешивания *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={e => {
                setDate(e.target.value);
                setErrorMsg(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Вес (кг) * (диапазон 15–200 кг)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="15"
                max="200"
                required
                value={weightKg}
                onChange={e => {
                  setWeightKg(e.target.value);
                  setErrorMsg(null);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-lg font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 pr-12"
                placeholder="38.5"
              />
              <span className="absolute right-4 top-3 text-sm font-bold text-slate-400">кг</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Допустимый диапазон: от 15.0 до 200.0 кг</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Нейтральный контекст *
            </label>
            <input
              type="text"
              required
              value={context}
              onChange={e => {
                setContext(e.target.value);
                setErrorMsg(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              placeholder="Перед вечерней тренировкой"
            />
            {/* Quick Context Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {contextPresets.map(preset => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => {
                    setContext(preset);
                    setErrorMsg(null);
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition"
                >
                  {preset}
                </button>
              ))}
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
              <span>Сохранить в дневник</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
