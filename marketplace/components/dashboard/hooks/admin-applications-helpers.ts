import { PROVIDER_DOCUMENT_LABELS } from '@/lib/data/documents';
import type { Application } from './admin-applications-types';

export function mapDocLabel(type: string) {
  if (type in PROVIDER_DOCUMENT_LABELS) return PROVIDER_DOCUMENT_LABELS[type as keyof typeof PROVIDER_DOCUMENT_LABELS];
  if (type === 'id_verification') return 'ID uploaded';
  if (type === 'public_liability_insurance') return 'Insurance';
  if (type === 'tax_clearance' || type === 'tax_clearance_number') return 'Tax Clearance Number';
  if (type === 'safe_pass') return 'Safe Pass';
  if (type === 'safe_electric') return 'Safe Electric';
  if (type === 'reci') return 'RECI';
  if (type === 'rgi') return 'RGI';
  return type.replaceAll('_', ' ');
}

export function findDocument(documents: Application['documents'], expectedType: string) {
  if (expectedType === 'tax_clearance_number') {
    return documents.find(
      (doc) => doc.document_type === 'tax_clearance_number' || doc.document_type === 'tax_clearance'
    );
  }
  return documents.find((doc) => doc.document_type === expectedType);
}
