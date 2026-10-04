import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getDocumentExpiryStatus, calculateFourWeekAttendance } from '../../utils/rules';
import { formatRussianDate } from '../../utils/calendarEngine';
import { DocumentRecord, DocType } from '../../types';
import {
  Clock,
  FileText,
  Upload,
  CalendarX,
  Award,
  CheckCircle2,
  Eye,
  HeartHandshake,
  Dumbbell,
  XCircle,
  HelpCircle,
  CheckSquare,
  BellRing,
  AlertTriangle,
  Send
} from 'lucide-react';
import { ReportAbsenceModal } from '../../components/modals/ReportAbsenceModal';
import { UploadDocumentModal } from '../../components/modals/UploadDocumentModal';
import { DocumentViewModal } from '../../components/modals/DocumentViewModal';

export const ParentView: React.FC = () => {
  const { athletes, documents, sessions, tasks, activeNav, setActiveNav, toggleTaskStatus, groups, documentRequests } = useApp();

  // Strict Data Isolation: Parent sees exclusively Anton K. ('ath-1')
  const child = athletes.find(a => a.id === 'ath-1') || athletes[0];
  const childGroup = groups.find(g => g.id === child?.groupId);

  if (!child) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Данные спортсмена не найдены</h2>
        <p className="text-sm text-slate-500">Пожалуйста, используйте кнопку «Сбросить демо-данные к исходным» в верхней панели.</p>
      </div>
    );
  }

  const childDocs = documents.filter(d => d.athleteId === child.id);
  // Strictly filter only tasks published to family!
  const publishedTasks = tasks.filter(t => t.athleteId === child.id && t.publishedToFamily);

  // Next session
  const nextSession = sessions.find(s => s.id === 'ses-next') || sessions[sessions.length - 1];
  const childNextAttendance = nextSession ? ((nextSession.attendance && nextSession.attendance[child.id]) || 'present') : 'present';

  // 4-week rule attendance calculation for child
  const attendanceReport = calculateFourWeekAttendance(athletes, sessions);
  const childAttendanceRow = attendanceReport.find(r => r.athlete.id === child.id);

  // Modals and Request state
  const childPendingRequests = (documentRequests || []).filter(
    r => r && r.athleteId === child.id && r.status === 'pending'
  );
  const [uploadDocType, setUploadDocType] = useState<DocType>('medical');
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);
  const [taskFeedbackToast, setTaskFeedbackToast] = useState<string | null>(null);
  const taskFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (taskFeedbackTimerRef.current) {
        clearTimeout(taskFeedbackTimerRef.current);
      }
    };
  }, []);

  const showToast = (msg: string) => {
    if (taskFeedbackTimerRef.current) {
      clearTimeout(taskFeedbackTimerRef.current);
    }
    setTaskFeedbackToast(msg);
    taskFeedbackTimerRef.current = setTimeout(() => {
      setTaskFeedbackToast(null);
      taskFeedbackTimerRef.current = null;
    }, 4000);
  };

  const navTab = activeNav.startsWith('parent_') ? activeNav : 'parent_main';

  const handleTaskToggle = (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'completed' ? 'active' : 'completed';
    toggleTaskStatus(taskId, nextStatus);
    showToast(
      nextStatus === 'completed'
        ? 'Задача отмечена как выполненная ребёнком!'
        : 'Статус задачи возвращен в работу.'
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {taskFeedbackToast && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-md text-sm font-semibold flex items-center justify-between animate-fadeIn">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            {taskFeedbackToast}
          </span>
          <button onClick={() => setTaskFeedbackToast(null)} className="underline text-xs font-bold">
            ОК
          </button>
        </div>
      )}

      {/* Header (Slide 14) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 text-white font-black text-xl flex items-center justify-center shadow-md ring-4 ring-slate-100 shrink-0">
            {child.avatarInitials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
                Кабинет родителя
              </span>
              <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.2 rounded border border-emerald-200">
                {childGroup?.name || 'Группа самбо'}
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
            Тренер: {childGroup?.coachName || 'Иванов А. В.'}
          </span>
        </div>
      </div>

      {/* Active Coach Document Update Requests Notification Banner */}
      {childPendingRequests.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border-2 border-amber-400 rounded-2xl p-5 shadow-sm space-y-3 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <BellRing className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 bg-amber-200 px-2.5 py-0.5 rounded-full border border-amber-300">
                    Уведомление от тренера: требуется обновление документа
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {childPendingRequests[0].requestedBy} • {childPendingRequests[0].requestedAt}
                  </span>
                </div>
                <h3 className="font-extrabold text-base text-slate-900">
                  {childPendingRequests[0].title}
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed max-w-2xl">
                  {childPendingRequests[0].message}
                </p>
                <div className="text-[11px] text-amber-900 font-semibold pt-0.5">
                  Без актуального документа допуск к тренировочным схваткам и турнирам будет приостановлен.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
              <button
                onClick={() => {
                  setUploadDocType(childPendingRequests[0].docType);
                  setIsUploadModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-md shadow-red-900/20 transition flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Загрузить обновлённый документ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveNav('parent_main')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            navTab === 'parent_main'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          <span>Сводка ребёнка</span>
        </button>

        <button
          onClick={() => setActiveNav('parent_attendance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            navTab === 'parent_attendance'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Dumbbell className="w-4 h-4" />
          <span>Занятия и пропуски</span>
        </button>

        <button
          onClick={() => setActiveNav('parent_documents')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            navTab === 'parent_documents'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Документы ({childDocs.length})</span>
          {childPendingRequests.length > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] font-black rounded-full bg-amber-400 text-slate-950 border border-amber-500">
              {childPendingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveNav('parent_tasks')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            navTab === 'parent_tasks'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Задачи тренера ({publishedTasks.length})</span>
        </button>
      </div>

      {/* TAB 1: PARENT MAIN (OVERVIEW) */}
      {navTab === 'parent_main' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Widget «Ближайшее занятие» */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-red-600" />
                <h2 className="font-extrabold text-slate-900 text-base">Ближайшее занятие</h2>
              </div>
              <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                {formatRussianDate(nextSession.date, false)}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">Группа 1 • Самбо</span>
                <span className="font-mono text-xs font-bold text-slate-700">{nextSession.timeRange}</span>
              </div>
              <div className="text-xs text-slate-500">
                Тема: {nextSession.topic} (Зал самбо №1)
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

          {/* Widget «Над чем работаем» */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-red-600" />
                <h2 className="font-extrabold text-slate-900 text-base">Над чем работаем</h2>
              </div>
              <button
                onClick={() => setActiveNav('parent_tasks')}
                className="text-xs font-bold text-red-600 hover:underline"
              >
                Все задачи →
              </button>
            </div>

            {publishedTasks.length > 0 ? (
              publishedTasks.slice(0, 2).map(task => (
                <div key={task.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-start justify-between">
                    <span className="font-bold text-sm text-slate-900">{task.exerciseTitle}</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                      task.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {task.status === 'completed' ? 'Выполнено' : 'Активно'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600">
                    Навык: <strong>{task.skillTitle}</strong>
                  </div>
                  <div className="text-xs text-slate-500">
                    Срок контроля: {task.deadline}
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

          {/* Widget Documents Overview */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-red-600" />
                <h2 className="font-extrabold text-slate-900 text-base">Документы ребёнка</h2>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Передать документ</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {childDocs.map(doc => {
                const expStatus = getDocumentExpiryStatus(doc.expiryDate);
                const isUnverified = doc.verificationStatus === 'unverified';
                const isVerified = doc.verificationStatus === 'verified';
                const isExpiring = expStatus === 'expiring_soon';
                const hasPendingReq = childPendingRequests.some(r => r.docType === doc.type);

                return (
                  <div
                    key={doc.id}
                    className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition ${
                      hasPendingReq
                        ? 'border-amber-400 bg-amber-50/60 shadow-sm ring-1 ring-amber-300'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">{doc.title}</span>
                        <div className="flex items-center gap-1">
                          {hasPendingReq && (
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 border border-amber-300">
                              Запрошено
                            </span>
                          )}
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                            v{doc.version}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Годен до: {doc.expiryDate || 'Бессрочно'}
                      </div>
                      {hasPendingReq && (
                        <div className="text-[11px] text-amber-900 font-semibold mt-1.5 p-1.5 rounded bg-amber-100/80 border border-amber-200">
                          ⚠️ Тренер запросил обновление
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <div>
                        {hasPendingReq ? (
                          <span className="text-[10px] font-black text-amber-900 bg-amber-200 px-2 py-0.5 rounded border border-amber-300">
                            Требует замены
                          </span>
                        ) : isUnverified ? (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                            На проверке
                          </span>
                        ) : isVerified && !isExpiring ? (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                            Подтверждено
                          </span>
                        ) : isExpiring ? (
                          <span className="text-[10px] font-bold text-red-800 bg-red-100 px-2 py-0.5 rounded">
                            Истекает
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        {hasPendingReq && (
                          <button
                            onClick={() => {
                              setUploadDocType(doc.type);
                              setIsUploadModalOpen(true);
                            }}
                            className="text-xs font-bold text-amber-900 hover:text-amber-950 underline"
                          >
                            Обновить
                          </button>
                        )}
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="text-xs font-bold text-red-600 hover:underline"
                        >
                          Открыть
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PARENT ATTENDANCE */}
      {navTab === 'parent_attendance' && (
        <div className="space-y-6">
          {/* Regularity Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Дисциплина и посещаемость за 4 недели
              </div>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-3xl font-black text-slate-900">
                  {childAttendanceRow ? `${childAttendanceRow.ratePercent}%` : '100%'}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  База: {childAttendanceRow?.presentCount || 0} из {childAttendanceRow?.effectiveBaseE || 0} занятий
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Уважительных пропусков: {childAttendanceRow?.excusedCount || 0} (исключены из базы и не снижают процент)
              </p>
            </div>

            <button
              onClick={() => setIsAbsenceModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-900/20 transition flex items-center gap-2 self-start md:self-auto"
            >
              <CalendarX className="w-4 h-4" />
              <span>Сообщить о будущем пропуске</span>
            </button>
          </div>

          {/* Sessions List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-extrabold text-sm text-slate-900">
              История занятий группы
            </div>

            <div className="divide-y divide-slate-100">
              {sessions.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  История занятий группы пуста.
                </div>
              ) : (
                sessions.map(s => {
                  const status = (s.attendance && s.attendance[child.id]) || 'unmarked';
                  const excReason = s.exceptions && s.exceptions[child.id];

                return (
                  <div key={s.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{formatRussianDate(s.date, false)}</span>
                        <span className="text-xs font-mono text-slate-500 font-semibold">{s.timeRange}</span>
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">{s.topic}</div>
                      {status === 'excused' && excReason && (
                        <div className="text-[11px] text-blue-700 font-semibold mt-1">
                          Причина: {excReason}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0">
                      {status === 'present' && (
                        <span className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Был на тренировке
                        </span>
                      )}
                      {status === 'absent' && (
                        <span className="px-3 py-1 rounded-lg bg-red-100 text-red-800 text-xs font-bold inline-flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Отсутствовал
                        </span>
                      )}
                      {status === 'excused' && (
                        <span className="px-3 py-1 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Уважительный пропуск
                        </span>
                      )}
                      {status === 'unmarked' && (
                        <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold inline-flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5" /> Запланировано
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PARENT DOCUMENTS */}
      {navTab === 'parent_documents' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Пакет документов спортсмена</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Медицинские справки, полисы страхования и согласия на участие в тренировках
              </p>
            </div>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-900/20 transition flex items-center gap-2 self-start sm:self-auto"
            >
              <Upload className="w-4 h-4" />
              <span>Загрузить новый документ</span>
            </button>
          </div>

          {childPendingRequests.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex items-start gap-3.5 shadow-sm animate-fadeIn">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <div className="font-extrabold text-sm text-slate-900">
                  Внимание: поступил запрос на обновление документов
                </div>
                <div className="text-xs text-amber-950 leading-relaxed">
                  Тренерский штаб ожидает новую копию для следующих документов:{' '}
                  <strong>{childPendingRequests.map(r => r.title).join(', ')}</strong>.
                  Нажмите кнопку «Обновить» на соответствующей карточке ниже для быстрой отправки.
                </div>
              </div>
            </div>
          )}

          {childDocs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
              Нет загруженных документов. Нажмите «Загрузить новый документ» выше.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {childDocs.map(doc => {
                const expStatus = getDocumentExpiryStatus(doc.expiryDate);
                const isUnverified = doc.verificationStatus === 'unverified';
                const isVerified = doc.verificationStatus === 'verified';
                const isExpiring = expStatus === 'expiring_soon';
                const hasPendingReq = childPendingRequests.some(r => r.docType === doc.type);
                const reqDetail = childPendingRequests.find(r => r.docType === doc.type);

                return (
                  <div
                    key={doc.id}
                    className={`bg-white rounded-2xl border p-5 shadow-sm flex flex-col justify-between space-y-4 transition ${
                      hasPendingReq
                        ? 'border-amber-400 ring-2 ring-amber-300/70 bg-gradient-to-b from-amber-50/50 via-white to-white'
                        : 'border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-sm text-slate-900">{doc.title}</div>
                          {hasPendingReq && (
                            <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 border border-amber-300">
                              <AlertTriangle className="w-3 h-3 text-amber-700" /> Запрошено обновление
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                          v{doc.version}
                        </span>
                      </div>

                      <div className="mt-2 space-y-1 text-xs text-slate-500">
                        <div>Файл: <code className="font-mono text-slate-700">{doc.fileName}</code></div>
                        <div>Дата передачи: {doc.uploadDate}</div>
                        {doc.expiryDate && (
                          <div className="font-semibold text-slate-800">Действует до: {doc.expiryDate}</div>
                        )}
                      </div>

                      {hasPendingReq && reqDetail && (
                        <div className="mt-3 p-3 rounded-xl bg-amber-100/90 border border-amber-300 text-xs text-amber-950 space-y-1 shadow-2xs">
                          <div className="font-black flex items-center gap-1.5 text-amber-900">
                            <Send className="w-3.5 h-3.5 text-amber-800" /> Запрос от: {reqDetail.requestedBy}
                          </div>
                          <div className="text-[11px] text-slate-700 leading-snug">
                            {reqDetail.message}
                          </div>
                        </div>
                      )}

                      {doc.verifierComment && (
                        <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                          <span className="font-bold">Замечание: </span>{doc.verifierComment}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        {hasPendingReq ? (
                          <span className="text-[11px] font-black text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded border border-amber-300">
                            Требуется замена
                          </span>
                        ) : isUnverified ? (
                          <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                            На проверке контролёром
                          </span>
                        ) : isVerified && !isExpiring ? (
                          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                            Проверено и одобрено
                          </span>
                        ) : isExpiring ? (
                          <span className="text-[11px] font-bold text-red-800 bg-red-100 px-2 py-0.5 rounded border border-red-200">
                            Истекает срок действия
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2">
                        {hasPendingReq && (
                          <button
                            onClick={() => {
                              setUploadDocType(doc.type);
                              setIsUploadModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-sm transition flex items-center gap-1"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Обновить</span>
                          </button>
                        )}
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1"
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
          )}
        </div>
      )}

      {/* TAB 4: PARENT TASKS */}
      {navTab === 'parent_tasks' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">Индивидуальные задачи от тренера</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Упражнения для домашней отработки и закрепления навыков самбо
            </p>
          </div>

          <div className="space-y-4">
            {publishedTasks.length > 0 ? (
              publishedTasks.map(task => {
                const isCompleted = task.status === 'completed';

                return (
                  <div
                    key={task.id}
                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div>
                        <div className="text-xs font-bold text-red-600 uppercase tracking-wider">
                          Навык: {task.skillTitle}
                        </div>
                        <h3 className="text-base font-black text-slate-900 mt-0.5">
                          {task.exerciseTitle}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                          isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isCompleted ? 'Выполнено' : 'В работе'}
                        </span>
                        <button
                          onClick={() => handleTaskToggle(task.id, task.status)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                            isCompleted
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                          }`}
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>{isCompleted ? 'Вернуть в работу' : 'Отметить выполненным'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600">
                      <span className="font-bold text-slate-800">Наблюдение тренера: </span>
                      {task.observation}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span>Срок выполнения: <strong>{task.deadline}</strong></span>
                      {task.completedAt && <span>Завершено: {task.completedAt}</span>}
                    </div>

                    {task.coachFeedback && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950">
                        <span className="font-bold">Комментарий тренера: </span>
                        {task.coachFeedback}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
                Нет опубликованных индивидуальных задач.
              </div>
            )}
          </div>
        </div>
      )}

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
          defaultType={uploadDocType}
          onSuccess={() => showToast('Новый документ передан на верификацию! Запрос тренера успешно выполнен.')}
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
