import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSaved?: (userName: string) => void;
}

export const AddStaffModal: React.FC<Props> = ({ onClose, onSaved }) => {
  const { addClubUser } = useApp();

  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'admin' | 'coach' | 'verifier'>('coach');
  const [title, setTitle] = useState('');
  const [phone, setPhone] = useState('+7 (');
  const [email, setEmail] = useState('');
  const [isVerifierAssigned, setIsVerifierAssigned] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = fullName.trim();
    if (!trimmedName || trimmedName.length < 5) {
      setErrorMsg('Укажите полные ФИО сотрудника (не менее 5 символов).');
      return;
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle || trimmedTitle.length < 3) {
      setErrorMsg('Укажите должность или спортивную квалификацию.');
      return;
    }

    const trimmedPhone = phone.trim();
    if (trimmedPhone && trimmedPhone !== '+7 (' && trimmedPhone.length < 7) {
      setErrorMsg('Укажите корректный контактный телефон (не менее 7 символов) или оставьте поле пустым.');
      return;
    }

    const trimmedEmail = email.trim();
    if (trimmedEmail && (!trimmedEmail.includes('@') || !trimmedEmail.includes('.'))) {
      setErrorMsg('Укажите корректный адрес электронной почты или оставьте поле пустым.');
      return;
    }

    const finalPhone = (!trimmedPhone || trimmedPhone === '+7 (')
      ? '+7 (999) 000-00-00'
      : trimmedPhone;

    setIsSubmitting(true);
    try {
      addClubUser({
        fullName: trimmedName,
        role,
        phone: finalPhone,
        email: trimmedEmail || `${trimmedName.split(' ')[0]?.toLowerCase() || 'staff'}@sambo-club.ru`,
        title: trimmedTitle,
        isHeadManager: false,
        isVerifierAssigned: role === 'verifier' || isVerifierAssigned
      });

      if (onSaved) onSaved(trimmedName);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Добавить сотрудника</h3>
              <p className="text-xs text-slate-400">Назначение роли и служебных прав</p>
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
              ФИО сотрудника *
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
              placeholder="Сидоров Виктор Павлович"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Системная роль *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole('coach')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition text-center ${
                  role === 'coach'
                    ? 'bg-red-600 text-white border-red-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Тренер
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition text-center ${
                  role === 'admin'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Администратор
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('verifier');
                  setIsVerifierAssigned(true);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition text-center ${
                  role === 'verifier'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Проверяющий
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Должность / Квалификация *
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
              placeholder={role === 'coach' ? 'Тренер высшей категории, МС по самбо' : role === 'verifier' ? 'Спортивный врач, контролёр медкомиссии' : 'Координатор учебно-тренировочного процесса'}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Телефон
              </label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-mono"
                placeholder="+7 (999) 000-00-00"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Рабочий Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                placeholder="v.sidorov@sambo-club.ru"
              />
            </div>
          </div>

          {/* Additional Permission Checkbox */}
          {role !== 'verifier' && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isVerifierAssigned}
                  onChange={e => setIsVerifierAssigned(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                />
                <span className="text-xs font-semibold text-slate-800">
                  Дополнительно наделить полномочиями проверки документов
                </span>
              </label>
              <p className="text-[11px] text-slate-500 mt-1 pl-6">
                Позволяет сотруднику открывать очередь проверки и выносить решения по справкам.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-red-900/20 transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Сохранение...' : 'Сохранить сотрудника'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
