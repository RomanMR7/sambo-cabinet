import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, CalendarX, AlertCircle } from 'lucide-react';

interface Props {
  athleteId: string;
  sessionId: string;
  onClose: () => void;
}

export const ReportAbsenceModal: React.FC<Props> = ({ athleteId, sessionId, onClose }) => {
  const { reportAbsence, sessions } = useApp();
  const [selectedSessionId, setSelectedSessionId] = useState(sessionId);
  const session = sessions.find(s => s.id === selectedSessionId) || sessions[0];

  const [reasonCategory, setReasonCategory] = useState<'illness' | 'family' | 'custom'>('illness');
  const [comment, setComment] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!selectedSessionId) {
      return 'Выберите тренировочное занятие из списка.';
    }

    if (reasonCategory === 'custom') {
      const trimmed = comment.trim();
      if (!trimmed || trimmed.length < 3) {
        return 'При выборе категории «Иная причина» необходимо указать комментарий с причиной пропуска (не менее 3 символов).';
      }
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

    let fullReason = '';
    if (reasonCategory === 'illness') {
      fullReason = `Болезнь спортсмена (справка будет предоставлена)${comment.trim() ? ': ' + comment.trim() : ''}`;
    } else if (reasonCategory === 'family') {
      fullReason = `Заявление родителя (семейные обстоятельства)${comment.trim() ? ': ' + comment.trim() : ''}`;
    } else {
      fullReason = comment.trim();
    }

    reportAbsence(athleteId, selectedSessionId, fullReason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center text-white">
              <CalendarX className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Сообщить о пропуске</h3>
              <p className="text-xs text-slate-300">
                {session ? `${session.date} (${session.timeRange})` : 'Ближайшее занятие'}
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

        {/* Validation Error Banner */}
        {errorMsg && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-start gap-2.5 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Математический расчет (Правило 4 недель): </span>
              Согласованный уважительный пропуск автоматически исключается из эффективной базы <span className="font-mono font-bold">E</span>, не ухудшая спортивный процент посещаемости ребёнка.
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Выберите занятие для пропуска *
            </label>
            <select
              value={selectedSessionId}
              onChange={e => {
                setSelectedSessionId(e.target.value);
                setErrorMsg(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
            >
              {sessions.map(s => (
                <option key={s.id} value={s.id}>
                  {s.date} ({s.timeRange}) — {s.topic}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Причина пропуска *
            </label>
            <div className="space-y-2">
              <label
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  reasonCategory === 'illness'
                    ? 'bg-red-50/70 border-red-500 text-slate-900 font-semibold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="reason"
                  checked={reasonCategory === 'illness'}
                  onChange={() => {
                    setReasonCategory('illness');
                    setErrorMsg(null);
                  }}
                  className="text-red-600 focus:ring-red-500"
                />
                <div>
                  <div className="text-sm">Болезнь / Недомогание</div>
                  <div className="text-xs text-slate-500 font-normal">Справка от педиатра или врача</div>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  reasonCategory === 'family'
                    ? 'bg-red-50/70 border-red-500 text-slate-900 font-semibold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="reason"
                  checked={reasonCategory === 'family'}
                  onChange={() => {
                    setReasonCategory('family');
                    setErrorMsg(null);
                  }}
                  className="text-red-600 focus:ring-red-500"
                />
                <div>
                  <div className="text-sm">Семейные обстоятельства</div>
                  <div className="text-xs text-slate-500 font-normal">Заявление родителя / поездка</div>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  reasonCategory === 'custom'
                    ? 'bg-red-50/70 border-red-500 text-slate-900 font-semibold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="reason"
                  checked={reasonCategory === 'custom'}
                  onChange={() => {
                    setReasonCategory('custom');
                    setErrorMsg(null);
                  }}
                  className="text-red-600 focus:ring-red-500"
                />
                <div>
                  <div className="text-sm">Иная причина *</div>
                  <div className="text-xs text-slate-500 font-normal">Школьная олимпиада или др. (требует комментария)</div>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Комментарий для тренера {reasonCategory === 'custom' && <span className="text-red-500">*</span>}
            </label>
            <textarea
              rows={2}
              value={comment}
              onChange={e => {
                setComment(e.target.value);
                setErrorMsg(null);
              }}
              placeholder={reasonCategory === 'custom' ? 'Обязательно укажите причину пропуска...' : 'Укажите подробности при необходимости...'}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          {/* Buttons */}
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
              className="px-5 py-2 text-sm font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white shadow transition"
            >
              Передать тренеру
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
