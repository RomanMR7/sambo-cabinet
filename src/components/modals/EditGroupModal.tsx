import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Settings,
  Users,
  Save,
  AlertCircle,
  ArrowRightLeft,
  UserMinus,
  UserPlus,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

interface Props {
  groupId?: string;
  onClose: () => void;
  onSaved?: () => void;
}

export const EditGroupModal: React.FC<Props> = ({ groupId, onClose, onSaved }) => {
  const {
    groups,
    selectedGroupId,
    clubUsers,
    athletes,
    updateGroup,
    moveAthleteToGroup,
    expelAthlete,
    addAthleteToGroup
  } = useApp();

  const currentGroupId = groupId || selectedGroupId || groups[0]?.id || 'grp-1';
  const targetGroup = groups.find(g => g.id === currentGroupId) || groups[0];

  const [activeTab, setActiveTab] = useState<'params' | 'roster'>('params');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parameters form state
  const [name, setName] = useState(targetGroup?.name || '');
  const [coachName, setCoachName] = useState(targetGroup?.coachName || '');
  const [schedule, setSchedule] = useState(targetGroup?.schedule || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  const triggerSuccessMsg = (msg: string) => {
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    setSuccessMsg(msg);
    successTimerRef.current = setTimeout(() => {
      setSuccessMsg(null);
      successTimerRef.current = null;
    }, 3000);
  };

  // Transfer modal state
  const [transferAthleteId, setTransferAthleteId] = useState<string | null>(null);
  const [targetTransferGroupId, setTargetTransferGroupId] = useState<string>(
    groups.find(g => g.id !== currentGroupId)?.id || ''
  );

  // New Athlete form inside roster tab
  const [isAddingAthlete, setIsAddingAthlete] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newBirthDate, setNewBirthDate] = useState('2015-05-10');
  const [newParentName, setNewParentName] = useState('');
  const [newParentPhone, setNewParentPhone] = useState('+7 (');
  const [newAthletePhone, setNewAthletePhone] = useState('');
  const [newAthleteError, setNewAthleteError] = useState<string | null>(null);

  // Coach list from clubUsers
  const availableCoaches = clubUsers.filter(u => u.role === 'coach');

  // Athletes currently in this group
  const groupAthletes = athletes.filter(a => a.groupId === targetGroup?.id && a.isActive);
  const otherGroups = groups.filter(g => g.id !== targetGroup?.id);

  const handleSaveParams = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!name.trim() || name.trim().length < 3) {
      setErrorMsg('Укажите название группы (не менее 3 символов).');
      return;
    }
    if (!coachName.trim()) {
      setErrorMsg('Выберите ответственного тренера группы.');
      return;
    }
    if (!schedule.trim() || schedule.trim().length < 3) {
      setErrorMsg('Укажите расписание тренировок (не менее 3 символов).');
      return;
    }

    setIsSubmitting(true);
    try {
      if (targetGroup) {
        updateGroup(targetGroup.id, {
          name: name.trim(),
          coachName: coachName.trim(),
          schedule: schedule.trim()
        });
      }
      triggerSuccessMsg('Параметры группы успешно сохранены!');
      if (onSaved) onSaved();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmTransfer = (athleteId: string) => {
    if (isSubmitting) return;
    const targetId = targetTransferGroupId || otherGroups[0]?.id;
    if (!athleteId || !targetId) return;

    setIsSubmitting(true);
    try {
      moveAthleteToGroup(athleteId, targetId);
      setTransferAthleteId(null);
      triggerSuccessMsg('Спортсмен успешно переведен в другую группу!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExpelAthlete = (athleteId: string, athleteName: string) => {
    if (window.confirm(`Вы действительно хотите отчислить спортсмена ${athleteName} из группы?`)) {
      expelAthlete(athleteId);
      triggerSuccessMsg(`Спортсмен ${athleteName} отчислен из состава.`);
    }
  };

  const handleCreateAthlete = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedFull = newFullName.trim();
    if (!trimmedFull || trimmedFull.length < 5) {
      setNewAthleteError('Укажите полные ФИО спортсмена (не менее 5 символов).');
      return;
    }

    if (!newBirthDate) {
      setNewAthleteError('Укажите дату рождения спортсмена.');
      return;
    }
    const todayStr = new Date().toISOString().slice(0, 10);
    if (newBirthDate > todayStr) {
      setNewAthleteError('Дата рождения не может быть в будущем.');
      return;
    }
    if (newBirthDate < '1920-01-01') {
      setNewAthleteError('Укажите корректную дату рождения.');
      return;
    }

    const trimmedParent = newParentName.trim() || 'Родитель спортсмена';
    const trimmedParentPhone = newParentPhone.trim();
    if (trimmedParentPhone && trimmedParentPhone !== '+7 (' && trimmedParentPhone.length < 7) {
      setNewAthleteError('Телефон родителя должен содержать не менее 7 знаков.');
      return;
    }
    const finalParentPhone = (trimmedParentPhone && trimmedParentPhone !== '+7 (') ? trimmedParentPhone : '+7 (999) 000-00-00';

    const parts = trimmedFull.split(/\s+/);
    const shortName = parts.length > 1 ? `${parts[1]} ${parts[0][0]}.` : trimmedFull;

    setIsSubmitting(true);
    try {
      addAthleteToGroup({
        fullName: trimmedFull,
        shortName,
        groupId: targetGroup.id,
        isActive: true,
        birthDate: newBirthDate,
        parentName: trimmedParent,
        parentPhone: finalParentPhone,
        athletePhone: newAthletePhone.trim() || '',
        admissionDecision: {
          status: 'pending',
          basis: 'Новый спортсмен, ожидает медзаключения',
          reviewedAt: new Date().toISOString().slice(0, 10),
          reviewedBy: targetGroup.coachName || 'Тренер'
        }
      });

      setNewFullName('');
      setNewParentName('');
      setNewParentPhone('+7 (');
      setNewAthletePhone('');
      setIsAddingAthlete(false);
      setNewAthleteError(null);
      triggerSuccessMsg('Спортсмен успешно добавлен в состав группы!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shrink-0">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-snug">
                {targetGroup?.name || 'Настройка группы'}
              </h3>
              <p className="text-xs text-slate-400">
                Тренер: {targetGroup?.coachName} • {groupAthletes.length} спортсменов
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

        {/* Tab Switcher */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-6 pt-3">
          <button
            type="button"
            onClick={() => setActiveTab('params')}
            className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
              activeTab === 'params'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Параметры группы</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
              activeTab === 'roster'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Состав спортсменов ({groupAthletes.length})</span>
          </button>
        </div>

        {/* Success Banner */}
        {successMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 flex items-center gap-2 text-xs text-emerald-800 font-semibold animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: GROUP PARAMETERS */}
          {activeTab === 'params' && (
            <form onSubmit={handleSaveParams} className="space-y-4">
              {errorMsg && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 flex items-center gap-2 text-xs text-red-800 font-semibold">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Название группы *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => {
                    setName(e.target.value);
                    setErrorMsg(null);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  placeholder="Группа 1 (Начальная подготовка)"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Назначенный тренер *
                </label>
                <select
                  value={coachName}
                  onChange={e => {
                    setCoachName(e.target.value);
                    setErrorMsg(null);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white"
                >
                  {availableCoaches.map(c => (
                    <option key={c.id} value={c.fullName}>
                      {c.fullName} ({c.title})
                    </option>
                  ))}
                  {/* Fallback if current coach not in available list */}
                  {!availableCoaches.some(c => c.fullName === coachName) && coachName && (
                    <option value={coachName}>{coachName}</option>
                  )}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Список формируется из сотрудников с системной ролью «Тренер».
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Расписание тренировок *
                </label>
                <input
                  type="text"
                  required
                  value={schedule}
                  onChange={e => {
                    setSchedule(e.target.value);
                    setErrorMsg(null);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-mono"
                  placeholder="Вт, Чт 18:00–19:00"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Закрыть
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-900/20 transition flex items-center gap-1.5 ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: ATHLETES ROSTER */}
          {activeTab === 'roster' && (
            <div className="space-y-4">
              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    Активный список: {groupAthletes.length} спортсменов
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Управление зачислением, переводами и отчислением
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddingAthlete(prev => !prev)}
                  className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isAddingAthlete ? 'Скрыть форму' : '+ Добавить спортсмена'}</span>
                </button>
              </div>

              {/* Add Athlete Inline Form */}
              {isAddingAthlete && (
                <form
                  onSubmit={handleCreateAthlete}
                  className="p-4 rounded-xl bg-red-50/50 border border-red-200 space-y-3 animate-fadeIn"
                >
                  <div className="font-extrabold text-xs text-red-900 flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-red-600" />
                    <span>Новый спортсмен в группу «{targetGroup.name}»</span>
                  </div>

                  {newAthleteError && (
                    <div className="text-xs text-red-600 font-semibold bg-red-100 p-2 rounded-lg">
                      {newAthleteError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        ФИО спортсмена *
                      </label>
                      <input
                        type="text"
                        required
                        value={newFullName}
                        onChange={e => setNewFullName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:border-red-500"
                        placeholder="Ковалёв Артем Сергеевич"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Дата рождения
                      </label>
                      <input
                        type="date"
                        value={newBirthDate}
                        onChange={e => setNewBirthDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:border-red-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        ФИО родителя
                      </label>
                      <input
                        type="text"
                        value={newParentName}
                        onChange={e => setNewParentName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:border-red-500"
                        placeholder="Ковалёва Марина И."
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Телефон родителя
                      </label>
                      <input
                        type="text"
                        value={newParentPhone}
                        onChange={e => setNewParentPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:border-red-500 font-mono"
                        placeholder="+7 (999) 000-00-00"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Телефон спортсмена
                      </label>
                      <input
                        type="text"
                        value={newAthletePhone}
                        onChange={e => setNewAthletePhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:border-red-500 font-mono"
                        placeholder="+7 (999) 000-00-01"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingAthlete(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition ${
                        isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isSubmitting ? 'Зачисление...' : 'Зачислить в группу'}
                    </button>
                  </div>
                </form>
              )}

              {/* Athletes List */}
              {groupAthletes.length === 0 ? (
                <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-semibold">В этой группе пока нет спортсменов</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Нажмите «+ Добавить спортсмена», чтобы зачислить первого ученика.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  {groupAthletes.map(ath => {
                    const isTransferringThis = transferAthleteId === ath.id;
                    const isAdmitted = ath.admissionDecision?.status === 'admitted';

                    return (
                      <div key={ath.id} className="p-3.5 hover:bg-slate-50 transition">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {ath.avatarInitials}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <span>{ath.fullName}</span>
                                {isAdmitted ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                    Допущен
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                                    {ath.admissionDecision?.status === 'not_admitted' ? 'Не допущен' : 'Ожидает'}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                Род.: {ath.parentName} ({ath.parentPhone})
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            {otherGroups.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setTransferAthleteId(isTransferringThis ? null : ath.id)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1 ${
                                  isTransferringThis
                                    ? 'bg-red-50 text-red-700 border-red-300'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                                <span>Перевести...</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleExpelAthlete(ath.id, ath.fullName)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition flex items-center gap-1"
                              title="Отчислить из группы"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                              <span>Отчислить</span>
                            </button>
                          </div>
                        </div>

                        {/* Inline Transfer Selector */}
                        {isTransferringThis && (
                          <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-center gap-2 animate-fadeIn">
                            <span className="text-xs font-semibold text-slate-700 shrink-0">
                              Выберите новую группу:
                            </span>
                            <select
                              value={targetTransferGroupId}
                              onChange={e => setTargetTransferGroupId(e.target.value)}
                              className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white font-medium focus:outline-none focus:border-red-500"
                            >
                              {otherGroups.map(og => (
                                <option key={og.id} value={og.id}>
                                  {og.name} (Тренер: {og.coachName})
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={() => handleConfirmTransfer(ath.id)}
                              className={`px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shrink-0 transition ${
                                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              {isSubmitting ? 'Перевод...' : 'Подтвердить перевод'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setTransferAthleteId(null)}
                              className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800"
                            >
                              Отмена
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
