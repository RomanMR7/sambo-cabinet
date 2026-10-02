import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Shield,
  Users,
  Calendar,
  Lock,
  CheckCircle2,
  Building,
  Edit,
  Plus
} from 'lucide-react';
import { EditGroupModal } from '../../components/modals/EditGroupModal';
import { EditScheduleSlotModal } from '../../components/modals/EditScheduleSlotModal';
import { ScheduleSlot } from '../../types';

export const AdminView: React.FC = () => {
  const { groupInfo, scheduleSlots, activeNav, setActiveNav } = useApp();

  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [isEditGroupOpen, setIsEditGroupOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ScheduleSlot | null | undefined>(undefined);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const navTab = activeNav.startsWith('admin_') ? activeNav : 'admin_main';

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleMedicalDocClick = () => {
    setSecurityModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast */}
      {toastMsg && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-md text-sm font-semibold flex items-center justify-between animate-fadeIn">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            {toastMsg}
          </span>
          <button onClick={() => setToastMsg(null)} className="underline text-xs font-bold">
            ОК
          </button>
        </div>
      )}

      {/* Security Warning Modal */}
      {securityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-red-200 overflow-hidden flex flex-col p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Доступ заблокирован</h3>
                <p className="text-xs text-red-600 font-semibold">Защита персональных и медицинских данных</p>
              </div>
            </div>

            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-950 leading-relaxed">
              <span className="font-bold">Системное ограничение матрицы доступа: </span>
              У роли <span className="font-bold">Администратор</span> нет медицинского допуска.
              Медицинские копии закрыты по умолчанию в соответствии с законодательством о защите персональных данных и врачебной тайны.
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSecurityModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
              >
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header (Slide 16) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" />
            <span>Панель администратора клуба</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Управление клубом и группами
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Организационная структура • Сетка расписания • Права доступа
          </p>
        </div>

        <button
          onClick={() => setIsEditGroupOpen(true)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-sm transition flex items-center gap-1.5"
        >
          <Edit className="w-4 h-4" />
          <span>Настроить группу</span>
        </button>
      </div>

      {/* System Security Banner */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-white">
                Системный баннер безопасности: Медицинские копии закрыты по умолчанию
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                Защита данных
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Администратор управляет организационными параметрами группы, составом и залами. Доступ к сканам медицинских справок требует специального медицинского допуска.
            </p>
          </div>
        </div>

        <button
          onClick={handleMedicalDocClick}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold shrink-0 transition border border-slate-700 flex items-center gap-1.5 self-start md:self-auto"
        >
          <Lock className="w-3.5 h-3.5 text-red-400" />
          <span>Тест клика по меддокументу</span>
        </button>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveNav('admin_main')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            navTab === 'admin_main'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Группы клуба</span>
        </button>

        <button
          onClick={() => setActiveNav('admin_schedule')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            navTab === 'admin_schedule'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Расписание занятий</span>
        </button>

        <button
          onClick={() => setActiveNav('admin_roles')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            navTab === 'admin_roles'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Роли и назначения</span>
        </button>

        <button
          onClick={() => setActiveNav('admin_security')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            navTab === 'admin_security'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Контур безопасности</span>
        </button>
      </div>

      {/* TAB 1: ADMIN MAIN (GROUPS OVERVIEW) */}
      {navTab === 'admin_main' && (
        <div className="space-y-6">
          {/* Counters at top */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Структура</div>
              <div className="text-2xl font-black text-slate-900 mt-2">1 группа</div>
              <div className="text-xs text-slate-500 mt-1">{groupInfo.name}</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Спортсмены</div>
              <div className="text-2xl font-black text-slate-900 mt-2">{groupInfo.athleteCount} спортсменов</div>
              <div className="text-xs text-slate-500 mt-1">Активный состав клуба</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Тренерский состав</div>
              <div className="text-2xl font-black text-slate-900 mt-2">1 тренер</div>
              <div className="text-xs text-slate-500 mt-1">{groupInfo.coachName}</div>
            </div>
          </div>

          {/* Groups Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-sm">Группы клуба</h3>
              <button
                onClick={() => setIsEditGroupOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition"
              >
                Редактировать группу
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[500px]">
                <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Группа</th>
                    <th className="py-3.5 px-4">Тренер</th>
                    <th className="py-3.5 px-4">Расписание</th>
                    <th className="py-3.5 px-4 text-center">Состав</th>
                    <th className="py-3.5 px-4 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="py-4 px-4 font-bold text-slate-900 text-sm">{groupInfo.name}</td>
                    <td className="py-4 px-4 font-medium text-slate-700">{groupInfo.coachName}</td>
                    <td className="py-4 px-4 font-mono text-slate-600">{groupInfo.schedule}</td>
                    <td className="py-4 px-4 text-center font-bold text-slate-900">{groupInfo.athleteCount}</td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => setIsEditGroupOpen(true)}
                        className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                      >
                        Настроить
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ADMIN SCHEDULE */}
      {navTab === 'admin_schedule' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Сетка расписания залов и групп</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Назначение тренировочных дней, залов и тренерского состава
              </p>
            </div>

            <button
              onClick={() => setEditingSlot(null)}
              className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>+ Добавить занятие в сетку</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {scheduleSlots.map(item => (
              <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 text-base">{item.day}</span>
                  <span className="text-xs font-mono font-bold bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded">
                    {item.time}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-600">
                  <div><strong>Зал:</strong> {item.hall}</div>
                  <div><strong>Тренер:</strong> {item.coach}</div>
                  <div><strong>Группа:</strong> {item.group}</div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Утверждено
                  </span>
                  <button
                    onClick={() => setEditingSlot(item)}
                    className="text-xs font-bold text-red-600 hover:underline"
                  >
                    Изменить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ADMIN ROLES */}
      {navTab === 'admin_roles' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Матрица ролей и доступ</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Разграничение полномочий между тренерами, верификаторами и администрацией
              </p>
            </div>

            <button
              onClick={() => showToast('Права ролей сохранены в политику безопасности!')}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition"
            >
              Сохранить политику
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-900 text-sm">Тренер: Иванов А. В.</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Активен</span>
              </div>
              <p className="text-xs text-slate-600">
                Полный доступ к спортивному журналу, индивидуальным траекториям S/3S, посещаемости и принятию решений о спортивном допуске.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-900">Проверяющий: Смирнова В. А.</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Активен</span>
              </div>
              <p className="text-xs text-slate-600">
                Доступ к очереди проверки медицинских справок, страховок и согласий. Проверяет подлинность и сроки действия документов.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-900">Родители (24 учетных записи)</span>
                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">Изолирован</span>
              </div>
              <p className="text-xs text-slate-600">
                Доступ строго ограничен данными собственного ребёнка. Возможность загружать справки и заявлять об уважительных пропусках.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-900">Администратор: Михайлов Д. П.</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Активен</span>
              </div>
              <p className="text-xs text-slate-600">
                Управление группами, расписанием и правами. Медицинские файлы закрыты по умолчанию (требуется спец. допуск).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ADMIN SECURITY */}
      {navTab === 'admin_security' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-black text-slate-900">Контур информационной безопасности</h2>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-700 leading-relaxed">
              <div className="font-bold text-slate-900 text-sm">Правила изоляции медицинских данных:</div>
              <p>
                1. Сканы медицинских справок спортсменов хранятся в защищенном контуре и доступны исключительно спортивному врачу / контролёру.
              </p>
              <p>
                2. Администратор школы видит только организационные метаданные (наличие или отсутствие подтверждения), но не содержание медзаключений.
              </p>
              <p>
                3. Решение о допуске принимается отдельно тренером на основании статуса проверки документа.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={handleMedicalDocClick}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center gap-2"
              >
                <Lock className="w-4 h-4 text-red-400" />
                <span>Проверить блокировку доступа к медфайлу</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Group Modal */}
      {isEditGroupOpen && (
        <EditGroupModal
          onClose={() => setIsEditGroupOpen(false)}
          onSaved={() => showToast('Параметры группы успешно сохранены!')}
        />
      )}

      {/* Edit Schedule Slot Modal */}
      {editingSlot !== undefined && (
        <EditScheduleSlotModal
          slot={editingSlot}
          onClose={() => setEditingSlot(undefined)}
          onSaved={() => showToast('Расписание успешно обновлено!')}
        />
      )}
    </div>
  );
};
