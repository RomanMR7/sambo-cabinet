import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Shield,
  Users,
  Calendar,
  Settings,
  Lock,
  FileText
} from 'lucide-react';

export const AdminView: React.FC = () => {
  const { groupInfo } = useApp();

  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [genericModalMsg, setGenericModalMsg] = useState<string | null>(null);

  const handleMedicalDocClick = () => {
    setSecurityModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
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

      {genericModalMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">Организационный блок</h3>
            <p className="text-xs text-slate-600">{genericModalMsg}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setGenericModalMsg(null)}
                className="px-4 py-2 bg-red-600 text-white font-bold text-xs rounded-xl"
              >
                Закрыть
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
            Управление группой
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Организационная структура • Сетка расписания • Права доступа
          </p>
        </div>
      </div>

      {/* System Security Banner (Slide 16) */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-md flex items-start justify-between gap-4">
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
              Администратор управляет организационными параметрами группы, составом и залами. Доступ к сканам справок требует специального медицинского допуска.
            </p>
          </div>
        </div>

        <button
          onClick={handleMedicalDocClick}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold shrink-0 transition border border-slate-700 flex items-center gap-1.5"
        >
          <Lock className="w-3.5 h-3.5 text-red-400" />
          <span>Тест клика по меддокументу</span>
        </button>
      </div>

      {/* Counters at top (Slide 16) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Структура</div>
          <div className="text-2xl font-black text-slate-900 mt-2">1 группа</div>
          <div className="text-xs text-slate-500 mt-1">Группа начальной подготовки 1</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Спортсмены</div>
          <div className="text-2xl font-black text-slate-900 mt-2">24 спортсмена</div>
          <div className="text-xs text-slate-500 mt-1">5 спортсменов в активном демо-контуре</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Тренерский состав</div>
          <div className="text-2xl font-black text-slate-900 mt-2">1 тренер</div>
          <div className="text-xs text-slate-500 mt-1">Иванов А. В. (Мастер спорта)</div>
        </div>
      </div>

      {/* Table «Группы» (Slide 16) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-sm">Группы клуба</h3>
          <button
            onClick={() => setGenericModalMsg('Редактирование параметров группы: название, назначенный зал (Зал №1), лимит состава (24 человека).')}
            className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition"
          >
            Настроить группу
          </button>
        </div>

        <table className="w-full text-left text-xs">
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
                  onClick={() => setGenericModalMsg('Открыты параметры расписания: Вт, Чт 18:00–19:00.')}
                  className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Настроить
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Block «Роли и назначения» (Slide 16) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Роли и назначения</h3>
              <p className="text-xs text-slate-500">Матрица разграничения доступа</p>
            </div>
            <button
              onClick={() => setGenericModalMsg('Управление правами доступа: Администратор может добавлять новых тренеров и контролёров.')}
              className="text-xs font-bold text-red-600 hover:underline"
            >
              Управлять доступом
            </button>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900">Тренер</span>
                <div className="text-slate-500">Иванов А. В. • Полный методический доступ</div>
              </div>
              <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Активен</span>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900">Проверяющий документы</span>
                <div className="text-slate-500">Смирнова В. А. • Очередь верификации</div>
              </div>
              <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Активен</span>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900">Родители</span>
                <div className="text-slate-500">Доступ только к своим детям (изолирован)</div>
              </div>
              <span className="font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">24 профиля</span>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900">Спортсмены</span>
                <div className="text-slate-500">Личный прогресс без публичного ранжирования</div>
              </div>
              <span className="font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">24 профиля</span>
            </div>
          </div>
        </div>

        {/* Организационная сводка (Slide 16) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-base">Организационная сводка</h3>
            <p className="text-xs text-slate-500">Быстрый переход к клубным реестрам</p>
          </div>

          <div className="space-y-3">
            <div
              onClick={() => setGenericModalMsg('Состав группы: 24 спортсмена зачислены. Последнее изменение: перевод в группу начальной подготовки.')}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition cursor-pointer flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-red-600" />
                <div>
                  <div className="font-bold text-slate-900">Состав и изменения</div>
                  <div className="text-slate-500">Приказы о зачислении и переводах</div>
                </div>
              </div>
              <span className="font-semibold text-slate-400">→</span>
            </div>

            <div
              onClick={() => setGenericModalMsg('Расписание занятий утверждено на 2026/2027 учебный год: Вторник, Четверг 18:00.')}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition cursor-pointer flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-red-600" />
                <div>
                  <div className="font-bold text-slate-900">Расписание занятий</div>
                  <div className="text-slate-500">Сетка залов и график тренировок</div>
                </div>
              </div>
              <span className="font-semibold text-slate-400">→</span>
            </div>

            <div
              onClick={() => setGenericModalMsg('История назначений: Иванов А. В. назначен старшим тренером группы с 01.09.2026.')}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition cursor-pointer flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-red-600" />
                <div>
                  <div className="font-bold text-slate-900">История назначений</div>
                  <div className="text-slate-500">Журнал тренерских и судейских приказов</div>
                </div>
              </div>
              <span className="font-semibold text-slate-400">→</span>
            </div>

            {/* Document security test item */}
            <div
              onClick={handleMedicalDocClick}
              className="p-3.5 rounded-xl border border-red-200 bg-red-50/40 hover:bg-red-50 transition cursor-pointer flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-red-600" />
                <div>
                  <div className="font-bold text-red-900">Медицинский архив</div>
                  <div className="text-red-700/80">Попытка открытия защищённого медфайла</div>
                </div>
              </div>
              <Lock className="w-4 h-4 text-red-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
