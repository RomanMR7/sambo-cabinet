import React from 'react';
import { DocumentRecord } from '../../types';
import { X, FileText, CheckCircle2, AlertTriangle, ShieldCheck, Download, Calendar, User } from 'lucide-react';

interface Props {
  document: DocumentRecord | null;
  onClose: () => void;
  athleteName?: string;
}

export const DocumentViewModal: React.FC<Props> = ({ document, onClose, athleteName }) => {
  if (!document) return null;

  const isVerified = document.verificationStatus === 'verified';
  const hasRemarks = document.verificationStatus === 'has_remarks';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-600/90 flex items-center justify-center text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">{document.title}</h3>
              <p className="text-xs text-slate-300">
                {document.fileName} • Версия {document.version} {athleteName ? `• ${athleteName}` : ''}
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
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Status Banner */}
          <div className="flex items-center justify-between p-4 rounded-xl border bg-slate-50 border-slate-200">
            <div className="flex items-center gap-3">
              {isVerified ? (
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : hasRemarks ? (
                <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              )}
              <div>
                <div className="text-xs text-slate-500 font-medium">Статус проверки документа:</div>
                <div className="text-sm font-bold">
                  {isVerified && <span className="text-emerald-700">Проверено и подтверждено</span>}
                  {hasRemarks && <span className="text-red-700">Требуется уточнение / Есть замечание</span>}
                  {!isVerified && !hasRemarks && (
                    <span className="text-amber-700">Не проверено / На проверке в очереди</span>
                  )}
                </div>
              </div>
            </div>

            <span className="text-xs font-mono px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-600">
              Версия {document.version}
            </span>
          </div>

          {document.verifierComment && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
              <span className="font-bold">Комментарий проверяющего: </span>
              {document.verifierComment}
            </div>
          )}

          {/* Mock Document Preview Canvas */}
          <div className="border border-slate-200 rounded-xl bg-slate-100 p-6 flex flex-col items-center justify-center relative min-h-[260px] overflow-hidden text-center">
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
              <span className="text-8xl font-black rotate-[-25deg] uppercase">САМБО-ДОКУМЕНТ</span>
            </div>

            <div className="w-16 h-20 bg-white border border-slate-300 rounded shadow-md flex flex-col items-center justify-center mb-3">
              <FileText className="w-8 h-8 text-red-600" />
              <span className="text-[9px] font-bold mt-1 text-slate-600">PDF</span>
            </div>

            <h4 className="text-sm font-bold text-slate-800">{document.title}</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Файл: <code className="font-mono text-slate-700">{document.fileName}</code>
            </p>

            <div className="mt-4 flex flex-wrap gap-2 justify-center text-xs text-slate-600">
              <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded border border-slate-200">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Загружен: {document.uploadDate}
              </span>
              {document.expiryDate && (
                <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded border border-slate-200">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" /> Срок действия: {document.expiryDate}
                </span>
              )}
              {document.verifiedBy && (
                <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded border border-slate-200">
                  <User className="w-3.5 h-3.5 text-emerald-500" /> Проверил: {document.verifiedBy} ({document.verifiedAt})
                </span>
              )}
            </div>

            <div className="mt-5">
              <button
                onClick={() => {
                  const content = `ЭЛЕКТРОННЫЙ АРХИВ САМБО\n\nДокумент: ${document.title}\nФайл: ${document.fileName}\nВерсия: ${document.version}\nДата загрузки: ${document.uploadDate}\nСрок действия: ${document.expiryDate || 'Бессрочно'}\nСтатус верификации: ${document.verificationStatus}\nПроверил: ${document.verifiedBy || 'Ожидает проверки'}\n\nЦифровой кабинет самбо • Защищенный контур`;
                  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = window.document.createElement('a');
                  a.href = url;
                  a.download = document.fileName.endsWith('.pdf') ? document.fileName.replace('.pdf', '.txt') : `${document.fileName}.txt`;
                  window.document.body.appendChild(a);
                  a.click();
                  window.document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold shadow-sm transition"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                Скачать электронную копию
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Цифровой контур хранения документов
            </span>
            <span>ID: {document.id}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-sm font-semibold transition"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
