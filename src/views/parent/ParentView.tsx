import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getDocumentExpiryStatus } from '../../utils/rules';
import { DocumentRecord } from '../../types';
import {
  Clock,
  FileText,
  Upload,
  CalendarX,
  Award,
  CheckCircle2,
  ShieldCheck,
  Eye
} from 'lucide-react';
import { ReportAbsenceModal } from '../../components/modals/ReportAbsenceModal';
import { UploadDocumentModal } from '../../components/modals/UploadDocumentModal';
import { DocumentViewModal } from '../../components/modals/DocumentViewModal';

export const ParentView: React.FC = () => {
  const { athletes, documents, sessions, tasks } = useApp();

  // Strict Data Isolation: Parent sees exclusively Anton K. ('ath-1')
  const child = athletes.find(a => a.id === 'ath-1') || athletes[0];
  const childDocs = documents.filter(d => d.athleteId === child.id);
  // Strictly filter only tasks published to family!
  const publishedTasks = tasks.filter(t => t.athleteId === child.id && t.publishedToFamily);

  // Next session
  const nextSession = sessions.find(s => s.id === 'ses-next') || sessions[sessions.length - 1];
  const childNextAttendance = nextSession.attendance[child.id] || 'present';

  // Modals state
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header (Slide 14) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 text-white font-black text-xl flex items-center justify-center shadow-md ring-4 ring-slate-100">
            {child.avatarInitials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
                Кабинет родителя
              </span>
              <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.2 rounded border border-emerald-200">
                Группа 1 (Самбо)
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-0.5">
              Мой ребёнок: {child.fullName}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Родитель: {child.parentName} ({child.parentPhone})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">
            Тренер: Иванов А. В.
          </span>
        </div>
      </div>

      {/* Grid: 2 Columns for Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Widget «Ближайшее занятие» (Slide 14) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-600" />
              <h2 className="font-extrabold text-slate-900 text-base">Ближайшее занятие</h2>
            </div>
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
              8 октября 2026
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">Группа 1 • Самбо</span>
              <span className="font-mono text-xs font-bold text-slate-700">18:00–19:00</span>
            </div>
            <div className="text-xs text-slate-500">
              Тема: Техника и соревновательные схватки (Зал самбо №1)
            </div>

            <div className="pt-2 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Статус участия ребёнка:</span>
              {childNextAttendance === 'excused' ? (
                <span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                  Уважительный пропуск согласован
                </span>
              ) : (
                <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  Планирует присутствовать
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => setIsAbsenceModalOpen(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-900/20 transition flex items-center justify-center gap-2"
          >
            <CalendarX className="w-4 h-4" />
            <span>Сообщить о пропуске</span>
          </button>
          <p className="text-[11px] text-slate-400 text-center">
            Уважительный пропуск (болезнь/заявление) не снизит спортивный рейтинг в правиле 4 недель.
          </p>
        </div>

        {/* Widget «Над чем работаем» & «Прогресс ребёнка» (Slide 14) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-red-600" />
              <h2 className="font-extrabold text-slate-900 text-base">Над чем работаем</h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              Опубликовано тренером
            </span>
          </div>

          {publishedTasks.length > 0 ? (
            publishedTasks.map(task => (
              <div key={task.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-start justify-between">
                  <span className="font-bold text-sm text-slate-900">{task.exerciseTitle}</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Активно
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  Навык: <strong>{task.skillTitle}</strong>
                </div>
                <div className="text-xs text-slate-500">
                  Срок выполнения: {task.deadline}
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-xs text-slate-400">
              Пока нет опубликованных задач.
            </div>
          )}

          {/* Widget «Прогресс ребёнка» */}
          <div className="pt-2 border-t border-slate-100">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Прогресс ребёнка:
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-emerald-950">
                    Результат последней проверки: Выполнено в упражнении
                  </div>
                  <div className="text-[11px] text-emerald-800 mt-0.5">
                    «Есть улучшения, продолжай в том же духе»
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Widget «Документы ребёнка» (Full width or bottom) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-red-600" />
                <h2 className="font-extrabold text-slate-900 text-base">Документы ребёнка</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Контроль сроков действия и передача новых скан-копий в клуб
              </p>
            </div>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-2 self-start sm:self-center"
            >
              <Upload className="w-4 h-4" />
              <span>Передать документ</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {childDocs.map(doc => {
              const expStatus = getDocumentExpiryStatus(doc.expiryDate);
              const isUnverified = doc.verificationStatus === 'unverified';
              const isVerified = doc.verificationStatus === 'verified';
              const isExpiring = expStatus === 'expiring_soon';

              return (
                <div
                  key={doc.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-sm text-slate-900">{doc.title}</div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                        v{doc.version}
                      </span>
                    </div>

                    <div className="mt-2 space-y-1 text-xs text-slate-500">
                      <div>Файл: <code className="text-slate-700">{doc.fileName}</code></div>
                      {doc.expiryDate && (
                        <div className="font-medium text-slate-700">Годен до: {doc.expiryDate}</div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      {isUnverified && (
                        <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                          На проверке
                        </span>
                      )}
                      {isVerified && !isExpiring && (
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                          Проверено
                        </span>
                      )}
                      {isExpiring && (
                        <span className="text-[11px] font-bold text-red-800 bg-red-100 px-2 py-0.5 rounded border border-red-200">
                          Требуется обновление
                        </span>
                      )}

                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="text-xs font-bold text-slate-700 hover:text-red-600 transition flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Открыть</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[11px] text-slate-400 italic flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>После передачи копии документа она отправляется на проверку спортивному контролёру.</span>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isAbsenceModalOpen && (
        <ReportAbsenceModal
          athleteId={child.id}
          sessionId={nextSession.id}
          onClose={() => setIsAbsenceModalOpen(false)}
        />
      )}

      {isUploadModalOpen && (
        <UploadDocumentModal
          athleteId={child.id}
          onClose={() => setIsUploadModalOpen(false)}
        />
      )}

      {previewDoc && (
        <DocumentViewModal
          document={previewDoc}
          athleteName={child.fullName}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
};
