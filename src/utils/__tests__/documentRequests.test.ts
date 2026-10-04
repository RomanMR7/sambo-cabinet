import { describe, it, expect } from 'vitest';
import { DocumentRequest, DocumentRecord } from '../../types';

describe('Document Update Requests Workflow', () => {
  it('creates a valid pending document update request', () => {
    const request: DocumentRequest = {
      id: 'req-1',
      athleteId: 'ath-1',
      docType: 'insurance',
      title: 'Страховой полис от несчастных случаев',
      message: 'Срок действия страхового полиса истекает 2026-10-14. Пожалуйста, обновите полис.',
      requestedAt: '2026-10-06',
      requestedBy: 'Иванов А. В. (Тренер)',
      status: 'pending'
    };

    expect(request.status).toBe('pending');
    expect(request.athleteId).toBe('ath-1');
    expect(request.docType).toBe('insurance');
  });

  it('marks pending document requests as resolved upon document upload', () => {
    const requests: DocumentRequest[] = [
      {
        id: 'req-1',
        athleteId: 'ath-1',
        docType: 'insurance',
        title: 'Страховой полис',
        message: 'Требуется обновить полис.',
        requestedAt: '2026-10-06',
        requestedBy: 'Тренер',
        status: 'pending'
      },
      {
        id: 'req-2',
        athleteId: 'ath-2',
        docType: 'medical',
        title: 'Медицинская справка',
        message: 'Требуется обновить справку.',
        requestedAt: '2026-10-06',
        requestedBy: 'Тренер',
        status: 'pending'
      }
    ];

    // Simulate parent uploading new insurance document for ath-1
    const uploadedDoc: Partial<DocumentRecord> = {
      athleteId: 'ath-1',
      type: 'insurance',
      title: 'Новый страховой полис',
      expiryDate: '2027-10-06'
    };

    const updatedRequests = requests.map(r => {
      if (r.athleteId === uploadedDoc.athleteId && r.docType === uploadedDoc.type && r.status === 'pending') {
        return {
          ...r,
          status: 'resolved' as const,
          resolvedAt: '2026-10-06'
        };
      }
      return r;
    });

    // req-1 should now be resolved
    expect(updatedRequests.find(r => r.id === 'req-1')?.status).toBe('resolved');
    expect(updatedRequests.find(r => r.id === 'req-1')?.resolvedAt).toBe('2026-10-06');

    // req-2 for ath-2 should remain pending
    expect(updatedRequests.find(r => r.id === 'req-2')?.status).toBe('pending');
  });

  it('filters active pending requests for a specific athlete', () => {
    const requests: DocumentRequest[] = [
      {
        id: 'req-1',
        athleteId: 'ath-1',
        docType: 'insurance',
        title: 'Страховой полис',
        message: 'Требуется обновить полис.',
        requestedAt: '2026-10-06',
        requestedBy: 'Тренер',
        status: 'pending'
      },
      {
        id: 'req-2',
        athleteId: 'ath-1',
        docType: 'medical',
        title: 'Медицинская справка',
        message: 'Справка обновлена.',
        requestedAt: '2026-10-01',
        requestedBy: 'Тренер',
        status: 'resolved',
        resolvedAt: '2026-10-02'
      },
      {
        id: 'req-3',
        athleteId: 'ath-2',
        docType: 'insurance',
        title: 'Страховой полис Лизы',
        message: 'Требуется обновить.',
        requestedAt: '2026-10-06',
        requestedBy: 'Тренер',
        status: 'pending'
      }
    ];

    const childPending = requests.filter(r => r.athleteId === 'ath-1' && r.status === 'pending');
    expect(childPending).toHaveLength(1);
    expect(childPending[0].id).toBe('req-1');
    expect(childPending[0].docType).toBe('insurance');
  });
});
