/**
 * ProviderBadges — server component
 * Displays document-based trust badges on a provider's public profile.
 * Only shows badges for documents with status = 'verified'.
 */
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { PROVIDER_DOCUMENT_BADGES, type ProviderDocumentType } from '@/lib/data/documents';

type Props = {
  providerId: string;
};

export default async function ProviderBadges({ providerId }: Props) {
  const supabase = getSupabaseServiceClient();

  const isoNow = new Date().toISOString();
  const { data: docs } = await supabase
    .from('provider_documents')
    .select('document_type,status')
    .eq('profile_id', providerId)
    .eq('status', 'verified')
    .or(`expires_at.is.null,expires_at.gt.${isoNow}`);

  const activeDocs = docs ?? [];

  const badges = activeDocs
    .map((doc) => PROVIDER_DOCUMENT_BADGES[doc.document_type as ProviderDocumentType])
    .filter(Boolean) as { icon: string; label: string }[];

  if (badges.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
      }}
      aria-label="Provider verification badges"
    >
      {badges.map((badge) => (
        <span
          key={badge.label}
          title={`Verified: ${badge.label}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            borderRadius: 20,
            fontSize: '0.78rem',
            fontWeight: 600,
            background: 'color-mix(in srgb, var(--wm-primary) 10%, transparent)',
            border: '1px solid color-mix(in srgb, var(--wm-primary) 25%, transparent)',
            color: 'var(--wm-primary-dark)',
          }}
        >
          <span aria-hidden="true">{badge.icon}</span>
          {badge.label}
        </span>
      ))}
    </div>
  );
}
