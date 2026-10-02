import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Athlete } from '../../types';
import { X, UserCheck, Save, AlertCircle } from 'lucide-react';

interface Props {
  athlete: Athlete;
  onClose: () => void;
  onSaved?: () => void;
}

export const EditAthleteModal: React.FC<Props> = ({ athlete, onClose, onSaved }) => {
  const { updateAthlete } = useApp();

  const [fullName, setFullName] = useState(athlete.fullName);
  const [shortName, setShortName] = useState(athlete.shortName);
  const [birthDate, setBirthDate] = useState(athlete.birthDate || '2015-05-10');
  const [parentName, setParentName] = useState(athlete.parentName);
  const [parentPhone, setParentPhone] = useState(athlete.parentPhone);
  const [athletePhone, setAthletePhone] = useState(athlete.athletePhone);
  const [isActive, setIsActive] = useState(athlete.isActive);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const validate = (): string | null => {
    const trimmedFull = fullName.trim();
    if (!trimmedFull || trimmedFull.length < 3) {
      return 'Укажите полное ФИО спортсмена (не менее 3 символов).';
    }

    const trimmedShort = shortName.trim();
    if (!trimmedShort) {
      return 'Укажите короткое имя спортсмена (например, "Иван П.").';
    }

    if (!birthDate) {
      return 'Укажите дату рождения спортсмена.';
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    if (birthDate > todayStr) {
      return 'Дата рождения не может быть в будущем.';
    }
    if (birthDate < '1920-01-01') {
      return 'Укажите корректную дату рождения спортсмена.';
    }

    const trimmedParent = parentName.trim();
    if (!trimmedParent || trimmedParent.length < 3) {
      return 'Укажите ФИО родителя или законного представителя.';
    }

    const trimmedParentPhone = parentPhone.trim();
    if (!trimmedParentPhone || trimmedParentPhone.length < 7) {
      return 'Укажите корректный контактный телефон родителя (не менее 7 символов).';
    }

    if (athletePhone.trim() && athletePhone.trim().length < 6) {
      return 'Телефон спортсмена должен содержать не менее 6 знаков, либо оставьте поле пустым.';
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

    updateAthlete(athlete.id, {
      fullName: fullName.trim(),
      shortName: shortName.trim(),
      birthDate,
      parentName: parentName.trim(),
      parentPhone: parentPhone.trim(),
      athletePhone: athletePhone.trim() || '',
      isActive
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
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Редактирование профиля</h3>
              <p className="text-xs text-slate-400">{athlete.fullName}</p>
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
              ФИО спортсмена *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={e => {
                setFullName(e.target.value);
                setErrorMsg(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              placeholder="Кузнецов Антон Романович"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Короткое имя *
              </label>
              <input
                type="text"
                required
                value={shortName}
                onChange={e => {
                  setShortName(e.target.value);
                  setErrorMsg(null);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                placeholder="Антон К."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Дата рождения *
              </label>
              <input
                type="date"
                required
                max={new Date().toISOString().slice(0, 10)}
                value={birthDate}
                onChange={e => {
                  setBirthDate(e.target.value);
                  setErrorMsg(null);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                ФИО Родителя / Опекуна *
              </label>
              <input
                type="text"
                required
                value={parentName}
                onChange={e => {
                  setParentName(e.target.value);
                  setErrorMsg(null);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                placeholder="Ольга Кузнецова"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Телефон родителя *
              </label>
              <input
                type="tel"
                required
                value={parentPhone}
                onChange={e => {
                  setParentPhone(e.target.value);
                  setErrorMsg(null);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-mono"
                placeholder="+7 (916) 123-45-67"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Телефон спортсмена
              </label>
              <input
                type="tel"
                value={athletePhone}
                onChange={e => {
                  setAthletePhone(e.target.value);
                  setErrorMsg(null);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-mono"
                placeholder="+7 (916) 777-88-99"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                />
                <span className="text-sm font-semibold text-slate-800">Активный статус в группе</span>
              </label>
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
              <span>Сохранить изменения</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
