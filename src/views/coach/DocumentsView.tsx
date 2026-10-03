import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getDocumentExpiryStatus, filterDocumentsForRole } from '../../utils/rules';
import { DocumentRecord } from '../../types';
import {
  FileText,
  Plus,
  Eye,
  Search
} from 'lucide-react';
import { DocumentViewModal } from '../../components/modals/DocumentViewModal';
import { UploadDocumentModal } from '../../components/modals/UploadDocumentModal';

export const DocumentsView: React.FC = () => {
  const { documents, athletes, selectedAthleteId, setSelectedAthleteId, setActiveNav, role } = useApp();
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);
  const [uploadAthleteId, setUploadAthleteId] = useState<string | null>(null);

  const currentAthleteId = (role === 'parent' || role === 'athlete') ? 'ath-1' : selectedAthleteId;
  const accessibleDocs = filterDocumentsForRole(documents, role, currentAthleteId);

  const filteredDocs = accessibleDocs.filter(doc => {
    const athlete = athletes.find(a => a.id === doc.athleteId);
    const matchesSearch =
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(search.toLowerCase()) ||
      (athlete?.fullName.toLowerCase().includes(search.toLowerCase()) ?? false);

    if (!matchesSearch) return false;
    if (filterType === 'all') return true;
    if (filterType === 'unverified') return doc.verificationStatus === 'unverified';
    if (filterType === 'expiring') {
      const exp = getDocumentExpiryStatus(doc.expiryDate);
      return exp === 'expiring_soon' || exp === 'expired';
    }
    return doc.type === filterType;
  });

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
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterType === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Все ({accessibleDocs.length})
          </button>
          <button
            onClick={() => setFilterType('unverified')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterType === 'unverified' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            На проверке ({accessibleDocs.filter(d => d.verificationStatus === 'unverified').length})
          </button>
          <button
            onClick={() => setFilterType('expiring')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterType === 'expiring' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Истекают скоро
          </button>
          {role !== 'admin' && (
            <button
              onClick={() => setFilterType('medical')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterType === 'medical' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Медицинские
            </button>
          )}
          <button
            onClick={() => setFilterType('insurance')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterType === 'insurance' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Страховки
          </button>
        </div>

        <div className="relative w-full sm:w-64">
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
                      <button
                        onClick={() => {
                          setSelectedAthleteId(doc.athleteId);
                          setActiveNav('athlete_detail');
                        }}
                        className="text-xs text-red-600 hover:underline font-semibold"
                      >
                        {athlete?.shortName}
                      </button>
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
