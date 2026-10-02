import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, UserPlus, Save, AlertCircle } from 'lucide-react';

interface Props {
  onClose: () => void;
  onAdded?: (athleteId: string) => void;
}

export const AddAthleteModal: React.FC<Props> = ({ onClose, onAdded }) => {
  const { addAthlete } = useApp();

  const [fullName, setFullName] = useState('');
  const [shortName, setShortName] = useState('');
  const [birthDate, setBirthDate] = useState('2015-05-10');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [athletePhone, setAthletePhone] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFullNameChange = (val: string) => {
    setFullName(val);
    setErrorMsg(null);
    if (!shortName || shortName === '') {
      // Auto-suggest shortName: First name + first letter of last name
      const parts = val.trim().split(/\s+/);
      if (parts.length >= 2) {
        setShortName(`${parts[1]} ${parts[0][0]}.`);
      } else if (parts.length === 1 && parts[0].length > 0) {
        setShortName(parts[0]);
      }
    }
  };

  const validate = (): string | null => {
    const trimmedFull = fullName.trim();
    if (!trimmedFull || trimmedFull.length < 3) {
      return 'Укажите полное ФИО спортсмена (не менее 3 символов).';
    }

    const trimmedShort = shortName.trim();
    if (!trimmedShort) {
      return 'Укажите короткое имя спортсмена для ведомостей (например, "Иван П.").';
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

    const short = shortName.trim() || fullName.trim().slice(0, 10);

    addAthlete({
      fullName: fullName.trim(),
      shortName: short,
      birthDate,
      groupId: 'grp-1',
      isActive: true,
      admissionDecision: {
        status: 'pending',
        basis: 'Первичный прием спортсмена. Ожидается комплект справок.',
        reviewedAt: new Date().toISOString().slice(0, 10),
        reviewedBy: 'Тренер'
      },
      parentName: parentName.trim(),
      parentPhone: parentPhone.trim(),
      athletePhone: athletePhone.trim() || ''
    });

    if (onAdded) onAdded('new');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Добавить спортсмена в группу</h3>
              <p className="text-xs text-slate-400">Группа 1 • Самбо</p>
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
              onChange={e => handleFullNameChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              placeholder="Сидоров Илья Алексеевич"
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
                placeholder="Илья С."
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
                ФИО Родителя *
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
                placeholder="Елена Сидорова"
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
                placeholder="+7 (915) 333-22-11"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Телефон спортсмена (если есть)
            </label>
            <input
              type="tel"
              value={athletePhone}
              onChange={e => {
                setAthletePhone(e.target.value);
                setErrorMsg(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-mono"
              placeholder="+7 (915) 555-44-33"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            После создания спортсмен получает статус допуска <strong>«Ожидает»</strong>. По правилам двухконтурного допуска тренер принимает решение только после верификации медицинских копий.
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
              <span>Добавить спортсмена</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
