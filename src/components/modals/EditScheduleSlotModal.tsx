import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ScheduleSlot } from '../../types';
import { X, Calendar, Save, Trash2, AlertCircle } from 'lucide-react';

interface Props {
  slot?: ScheduleSlot | null; // null = adding new slot
  onClose: () => void;
  onSaved?: () => void;
}

export const EditScheduleSlotModal: React.FC<Props> = ({ slot, onClose, onSaved }) => {
  const { addScheduleSlot, updateScheduleSlot, deleteScheduleSlot } = useApp();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [day, setDay] = useState(slot?.day || 'Вторник');
  const [time, setTime] = useState(slot?.time || '18:00–19:00');
  const [hall, setHall] = useState(slot?.hall || 'Зал самбо №1');
  const [coach, setCoach] = useState(slot?.coach || 'Иванов А. В.');
  const [group, setGroup] = useState(slot?.group || 'Группа 1');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const daysOfWeek = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

  const validate = (): string | null => {
    if (!day.trim()) {
      return 'Выберите день недели проведения занятия.';
    }

    const trimmedTime = time.trim();
    if (!trimmedTime || trimmedTime.length < 3) {
      return 'Укажите время проведения занятия (например, "18:00–19:00").';
    }

    const trimmedHall = hall.trim();
    if (!trimmedHall || trimmedHall.length < 2) {
      return 'Укажите зал проведения тренировки.';
    }

    const trimmedCoach = coach.trim();
    if (!trimmedCoach || trimmedCoach.length < 3) {
      return 'Укажите ФИО тренера занятия.';
    }

    const trimmedGroup = group.trim();
    if (!trimmedGroup || trimmedGroup.length < 2) {
      return 'Укажите название группы.';
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
      if (slot) {
        updateScheduleSlot(slot.id, {
          day: day.trim(),
          time: time.trim(),
          hall: hall.trim(),
          coach: coach.trim(),
          group: group.trim()
        });
      } else {
        addScheduleSlot({
          day: day.trim(),
          time: time.trim(),
          hall: hall.trim(),
          coach: coach.trim(),
          group: group.trim()
        });
      }

      if (onSaved) onSaved();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (isSubmitting) return;
    if (slot && confirm('Удалить этот слот расписания?')) {
      setIsSubmitting(true);
      try {
        deleteScheduleSlot(slot.id);
        if (onSaved) onSaved();
        onClose();
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div 
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {slot ? 'Редактировать занятие' : 'Добавить занятие в сетку'}
              </h3>
              <p className="text-xs text-slate-400">Расписание клуба</p>
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
              День недели *
            </label>
            <select
              value={day}
              onChange={e => {
                setDay(e.target.value);
                setErrorMsg(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white"
            >
              {daysOfWeek.map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Время проведения *
            </label>
            <input
              type="text"
              required
              value={time}
              onChange={e => {
                setTime(e.target.value);
                setErrorMsg(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-mono"
              placeholder="18:00–19:00"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Зал *
            </label>
            <input
              type="text"
              required
              value={hall}
              onChange={e => {
                setHall(e.target.value);
                setErrorMsg(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              placeholder="Зал самбо №1"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Тренер *
              </label>
              <input
                type="text"
                required
                value={coach}
                onChange={e => {
                  setCoach(e.target.value);
                  setErrorMsg(null);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                placeholder="Иванов А. В."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Группа *
              </label>
              <input
                type="text"
                required
                value={group}
                onChange={e => {
                  setGroup(e.target.value);
                  setErrorMsg(null);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                placeholder="Группа 1"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            {slot ? (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDelete}
                className={`px-3.5 py-2 rounded-xl text-red-600 hover:bg-red-50 text-xs font-bold transition flex items-center gap-1.5 ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Удаление...' : 'Удалить слот'}</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-900/20 transition flex items-center gap-2 ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'Сохранение...' : 'Сохранить'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
