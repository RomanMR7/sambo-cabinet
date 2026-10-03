import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { calculateFourWeekAttendance, FourWeekReportRow, generateAttendanceCSV, isCoachForGroup } from '../../utils/rules';
import {
  BarChart3,
  Download,
  Printer,
  AlertCircle,
  Trophy,
  HelpCircle,
  Sparkles,
  Calendar,
  Users
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const {
    athletes,
    sessions,
    groups,
    activeCoachId,
    clubUsers,
    setSelectedAthleteId,
    setActiveNav
  } = useApp();

  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<'october_2026' | 'september_2026' | 'all'>('october_2026');

  const activeCoach =
    (Array.isArray(clubUsers) ? clubUsers : []).find(u => u && u.id === activeCoachId) ||
    (Array.isArray(clubUsers) ? clubUsers : []).find(u => u && u.role === 'coach');

  const filteredAthletes = useMemo(() => {
    const safeAthletes = Array.isArray(athletes) ? athletes : [];
    if (selectedGroupId === 'all') {
      return safeAthletes.filter(a => a && a.isActive);
    }
    return safeAthletes.filter(a => a && a.isActive && a.groupId === selectedGroupId);
  }, [athletes, selectedGroupId]);

  const filteredSessions = useMemo(() => {
    const safeSessions = Array.isArray(sessions) ? sessions : [];
    return safeSessions.filter(s => {
      if (!s) return false;
      if (selectedGroupId !== 'all' && s.groupId && s.groupId !== selectedGroupId) {
        return false;
      }
      if (selectedPeriod === 'october_2026') {
        return s.date.startsWith('2026-10');
      }
      if (selectedPeriod === 'september_2026') {
        return s.date.startsWith('2026-09');
      }
      return true;
    });
  }, [sessions, selectedGroupId, selectedPeriod]);

  const reportRows: FourWeekReportRow[] = useMemo(() => {
    return calculateFourWeekAttendance(filteredAthletes, filteredSessions);
  }, [filteredAthletes, filteredSessions]);

  const handleExportCSV = () => {
    const csvContent = generateAttendanceCSV(reportRows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Отчет_посещаемости_самбо_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Аналитика и дисциплина</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Отчёты и Регулярность
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Расчёт по «Правилу 4 недель» • Эффективная база E • Рейтинг группы
          </p>
        </div>

        <div className="flex items-center gap-2.5 no-print">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold shadow-sm transition"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Экспорт в CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm shadow-red-900/20 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Печатная форма</span>
          </button>
        </div>
      </div>

      {/* Formula & Explanation Card (Slide 12) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-red-600" />
          <h3 className="font-extrabold text-slate-900 text-base">
            Математическая модель: «Правило 4 недель» (Слайд 12)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="font-bold text-slate-800">1. Эффективная база (E)</div>
            <p className="text-slate-600 mt-1 font-mono">
              E = Всего - Уважительные (болезнь / заявление)
            </p>
            <p className="text-slate-500 mt-0.5">
              Уважительные причины исключаются из знаменателя и не штрафуют спортсмена.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="font-bold text-slate-800">2. Доля посещений</div>
            <p className="text-slate-600 mt-1 font-mono">
              Доля = (Присутствовал / E) × 100%
            </p>
            <p className="text-slate-500 mt-1">
              Спортсмены с одинаковой долей делят одно призовое место.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
            <div className="font-bold">3. Условия присвоения места</div>
            <p className="mt-1">
              Место рассчитывается, если <span className="font-bold">E ≥ 4</span> и <span className="font-bold">нет статусов «Не отмечено»</span>.
              Неотмеченные блокируют расчет места до момента заполнения тренером!
            </p>
          </div>
        </div>
      </div>

      {/* Group & Period Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Group Selector */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Группа
            </label>
            <select
              value={selectedGroupId}
              onChange={e => setSelectedGroupId(e.target.value)}
              className="mt-0.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 cursor-pointer"
            >
              <option value="all">Все группы клуба ({athletes.filter(a => a.isActive).length} спортсменов)</option>
              {groups.map(g => {
                const isMy = activeCoach && isCoachForGroup(activeCoach, g);
                return (
                  <option key={g.id} value={g.id}>
                    {g.name} {isMy ? '★ (Моя группа)' : ''}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Период анализа:
          </span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl flex-wrap">
            <button
              onClick={() => setSelectedPeriod('october_2026')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                selectedPeriod === 'october_2026'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Октябрь 2026 (Текущие 4 недели)
            </button>
            <button
              onClick={() => setSelectedPeriod('september_2026')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                selectedPeriod === 'september_2026'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Сентябрь 2026
            </button>
            <button
              onClick={() => setSelectedPeriod('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                selectedPeriod === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Все тренировки
            </button>
          </div>
        </div>
      </div>

      {/* Table: Four Week Attendance Calculation */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">
              Таблица регулярности: {selectedGroupId === 'all' ? 'Все группы клуба' : groups.find(g => g.id === selectedGroupId)?.name || 'Выбранная группа'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Окно анализа:{' '}
              {selectedPeriod === 'october_2026'
                ? 'Октябрь 2026 (Текущие 4 недели)'
                : selectedPeriod === 'september_2026'
                ? 'Сентябрь 2026'
                : 'Все тренировки'}{' '}
              ({filteredSessions.length} {filteredSessions.length === 1 ? 'тренировка' : filteredSessions.length < 5 ? 'тренировки' : 'тренировок'} в расписании)
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400">
            Всего в выборке: {reportRows.length} спортсменов
          </span>
        </div>

        {reportRows.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Calendar className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-medium text-sm">Данные о посещаемости отсутствуют</p>
            <p className="text-xs text-slate-400 mt-1">В группе нет спортсменов или проведенных тренировок за последние 4 недели</p>
          </div>
        ) : (
          <>
            {/* Mobile View: Cards (shown on phones) */}
            <div className="sm:hidden divide-y divide-slate-100">
          {reportRows.map(row => {
            const isFirst = row.rankNumber === 1;
            const isThird = row.rankNumber === 3;

            return (
              <div
                key={row.athlete.id}
                onClick={() => {
                  setSelectedAthleteId(row.athlete.id);
                  setActiveNav('athlete_detail');
                }}
                className="p-4 space-y-3 bg-white hover:bg-slate-50 transition cursor-pointer active:bg-slate-100"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 font-bold flex items-center justify-center shrink-0">
                      {row.athlete.avatarInitials}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        {row.athlete.shortName}
                      </div>
                      <div className="text-[11px] text-slate-400">{row.athlete.fullName}</div>
                    </div>
                  </div>

                  <div>
                    {row.statusBadge === 'ranked' && (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-extrabold text-[11px] shadow-sm ${
                          isFirst
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : isThird
                            ? 'bg-blue-100 text-blue-900 border border-blue-300'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}
                      >
                        <Trophy className={`w-3 h-3 ${isFirst ? 'text-amber-600' : 'text-slate-500'}`} />
                        <span>{row.rankText}</span>
                      </span>
                    )}

                    {row.statusBadge === 'blocked' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-100 text-amber-800 border border-amber-200">
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                        <span>Заблокировано</span>
                      </span>
                    )}

                    {row.statusBadge === 'unranked' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-600 border border-slate-200">
                        <HelpCircle className="w-3 h-3 text-slate-400" />
                        <span>Без места</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1.5 p-2 rounded-xl bg-slate-50 text-center text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400">Доля</div>
                    <div className="font-black text-slate-900 text-sm">{row.ratePercent}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">База E</div>
                    <div className="font-bold text-slate-800">{row.effectiveBaseE}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-emerald-600 font-semibold">Посещений</div>
                    <div className="font-bold text-emerald-700">{row.presentCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Пропусков</div>
                    <div className="font-bold text-slate-700">{row.absentCount}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop View: Full Table (shown on tablet/desktop) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Спортсмен</th>
                <th className="py-3.5 px-3 text-center">Всего занятий</th>
                <th className="py-3.5 px-3 text-center">Уважит. (исключено)</th>
                <th className="py-3.5 px-3 text-center font-black text-slate-900">База E</th>
                <th className="py-3.5 px-3 text-center text-emerald-700">Посещения (P)</th>
                <th className="py-3.5 px-3 text-center text-red-700">Пропуски (A)</th>
                <th className="py-3.5 px-3 text-center text-amber-700">Не отм. (U)</th>
                <th className="py-3.5 px-4 text-center font-black text-slate-900">Доля (%)</th>
                <th className="py-3.5 px-4 text-right">Итоговое место</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportRows.map(row => {
                const isFirst = row.rankNumber === 1;
                const isThird = row.rankNumber === 3;

                return (
                  <tr
                    key={row.athlete.id}
                    onClick={() => {
                      setSelectedAthleteId(row.athlete.id);
                      setActiveNav('athlete_detail');
                    }}
                    className="hover:bg-slate-50 transition cursor-pointer"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 font-bold flex items-center justify-center shrink-0">
                          {row.athlete.avatarInitials}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm hover:text-red-600 transition">
                            {row.athlete.shortName}
                          </div>
                          <div className="text-[11px] text-slate-400">{row.athlete.fullName}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-center text-slate-600 font-mono">
                      {row.totalSessions}
                    </td>

                    <td className="py-3.5 px-3 text-center text-blue-600 font-semibold font-mono">
                      {row.excusedCount > 0 ? row.excusedCount : '—'}
                    </td>

                    <td className="py-3.5 px-3 text-center font-bold text-slate-900 font-mono bg-slate-50/50">
                      {row.effectiveBaseE}
                    </td>

                    <td className="py-3.5 px-3 text-center font-bold text-emerald-600 font-mono">
                      {row.presentCount}
                    </td>

                    <td className="py-3.5 px-3 text-center text-red-500 font-mono">
                      {row.absentCount}
                    </td>

                    <td className="py-3.5 px-3 text-center font-mono">
                      {row.unmarkedCount > 0 ? (
                        <span className="font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                          {row.unmarkedCount}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center font-black text-sm text-slate-900">
                      <span className="inline-block px-2.5 py-0.5 rounded-lg bg-slate-100 font-mono">
                        {row.ratePercent}%
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {row.statusBadge === 'ranked' && (
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-extrabold text-xs shadow-sm ${
                            isFirst
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : isThird
                              ? 'bg-blue-100 text-blue-900 border border-blue-300'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}
                        >
                          <Trophy className={`w-3.5 h-3.5 ${isFirst ? 'text-amber-600' : 'text-slate-500'}`} />
                          <span>{row.rankText}</span>
                        </span>
                      )}

                      {row.statusBadge === 'blocked' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-xs bg-amber-100 text-amber-800 border border-amber-200">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Заблокировано</span>
                        </span>
                      )}

                      {row.statusBadge === 'unranked' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-xs bg-slate-100 text-slate-600 border border-slate-200">
                          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                          <span>Без места</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </>
    )}

        {/* Footer Notes (Slide 12) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
          <span>* При равной доле посещений спортсмены делят призовое место (например, 1, 1, 3... место) согласно спортивному регламенту. Неотмеченные занятия блокируют расчет до заполнения.</span>
          <span className="font-bold text-slate-700">
            {selectedGroupId === 'all'
              ? `Все группы клуба • Старший тренер: ${activeCoach?.fullName || 'Иванов А. В.'}`
              : `${groups.find(g => g.id === selectedGroupId)?.name || 'Выбранная группа'} • Тренер: ${groups.find(g => g.id === selectedGroupId)?.coachName || activeCoach?.fullName || 'Иванов А. В.'}`}
          </span>
        </div>
      </div>
    </div>
  );
};
