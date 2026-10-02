import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getDocumentExpiryStatus } from '../../utils/rules';
import { DocumentRecord } from '../../types';
import {
  FileText,
  Plus,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Eye,
  Send,
  MoreVertical
} from 'lucide-react';
import { DocumentViewModal } from '../../components/modals/DocumentViewModal';
import { UploadDocumentModal } from '../../components/modals/UploadDocumentModal';
import { AdmissionDecisionModal } from '../../components/modals/AdmissionDecisionModal';
import { ObservationTaskModal } from '../../components/modals/ObservationTaskModal';

interface Props {
  onBack?: () => void;
}

export const AthleteDetailView: React.FC<Props> = ({ onBack }) => {
  const {
    athletes,
    selectedAthleteId,
    documents,
    sessions,
    tasks,
    weights,
    setRole,
    setActiveNav
  } = useApp();

  const athlete = athletes.find(a => a.id === selectedAthleteId) || athletes[0];
  const athleteDocs = documents.filter(d => d.athleteId === athlete.id);

  // Default tab: 'documents' as requested in prompt:
  // "Горизонтальные табы: Обзор, Развитие, Посещения, Тесты, Старты, Документы (активный по умолчанию для демо), История."
  const [activeTab, setActiveTab] = useState<
    'overview' | 'development' | 'attendance' | 'tests' | 'starts' | 'documents' | 'history'
  >('documents');

  // Modals state
  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDecisionOpen, setIsDecisionOpen] = useState(false);
  const [isObservationOpen, setIsObservationOpen] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNoticeMessage(msg);
    setTimeout(() => setNoticeMessage(null), 4000);
  };

  const tabs: Array<{ id: typeof activeTab; label: string }> = [
    { id: 'overview', label: 'Обзор' },
    { id: 'development', label: 'Развитие' },
    { id: 'attendance', label: 'Посещения' },
    { id: 'tests', label: 'Тесты и вес' },
    { id: 'starts', label: 'Старты' },
    { id: 'documents', label: 'Документы' },
    { id: 'history', label: 'История' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {noticeMessage && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-md text-sm font-semibold flex items-center justify-between animate-fadeIn">
          <span>{noticeMessage}</span>
          <button onClick={() => setNoticeMessage(null)} className="text-white font-bold text-xs underline ml-4">
            Закрыть
          </button>
        </div>
      )}

      {/* Breadcrumb / Back button */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <button
          onClick={() => (onBack ? onBack() : setActiveNav('athletes'))}
          className="inline-flex items-center gap-1.5 hover:text-red-600 font-medium transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Спортсмены группы</span>
        </button>
        <span>/</span>
        <span className="text-slate-800 font-semibold">{athlete.fullName}</span>
      </div>

      {/* Main Header (Slide 05) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 text-white font-black text-xl flex items-center justify-center shadow-md shadow-red-900/30 ring-4 ring-slate-100">
            {athlete.avatarInitials}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-slate-900">{athlete.shortName}</h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Активен
              </span>
            </div>
            <div className="text-sm text-slate-500 mt-0.5">
              {athlete.fullName} • Группа 1 (Самбо)
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Родитель: {athlete.parentName} ({athlete.parentPhone})
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => showNotification(`Данные спортсмена ${athlete.shortName} сохранены в профиле.`)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            Редактировать
          </button>
          <button
            onClick={() => setIsObservationOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-sm transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Наблюдение</span>
          </button>
          <button className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Layout with Tabs + Right Action Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Tabs & Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Horizontal Tabs */}
          <div className="bg-white rounded-xl border border-slate-200 p-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar shadow-sm">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB CONTENT: DOCUMENTS (Active by default) */}
          {activeTab === 'documents' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Документы и допуски</h3>
                  <p className="text-xs text-slate-500">
                    Учет медицинских справок, страховых полисов и согласий
                  </p>
                </div>
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Добавить документ</span>
                </button>
              </div>

              {/* Document List (Slide 05) */}
              <div className="space-y-3">
                {athleteDocs.map(doc => {
                  const expiryStatus = getDocumentExpiryStatus(doc.expiryDate);
                  const isVerified = doc.verificationStatus === 'verified';
                  const isUnverified = doc.verificationStatus === 'unverified';
                  const hasRemarks = doc.verificationStatus === 'has_remarks';

                  return (
                    <div
                      key={doc.id}
                      className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm">{doc.title}</span>
                            {/* Verification Badge */}
                            {isVerified && (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Проверено
                              </span>
                            )}
                            {isUnverified && (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> На проверке
                              </span>
                            )}
                            {hasRemarks && (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Есть замечание
                              </span>
                            )}

                            {/* Expiry Badge */}
                            {expiryStatus === 'expiring_soon' && (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                Скоро истекает
                              </span>
                            )}
                            {expiryStatus === 'expired' && (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-900 border border-red-300">
                                Истёк
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
                            <span>Файл: <code className="text-slate-700 font-mono">{doc.fileName}</code></span>
                            <span>• Версия {doc.version}</span>
                            {doc.expiryDate && (
                              <span className="text-slate-600 font-medium">Срок: {doc.expiryDate}</span>
                            )}
                            <span>Загружен: {doc.uploadDate}</span>
                          </div>

                          {doc.type === 'insurance' && (
                            <div className="text-[11px] text-slate-400 mt-0.5 italic">
                              Закрытая копия загружена
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Открыть</span>
                        </button>
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB CONTENT: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-base">Обзор спортсмена</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-slate-400 uppercase">Контакты семьи</div>
                  <div className="text-sm font-bold text-slate-800 mt-1">{athlete.parentName}</div>
                  <div className="text-xs text-slate-600">Тел: {athlete.parentPhone}</div>
                  <div className="text-xs text-slate-600 mt-1">Телефон спортсмена: {athlete.athletePhone}</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-slate-400 uppercase">Текущий вес</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {weights[0]?.weightKg || 38.3} кг
                  </div>
                  <div className="text-xs text-slate-500">Контекст: {weights[0]?.context || 'Перед тренировкой'}</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: DEVELOPMENT */}
          {activeTab === 'development' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 text-base">Индивидуальные задачи и S/3S</h3>
                <button
                  onClick={() => setIsObservationOpen(true)}
                  className="text-xs font-bold text-red-600 hover:underline"
                >
                  + Новая задача
                </button>
              </div>

              <div className="space-y-3">
                {tasks.filter(t => t.athleteId === athlete.id).map(t => (
                  <div key={t.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{t.exerciseTitle}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        t.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {t.status === 'completed' ? 'Зачтено' : 'В работе'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600">
                      <span className="font-semibold">Наблюдение тренера: </span> {t.observation}
                    </div>
                    <div className="text-xs text-slate-500">
                      Срок контроля: {t.deadline} • Навык: {t.skillTitle}
                    </div>
                    {t.coachFeedback && (
                      <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                        <span className="font-bold">Отзыв тренера: </span> {t.coachFeedback}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB CONTENT: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-base">История посещаемости (4 недели)</h3>
              <div className="space-y-2">
                {sessions.map(s => {
                  const status = s.attendance[athlete.id] || 'unmarked';
                  return (
                    <div key={s.id} className="p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-slate-900">{s.date} • {s.topic}</div>
                        <div className="text-xs text-slate-500">{s.timeRange}</div>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                        status === 'present'
                          ? 'bg-emerald-100 text-emerald-800'
                          : status === 'absent'
                          ? 'bg-red-100 text-red-800'
                          : status === 'excused'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {status === 'present'
                          ? 'Присутствовал'
                          : status === 'absent'
                          ? 'Отсутствовал'
                          : status === 'excused'
                          ? 'Уважительный пропуск'
                          : 'Не отмечено'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB CONTENT: TESTS & WEIGHT */}
          {activeTab === 'tests' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Дневник веса (этический формат)</h3>
                  <p className="text-xs text-slate-500">
                    Строго дата, числовое значение в кг и нейтральный контекст (без диет и оценок)
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {weights.filter(w => w.athleteId === athlete.id).map(w => (
                  <div key={w.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-sm">{w.date}</span>
                      <div className="text-xs text-slate-500">{w.context}</div>
                    </div>
                    <span className="text-base font-black text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-200">
                      {w.weightKg} кг
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB CONTENT: STARTS */}
          {activeTab === 'starts' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-base">Соревнования и старты</h3>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Первенство города по самбо</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    24 октября 2026
                  </span>
                </div>
                <div className="text-xs text-slate-600">Весовая категория: Юноши до 42 кг</div>
                <div className="text-xs text-slate-500">Статус допуска: {athlete.admissionDecision.status === 'admitted' ? 'Допущен' : 'Ожидает решения'}</div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: HISTORY */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
              <h3 className="font-extrabold text-slate-900 text-base">Журнал изменений</h3>
              <div className="text-xs text-slate-500 space-y-2">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-800">2026-10-02: </span>
                  Загружена версия 1 «Медицинский документ».
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-800">2026-10-01: </span>
                  Пересмотр спортивного допуска: {athlete.admissionDecision.status}.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Next Action & Admission Decision (Slide 05) */}
        <div className="space-y-4">
          {/* Block «Следующее действие» */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Следующее действие
            </h3>

            {/* Button-card «Проверить документ» */}
            <div
              onClick={() => {
                setRole('verifier');
                setActiveNav('queue');
              }}
              className="p-3.5 rounded-xl border border-red-200 bg-red-50/40 hover:bg-red-50 transition cursor-pointer group flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-red-700">
                  Проверить документ
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Переход к очереди проверки (роль Проверяющий)
                </div>
              </div>
            </div>

            {/* Button-card «Запросить обновление полиса» */}
            <div
              onClick={() => showNotification('Уведомление родителю (Ольге Кузнецовой) отправлено: «Требуется обновить страховой полис до 14 октября».')}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition cursor-pointer group flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-red-700">
                  Запросить обновление полиса
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Отправляет уведомление родителю
                </div>
              </div>
            </div>
          </div>

          {/* Block «Решение об участии» */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Решение об участии
              </span>
              <span className="text-xs text-slate-500 mt-0.5 block italic">
                Фиксирует ответственный
              </span>
            </div>

            <div className="p-3.5 rounded-xl border bg-slate-50 border-slate-200">
              <div className="text-xs text-slate-500">Текущий спортивный статус:</div>
              <div className="mt-1 flex items-center gap-2">
                {athlete.admissionDecision.status === 'admitted' && (
                  <span className="text-sm font-black text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Допущен к тренировкам
                  </span>
                )}
                {athlete.admissionDecision.status === 'pending' && (
                  <span className="text-sm font-black text-amber-700 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> Ожидает решения
                  </span>
                )}
                {athlete.admissionDecision.status === 'not_admitted' && (
                  <span className="text-sm font-black text-red-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Не допущен
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-600 mt-2 font-medium">
                Основание: {athlete.admissionDecision.basis}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Дата: {athlete.admissionDecision.reviewedAt} • Автор: {athlete.admissionDecision.reviewedBy}
              </div>
              {athlete.admissionDecision.validUntil && (
                <div className="text-[11px] text-amber-700 font-semibold mt-1">
                  Пересмотр: до {athlete.admissionDecision.validUntil}
                </div>
              )}
            </div>

            <button
              onClick={() => setIsDecisionOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Принять решение</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {previewDoc && (
        <DocumentViewModal
          document={previewDoc}
          athleteName={athlete.fullName}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {isUploadOpen && (
        <UploadDocumentModal
          athleteId={athlete.id}
          onClose={() => setIsUploadOpen(false)}
        />
      )}

      {isDecisionOpen && (
        <AdmissionDecisionModal
          athleteId={athlete.id}
          onClose={() => setIsDecisionOpen(false)}
        />
      )}

      {isObservationOpen && (
        <ObservationTaskModal
          athleteId={athlete.id}
          onClose={() => setIsObservationOpen(false)}
        />
      )}
    </div>
  );
};
