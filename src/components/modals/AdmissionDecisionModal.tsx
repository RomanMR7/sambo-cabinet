import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AdmissionStatus, AdmissionDecision } from '../../types';
import { X, ShieldCheck, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface Props {
  athleteId: string;
  onClose: () => void;
}

export const AdmissionDecisionModal: React.FC<Props> = ({ athleteId, onClose }) => {
  const { athletes, updateAdmissionDecision } = useApp();
  const athlete = athletes.find(a => a.id === athleteId);

  const [status, setStatus] = useState<AdmissionStatus>(
    athlete?.admissionDecision.status || 'pending'
  );
  const [basis, setBasis] = useState(
    athlete?.admissionDecision.basis || 'На основании действующей справки и страховки'
  );
  const [validUntil, setValidUntil] = useState(
    athlete?.admissionDecision.validUntil || '2026-11-15'
  );
  const [reviewedBy, setReviewedBy] = useState(
    athlete?.admissionDecision.reviewedBy || 'Тренер 1 (Иванов А. В.)'
  );

  if (!athlete) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const decision: AdmissionDecision = {
      status,
      basis,
      reviewedAt: '2026-10-06',
      reviewedBy,
      validUntil: validUntil || undefined
    };
    updateAdmissionDecision(athleteId, decision);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Решение о допуске спортсмена</h3>
              <p className="text-xs text-slate-300">
                {athlete.fullName} ({athlete.shortName})
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

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Critical Rule Banner */}
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Критическое правило безопасности: </span>
              Наличие файла или действующего полиса само по себе НЕ разрешает участие спортсмена.
              Спортивный допуск оформляется отдельным ответственным решением тренера!
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Статус решения
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('admitted')}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold border flex flex-col items-center gap-1.5 transition ${
                  status === 'admitted'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className={`w-4 h-4 ${status === 'admitted' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>Допущен</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('pending')}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold border flex flex-col items-center gap-1.5 transition ${
                  status === 'pending'
                    ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Clock className={`w-4 h-4 ${status === 'pending' ? 'text-amber-600' : 'text-slate-400'}`} />
                <span>Ожидает</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('not_admitted')}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold border flex flex-col items-center gap-1.5 transition ${
                  status === 'not_admitted'
                    ? 'bg-red-50 border-red-500 text-red-800 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <XCircle className={`w-4 h-4 ${status === 'not_admitted' ? 'text-red-600' : 'text-slate-400'}`} />
                <span>Не допущен</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Основание решения (текстовое обоснование) *
            </label>
            <textarea
              rows={3}
              value={basis}
              onChange={e => setBasis(e.target.value)}
              required
              placeholder="Например: Диспансеризация пройдена, оригинал страховки сверен..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Дата обязательного пересмотра
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={e => setValidUntil(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Ответственное лицо
              </label>
              <input
                type="text"
                value={reviewedBy}
                onChange={e => setReviewedBy(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
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
              className="px-5 py-2 text-sm font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white shadow transition"
            >
              Зафиксировать решение
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
