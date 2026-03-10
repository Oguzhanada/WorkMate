import { ProviderDocumentType, PROVIDER_DOCUMENT_LABELS } from '@/lib/data/documents';

type TemplateInput = {
  fullName?: string | null;
  documentType: ProviderDocumentType;
  reason?: string | null;
  expiresAt?: string | null;
};

export function buildProviderDocumentApprovedMessage(input: TemplateInput) {
  const label = PROVIDER_DOCUMENT_LABELS[input.documentType];
  return {
    subject: `Document approved: ${label}`,
    body: `Hi ${input.fullName ?? 'there'}, your ${label} has been approved by WorkMate admin.`
  };
}

export function buildProviderDocumentRejectedMessage(input: TemplateInput) {
  const label = PROVIDER_DOCUMENT_LABELS[input.documentType];
  return {
    subject: `Document update required: ${label}`,
    body: `Hi ${input.fullName ?? 'there'}, your ${label} was rejected.${input.reason ? ` Reason: ${input.reason}` : ''}`
  };
}

export function buildProviderDocumentExpiringMessage(input: TemplateInput) {
  const label = PROVIDER_DOCUMENT_LABELS[input.documentType];
  const expiry = input.expiresAt ? new Date(input.expiresAt).toLocaleDateString('en-IE') : 'soon';
  return {
    subject: `Document expiring soon: ${label}`,
    body: `Hi ${input.fullName ?? 'there'}, your ${label} is expiring on ${expiry}. Please upload a renewed document.`
  };
}
