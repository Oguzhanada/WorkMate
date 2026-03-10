'use client';

import { Star, MapPin, Shield, ShieldCheck, Award } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

export type ProviderData = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  counties: string[];
  service_categories: string[];
  verified: boolean;
  id_verified: boolean;
  garda_vetted: boolean;
  compliance_score: number;
  average_rating: number | null;
  review_count: number;
  created_at: string;
};

type ProviderCardProps = {
  provider: ProviderData;
  locale: string;
  isHighlighted?: boolean;
  onHover?: (providerId: string | null) => void;
};

export default function ProviderCard({ provider, locale, isHighlighted, onHover }: ProviderCardProps) {
  const {
    id,
    full_name,
    avatar_url,
    counties,
    service_categories,
    verified,
    id_verified,
    garda_vetted,
    average_rating,
    review_count,
  } = provider;

  const initials = full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      onMouseEnter={() => onHover?.(id)}
      onMouseLeave={() => onHover?.(null)}
      style={{
        background: 'var(--wm-surface)',
        border: `1px solid ${isHighlighted ? 'var(--wm-primary)' : 'var(--wm-border)'}`,
        borderRadius: '16px',
        padding: '16px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: isHighlighted
          ? '0 4px 20px rgba(var(--wm-primary-rgb), 0.15)'
          : 'var(--wm-shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', gap: '14px' }}>
        {/* Avatar */}
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            overflow: 'hidden',
            flexShrink: 0,
            background: avatar_url ? 'var(--wm-surface-alt)' : 'var(--wm-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {avatar_url ? (
            <img
              src={avatar_url}
              alt={full_name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span
              style={{
                color: 'white',
                fontSize: '18px',
                fontWeight: 700,
                fontFamily: 'var(--wm-font-display)',
              }}
            >
              {initials}
            </span>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name + badges row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <h3
              style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: 700,
                fontFamily: 'var(--wm-font-display)',
                color: 'var(--wm-text)',
                lineHeight: 1.3,
              }}
            >
              {full_name}
            </h3>
            {id_verified && (
              <Shield
                size={14}
                style={{ color: 'var(--wm-primary)' }}
                aria-label="ID Verified"
              />
            )}
            {garda_vetted && (
              <ShieldCheck
                size={14}
                style={{ color: 'var(--wm-blue)' }}
                aria-label="Garda Vetted"
              />
            )}
          </div>

          {/* Categories */}
          {service_categories.length > 0 && (
            <p
              style={{
                margin: '2px 0 0',
                fontSize: '13px',
                color: 'var(--wm-muted)',
                fontFamily: 'var(--wm-font-sans)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {service_categories.slice(0, 3).join(' \u00B7 ')}
            </p>
          )}

          {/* Rating */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '6px',
              flexWrap: 'wrap',
            }}
          >
            {average_rating !== null ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Star size={14} fill="var(--wm-amber)" style={{ color: 'var(--wm-amber)' }} />
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--wm-text)',
                    fontFamily: 'var(--wm-font-sans)',
                  }}
                >
                  {average_rating}
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--wm-muted)',
                    fontFamily: 'var(--wm-font-sans)',
                  }}
                >
                  ({review_count})
                </span>
              </div>
            ) : (
              <Badge tone="neutral">New</Badge>
            )}

            {verified && (
              <Badge tone="primary" dot>
                <Award size={11} /> Verified Pro
              </Badge>
            )}
          </div>

          {/* Counties */}
          {counties.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '8px',
              }}
            >
              <MapPin size={13} style={{ color: 'var(--wm-muted)', flexShrink: 0 }} />
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--wm-muted)',
                  fontFamily: 'var(--wm-font-sans)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {counties.length <= 3
                  ? counties.join(', ')
                  : `${counties.slice(0, 2).join(', ')} +${counties.length - 2} more`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid var(--wm-border)',
        }}
      >
        <span
          style={{
            fontSize: '13px',
            color: 'var(--wm-primary-dark)',
            fontWeight: 600,
            fontFamily: 'var(--wm-font-sans)',
          }}
        >
          Get a quote
        </span>
        <Button
          href={`/${locale}/profile/public/${id}`}
          variant="outline"
          size="sm"
        >
          View Profile
        </Button>
      </div>
    </div>
  );
}
