import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DocumentRecord } from '../../types';
import {
  Clock,
  Users,
  History,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Eye,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { DocumentViewModal } from '../../components/modals/DocumentViewModal';

export const VerifierView: React.FC = () => {
  const { documents, athletes, verifyDocument } = useApp();

  const [activeTab, setActiveTab] = useState<'queue' | 'athletes' | 'history'>('queue');
  const [selectedDocId, setSelectedDocId] = useState<string>('doc-1');
  const [verifierComment, setVerifierComment] = useState('');
  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Queue of unverified docs
  const queueDocs = documents.filter(d => d.verificationStatus === 'unverified');
  const verifiedHistoryDocs = documents.filter(d => d.verificationStatus !== 'unverified');

  const selectedDoc = documents.find(d => d.id === selectedDocId) || queueDocs[0] || documents[0];
  const selectedAthlete = athletes.find(a => a.id === selectedDoc?.athleteId);

  const handleVerify = () => {
    if (!selectedDoc) return;
    verifyDocument(selectedDoc.id, 'verified', verifierComment);
    setSuccessToast(`Документ «${selectedDoc.title}» (${selectedAthlete?.shortName}) успешно подтверждён!`);
    setVerifierComment('');
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleRemarks = () => {
    if (!selectedDoc) return;
    if (!verifierComment.trim()) {
      alert('Пожалуйста, укажите причину замечания в поле комментария.');
      return;
    }
    verifyDocument(selectedDoc.id, 'has_remarks', verifierComment);
    setSuccessToast(`Замечание к документу «${selectedDoc.title}» зафиксировано.`);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {successToast && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-md text-sm font-semibold flex items-center justify-between animate-fadeIn">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            {successToast}
          </span>
          <button onClick={() => setSuccessToast(null)} className="underline text-xs font-bold">
            Закрыть
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Служба верификации документов</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Очередь проверки документов
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Проверка медицинских справок, согласий и страховых полисов
          </p>
        </div>
      </div>

      {/* Two Columns: Left Navigation & Queue List, Right Inspection Workspace (Slide 17) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Queue List & Tabs */}
        <div className="space-y-4">
          {/* Subtabs */}
          <div className="bg-white rounded-xl border border-slate-200 p-1 flex items-center gap-1 shadow-sm">
            <button
              onClick={() => setActiveTab('queue')}
              className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'queue'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Очередь ({queueDocs.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('athletes')}
              className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'athletes'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Спортсмены</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>История</span>
            </button>
          </div>

          {/* List Content */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-2">
            {activeTab === 'queue' && (
              <>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                  На проверке ({queueDocs.length})
                </div>
                {queueDocs.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    Очередь пуста. Все поступившие документы проверены!
                  </div>
                ) : (
                  queueDocs.map(doc => {
                    const athlete = athletes.find(a => a.id === doc.athleteId);
                    const isSelected = doc.id === selectedDoc?.id;

                    return (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDocId(doc.id)}
                        className={`p-3.5 rounded-xl border transition cursor-pointer ${
                          isSelected
                            ? 'bg-red-50/80 border-red-500 shadow-sm'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-900">
                            {athlete?.shortName}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                            v{doc.version}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5 font-medium">{doc.title}</div>
                        <div className="text-[11px] text-slate-400 mt-1 font-mono">
                          Файл: {doc.fileName}
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}

            {activeTab === 'athletes' && (
              <>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                  Назначенные участники
                </div>
                {athletes.map(ath => (
                  <div key={ath.id} className="p-3 rounded-xl border border-slate-200 text-xs">
                    <div className="font-bold text-slate-900">{ath.shortName}</div>
                    <div className="text-slate-500">{ath.fullName} • Группа 1</div>
                  </div>
                ))}
              </>
            )}

            {activeTab === 'history' && (
              <>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                  Ранее проверенные
                </div>
                {verifiedHistoryDocs.map(doc => {
                  const ath = athletes.find(a => a.id === doc.athleteId);
                  const isSelected = doc.id === selectedDoc?.id;

                  return (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDocId(doc.id)}
                      className={`p-3 rounded-xl border cursor-pointer text-xs transition ${
                        isSelected ? 'border-red-500 bg-red-50/60' : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex justify-between font-bold">
                        <span>{ath?.shortName}</span>
                        <span className={doc.verificationStatus === 'verified' ? 'text-emerald-700' : 'text-red-700'}>
                          {doc.verificationStatus === 'verified' ? 'Подтверждён' : 'Замечание'}
                        </span>
                      </div>
                      <div className="text-slate-500 mt-0.5">{doc.title}</div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* Right 2 Columns: Central Workspace / Verification Card (Slide 17) */}
        <div className="lg:col-span-2 space-y-5">
          {selectedDoc ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              {/* Header */}
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 text-white font-extrabold text-xl flex items-center justify-center shadow-md">
                  {selectedAthlete?.avatarInitials || 'СП'}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    {selectedAthlete?.shortName} / {selectedDoc.title}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedAthlete?.fullName} • Группа 1 • Загружен: {selectedDoc.uploadDate} (Версия {selectedDoc.version})
                  </p>
                </div>
              </div>

              {/* File Block (Slide 17) */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-14 rounded-xl bg-white border border-slate-300 shadow-sm flex flex-col items-center justify-center shrink-0">
                    <FileText className="w-7 h-7 text-red-600" />
                    <span className="text-[9px] font-bold text-slate-500 mt-0.5">PDF</span>
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900">{selectedDoc.fileName}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Защищённая электронная копия документа
                    </div>
                    {selectedDoc.isRestrictedMedical && (
                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200">
                        Медицинская тайна (скрыто для Администратора)
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setPreviewDoc(selectedDoc)}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold shadow-sm transition flex items-center justify-center gap-2 self-start sm:self-center"
                >
                  <Eye className="w-4 h-4 text-slate-600" />
                  <span>Открыть копию</span>
                </button>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-slate-400 font-bold uppercase text-[10px]">Принадлежность</div>
                  <div className="font-extrabold text-slate-900 text-sm mt-0.5">
                    {selectedAthlete?.fullName}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-slate-400 font-bold uppercase text-[10px]">Сведения по документу</div>
                  <div className="font-extrabold text-slate-900 text-sm mt-0.5">
                    {selectedDoc.title} (v{selectedDoc.version})
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-slate-400 font-bold uppercase text-[10px]">Срок действия</div>
                  <div className="font-extrabold text-slate-900 text-sm mt-0.5">
                    {selectedDoc.expiryDate ? selectedDoc.expiryDate : 'Бессрочно / в файле'}
                  </div>
                </div>
              </div>

              {/* Input: Verifier comment (0/500 symbols) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Комментарий проверки
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {verifierComment.length}/500
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={verifierComment}
                  onChange={e => setVerifierComment(e.target.value)}
                  placeholder="Служебная отметка проверяющего: реквизиты печати, соответствие ФИО, замечания..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-medium"
                />
              </div>

              {/* Action Buttons: Confirm / Needs Clarification (Slide 17) */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
                <button
                  onClick={handleRemarks}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5 touch-manipulation"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Требуется уточнение</span>
                </button>

                <button
                  onClick={handleVerify}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-900/20 transition flex items-center justify-center gap-1.5 touch-manipulation"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Подтвердить проверку</span>
                </button>
              </div>

              {/* Lower Informational Block (Slide 17) */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-amber-900">
                    Решение об участии: Ожидает решения ответственного (тренера)
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Пояснение системы двухконтурного допуска: Проверяющий подтверждает исключительно подлинность и комплектность прикреплённого документа.
                    <strong> Проверяющий НЕ имеет права выдавать спортивный допуск спортсмена к схваткам.</strong>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              Выберите документ из очереди проверки слева.
            </div>
          )}
        </div>
      </div>

      {previewDoc && (
        <DocumentViewModal
          document={previewDoc}
          athleteName={selectedAthlete?.fullName}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
};
