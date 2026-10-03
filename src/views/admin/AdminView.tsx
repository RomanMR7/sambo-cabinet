import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Shield,
  Users,
  Calendar,
  Lock,
  CheckCircle2,
  Building,
  Edit,
  Plus,
  Database,
  Download,
  Upload,
  Crown,
  UserCheck,
  Trash2,
  Search,
  Phone,
  Mail,
  UserPlus
} from 'lucide-react';
import { EditGroupModal } from '../../components/modals/EditGroupModal';
import { EditScheduleSlotModal } from '../../components/modals/EditScheduleSlotModal';
import { AddStaffModal } from '../../components/modals/AddStaffModal';
import { ScheduleSlot } from '../../types';

export const AdminView: React.FC = () => {
  const {
    groups,
    selectedGroupId,
    clubUsers,
    setHeadManager,
    toggleVerifierRole,
    deleteClubUser,
    athletes,
    scheduleSlots,
    activeNav,
    setActiveNav,
    downloadBackup,
    importData,
    storageError,
    clearStorageError
  } = useApp();

  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingSlot, setEditingSlot] = useState<ScheduleSlot | null | undefined>(undefined);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && securityModalOpen) {
        setSecurityModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [securityModalOpen]);

  // Filters for roles tab
  const [rolesSearch, setRolesSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'coach' | 'verifier'>('all');

  const navTab = activeNav.startsWith('admin_') ? activeNav : 'admin_main';

  const showToast = (msg: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMsg(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMsg(null);
      toastTimerRef.current = null;
    }, 3500);
  };

  const handleMedicalDocClick = () => {
    setSecurityModalOpen(true);
  };

  // Find head manager
  const currentHeadManager =
    clubUsers.find(u => u.isHeadManager) ||
    clubUsers.find(u => u.role === 'admin') ||
    clubUsers[0];

  // Active athletes count across all groups
  const activeAthletesCount = athletes.filter(a => a.isActive).length;
  const coachesCount = clubUsers.filter(u => u.role === 'coach').length;

  // Filtered users for roles tab
  const filteredUsers = clubUsers.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (rolesSearch.trim()) {
      const q = rolesSearch.toLowerCase();
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.title.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

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
        <div
          onClick={e => {
            if (e.target === e.currentTarget) setSecurityModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn"
        >
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
          onClick={() => setEditingGroupId(selectedGroupId || groups[0]?.id || 'grp-1')}
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
              Администратор управляет организационными параметрами групп, составом и залами. Доступ к сканам медицинских справок требует специального медицинского допуска.
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
          <span>Роли и назначения ({clubUsers.length})</span>
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
              <div className="text-2xl font-black text-slate-900 mt-2">{groups.length} группы</div>
              <div className="text-xs text-slate-500 mt-1">Школа спортивного и боевого самбо</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Спортсмены</div>
              <div className="text-2xl font-black text-slate-900 mt-2">{activeAthletesCount} спортсменов</div>
              <div className="text-xs text-slate-500 mt-1">Активный состав клуба во всех группах</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Тренерский состав</div>
              <div className="text-2xl font-black text-slate-900 mt-2">{coachesCount} тренера</div>
              <div className="text-xs text-slate-500 mt-1">Штатные спортивные наставники</div>
            </div>
          </div>

          {/* Groups Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Группы клуба</h3>
                <p className="text-xs text-slate-500">
                  Нажмите «Настроить» для изменения расписания, смены тренера или управления составом спортсменов
                </p>
              </div>
              <button
                onClick={() => setEditingGroupId(groups[0]?.id || 'grp-1')}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Редактировать группу</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[600px]">
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
                  {groups.map(g => {
                    const athletesInGroup = athletes.filter(a => a.groupId === g.id && a.isActive);
                    return (
                      <tr key={g.id} className="hover:bg-slate-50 transition">
                        <td className="py-4 px-4 font-bold text-slate-900 text-sm">
                          {g.name}
                        </td>
                        <td className="py-4 px-4 font-medium text-slate-700">
                          {g.coachName}
                        </td>
                        <td className="py-4 px-4 font-mono text-slate-600">
                          {g.schedule}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="font-extrabold text-slate-900 px-2.5 py-1 rounded-full bg-slate-100 text-xs">
                            {athletesInGroup.length} атл.
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => setEditingGroupId(g.id)}
                            className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-600 text-red-700 hover:text-white font-bold border border-red-200 hover:border-red-600 transition"
                          >
                            Настроить
                          </button>
                        </td>
                      </tr>
                    );
                  })}
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

          {scheduleSlots.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
              Сетка расписания пуста. Добавьте первое занятие с помощью кнопки выше.
            </div>
          ) : (
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
          )}
        </div>
      )}

      {/* TAB 3: ADMIN ROLES & USERS */}
      {navTab === 'admin_roles' && (
        <div className="space-y-6">
          {/* Current Club Manager Highlight Card */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 rounded-2xl text-white p-6 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                <Crown className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Текущий управляющий школы самбо
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-400 text-slate-950">
                    АКТИВЕН
                  </span>
                </div>
                <h2 className="text-xl font-black text-white mt-0.5">
                  {currentHeadManager?.fullName || 'Михайлов Дмитрий Павлович'}
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  {currentHeadManager?.title} • {currentHeadManager?.phone} • {currentHeadManager?.email}
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-300 bg-black/30 p-3 rounded-xl border border-white/10 max-w-xs leading-relaxed">
              Вы можете назначить любого другого администратора или тренера управляющим клуба с помощью кнопки в таблице ниже.
            </div>
          </div>

          {/* Action Bar & Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setRoleFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  roleFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Все сотрудники ({clubUsers.length})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('admin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  roleFilter === 'admin'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Администрация ({clubUsers.filter(u => u.role === 'admin').length})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('coach')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  roleFilter === 'coach'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Тренеры ({clubUsers.filter(u => u.role === 'coach').length})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('verifier')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  roleFilter === 'verifier'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Проверяющие ({clubUsers.filter(u => u.role === 'verifier').length})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={rolesSearch}
                  onChange={e => setRolesSearch(e.target.value)}
                  placeholder="Поиск по ФИО/должности..."
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs w-48 sm:w-56 focus:outline-none focus:border-red-500"
                />
              </div>

              <button
                onClick={() => setIsAddStaffOpen(true)}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-sm transition flex items-center gap-1.5 shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Добавить сотрудника</span>
              </button>
            </div>
          </div>

          {/* Interactive Staff Users Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Сотрудник</th>
                    <th className="py-3.5 px-4">Роль</th>
                    <th className="py-3.5 px-4">Контакты</th>
                    <th className="py-3.5 px-4">Статус управляющего</th>
                    <th className="py-3.5 px-4">Контроль документов</th>
                    <th className="py-3.5 px-4 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map(user => {
                    const initials = user.fullName
                      .split(' ')
                      .map(p => p[0])
                      .slice(0, 2)
                      .join('');

                    return (
                      <tr key={user.id} className="hover:bg-slate-50 transition">
                        {/* Name & Title */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {initials}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <span>{user.fullName}</span>
                                {user.isHeadManager && (
                                  <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                )}
                              </div>
                              <div className="text-slate-500 text-xs mt-0.5">{user.title}</div>
                            </div>
                          </div>
                        </td>

                        {/* System Role */}
                        <td className="py-3.5 px-4">
                          {user.role === 'admin' ? (
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900 text-white">
                              Администратор
                            </span>
                          ) : user.role === 'coach' ? (
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-800">
                              Тренер
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800">
                              Проверяющий
                            </span>
                          )}
                        </td>

                        {/* Contacts */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5 text-slate-600 font-medium">
                            <div className="flex items-center gap-1 font-mono">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{user.phone}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-500">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{user.email}</span>
                            </div>
                          </div>
                        </td>

                        {/* Head Manager Column */}
                        <td className="py-3.5 px-4">
                          {user.isHeadManager ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300">
                              <Crown className="w-3.5 h-3.5 text-amber-600" />
                              Управляющий клуба
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setHeadManager(user.id);
                                showToast(`Управляющим клуба назначен ${user.fullName}`);
                              }}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition"
                            >
                              Сделать управляющим
                            </button>
                          )}
                        </td>

                        {/* Verifier Role Column */}
                        <td className="py-3.5 px-4">
                          {user.isVerifierAssigned ? (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                <UserCheck className="w-3 h-3 text-emerald-600" />
                                Назначен
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  toggleVerifierRole(user.id);
                                  showToast(`Сняты полномочия проверки у ${user.fullName}`);
                                }}
                                className="text-[11px] text-slate-400 hover:text-red-600 font-semibold"
                                title="Снять права проверки"
                              >
                                Снять
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                toggleVerifierRole(user.id);
                                showToast(`${user.fullName} назначен проверяющим документов!`);
                              }}
                              className="px-2 py-1 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-800 text-[11px] font-semibold border border-slate-200 hover:border-emerald-300 transition"
                            >
                              + Назначить
                            </button>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          {!user.isHeadManager && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Удалить сотрудника ${user.fullName} из системы?`)) {
                                  deleteClubUser(user.id);
                                  showToast(`Сотрудник ${user.fullName} удален`);
                                }
                              }}
                              className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                              title="Удалить сотрудника"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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

          {/* Backup & Data Integrity Block */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-black text-slate-900">Резервное копирование и отказоустойчивость</h2>
            </div>

            {storageError && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-center justify-between">
                <span>{storageError}</span>
                <button onClick={clearStorageError} className="underline text-xs font-bold text-red-700">Закрыть</button>
              </div>
            )}

            <p className="text-xs text-slate-600 leading-relaxed">
              Система обеспечивает локальное сохранение состояния с защитой от сбоев (QuotaExceededError, синтаксические ошибки JSON, приватный режим). Вы можете экспортировать архив данных в JSON или восстановить базу клуба из копии.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => {
                  downloadBackup();
                  showToast('Резервная копия успешно экспортирована и скачана!');
                }}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition flex items-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Скачать резервную копию (JSON)</span>
              </button>

              <label className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition flex items-center gap-2 cursor-pointer border border-slate-300">
                <Upload className="w-4 h-4 text-slate-600" />
                <span>Восстановить из файла</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const content = event.target?.result as string;
                        const res = importData(content);
                        if (res.success) {
                          showToast('База данных успешно восстановлена из резервной копии!');
                        } else {
                          alert(res.error || 'Ошибка восстановления данных');
                        }
                      };
                      reader.readAsText(file);
                    }
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Edit Group Modal */}
      {editingGroupId !== null && (
        <EditGroupModal
          groupId={editingGroupId}
          onClose={() => setEditingGroupId(null)}
          onSaved={() => showToast('Параметры и состав группы успешно обновлены!')}
        />
      )}

      {/* Add Staff Modal */}
      {isAddStaffOpen && (
        <AddStaffModal
          onClose={() => setIsAddStaffOpen(false)}
          onSaved={(name) => showToast(`Сотрудник ${name} успешно внесен в реестр клуба!`)}
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
