import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { getDocumentExpiryStatus, filterDocumentsForRole } from '../../utils/rules';
import { DocumentRecord } from '../../types';
import {
  FileText,
  Plus,
  Eye,
  Search,
  Users,
  Clock
} from 'lucide-react';
import { DocumentViewModal } from '../../components/modals/DocumentViewModal';
import { UploadDocumentModal } from '../../components/modals/UploadDocumentModal';

export const DocumentsView: React.FC = () => {
  const { documents, athletes, groups, selectedAthleteId, setSelectedAthleteId, setActiveNav, role } = useApp();
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [sortByExpiry, setSortByExpiry] = useState<boolean>(false);
  const [search, setSearch] = useState('');
  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);
  const [uploadAthleteId, setUploadAthleteId] = useState<string | null>(null);

  const currentAthleteId = (role === 'parent' || role === 'athlete') ? 'ath-1' : selectedAthleteId;
  const accessibleDocs = filterDocumentsForRole(documents, role, currentAthleteId);

  const groupDocs = useMemo(() => {
    return accessibleDocs.filter(doc => {
      const athlete = athletes.find(a => a.id === doc.athleteId);
      if (!athlete) return false;
      if (selectedGroupId !== 'all' && athlete.groupId !== selectedGroupId) {
        return false;
      }
      return true;
    });
  }, [accessibleDocs, athletes, selectedGroupId]);

  const filteredDocs = useMemo(() => {
    const list = groupDocs.filter(doc => {
      const athlete = athletes.find(a => a.id === doc.athleteId);
      if (!athlete) return false;

      const matchesSearch =
        doc.title.toLowerCase().includes(search.toLowerCase()) ||
        doc.fileName.toLowerCase().includes(search.toLowerCase()) ||
        athlete.fullName.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;
      if (filterType === 'all') return true;
      if (filterType === 'unverified') return doc.verificationStatus === 'unverified';
      if (filterType === 'expiring') {
        const exp = getDocumentExpiryStatus(doc.expiryDate);
        return exp === 'expiring_soon' || exp === 'expired';
      }
      return doc.type === filterType;
    });

    if (sortByExpiry) {
      return [...list].sort((a, b) => {
        // Expired/expiring first: earlier expiry date first; missing expiry date last
        if (!a.expiryDate && !b.expiryDate) return 0;
        if (!a.expiryDate) return 1;
        if (!b.expiryDate) return -1;
        return a.expiryDate.localeCompare(b.expiryDate);
      });
    }

    return list;
  }, [groupDocs, athletes, search, filterType, sortByExpiry]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Документы группы
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Реестр медицинских справок, страховок и согласий спортсменов
          </p>
        </div>

        <button
          onClick={() => setUploadAthleteId(selectedAthleteId || athletes[0]?.id || 'ath-1')}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-sm transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>+ Добавить документ</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterType === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Все ({groupDocs.length})
          </button>
          <button
            onClick={() => setFilterType('unverified')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterType === 'unverified' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            На проверке ({groupDocs.filter(d => d.verificationStatus === 'unverified').length})
          </button>
          <button
            onClick={() => setFilterType('expiring')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterType === 'expiring' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Истекают скоро ({groupDocs.filter(d => { const exp = getDocumentExpiryStatus(d.expiryDate); return exp === 'expiring_soon' || exp === 'expired'; }).length})
          </button>
          {role !== 'admin' && (
            <button
              onClick={() => setFilterType('medical')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterType === 'medical' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Медицинские ({groupDocs.filter(d => d.type === 'medical').length})
            </button>
          )}
          <button
            onClick={() => setFilterType('insurance')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterType === 'insurance' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Страховки ({groupDocs.filter(d => d.type === 'insurance').length})
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Group Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedGroupId}
              onChange={e => setSelectedGroupId(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">Все группы</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort by Expiry Date */}
          <button
            onClick={() => setSortByExpiry(!sortByExpiry)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border shadow-2xs ${
              sortByExpiry
                ? 'bg-red-50 border-red-300 text-red-700 font-extrabold'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title="Сортировать: сначала истекающие документы"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Сначала истекающие</span>
            {sortByExpiry && <span className="w-1.5 h-1.5 rounded-full bg-red-600" />}
          </button>

          {/* Search Input */}
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по документам..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20"
            />
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
          <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="font-medium text-sm">Документы не найдены</p>
          <p className="text-xs text-slate-400 mt-1">Попробуйте изменить параметры фильтрации или поисковый запрос</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map(doc => {
            const athlete = athletes.find(a => a.id === doc.athleteId);
            const athleteGroup = groups.find(g => g.id === athlete?.groupId);
            const expiryStatus = getDocumentExpiryStatus(doc.expiryDate);
            const isVerified = doc.verificationStatus === 'verified';
            const isUnverified = doc.verificationStatus === 'unverified';

            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
              >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 leading-tight">{doc.title}</h3>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        <button
                          onClick={() => {
                            setSelectedAthleteId(doc.athleteId);
                            setActiveNav('athlete_detail');
                          }}
                          className="text-xs text-red-600 hover:underline font-semibold"
                        >
                          {athlete?.shortName}
                        </button>
                        {athleteGroup && (
                          <span className="text-[10px] text-slate-500 font-medium">
                            • {athleteGroup.name.replace(/ \(.*\)/, '')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    v{doc.version}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
                  <div>Файл: <code className="font-mono text-slate-800">{doc.fileName}</code></div>
                  <div>Загружен: {doc.uploadDate}</div>
                  {doc.expiryDate && (
                    <div className="font-semibold text-slate-700">Срок: {doc.expiryDate}</div>
                  )}
                  {doc.verifierComment && (
                    <div className="text-amber-800 font-medium pt-1 border-t border-slate-200">
                      Замечание: {doc.verifierComment}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  {isVerified && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Проверено
                    </span>
                  )}
                  {isUnverified && (
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      На проверке
                    </span>
                  )}
                  {expiryStatus === 'expiring_soon' && (
                    <span className="text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 ml-1">
                      Истекает
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setPreviewDoc(doc)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Открыть</span>
                </button>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {previewDoc && (
        <DocumentViewModal
          document={previewDoc}
          athleteName={athletes.find(a => a.id === previewDoc.athleteId)?.fullName}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {uploadAthleteId && (
        <UploadDocumentModal
          athleteId={uploadAthleteId}
          onClose={() => setUploadAthleteId(null)}
        />
      )}
    </div>
  );
};
