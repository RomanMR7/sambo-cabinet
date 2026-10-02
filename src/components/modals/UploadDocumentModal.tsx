import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DocType } from '../../types';
import { X, Upload, FileText, AlertCircle } from 'lucide-react';

interface Props {
  athleteId: string;
  defaultType?: DocType;
  onClose: () => void;
}

export const UploadDocumentModal: React.FC<Props> = ({ athleteId, defaultType = 'medical', onClose }) => {
  const { uploadDocument, athletes } = useApp();
  const [selectedAthleteId, setSelectedAthleteId] = useState(athleteId);
  const currentAthlete = athletes.find(a => a.id === selectedAthleteId) || athletes[0];

  const [docType, setDocType] = useState<DocType>(defaultType);
  const [title, setTitle] = useState(
    defaultType === 'medical'
      ? 'Медицинский документ'
      : defaultType === 'insurance'
      ? 'Страховой полис'
      : 'Согласие на участие'
  );
  const [expiryDate, setExpiryDate] = useState('2027-10-06');
  const [fileName, setFileName] = useState('');
  const [fileSelected, setFileSelected] = useState<string | null>(null);

  const handleTypeChange = (t: DocType) => {
    setDocType(t);
    if (t === 'medical') {
      setTitle('Медицинский документ (справка / допуск)');
    } else if (t === 'insurance') {
      setTitle('Страховой полис от несчастных случаев');
    } else {
      setTitle('Согласие родителя на участие в тренировках');
    }
  };

  const handleFakeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      setFileSelected(file.name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalFileName = fileName || `${docType === 'medical' ? 'Мед_справка' : docType === 'insurance' ? 'Полис' : 'Согласие'}_${currentAthlete?.shortName.replace(/[\s.]+/g, '_') || 'спортсмен'}.pdf`;

    uploadDocument(selectedAthleteId, {
      type: docType,
      title: title || 'Новый документ',
      fileName: finalFileName,
      expiryDate: docType === 'consent' ? undefined : expiryDate
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center text-white">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Загрузить документ</h3>
              <p className="text-xs text-slate-300">
                Спортсмен: {currentAthlete?.fullName || currentAthlete?.shortName}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* Important Rule Notice */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Правило двухконтурного контроля: </span>
              Загрузка новой копии или изменение даты создаёт новую версию документа и автоматически переводит статус в 
              <span className="font-semibold text-amber-700"> «На проверке»</span> для контролёра.
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Спортсмен
            </label>
            <select
              value={selectedAthleteId}
              onChange={e => setSelectedAthleteId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-medium bg-white"
            >
              {athletes.map(a => (
                <option key={a.id} value={a.id}>
                  {a.shortName} ({a.fullName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Тип документа
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('medical')}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition text-center ${
                  docType === 'medical'
                    ? 'bg-red-50 border-red-500 text-red-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Медицинский
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('insurance')}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition text-center ${
                  docType === 'insurance'
                    ? 'bg-red-50 border-red-500 text-red-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Страховка
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('consent')}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition text-center ${
                  docType === 'consent'
                    ? 'bg-red-50 border-red-500 text-red-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Согласие
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Название документа
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-medium"
            />
          </div>

          {docType !== 'consent' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Срок действия (годен до)
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-medium"
              />
            </div>
          )}

          {/* Fake File Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Файл документа (PDF или скан)
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition relative">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFakeFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <FileText className="w-8 h-8 text-slate-400 mx-auto mb-1" />
              {fileSelected ? (
                <div className="text-xs font-bold text-slate-800">
                  Выбран: <span className="text-red-600">{fileSelected}</span>
                </div>
              ) : (
                <>
                  <p className="text-xs font-semibold text-slate-700">
                    Нажмите для выбора файла или перетащите сюда
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">PDF, PNG или JPG до 15 МБ</p>
                </>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white shadow transition"
            >
              Сохранить и передать на проверку
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
